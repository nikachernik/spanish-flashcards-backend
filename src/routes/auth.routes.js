const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// Password reset routes
router.post('/reset-password-request', 
  body('email').isEmail().normalizeEmail(),
  authController.resetPasswordRequest
);
router.post('/reset-password', 
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  authController.resetPassword
);

// Test endpoint to verify JWT authentication
router.get('/test-auth', authMiddleware, (req, res) => {
  res.json({ 
    message: 'Authentication successful',
    userId: req.userId,
    user: req.user.email
  });
});

module.exports = router;