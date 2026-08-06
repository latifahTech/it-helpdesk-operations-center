require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load core models and authentication middleware
const Ticket = require('./models/Ticket');
const AuditLog = require('./models/AuditLog');
const requireApiKey = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware for CORS and JSON payload handling
app.use(cors());
app.use(express.json());

// Connect to MongoDB using the configured database URI
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

/**
 * @route   GET /api/health
 * @desc    Return service health status for readiness and uptime checks
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

// Require API key validation for all /api routes
app.use('/api', requireApiKey);

/**
 * @route   POST /api/tickets
 * @desc    Create a new maintenance or support ticket
 * @access  Private (API Key Required)
 */
app.post('/api/tickets', async (req, res) => {
  try {
    const { action, category, priority, device, location } = req.body;

    if (!action || !category) {
      return res.status(400).json({ error: 'Missing required fields: action, category' });
    }

    const newTicket = new Ticket({
      action,
      category,
      priority: priority || 'Medium',
      device: device || '',
      location: location || '',
    });

    await newTicket.save();

    res.status(200 || 201).json({ success: true, data: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/tickets
 * @desc    Retrieve paginated ticket records with category and search filters
 * @access  Private (API Key Required)
 */
app.get('/api/tickets', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, includeDeleted } = req.query;
    let query = {};

    // Exclude soft-deleted tickets from default queries
    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/tickets/stats
 * @desc    Aggregate dashboard analytics including category distribution and recent activity
 * @access  Private (API Key Required)
 */
app.get('/api/tickets/stats', async (req, res) => {
  try {
    const { category } = req.query;
    const matchQuery = { deletedAt: null };

    if (category && category !== 'ALL') {
      matchQuery.category = category;
    }

    // Aggregate ticket counts by category
    const categoryStats = await Ticket.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // Aggregate ticket counts by priority level
    const priorityStats = await Ticket.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $project: { _id: 0, priority: "$_id", count: 1 } }
    ]);

    // Aggregate one-week audit activity totals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalLogs = await Ticket.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      stats: {
        totalLogs,
        categoryStats,
        priorityStats,
        dailyActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Soft-delete a ticket and capture the action in the audit trail
 * @access  Private (API Key Required)
 */
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket || ticket.deletedAt) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const snapshot = ticket.toObject();

    ticket.deletedAt = new Date();
    ticket.deletedBy = req.actor || 'Admin';
    await ticket.save();

    await AuditLog.create({
      action: 'DELETE_TICKET',
      targetId: ticket._id,
      performedBy: req.actor || 'Admin',
      snapshot,
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/tickets/:id/restore
 * @desc    Restore a soft-deleted ticket and record the restore action
 * @access  Private (API Key Required)
 */
app.post('/api/tickets/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket || !ticket.deletedAt) {
      return res.status(404).json({ success: false, error: 'Deleted ticket not found' });
    }

    ticket.deletedAt = null;
    ticket.deletedBy = null;
    await ticket.save();

    await AuditLog.create({
      action: 'RESTORE_TICKET',
      targetId: ticket._id,
      performedBy: req.actor,
      snapshot: ticket.toObject(),
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/audit
 * @desc    Retrieve paginated audit logs for administrative actions
 * @access  Private (API Key Required)
 */
app.get('/api/audit', async (req, res) => {
  try {
    const { action, page = 1, limit = 20 } = req.query;
    let query = {};

    if (action && action !== 'ALL') {
      query.action = action;
    }

    const entries = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server Initialization
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});