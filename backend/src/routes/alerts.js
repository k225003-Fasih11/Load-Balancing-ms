const router = require('express').Router();
const Alert = require('../models/Alert');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try { res.json(await Alert.find().populate('server', 'name').populate('createdBy', 'name')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Alert.create({ ...req.body, createdBy: req.user._id })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try { res.json(await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try { await Alert.findByIdAndDelete(req.params.id); res.json({ message: 'Alert deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
