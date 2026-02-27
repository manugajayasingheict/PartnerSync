const Report = require('../models/Report');
const Project = require('../models/Project');
const axios = require('axios');
const asyncHandler = require('express-async-handler');

// @desc    Submit a new progress report with auto USD conversion
// @route   POST /api/reports/submit
// @access  Private (Admin, Partner, Government)
exports.submitReport = asyncHandler(async (req, res) => {
    const { project, reportType, amountLKR, peopleImpacted, description } = req.body;

    // Input Validation: Check required fields
    if (!project) {
        res.status(400);
        throw new Error('Please select a project');
    }

    if (!reportType) {
        res.status(400);
        throw new Error('Please specify a report type');
    }

    if (!description || description.trim() === '') {
        res.status(400);
        throw new Error('Please provide a description');
    }

    // Conditional Validation based on reportType
    if (reportType === 'financial') {
        if (!amountLKR || Number(amountLKR) <= 0) {
            res.status(400);
            throw new Error('Financial reports require a positive amount in LKR');
        }
    }

    if (reportType === 'people_helped') {
        if (!peopleImpacted || Number(peopleImpacted) < 1 || !Number.isInteger(Number(peopleImpacted))) {
            res.status(400);
            throw new Error('People helped reports require a positive whole number');
        }
    }

    // Validation: Check if project exists and is "In Progress"
    const projectDoc = await Project.findById(project);
    
    if (!projectDoc) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (projectDoc.status !== 'In Progress') {
        res.status(400);
        throw new Error('Reports can only be submitted for projects marked "In Progress"');
    }

    let amountUSD = null;
    let exchangeRate = null;
    let usdConversionWarning = null;

    // If it's a financial report, fetch live exchange rate with timeout
    if (reportType === 'financial' && amountLKR) {
        try {
            const rateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/LKR', {
                timeout: 5000 // 5 second timeout
            });
            exchangeRate = rateResponse.data.rates.USD;
            amountUSD = (amountLKR * exchangeRate).toFixed(2);
        } catch (error) {
            console.error('Exchange rate API failed:', error.message);
            usdConversionWarning = 'USD conversion unavailable - exchange rate service is temporarily down';
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
        message: 'Progress report submitted successfully',
        warning: usdConversionWarning
    });
});

// @desc    Get historical timeline of reports for a specific project
// @route   GET /api/reports/project/:id
// @access  Public
exports.getProjectReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ project: req.params.id })
        .populate('reportedBy', 'name organization')
        .populate('project', 'title')
        .sort({ reportDate: -1 }); // Most recent first

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Get aggregated impact statistics across all projects
// @route   GET /api/reports/stats/summary
// @access  Public
exports.getStatsSummary = asyncHandler(async (req, res) => {
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
});

// @desc    Delete a report entry (for erroneous entries)
// @route   DELETE /api/reports/remove/:id
// @access  Private (Admin or Report Owner)
exports.removeReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user is admin or the one who submitted the report
    if (req.user.role !== 'admin' && report.reportedBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this report');
    }

    await report.deleteOne();

    res.status(200).json({ 
        success: true, 
        message: 'Report removed successfully',
        data: {} 
    });
});

// @desc    Update a report entry
// @route   PUT /api/reports/update/:id
// @access  Private (Admin or Report Owner)
exports.updateReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user is admin or the one who submitted the report
    if (req.user.role !== 'admin' && report.reportedBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this report');
    }

    const { reportType, amountLKR, peopleImpacted, description } = req.body;

    // If updating to financial report with new amount, recalculate USD
    let amountUSD = report.amountUSD;
    let exchangeRate = report.exchangeRate;

    if (reportType === 'financial' && amountLKR && amountLKR !== report.amountLKR) {
        try {
            const rateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/LKR', {
                timeout: 5000
            });
            exchangeRate = rateResponse.data.rates.USD;
            amountUSD = (amountLKR * exchangeRate).toFixed(2);
        } catch (error) {
            console.error('Exchange rate API failed:', error.message);
            // Keep existing USD value if API fails
        }
    }

    // Update fields
    if (reportType !== undefined) report.reportType = reportType;
    if (amountLKR !== undefined) {
        report.amountLKR = amountLKR;
        report.amountUSD = amountUSD;
        report.exchangeRate = exchangeRate;
    }
    if (peopleImpacted !== undefined) report.peopleImpacted = peopleImpacted;
    if (description !== undefined) report.description = description;

    await report.save();

    // Populate details before sending response
    await report.populate('project', 'title organization');
    await report.populate('reportedBy', 'name email');

    res.status(200).json({
        success: true,
        data: report,
        message: 'Report updated successfully'
    });
});
