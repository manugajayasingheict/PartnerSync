const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); 

// Helper function to get token and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, organization, role } = req.body;

  // 🛡️ Manual Validation: Required for Tests to receive 400 before DB crash
  if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters'); // Fixes UT-01
  }

  if (!email || !email.includes('@')) {
      res.status(400);
      throw new Error('Please provide a valid email'); // Fixes UT-02
  }

  // 🛡️ Error Handling: Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
      res.status(400);
      throw new Error('User already exists'); // Fixes IT-01
  }

  // Encrypt Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 🛡️ Validation: Schema constraints are checked here
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    organization,
    role: 'public', 
    requestedRole: role 
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 🛡️ Validation: Ensure fields aren't empty
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide an email and password');
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Approve a user (Promote them)
// @route   PUT /api/auth/approve/:id
exports.approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = user.requestedRole || 'partner'; 
  user.isVerified = true;
  
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: `User verified! Role updated to ${user.role}`
  });
});

// @desc    Get all users
// @route   GET /api/auth/users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ 
    success: true, 
    count: users.length, 
    data: users 
  });
});

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
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