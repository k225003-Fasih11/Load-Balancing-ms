const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:  { type: String, required: true },
  resource:{ type: String, required: true },
  details: { type: String },
  ip:      { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
