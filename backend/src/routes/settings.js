// settings.js
const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.put('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { notifications: req.body }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
