// incidents.js
const router = require('express').Router();
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const incidents = await Incident.find().populate('server', 'name').sort({ createdAt: -1 }).limit(100);
    res.json(incidents);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, { resolved: true, resolvedAt: new Date() }, { new: true });
    res.json(incident);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
