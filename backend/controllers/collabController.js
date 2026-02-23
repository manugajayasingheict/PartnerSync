const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Project = require('../models/Project'); // Assuming you have this from Member 03

// 1. POST /api/collab/post – Create Announcement with DiceBear API
exports.createPost = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    
    // External API Feature: Generate Avatar based on Organization Name
    // It creates a dynamic image URL, no API key required!
    const orgName = req.user.organization || req.user.name;
    const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(orgName)}`;

    const newPost = new Post({
      author: req.user._id,
      authorName: req.user.name,
      organization: req.user.organization,
      avatarUrl,
      title,
      content,
      type
    });

    await newPost.save();

    // Bonus: Automatically notify all users about the new partnership call
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(500).json({ error: 'Server error while creating post' });
  }
};

// 2. GET /api/collab/feed – Retrieve Activity Feed
exports.getFeed = async (req, res) => {
  try {
    // Fetch posts, newest first
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

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Add the comment
    post.comments.push({
      user: req.user._id,
      userName: req.user.name,
      text
    });

    await post.save();

    // Auto-generate a notification for the post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        message: `${req.user.name} offered help on your post: "${post.title}"`
      });
    }

    res.status(201).json({ message: 'Comment added successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// 4. GET /api/collab/notifications – Fetch Alerts
exports.getNotifications = async (req, res) => {
  try {
    // Find alerts only for the logged-in user
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};