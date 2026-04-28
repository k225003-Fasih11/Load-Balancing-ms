// activity.js
const router = require('express').Router();
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const logs = await Activity.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
