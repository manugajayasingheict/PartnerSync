const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Invalid Project ID' });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (We will make it public for testing now)
const createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Invalid Data' });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        await project.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get projects with statistics (paginated with aggregation)
// @route   GET /api/projects/with-stats?page=1&limit=12&sdgGoal=X&status=Y&organization=Z
// @access  Public
const getProjectsWithStatistics = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Build filter criteria from query parameters
        const matchCriteria = {};
        if (req.query.sdgGoal) {
            matchCriteria.sdgGoal = req.query.sdgGoal;
        }
        if (req.query.status) {
            matchCriteria.status = req.query.status;
        }
        if (req.query.organization) {
            matchCriteria.organization = req.query.organization;
        }

        // Get total count for pagination metadata (with filters applied)
        const totalProjects = await Project.countDocuments(matchCriteria);
        const totalPages = Math.ceil(totalProjects / limit);

        // Aggregation pipeline: Filter FIRST, then paginate, then join and calculate
        const aggregationPipeline = [];
        
        // Stage 1: Apply filters if any exist
        if (Object.keys(matchCriteria).length > 0) {
            aggregationPipeline.push({ $match: matchCriteria });
        }
        
        // Stage 2 & 3: Pagination (after filtering, before expensive operations)
        aggregationPipeline.push(
            { $skip: skip },
            { $limit: limit }
        );
        
        const projectsWithStats = await Project.aggregate([
            ...aggregationPipeline,
            
            // Stage 3: Lookup/Join with reports collection
            {
                $lookup: {
                    from: 'reports',
                    localField: '_id',
                    foreignField: 'project',
                    as: 'reports'
                }
            },
            
            // Stage 4: Calculate financial totals
            {
                $addFields: {
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$reports',
                                        cond: { $eq: ['$$this.reportType', 'financial'] }
                                    }
                                },
                                in: { $ifNull: ['$$this.amountLKR', 0] }
                            }
                        }
                    }
                }
            },
            
            // Stage 5: Calculate people impacted
            {
                $addFields: {
                    totalPeopleImpacted: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$reports',
                                        cond: { $eq: ['$$this.reportType', 'people_helped'] }
                                    }
                                },
                                in: { $ifNull: ['$$this.peopleImpacted', 0] }
                            }
                        }
                    }
                }
            },
            
            // Stage 6: Count total reports
            {
                $addFields: {
                    totalReports: { $size: '$reports' }
                }
            },
            
            // Stage 7: Calculate derived values
            {
                $addFields: {
                    budgetRemaining: {
                        $subtract: [
                            { $ifNull: ['$budget', 0] },
                            '$totalSpent'
                        ]
                    },
                    budgetUtilization: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                            then: {
                                $multiply: [
                                    { $divide: ['$totalSpent', '$budget'] },
                                    100
                                ]
                            },
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
            
            // Stage 8: Add warning level
            {
                $addFields: {
                    warningLevel: {
                        $cond: {
                            if: { $gte: ['$budgetUtilization', 100] },
                            then: 'danger',
                            else: {
                                $cond: {
                                    if: { $gte: ['$budgetUtilization', 80] },
                                    then: 'warning',
                                    else: null
                                }
                            }
                        }
                    }
                }
            },
            
            // Stage 9: Remove reports array (don't need to send it)
            {
                $project: {
                    reports: 0
                }
            }
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
    } catch (error) {
        console.error('Aggregation error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single project statistics
// @route   GET /api/projects/:id/statistics
// @access  Public
const getSingleProjectStatistics = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, error: 'Invalid Project ID' });
        }

        // Aggregation for single project
        const projectStats = await Project.aggregate([
            // Match specific project
            { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
            
            // Lookup reports
            {
                $lookup: {
                    from: 'reports',
                    localField: '_id',
                    foreignField: 'project',
                    as: 'reports'
                }
            },
            
            // Calculate financial totals
            {
                $addFields: {
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$reports',
                                        cond: { $eq: ['$$this.reportType', 'financial'] }
                                    }
                                },
                                in: { $ifNull: ['$$this.amountLKR', 0] }
                            }
                        }
                    }
                }
            },
            
            // Calculate people impacted
            {
                $addFields: {
                    totalPeopleImpacted: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$reports',
                                        cond: { $eq: ['$$this.reportType', 'people_helped'] }
                                    }
                                },
                                in: { $ifNull: ['$$this.peopleImpacted', 0] }
                            }
                        }
                    }
                }
            },
            
            // Count total reports
            {
                $addFields: {
                    totalReports: { $size: '$reports' }
                }
            },
            
            // Calculate derived values
            {
                $addFields: {
                    budgetRemaining: {
                        $subtract: [
                            { $ifNull: ['$budget', 0] },
                            '$totalSpent'
                        ]
                    },
                    budgetUtilization: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$budget', 0] }, 0] },
                            then: {
                                $multiply: [
                                    { $divide: ['$totalSpent', '$budget'] },
                                    100
                                ]
                            },
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
            
            // Add warning level
            {
                $addFields: {
                    warningLevel: {
                        $cond: {
                            if: { $gte: ['$budgetUtilization', 100] },
                            then: 'danger',
                            else: {
                                $cond: {
                                    if: { $gte: ['$budgetUtilization', 80] },
                                    then: 'warning',
                                    else: null
                                }
                            }
                        }
                    }
                }
            },
            
            // Remove reports array
            {
                $project: {
                    reports: 0
                }
            }
        ]);

        if (!projectStats || projectStats.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.status(200).json({
            success: true,
            data: projectStats[0]
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get unique organizations list
// @route   GET /api/projects/organizations
// @access  Public
const getOrganizations = async (req, res) => {
    try {
        // Get distinct organizations from Project collection
        const organizations = await Project.distinct('organization');
        
        // Sort alphabetically
        organizations.sort();
        
        res.status(200).json({
            success: true,
            count: organizations.length,
            data: organizations
        });
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

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