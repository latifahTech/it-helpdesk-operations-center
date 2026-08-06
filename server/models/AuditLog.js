const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['DELETE_TICKET', 'RESTORE_TICKET', 'CREATE_TICKET', 'UPDATE_TICKET'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  performedBy: {
    type: String,
    required: true,
  },
  snapshot: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);