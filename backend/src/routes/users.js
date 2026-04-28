// users.js
const router = require('express').Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, async (req, res) => {
  try { res.json(await User.find().select('-password')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    res.json(await User.findByIdAndUpdate(req.params.id, rest, { new: true }).select('-password'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'User deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
