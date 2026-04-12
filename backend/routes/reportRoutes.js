const express = require('express');
const router = express.Router();
const {
    getReports,
    getReportById,
    submitReport,
    getProjectReports,
    getStatsSummary,
    removeReport,
    updateReport
} = require('../controllers/reportController');

// Import authentication middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---

// Get reports for a specific project (anyone can view)
router.get('/project/:id', getProjectReports);

// Get aggregated statistics summary (anyone can view)
router.get('/stats/summary', getStatsSummary);

// RESTful report listing and retrieval
router.get('/', getReports);
router.get('/:id', getReportById);

// --- PROTECTED ROUTES ---

// RESTful create/update/delete
router.post('/', protect, authorize('admin', 'partner', 'government'), submitReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, removeReport);

module.exports = router;