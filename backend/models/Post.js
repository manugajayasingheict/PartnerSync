const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  organization: { type: String, required: true },
  avatarUrl: { type: String }, // This will hold the DiceBear API link
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['Call for Partnership', 'Announcement'], default: 'Announcement' },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);