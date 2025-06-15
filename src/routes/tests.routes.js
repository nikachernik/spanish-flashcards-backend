const express = require('express');
const router = express.Router();
const testsController = require('../controllers/tests.controller');
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');

// Routes
router.get('/', authMiddleware, testsController.getTests);

router.post('/start', authMiddleware, [
  body('levelCode').optional(),
  body('themeId').optional().isInt(),
  body('wordCount').isInt({ min: 1, max: 50 }).optional()
], testsController.startTest);

router.post('/:id/answer', authMiddleware, [
  body('wordId').isInt(),
  body('userAnswer').notEmpty().trim()
], testsController.submitAnswer);

router.get('/:id/results', authMiddleware, testsController.getTestResults);

router.post('/:id/complete', authMiddleware, testsController.completeTest);

module.exports = router;