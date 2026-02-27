const Project = require('../models/Project');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler'); // 🛡️ Added for clean error handling

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find();
    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    res.status(200).json({ success: true, data: project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
    // Mongoose schema validation will be caught by asyncHandler automatically
    const project = await Project.create(req.body);

    res.status(201).json({
        success: true,
        data: project
    });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // 🛡️ Crucial: This ensures updates also follow Schema rules
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    res.status(200).json({ success: true, data: project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    await project.deleteOne();
    res.status(200).json({ success: true, data: {} });
});

// @desc    Get projects with statistics (paginated with aggregation)
// @route   GET /api/projects/with-stats
const getProjectsWithStatistics = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const matchCriteria = {};
    if (req.query.sdgGoal) matchCriteria.sdgGoal = req.query.sdgGoal;
    if (req.query.status) matchCriteria.status = req.query.status;
    if (req.query.organization) matchCriteria.organization = req.query.organization;

    const totalProjects = await Project.countDocuments(matchCriteria);
    const totalPages = Math.ceil(totalProjects / limit);

    const aggregationPipeline = [];
    if (Object.keys(matchCriteria).length > 0) aggregationPipeline.push({ $match: matchCriteria });
    
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
    
    const projectsWithStats = await Project.aggregate([
        ...aggregationPipeline,
        {
            $lookup: {
                from: 'reports',
                localField: '_id',
                foreignField: 'project',
                as: 'reports'
            }
        },
        {
            $addFields: {
                totalSpent: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$reports', cond: { $eq: ['$$this.reportType', 'financial'] } } },
                            in: { $ifNull: ['$$this.amountLKR', 0] }
                        }
                    }
                },
                totalPeopleImpacted: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$reports', cond: { $eq: ['$$this.reportType', 'people_helped'] } } },
                            in: { $ifNull: ['$$this.peopleImpacted', 0] }
                        }
                    }
                },
                totalReports: { $size: '$reports' }
            }
        },
        {
            $addFields: {
                budgetRemaining: { $subtract: [{ $ifNull: ['$budget', 0] }, '$totalSpent'] },
                budgetUtilization: {
                    $cond: {
                        if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                        then: { $multiply: [{ $divide: ['$totalSpent', '$budget'] }, 100] },
                        else: 0
                    }
                },
                isOverBudget: {
                    $cond: {
                        if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                        then: { $gt: ['$totalSpent', '$budget'] },
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                warningLevel: {
                    $cond: {
                        if: { $gte: ['$budgetUtilization', 100] },
                        then: 'danger',
                        else: { $cond: { if: { $gte: ['$budgetUtilization', 80] }, then: 'warning', else: null } }
                    }
                }
            }
        },
        { $project: { reports: 0 } }
    ]);

    res.status(200).json({
        success: true,
        page,
        limit,
        totalProjects,
        totalPages,
        count: projectsWithStats.length,
        data: projectsWithStats
    });
});

// @desc    Get single project statistics
// @route   GET /api/projects/:id/statistics
const getSingleProjectStatistics = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400);
        throw new Error('Invalid Project ID format');
    }

    const projectStats = await Project.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
        {
            $lookup: {
                from: 'reports',
                localField: '_id',
                foreignField: 'project',
                as: 'reports'
            }
        },
        {
            $addFields: {
                totalSpent: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$reports', cond: { $eq: ['$$this.reportType', 'financial'] } } },
                            in: { $ifNull: ['$$this.amountLKR', 0] }
                        }
                    }
                },
                totalPeopleImpacted: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$reports', cond: { $eq: ['$$this.reportType', 'people_helped'] } } },
                            in: { $ifNull: ['$$this.peopleImpacted', 0] }
                        }
                    }
                },
                totalReports: { $size: '$reports' }
            }
        },
        {
            $addFields: {
                budgetRemaining: { $subtract: [{ $ifNull: ['$budget', 0] }, '$totalSpent'] },
                budgetUtilization: {
                    $cond: {
                        if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                        then: { $multiply: [{ $divide: ['$totalSpent', '$budget'] }, 100] },
                        else: 0
                    }
                },
                isOverBudget: {
                    $cond: {
                        if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                        then: { $gt: ['$totalSpent', '$budget'] },
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                warningLevel: {
                    $cond: {
                        if: { $gte: ['$budgetUtilization', 100] },
                        then: 'danger',
                        else: { $cond: { if: { $gte: ['$budgetUtilization', 80] }, then: 'warning', else: null } }
                    }
                }
            }
        },
        { $project: { reports: 0 } }
    ]);

    if (!projectStats || projectStats.length === 0) {
        res.status(404);
        throw new Error('Project statistics not found');
    }

    res.status(200).json({
        success: true,
        data: projectStats[0]
    });
});

// @desc    Get unique organizations list
// @route   GET /api/projects/organizations
const getOrganizations = asyncHandler(async (req, res) => {
    const organizations = await Project.distinct('organization');
    organizations.sort();
    
    res.status(200).json({
        success: true,
        count: organizations.length,
        data: organizations
    });
});

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectsWithStatistics,
    getSingleProjectStatistics,
    getOrganizations
};