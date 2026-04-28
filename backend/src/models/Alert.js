const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  server:      { type: mongoose.Schema.Types.ObjectId, ref: 'Server' },
  metric:      { type: String, enum: ['load', 'response_time', 'connections', 'uptime'], required: true },
  operator:    { type: String, enum: ['gt', 'lt', 'gte', 'lte'], required: true },
  threshold:   { type: Number, required: true },
  isActive:    { type: Boolean, default: true },
  lastTriggered: { type: Date },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
