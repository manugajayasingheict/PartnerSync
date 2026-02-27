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

    // 🎨 DiceBear External API — generates avatar from org name, no API key needed
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

    res.status(201).json({ message: 'Post created successfully', post: newPost });
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
      user:     req.user._id,
      userName: req.user.name,
      text
    });

    await post.save();

    // 🔔 Auto-notify post author (skip if commenting on own post)
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
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 });

    // ✅ Mark all as read after fetching
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};