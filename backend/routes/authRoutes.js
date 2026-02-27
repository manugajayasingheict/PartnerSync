const express = require('express');
const router = express.Router();

// 1. Import the Logic from the Controller
// Added getUsers and deleteUser to the imports
const { register, login, approveUser, getUsers, deleteUser } = require('../controllers/authController');

// 2. Import the Security Guard (Middleware)
const { protect, authorize } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES (Anyone can access) ---

// Register a new user (http://localhost:5000/api/auth/register)
router.post('/register', register);

// Login a user (http://localhost:5000/api/auth/login)
router.post('/login', login);


// --- PROTECTED ROUTES (Only specific people) ---

// Admin Approval Route 
// 1. Check if Logged In (protect)
// 2. Check if Admin (authorize)
// 3. Run the Approval Logic (approveUser)
router.put('/approve/:id', protect, authorize('admin'), approveUser);

// --- NEW ADMIN MANAGEMENT ROUTES ---

// Get all users (Only Admin can see the list)
router.get('/users', protect, authorize('admin'), getUsers);

// Delete a user (Only Admin can remove users)
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;