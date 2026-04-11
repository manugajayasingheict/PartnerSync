const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
const { protect } = require('../middleware/authMiddleware');

router.get('/feed', collabController.getFeed);
router.post('/comment', collabController.addComment);
router.put('/comment/:commentId', collabController.updateComment);
router.get('/notifications', collabController.getNotifications);
router.put('/post/:id',    collabController.updatePost);
router.delete('/post/:id', collabController.deletePost);
router.post('/announcement', collabController.createAnnouncement);

module.exports = router;