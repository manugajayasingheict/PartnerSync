const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
// Assuming you have this middleware from your Member 01 Auth work
const { protect } = require('../middleware/authMiddleware'); 

// Apply protection to all Member 04 routes
router.use(protect);

router.post('/post', collabController.createPost);
router.get('/feed', collabController.getFeed);
router.post('/comment', collabController.addComment);
router.get('/notifications', collabController.getNotifications);
router.put('/post/:id',    collabController.updatePost);
router.delete('/post/:id', collabController.deletePost);

module.exports = router;