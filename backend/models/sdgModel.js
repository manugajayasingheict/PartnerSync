const mongoose = require('mongoose');

const sdgSchema = new mongoose.Schema({
  targetNumber: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  indicatorCode: {
    type: String,
  },
  benchmark: {
    type: String,
  },
  category: {
    type: String,
    default: 'Goal 17',
  },
  isOfficialUN: {
    type: Boolean,
    default: false,
  },
  lastSynced: {
    type: Date,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SDG', sdgSchema);