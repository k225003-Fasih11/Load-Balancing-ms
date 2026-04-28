const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  ipAddress:   { type: String, required: true },
  port:        { type: Number, required: true },
  weight:      { type: Number, default: 1 },
  status:      { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  capacity:    { type: Number, default: 100 },
  currentLoad: { type: Number, default: 0 },
  connections: { type: Number, default: 0 },
  responseTime:{ type: Number, default: 0 },
  uptime:      { type: Number, default: 100 },
  location:    { type: String, default: 'default' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Server', ServerSchema);
