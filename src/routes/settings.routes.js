const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body } = require('express-validator');

// Store user settings in memory (in production, use a secure database)
const userApiKeys = new Map();
const userTimeouts = new Map();

router.post('/api-key', authMiddleware, [
  body('apiKey').notEmpty().isLength({ min: 10 })
], (req, res) => {
  try {
    const { apiKey } = req.body;
    const userId = req.userId;
    
    // Store the API key associated with the user
    userApiKeys.set(userId, apiKey);
    
    res.json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ message: 'Failed to update API key' });
  }
});

router.post('/timeout', authMiddleware, [
  body('timeout').isInt({ min: 10, max: 300 })
], (req, res) => {
  try {
    const { timeout } = req.body;
    const userId = req.userId;
    
    // Store the timeout associated with the user
    userTimeouts.set(userId, timeout);
    
    res.json({ message: 'Timeout updated successfully' });
  } catch (error) {
    console.error('Error updating timeout:', error);
    res.status(500).json({ message: 'Failed to update timeout' });
  }
});

// Export functions to get user settings
router.getUserApiKey = (userId) => {
  return userApiKeys.get(userId) || process.env.GEMINI_API_KEY;
};

router.getUserTimeout = (userId) => {
  return userTimeouts.get(userId) || 90; // Default 90 seconds
};

module.exports = router;