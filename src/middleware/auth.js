const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: userData, error } = await supabase.auth.admin.getUserById(decoded.userId);
    
    if (error || !userData || !userData.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = userData.user;
    req.userId = userData.user.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;