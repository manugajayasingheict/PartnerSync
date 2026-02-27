const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Added to handle hashing within the model

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add your full name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Please add an email'], 
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email address'
    ]
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'], 
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  organization: { 
    type: String, 
    required: [true, 'Please add the name of your organization'],
    trim: true
  },
  
  // 1. The Role they WANT
  requestedRole: {
    type: String,
    enum: {
      values: ['partner', 'government', 'admin', 'public'],
      message: '{VALUE} is not a valid requested role'
    },
    default: 'partner'
  },

  // 2. The Role they HAVE
  role: {
    type: String,
    enum: ['public', 'partner', 'government', 'admin'],
    default: 'public' 
  },

  // 3. Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }
});

// 🛡️ Encrypt password using bcrypt before saving to DB
userSchema.pre('save', async function () {
  // If password isn't modified, just return (no next needed)
  if (!this.isModified('password')) {
    return; 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);