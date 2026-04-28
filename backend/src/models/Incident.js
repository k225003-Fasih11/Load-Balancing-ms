const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  server:      { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true },
  type:        { type: String, enum: ['overload', 'failure', 'threshold_breach', 'recovery'], required: true },
  severity:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  description: { type: String, required: true },
  loadAtTime:  { type: Number },
  resolved:    { type: Boolean, default: false },
  resolvedAt:  { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Incident', IncidentSchema);
