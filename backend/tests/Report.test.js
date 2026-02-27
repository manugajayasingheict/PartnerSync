const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Report = require('../models/Report');
const Project = require('../models/Project');
const User = require('../models/User');

let mongoServer;

// Setup in-memory MongoDB before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

// Clean up after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Close connection and stop server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Report Model Unit Tests', () => {
    let testUser;
    let testProject;

    beforeEach(async () => {
        // Create a test user
        testUser = await User.create({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
            role: 'partner',
            organization: 'Test Org'
        });

        // Create a test project
        testProject = await Project.create({
            title: 'Test Project',
            description: 'Test Description',
            organization: 'Test Org',
            sdgGoal: 'No Poverty',
            status: 'In Progress',
            createdBy: testUser._id
        });
    });

    describe('Financial Report Creation', () => {
        // TEST 01: Create valid financial report
        test('should create a valid financial report with all required fields', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 100000,
                amountUSD: 500,
                exchangeRate: 0.005,
                description: 'Q1 Financial Report'
            };

            const report = await Report.create(reportData);

            expect(report.project.toString()).toBe(testProject._id.toString());
            expect(report.reportedBy.toString()).toBe(testUser._id.toString());
            expect(report.reportType).toBe('financial');
            expect(report.amountLKR).toBe(100000);
            expect(report.amountUSD).toBe(500);
            expect(report.description).toBe('Q1 Financial Report');
            expect(report.reportDate).toBeDefined();
        });

        // TEST 02: Financial report validation - missing amountLKR
        test('should fail to create financial report without amountLKR', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                description: 'Incomplete Financial Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 03: Financial report validation - negative amount
        test('should fail to create financial report with negative amountLKR', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: -100,
                description: 'Invalid Financial Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 04: Financial report validation - zero amount
        test('should fail to create financial report with zero amountLKR', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 0,
                description: 'Zero Amount Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });
    });

    describe('People Helped Report Creation', () => {
        // TEST 05: Create valid people_helped report
        test('should create a valid people_helped report', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                peopleImpacted: 150,
                description: 'Community outreach milestone'
            };

            const report = await Report.create(reportData);

            expect(report.reportType).toBe('people_helped');
            expect(report.peopleImpacted).toBe(150);
            expect(report.description).toBe('Community outreach milestone');
        });

        // TEST 06: People report validation - missing peopleImpacted
        test('should fail to create people_helped report without peopleImpacted', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                description: 'Incomplete People Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 07: People report validation - decimal value
        test('should fail to create people_helped report with decimal peopleImpacted', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                peopleImpacted: 150.5,
                description: 'Invalid People Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 08: People report validation - negative value
        test('should fail to create people_helped report with negative peopleImpacted', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'people_helped',
                peopleImpacted: -10,
                description: 'Negative People Report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });
    });

    describe('Milestone and Other Report Types', () => {
        // TEST 09: Create milestone report
        test('should create a valid milestone report', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Project phase 1 completed'
            };

            const report = await Report.create(reportData);

            expect(report.reportType).toBe('milestone');
            expect(report.description).toBe('Project phase 1 completed');
        });

        // TEST 10: Create other type report
        test('should create a valid other type report', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'other',
                description: 'General project update'
            };

            const report = await Report.create(reportData);

            expect(report.reportType).toBe('other');
        });

        // TEST 11: Report type validation - invalid type
        test('should fail to create report with invalid reportType', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'invalid_type',
                description: 'Invalid report type'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });
    });

    describe('Required Fields Validation', () => {
        // TEST 12: Required field validation - missing project
        test('should fail to create report without project', async () => {
            const reportData = {
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Test description'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 13: Required field validation - missing reportedBy
        test('should fail to create report without reportedBy', async () => {
            const reportData = {
                project: testProject._id,
                reportType: 'milestone',
                description: 'Test description'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 14: Required field validation - missing description
        test('should fail to create report without description', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });

        // TEST 15: Description length validation
        test('should fail to create report with description exceeding 500 characters', async () => {
            const longDescription = 'a'.repeat(501);
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: longDescription
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });
    });

    describe('Default Values', () => {
        // TEST 16: Default reportType value
        test('should set default reportType to financial', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                amountLKR: 50000,
                description: 'Default type report'
            };

            const report = await Report.create(reportData);

            expect(report.reportType).toBe('financial');
        });

        // TEST 17: Default reportDate value
        test('should set reportDate to current date by default', async () => {
            const beforeCreate = new Date();
            
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Date test report'
            };

            const report = await Report.create(reportData);
            const afterCreate = new Date();

            expect(report.reportDate).toBeDefined();
            expect(report.reportDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(report.reportDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        });
    });

    describe('USD Amount Validation', () => {
        // TEST 18: Allow null USD amount
        test('should allow null amountUSD', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 100000,
                amountUSD: null,
                description: 'Report without USD'
            };

            const report = await Report.create(reportData);

            expect(report.amountUSD).toBeNull();
        });

        // TEST 19: Negative USD amount validation
        test('should fail with negative amountUSD', async () => {
            const reportData = {
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 100000,
                amountUSD: -50,
                description: 'Negative USD report'
            };

            await expect(Report.create(reportData)).rejects.toThrow();
        });
    });

    describe('Report Querying', () => {
        // TEST 20: Query reports by project
        test('should find reports by project', async () => {
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Report 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Report 2'
            });

            const reports = await Report.find({ project: testProject._id });

            expect(reports.length).toBe(2);
        });

        // TEST 21: Query reports by reportType
        test('should find reports by reportType', async () => {
            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'financial',
                amountLKR: 50000,
                description: 'Financial 1'
            });

            await Report.create({
                project: testProject._id,
                reportedBy: testUser._id,
                reportType: 'milestone',
                description: 'Milestone 1'
            });

            const financialReports = await Report.find({ reportType: 'financial' });

            expect(financialReports.length).toBe(1);
            expect(financialReports[0].reportType).toBe('financial');
        });
    });
});
