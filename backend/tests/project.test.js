const request = require('supertest');
const app = require('../server');
const Project = require('../models/Project');

describe('Member 03: Project Registry & Statistics', () => {

    // TEST 01: Unit - Budget Validation
    it('UT-03: Should reject a project with a negative budget', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({
                title: "Invalid Budget Project",
                description: "This should fail",
                sdgGoal: "Quality Education",
                organization: "Test Org",
                budget: -500 // Invalid negative value
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('cannot be negative');
    });

    // TEST 02: Unit - Date Logic
    it('UT-04: Should reject if End Date is before Start Date', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({
                title: "Time Travel Project",
                description: "Invalid dates",
                sdgGoal: "Climate Action",
                organization: "Test Org",
                startDate: "2026-12-01",
                endDate: "2026-01-01" // Invalid
            });
        expect(res.statusCode).toEqual(400);
    });

    // TEST 03: Integration - Missing Required Fields
    it('IT-03: Should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({
                title: "Missing Goal"
                // Missing sdgGoal and organization
            });
        expect(res.statusCode).toEqual(400);
    });

    // TEST 04: Integration - Fetch Statistics
    it('IT-04: Should fetch aggregated statistics successfully', async () => {
        const res = await request(app).get('/api/projects/with-stats');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});