const express = require('express');
const router = express.Router();
const wordsController = require('../controllers/words.controller');
const authMiddleware = require('../middleware/auth');
const { body, query } = require('express-validator');

// Validation rules
const wordValidation = [
  body('spanish').notEmpty().trim(),
  body('russian').notEmpty().trim(),
  body('levelId').isInt().optional(),
  body('themeId').isInt().optional()
];

// Routes
router.get('/', authMiddleware, [
  query('level').optional(),
  query('theme').optional(),
  query('limit').isInt({ min: 1, max: 1000 }).optional(),
  query('offset').isInt({ min: 0 }).optional()
], wordsController.getWords);

router.get('/:id', authMiddleware, wordsController.getWordById);

router.post('/', authMiddleware, wordValidation, wordsController.createWord);

router.put('/:id', authMiddleware, wordValidation, wordsController.updateWord);

router.delete('/:id', authMiddleware, wordsController.deleteWord);

router.post('/generate', authMiddleware, [
  body('theme').notEmpty(),
  body('level').notEmpty(),
  body('model').optional(),
  body('count').isInt({ min: 1, max: 20 }).optional(),
  body('existingWords').isArray().optional()
], wordsController.generateWords);

router.post('/:id/favorite', authMiddleware, wordsController.toggleFavorite);

module.exports = router;