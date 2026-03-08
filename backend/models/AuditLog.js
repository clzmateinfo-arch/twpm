const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    id: String,
    timestamp: Date,
    userId: String,
    userName: String,
    action: String,
    details: String
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
