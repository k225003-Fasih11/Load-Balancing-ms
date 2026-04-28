const router = require('express').Router();
const { getServers, createServer, updateServer, deleteServer, getServerHealth, simulateLoad } = require('../controllers/serverController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',           protect, getServers);
router.post('/',          protect, adminOnly, createServer);
router.put('/:id',        protect, adminOnly, updateServer);
router.delete('/:id',     protect, adminOnly, deleteServer);
router.get('/health',     protect, getServerHealth);
router.post('/simulate',  protect, simulateLoad);

module.exports = router;
