const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Helper function to sign JWT
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Register user
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, organization, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Passing plain password - User model pre-save hook handles hashing
  const user = await User.create({
    name,
    email,
    password, 
    organization,
    role: role === 'admin' ? 'admin' : 'public',
    requestedRole: role || 'partner',
    isVerified: role === 'admin' ? true : false,
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user (With Diagnostic Logs)
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('--- Login Diagnostic ---');
  console.log('Attempting login for:', email);

  // 1. Check for user and include hidden password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    console.log('Diagnostic: ❌ User not found in database');
    res.status(401);
    throw new Error('Invalid credentials');
  }

  console.log('Diagnostic: ✅ User found. Role is:', user.role);

  // 2. Compare Passwords
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Diagnostic: Entered Password:', password);
  console.log('Diagnostic: Password Match Result:', isMatch);

  if (!isMatch) {
    console.log('Diagnostic: ❌ Password comparison failed');
    res.status(401);
    throw new Error('Invalid credentials');
  }

  console.log('Diagnostic: 🎉 Login Successful!');
  sendTokenResponse(user, 200, res);
});

// @desc    Approve a user (Admin only)
exports.approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.role = user.requestedRole || 'partner';
  user.isVerified = true;
  await user.save();
  res.status(200).json({ success: true, data: user });
});

// @desc    Get all users (Admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Delete a user (Admin only)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: 'User removed from system'
  });
});