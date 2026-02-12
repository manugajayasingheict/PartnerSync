const Report = require('../models/Report');
const axios = require('axios');

// @desc    Submit a new progress report with auto USD conversion
// @route   POST /api/reports/submit
// @access  Private (Admin, Partner, Government)
exports.submitReport = async (req, res) => {
    try {
        const { project, reportType, amountLKR, peopleImpacted, description } = req.body;

        let amountUSD = null;
        let exchangeRate = null;

        // If it's a financial report, fetch live exchange rate
        if (reportType === 'financial' && amountLKR) {
            try {
                const rateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/LKR');
                exchangeRate = rateResponse.data.rates.USD;
                amountUSD = (amountLKR * exchangeRate).toFixed(2);
            } catch (error) {
                console.error('Exchange rate API failed:', error.message);
                // Continue without USD conversion if API fails
            }
        }

        const report = await Report.create({
            project,
            reportedBy: req.user._id,
            reportType,
            amountLKR,
            amountUSD,
            peopleImpacted,
            description,
            exchangeRate
        });

        // Populate project and user details before sending response
        await report.populate('project', 'title organization');
        await report.populate('reportedBy', 'name email');

        res.status(201).json({
            success: true,
            data: report,
            message: 'Progress report submitted successfully'
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get historical timeline of reports for a specific project
// @route   GET /api/reports/project/:id
// @access  Public
exports.getProjectReports = async (req, res) => {
    try {
        const reports = await Report.find({ project: req.params.id })
            .populate('reportedBy', 'name organization')
            .populate('project', 'title')
            .sort({ reportDate: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Invalid Project ID' });
    }
};

// @desc    Get aggregated impact statistics across all projects
// @route   GET /api/reports/stats/summary
// @access  Public
exports.getStatsSummary = async (req, res) => {
    try {
        // Aggregate total financial impact
        const financialStats = await Report.aggregate([
            { $match: { reportType: 'financial' } },
            {
                $group: {
                    _id: null,
                    totalLKR: { $sum: '$amountLKR' },
                    totalUSD: { $sum: { $toDouble: '$amountUSD' } },
                    reportCount: { $sum: 1 }
                }
            }
        ]);

        // Aggregate people impacted
        const peopleStats = await Report.aggregate([
            { $match: { reportType: 'people_helped' } },
            {
                $group: {
                    _id: null,
                    totalPeople: { $sum: '$peopleImpacted' },
                    reportCount: { $sum: 1 }
                }
            }
        ]);

        // Count reports by type
        const reportsByType = await Report.aggregate([
            {
                $group: {
                    _id: '$reportType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get total number of unique projects with reports
        const projectsWithReports = await Report.distinct('project');

        res.status(200).json({
            success: true,
            data: {
                financial: financialStats[0] || { totalLKR: 0, totalUSD: 0, reportCount: 0 },
                people: peopleStats[0] || { totalPeople: 0, reportCount: 0 },
                reportsByType: reportsByType,
                projectsReported: projectsWithReports.length,
                totalReports: await Report.countDocuments()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete a report entry (for erroneous entries)
// @route   DELETE /api/reports/remove/:id
// @access  Private (Admin or Report Owner)
exports.removeReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        // Check if user is admin or the one who submitted the report
        if (req.user.role !== 'admin' && report.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                error: 'Not authorized to delete this report' 
            });
        }

        await report.deleteOne();

        res.status(200).json({ 
            success: true, 
            message: 'Report removed successfully',
            data: {} 
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
