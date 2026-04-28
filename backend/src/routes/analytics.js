const router = require('express').Router();
const { getOverview, getAlgorithmComparison, getTrafficPrediction } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/overview',    protect, getOverview);
router.get('/comparison',  protect, getAlgorithmComparison);
router.get('/prediction',  protect, getTrafficPrediction);

module.exports = router;
