const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  organization: { type: String, required: true },
  
  // 1. The Role they WANT
  requestedRole: {
    type: String,
    enum: ['partner', 'government', 'admin'],
    default: 'partner'
  },

  // 2. The Role they HAVE (Default: Public/Guest)
  role: {
    type: String,
    enum: ['public', 'partner', 'government', 'admin'],
    default: 'public' // <--- SAFETY LOCK: Everyone starts with NO power
  },

  // 3. Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);