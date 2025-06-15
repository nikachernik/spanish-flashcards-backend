const express = require('express');
const router = express.Router();
const revisionsController = require('../controllers/revisions.controller');
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');

// Routes
router.post('/start', [
  body('levelCode').optional(),
  body('themeId').optional().isInt()
], revisionsController.startSession);

router.get('/next', authMiddleware, revisionsController.getNextWord);

router.post('/:wordId/mark', authMiddleware, [
  body('sessionId').isInt(),
  body('markedAsKnown').isBoolean()
], revisionsController.markWord);

router.post('/end/:sessionId', authMiddleware, revisionsController.endSession);

router.get('/history', authMiddleware, revisionsController.getHistory);

module.exports = router;