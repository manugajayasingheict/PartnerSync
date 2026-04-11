const mongoose = require('mongoose');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// 1. POST /api/collab/post – Create Announcement with DiceBear Avatar
exports.createPost = async (req, res) => {
  try {
    const { title, content, type } = req.body;

    // Validate required fields
    if (!title || !content || !type) {
      return res.status(400).json({ error: 'Title, content, and type are required.' });
    }

    const orgName = req.user.organization || req.user.name;
    const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(orgName)}`;

    const newPost = new Post({
      author:       req.user._id,
      authorName:   req.user.name,
      organization: req.user.organization,
      avatarUrl,
      title,
      content,
      type
    });

    await newPost.save();

    res.status(201).json({ message: 'Post created successfully', post: newPost, postId: newPost._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error while creating post' });
  }
};

// 2. GET /api/collab/feed – Retrieve Activity Feed
exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

// 3. POST /api/collab/comment – Comment to offer help
exports.addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;

    // Validate required fields
    if (!postId || !text) {
      return res.status(400).json({ error: 'postId and text are required.' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({
      _id: new mongoose.Types.ObjectId(),
      user:     req.user._id,
      userName: req.user.name,
      text
    });

    await post.save();

    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        message: `${req.user.name} commented on your post: "${post.title}"`
      });
    }

    const otherCommenters = post.comments
      .filter(comment => comment.user.toString() !== req.user._id.toString())
      .map(comment => comment.user.toString())
      .filter((userId, index, arr) => arr.indexOf(userId) === index);

    for (const commenterId of otherCommenters) {
      if (commenterId !== post.author.toString()) {
        await Notification.create({
          recipient: commenterId,
          message: `${req.user.name} also commented on "${post.title}"`
        });
      }
    }

    res.status(201).json({ message: 'Comment added successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// 3.5. PUT /api/collab/comment/:commentId – Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { commentId } = req.params;

    if (!text) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    // Find the post containing the comment
    const post = await Post.findOne({ 'comments._id': commentId });
    if (!post) return res.status(404).json({ error: 'Comment not found.' });

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    // Only the original commenter can edit
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this comment.' });
    }

    comment.text = text;
    await post.save();

    res.status(200).json({ message: 'Comment updated successfully.', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 });

    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Only admins can create announcements (assuming role-based auth)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create announcements.' });
    }

    const User = require('../models/User');
    const allUsers = await User.find({}, '_id');

    const notifications = allUsers.map(user => ({
      recipient: user._id,
      message: `System Announcement: ${message}`
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Announcement sent to all users.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, content, type } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Only the original author can edit
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this post.' });
    }

    if (title)   post.title   = title;
    if (content) post.content = content;
    if (type)    post.type    = type;

    await post.save();

    res.status(200).json({ message: 'Post updated successfully.', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Only the original author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};