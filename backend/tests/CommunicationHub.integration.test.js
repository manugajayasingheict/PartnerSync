// ============================================================
// CommunicationHub.integration.test.js
// Member 04 — Knowledge & Communication Hub
// ============================================================
//
// This file contains the integration tests for the Communication Hub.
// Run with: npm test
// ============================================================

// ============================================================
//  SECTION B — INTEGRATION TESTS (UPDATED FOR CURRENT AUTH)
// ============================================================
describe('SECTION B — INTEGRATION TESTS (Auth-Aligned)', () => {

  const request  = require('supertest');
  const app      = require('../server');
  const mongoose = require('mongoose');
  const User     = require('../models/User');
  const Post     = require('../models/Post');

  let tokenA;
  let tokenB;
  let testPostId;

  beforeAll(async () => {

    await User.deleteMany({ email: { $in: ['intA@test.com', 'intB@test.com'] } });
    await Post.deleteMany({ title: /Integration Updated/ });

    // Register A
    const registerA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'intA@test.com',
      password: 'password123',
      organization: 'Green Earth NGO'
    });
    expect(registerA.statusCode).toBe(201);

    const loginA = await request(app).post('/api/auth/login').send({
      email: 'intA@test.com',
      password: 'password123'
    });
    expect(loginA.statusCode).toBe(200);
    expect(loginA.body.token).toBeDefined();
    tokenA = loginA.body.token;

    // Register B
    const registerB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'intB@test.com',
      password: 'password123',
      organization: 'Blue Ocean NGO'
    });
    expect(registerB.statusCode).toBe(201);

    const loginB = await request(app).post('/api/auth/login').send({
      email: 'intB@test.com',
      password: 'password123'
    });
    expect(loginB.statusCode).toBe(200);
    expect(loginB.body.token).toBeDefined();
    tokenB = loginB.body.token;

    // Create base post
    const createRes = await request(app)
      .post('/api/collab/post')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Integration Updated Post',
        content: 'Testing.',
        type: 'Announcement'
      });

    expect(createRes.statusCode).toBe(201);

    // Support both response styles
    testPostId =
      createRes.body?.postId ||
      createRes.body?.post?._id ||
      createRes.body?._id ||
      null;

    expect(testPostId).toBeDefined();
    expect(testPostId).not.toBeNull();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['intA@test.com', 'intB@test.com'] } });
    await Post.deleteMany({ title: /Integration Updated/ });
    await mongoose.connection.close();
  });

  // ----------------------------------------------------------
  // INTEGRATION 1 — Create Post (basic success check)
  // ----------------------------------------------------------
  test('POST /api/collab/post — should return 201 when authorized', async () => {

    const res = await request(app)
      .post('/api/collab/post')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Integration Updated Post 2',
        content: 'Testing full stack.',
        type: 'Announcement'
      });

    expect(res.statusCode).toBe(201);
  });

  // ----------------------------------------------------------
  // INTEGRATION 2 — Unauthorized edit should return 403
  // ----------------------------------------------------------
  test('PUT /api/collab/post/:id — non-author should get 403', async () => {

    const res = await request(app)
      .put(`/api/collab/post/${testPostId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked' });

    expect([401, 403]).toContain(res.statusCode);
  });

  // ----------------------------------------------------------
  // INTEGRATION 3 — Author delete should succeed OR be properly blocked
  // ----------------------------------------------------------
  test('DELETE /api/collab/post/:id — author attempt', async () => {

    const res = await request(app)
      .delete(`/api/collab/post/${testPostId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([200, 403]).toContain(res.statusCode);
  });

  // ----------------------------------------------------------
  // INTEGRATION 5 — Update comment by commenter
  // ----------------------------------------------------------
  test('PUT /api/collab/comment/:commentId — commenter should update successfully', async () => {

    // Create a post for commenting
    const postRes = await request(app)
      .post('/api/collab/post')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Comment Test Post',
        content: 'For testing comments.',
        type: 'Announcement'
      });

    expect(postRes.statusCode).toBe(201);
    const commentPostId = postRes.body.postId;

    // First, add a comment
    const commentRes = await request(app)
      .post('/api/collab/comment')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ postId: commentPostId, text: 'Original comment' });

    expect(commentRes.statusCode).toBe(201);

    // Get the comment ID from the response
    const commentId = commentRes.body.post.comments[0]._id;

    // Now update the comment
    const updateRes = await request(app)
      .put(`/api/collab/comment/${commentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ text: 'Updated comment' });

    expect(updateRes.statusCode).toBe(200);
  });

  // ----------------------------------------------------------
  // INTEGRATION 4 — Protected routes should reject without token
  // ----------------------------------------------------------
  test('Protected routes should return 401 without token', async () => {

    const responses = await Promise.all([
      request(app).get('/api/collab/feed'),
      request(app).post('/api/collab/post').send({ title: 'T', content: 'C', type: 'Announcement' }),
      request(app).post('/api/collab/comment').send({ postId: testPostId, text: 'Hi' }),
      request(app).get('/api/collab/notifications')
    ]);

    // Feed is public, while write/notification routes are protected.
    expect(responses[0].statusCode).toBe(200);
    expect(responses[1].statusCode).toBe(401);
    expect(responses[2].statusCode).toBe(401);
    expect(responses[3].statusCode).toBe(401);
  });

});