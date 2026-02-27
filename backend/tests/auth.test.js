const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Member 01: User Authentication & Authorization', () => {
    
    // Cleanup database before tests
    beforeAll(async () => {
        await User.deleteMany({ email: 'testuser@example.com' });
    });

    // TEST 01: Unit/Validation - Password Length
    it('UT-01: Should reject registration if password < 6 characters', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Manuga",
                email: "testuser@example.com",
                password: "123", // Invalid length
                organization: "PartnerSync"
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('at least 6 characters');
    });

    // TEST 02: Unit/Validation - Email Regex
    it('UT-02: Should reject invalid email formats', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Manuga",
                email: "invalid-email-format",
                password: "password123",
                organization: "PartnerSync"
            });
        expect(res.statusCode).toEqual(400);
    });

    // TEST 03: Integration - Duplicate Email
    it('IT-01: Should prevent duplicate email registration in MongoDB', async () => {
        // First registration
        await request(app).post('/api/auth/register').send({
            name: "First User",
            email: "testuser@example.com",
            password: "password123",
            organization: "PartnerSync"
        });

        // Duplicate attempt
        const res = await request(app).post('/api/auth/register').send({
            name: "Second User",
            email: "testuser@example.com",
            password: "password123",
            organization: "PartnerSync"
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('User already exists');
    });

    // TEST 04: Integration - Protected Route
    it('IT-02: Should deny access to Admin routes without a valid JWT token', async () => {
        const res = await request(app).get('/api/auth/users');
        expect(res.statusCode).toEqual(401);
    });
});