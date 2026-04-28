const router = require('express').Router();
const { protect } = require('../middleware/auth');

const algorithms = [
  { id: 'round_robin', name: 'Round Robin', description: 'Distributes requests sequentially across all servers.', complexity: 'O(1)', bestFor: 'Equal server capacity, uniform request sizes' },
  { id: 'least_connections', name: 'Least Connections', description: 'Routes to the server with fewest active connections.', complexity: 'O(n)', bestFor: 'Variable request duration, unequal server load' },
  { id: 'ai_predict', name: 'AI Predict', description: 'Uses linear regression on traffic window to dynamically switch strategies.', complexity: 'O(n)', bestFor: 'Variable and spiky traffic patterns' }
];

let activeAlgorithm = 'round_robin';

router.get('/', protect, (req, res) => res.json({ algorithms, active: activeAlgorithm }));

router.put('/active', protect, (req, res) => {
  const { algorithm } = req.body;
  if (!algorithms.find(a => a.id === algorithm)) return res.status(400).json({ message: 'Invalid algorithm' });
  activeAlgorithm = algorithm;
  res.json({ active: activeAlgorithm, message: `Switched to ${algorithm}` });
});

module.exports = router;
