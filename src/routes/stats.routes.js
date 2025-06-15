const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth');

// Routes
router.get('/user', authMiddleware, statsController.getUserStats);
router.get('/words', authMiddleware, statsController.getWordStats);
router.get('/progress', authMiddleware, statsController.getProgress);
router.get('/achievements', authMiddleware, statsController.getAchievements);

module.exports = router;