const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: 'Auto',
            trim: true,
        },
        action: {
            type: String,
            required: [true, 'Action/Issue title is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Hardware', 'Software', 'Network', 'Security', 'General'],
            default: 'General',
            index: true,
        },
        priority: {
            type: String,
            enum: ['Critical', 'High', 'Medium', 'Low'],
            default: 'Medium',
        },
        device: {
            type: String,
            default: '',
            trim: true,
        },
        location: {
            type: String,
            default: '',
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
        deletedBy: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Secondary indexes to speed common list and filter queries
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ category: 1, deletedAt: 1 });
ticketSchema.index({ priority: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);