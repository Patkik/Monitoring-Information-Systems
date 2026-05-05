const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

router.get('/progress-dashboard', auth, progressController.getProgressDashboard);
router.get('/mentees/:menteeId/progress', auth, progressController.getMenteeProgress);

module.exports = router;