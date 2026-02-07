const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// 🔐 Import security middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Route for /api/projects
router.route('/')
    .get(getProjects) // Anyone can view
    // 🛡️ Only Admin, Partner, and Government can CREATE
    .post(protect, authorize('admin', 'partner', 'government'), createProject);

// Route for /api/projects/:id
router.route('/:id')
    .get(getProject) // Anyone can view a specific project
    // 🛡️ Only Admin, Partner, and Government can UPDATE
    .put(protect, authorize('admin', 'partner', 'government'), updateProject)
    // 🛡️ Only ADMIN can DELETE
    .delete(protect, authorize('admin'), deleteProject);

module.exports = router;