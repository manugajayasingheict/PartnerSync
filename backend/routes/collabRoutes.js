const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
const { protect } = require('../middleware/authMiddleware');

router.get('/feed', collabController.getFeed);
router.post('/post', protect, collabController.createPost);
router.post('/comment', protect, collabController.addComment);
router.put('/comment/:commentId', protect, collabController.updateComment);
router.get('/notifications', protect, collabController.getNotifications);
router.put('/post/:id', protect, collabController.updatePost);
router.delete('/post/:id', protect, collabController.deletePost);
router.post('/announcement', protect, collabController.createAnnouncement);

module.exports = router;