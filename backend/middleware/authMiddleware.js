const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect routes (Check if logged in)
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Get token from header
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

    // GET USER FROM DB
    req.user = await User.findById(decoded.id);

    // 🛑 CRITICAL FIX: Check if user actually exists in DB
    // (Prevents server crash if a user is deleted but token is still valid)
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// 2. Grant access to specific roles (Check if Admin/Partner)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};