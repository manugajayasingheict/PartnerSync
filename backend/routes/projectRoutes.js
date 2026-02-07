const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// Route for /api/projects
router.route('/')
    .get(getProjects)      // GET all projects
    .post(createProject);  // CREATE a new project

// Route for /api/projects/:id (Requires an ID, e.g., /api/projects/65c...)
router.route('/:id')
    .get(getProject)       // GET one specific project
    .put(updateProject)    // UPDATE a project
    .delete(deleteProject);// DELETE a project

module.exports = router;