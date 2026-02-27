const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
const Report = require('../models/Report');
const Project = require('../models/Project');
const User = require('../models/User');
const reportController = require('../controllers/reportController');

// Mock axios for exchange rate API calls
jest.mock('axios');

let mongoServer;
let app;

// Setup Express app for testing
const setupApp = () => {
    const testApp = express();
    testApp.use(express.json());
    
    // Mock authentication middleware
    testApp.use((req, res, next) => {
        req.user = {
            _id: new mongoose.Types.ObjectId(),
            role: 'admin',
            name: 'Test User',
            email: 'test@example.com'
        };
        next();
    });
    
    // Setup routes
    testApp.post('/api/reports/submit', reportController.submitReport);
    testApp.get('/api/reports/project/:id', reportController.getProjectReports);
    testApp.get('/api/reports/stats/summary', reportController.getStatsSummary);
    testApp.delete('/api/reports/remove/:id', reportController.removeReport);
    testApp.put('/api/reports/update/:id', reportController.updateReport);
    
    // Error handling middleware
    testApp.use((err, req, res, next) => {
        res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
            success: false,
            error: err.message
        });
    });
    
    return testApp;
};

// Setup in-memory MongoDB before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = setupApp();
});

// Clean up after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    jest.clearAllMocks();
});

// Close connection and stop server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Report Controller Unit Tests', () => {
    let testUser;
    let testProject;

    beforeEach(async () => {
        // Create test user
        testUser = await User.create({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
            role: 'partner',
            organization: 'Test Org'
        });

        // Create test project with "In Progress" status
        testProject = await Project.create({
            title: 'Test Project',
            description: 'Test Description',
            organization: 'Test Org',
            sdgGoal: 'No Poverty',
            status: 'In Progress',
            createdBy: testUser._id
        });

        // Mock req.user for tests
        app = setupApp();
        app.use((req, res, next) => {
            req.user = testUser;
            next();
        });
    });

    describe('POST /api/reports/submit - Submit Report', () => {
        // TEST 01: Submit financial report with USD conversion
        test('should successfully submit a financial report with USD conversion', async () => {
            // Mock successful exchange rate API response
            axios.get.mockResolvedValue({
                data: {
                    rates: {
                        USD: 0.005
                    }
                }
            });

            const reportData = {
                project: testProject._id.toString(),
                reportType: 'financial',
                amountLKR: 100000,
                description: 'Q1 Budget Report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.amountLKR).toBe(100000);
            expect(response.body.data.amountUSD).toBe(500);
            expect(response.body.message).toBe('Progress report submitted successfully');
            expect(axios.get).toHaveBeenCalledWith(
                'https://api.exchangerate-api.com/v4/latest/LKR',
                { timeout: 5000 }
            );
        });

        // TEST 02: Submit financial report when exchange rate API fails
        test('should submit financial report even when exchange rate API fails', async () => {
            // Mock failed exchange rate API response
            axios.get.mockRejectedValue(new Error('API unavailable'));

            const reportData = {
                project: testProject._id.toString(),
                reportType: 'financial',
                amountLKR: 100000,
                description: 'Q1 Budget Report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.amountUSD).toBeNull();
            expect(response.body.warning).toContain('USD conversion unavailable');
        });

        // TEST 03: Submit people_helped report
        test('should successfully submit a people_helped report', async () => {
            const reportData = {
                project: testProject._id.toString(),
                reportType: 'people_helped',
                peopleImpacted: 250,
                description: 'Community outreach event'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.peopleImpacted).toBe(250);
            expect(response.body.data.reportType).toBe('people_helped');
        });

        // TEST 04: Validation - missing project
        test('should fail when project is not provided', async () => {
            const reportData = {
                reportType: 'milestone',
                description: 'Test description'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('select a project');
        });

        // TEST 05: Validation - missing reportType
        test('should fail when reportType is not provided', async () => {
            const reportData = {
                project: testProject._id.toString(),
                description: 'Test description'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('specify a report type');
        });

        // TEST 06: Validation - empty description
        test('should fail when description is empty', async () => {
            const reportData = {
                project: testProject._id.toString(),
                reportType: 'milestone',
                description: '   '
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('provide a description');
        });

        // TEST 07: Validation - financial report without positive amount
        test('should fail financial report without positive amountLKR', async () => {
            const reportData = {
                project: testProject._id.toString(),
                reportType: 'financial',
                amountLKR: 0,
                description: 'Invalid financial report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('positive amount in LKR');
        });

        // TEST 08: Validation - people report without valid peopleImpacted
        test('should fail people_helped report without valid peopleImpacted', async () => {
            const reportData = {
                project: testProject._id.toString(),
                reportType: 'people_helped',
                peopleImpacted: 0,
                description: 'Invalid people report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('positive whole number');
        });

        // TEST 09: Validation - nonexistent project
        test('should fail when project does not exist', async () => {
            const fakeProjectId = new mongoose.Types.ObjectId();
            const reportData = {
                project: fakeProjectId.toString(),
                reportType: 'milestone',
                description: 'Test report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Project not found');
        });

        // TEST 10: Validation - project status check
        test('should fail when project status is not "In Progress"', async () => {
            // Update project status to "Completed"
            testProject.status = 'Completed';
            await testProject.save();

            const reportData = {
                project: testProject._id.toString(),
                reportType: 'milestone',
                description: 'Test report'
            };

            const response = await request(app)
                .post('/api/reports/submit')
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('In Progress');
        });
    });

    describe('GET /api/reports/project/:id - Get Project Reports', () => {
        // TEST 11: Get all reports for a project
        test('should return all reports for a specific project', async () => {
            // Create multiple reports for the project
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 50000,
                description: 'Report 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Report 2'
            });

            const response = await request(app)
                .get(`/api/reports/project/${testProject._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.data).toHaveLength(2);
        });

        // TEST 12: Get reports for project with no reports
        test('should return empty array for project with no reports', async () => {
            const response = await request(app)
                .get(`/api/reports/project/${testProject._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(0);
            expect(response.body.data).toHaveLength(0);
        });

        // TEST 13: Reports sorting by date
        test('should return reports sorted by most recent first', async () => {
            // Create reports with different dates
            const report1 = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Older Report',
                reportDate: new Date('2025-01-01')
            });

            const report2 = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Recent Report',
                reportDate: new Date('2025-12-01')
            });

            const response = await request(app)
                .get(`/api/reports/project/${testProject._id}`)
                .expect(200);

            expect(response.body.data[0]._id.toString()).toBe(report2._id.toString());
            expect(response.body.data[1]._id.toString()).toBe(report1._id.toString());
        });
    });

    describe('GET /api/reports/stats/summary - Get Statistics Summary', () => {
        // TEST 14: Calculate financial statistics
        test('should return correct financial statistics', async () => {
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 50000,
                amountUSD: 250,
                description: 'Financial 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 30000,
                amountUSD: 150,
                description: 'Financial 2'
            });

            const response = await request(app)
                .get('/api/reports/stats/summary')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.financial.totalLKR).toBe(80000);
            expect(response.body.data.financial.totalUSD).toBe(400);
            expect(response.body.data.financial.reportCount).toBe(2);
        });

        // TEST 15: Calculate people impacted statistics
        test('should return correct people impacted statistics', async () => {
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                peopleImpacted: 100,
                description: 'People 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                peopleImpacted: 150,
                description: 'People 2'
            });

            const response = await request(app)
                .get('/api/reports/stats/summary')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.people.totalPeople).toBe(250);
            expect(response.body.data.people.reportCount).toBe(2);
        });

        // TEST 16: Statistics when no reports exist
        test('should return zero statistics when no reports exist', async () => {
            const response = await request(app)
                .get('/api/reports/stats/summary')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.financial.totalLKR).toBe(0);
            expect(response.body.data.people.totalPeople).toBe(0);
            expect(response.body.data.totalReports).toBe(0);
        });

        // TEST 17: Count reports by type
        test('should count reports by type correctly', async () => {
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 50000,
                description: 'Financial'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Milestone 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Milestone 2'
            });

            const response = await request(app)
                .get('/api/reports/stats/summary')
                .expect(200);

            expect(response.body.data.reportsByType).toHaveLength(2);
            expect(response.body.data.totalReports).toBe(3);
        });
    });

    describe('DELETE /api/reports/remove/:id - Remove Report', () => {
        // TEST 18: Admin delete any report
        test('should allow admin to delete any report', async () => {
            const report = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Test Report'
            });

            // Mock admin user
            app.use((req, res, next) => {
                req.user = { ...testUser._doc, role: 'admin' };
                next();
            });

            const response = await request(app)
                .delete(`/api/reports/remove/${report._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed successfully');

            // Verify report was deleted
            const deletedReport = await Report.findById(report._id);
            expect(deletedReport).toBeNull();
        });

        // TEST 19: Owner delete own report
        test('should allow report owner to delete their own report', async () => {
            const report = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Test Report'
            });

            const response = await request(app)
                .delete(`/api/reports/remove/${report._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        // TEST 20: Delete nonexistent report
        test('should fail when report does not exist', async () => {
            const fakeReportId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/reports/remove/${fakeReportId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Report not found');
        });
    });

    describe('PUT /api/reports/update/:id - Update Report', () => {
        // TEST 21: Update report description
        test('should successfully update report description', async () => {
            const report = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Original Description'
            });

            const updateData = {
                description: 'Updated Description'
            };

            const response = await request(app)
                .put(`/api/reports/update/${report._id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe('Updated Description');
            expect(response.body.message).toContain('updated successfully');
        });

        // TEST 22: Update financial report and recalculate USD
        test('should recalculate USD when updating financial report amount', async () => {
            axios.get.mockResolvedValue({
                data: {
                    rates: {
                        USD: 0.006
                    }
                }
            });

            const report = await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 100000,
                amountUSD: 500,
                exchangeRate: 0.005,
                description: 'Original Report'
            });

            const updateData = {
                reportType: 'financial',
                amountLKR: 150000
            };

            const response = await request(app)
                .put(`/api/reports/update/${report._id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.amountLKR).toBe(150000);
            expect(response.body.data.amountUSD).toBe(900);
        });

        // TEST 23: Update nonexistent report
        test('should fail when report does not exist', async () => {
            const fakeReportId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/reports/update/${fakeReportId}`)
                .send({ description: 'Test' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Report not found');
        });
    });
});
