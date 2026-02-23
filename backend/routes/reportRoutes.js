const express = require('express');
const router = express.Router();
const {
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

// --- PROTECTED ROUTES ---

// Submit a new report (Admin, Partner, Government only)
router.post('/submit', protect, authorize('admin', 'partner', 'government'), submitReport);

// Update a report (Admin or Report Owner)
router.put('/update/:id', protect, updateReport);

// Delete a report (Admin or Report Owner)
router.delete('/remove/:id', protect, removeReport);

module.exports = router;