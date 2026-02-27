const request = require('supertest');
const app = require('../server');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

describe('Member 03: Project Registry & Statistics', () => {
    let token;

    // 🛡️ Setup: Register and PROMOTE user before running tests
    beforeAll(async () => {
        await User.deleteMany({ email: 'tester@partnersync.com' });
        
        // 1. Register the user
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Test User",
                email: "tester@partnersync.com",
                password: "password123",
                organization: "Test Org"
            });
        
        token = res.body.token; 
        const userId = res.body.user.id;

        // 2. 🛑 CRITICAL: Manually promote user to 'partner' role in DB
        // This prevents the 403 Forbidden error from the authorize middleware
        await User.findByIdAndUpdate(userId, { role: 'partner', isVerified: true });
    });

    // Cleanup after all tests finish
    afterAll(async () => {
        await User.deleteMany({ email: 'tester@partnersync.com' });
        await mongoose.connection.close();
    });

    // TEST 01: Unit - Budget Validation
    it('UT-03: Should reject a project with a negative budget', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`) 
            .send({
                title: "Invalid Budget Project",
                description: "This should fail",
                sdgGoal: "Quality Education",
                organization: "Test Org",
                budget: -500 
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('cannot be negative');
    });

    // TEST 02: Unit - Date Logic
    it('UT-04: Should reject if End Date is before Start Date', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`) 
            .send({
                title: "Time Travel Project",
                description: "Invalid dates",
                sdgGoal: "Climate Action",
                organization: "Test Org",
                startDate: "2026-12-01",
                endDate: "2026-01-01" 
            });
        expect(res.statusCode).toEqual(400);
    });

    // TEST 03: Integration - Missing Required Fields
    it('IT-03: Should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`) 
            .send({
                title: "Missing Goal"
            });
        expect(res.statusCode).toEqual(400);
    });

    // TEST 04: Integration - Fetch Statistics
    it('IT-04: Should fetch aggregated statistics successfully', async () => {
        const res = await request(app)
            .get('/api/projects/with-stats')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});