const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    action: { type: String, required: true },
    category: { type: String, required: true }, 
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: '30d' } // TTL Index: auto-deletes after 30 days
});

module.exports = mongoose.model('Log', logSchema);