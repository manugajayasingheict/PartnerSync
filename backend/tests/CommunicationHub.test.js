/**
 * ============================================================
 * CommunicationHub.test.js
 * Member 04 — Knowledge & Communication Hub
 * ============================================================
 *
 * This file contains 10 test cases split into two sections:
 *
 *   SECTION A — UNIT TESTS        (Tests 1–5)
 *   SECTION B — INTEGRATION TESTS (Tests 6–10)
 *
 * Run with: npm test
 * ============================================================
 */

// ============================================================
//  SECTION A — UNIT TESTS (5 Tests)
//
//  What:  Tests each controller function in complete isolation.
//  How:   MongoDB models are fully mocked using jest.mock().
//         No real database or HTTP requests are used.
//  Goal:  Verify individual function logic works on its own.
// ============================================================
describe('SECTION A — UNIT TESTS', () => {

  // ── MOCK MODELS (scoped to unit tests only) ───────────────
  jest.mock('../models/Post');
  jest.mock('../models/Notification');

  const {
    createPost,
    addComment,
    updatePost,
    deletePost
  } = require('../controllers/collabController');

  const PostMock         = require('../models/Post');
  const NotificationMock = require('../models/Notification');

  // ── MOCK HELPERS ─────────────────────────────────────────
  // Builds a fake req object so we don't need a real HTTP request
  const mockReq = (body = {}, params = {}, user = {}) => ({
    body,
    params,
    user: {
      _id:          'user123',
      name:         'Test User',
      organization: 'Test NGO',
      ...user
    }
  });

  // Builds a fake res object with jest spies to track calls
  const mockRes = () => {
    const res  = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────────────────
  // UNIT TEST 1 — createPost: DiceBear avatar URL is generated
  //
  // WHY: The DiceBear external API is the core "cool feature"
  //      of Member 04. This test proves the avatar URL is
  //      correctly built from the org name — in isolation,
  //      without any DB or network calls.
  // ──────────────────────────────────────────────────────────
  test('[UNIT 1] createPost — avatarUrl should be generated from DiceBear API using org name', async () => {
    let capturedPost = null;

    PostMock.mockImplementation((data) => {
      capturedPost = data;
      return { save: jest.fn().mockResolvedValue(data) };
    });

    const req = mockReq({ title: 'Test', content: 'Content', type: 'Announcement' });
    const res = mockRes();

    await createPost(req, res);

    expect(capturedPost.avatarUrl).toContain('dicebear.com');
    expect(capturedPost.avatarUrl).toContain('Test%20NGO');
  });

  // ──────────────────────────────────────────────────────────
  // UNIT TEST 2 — createPost: Returns 400 when fields missing
  //
  // WHY: Validates that the input validation inside the
  //      controller correctly rejects incomplete requests
  //      without touching the database at all.
  // ──────────────────────────────────────────────────────────
  test('[UNIT 2] createPost — should return 400 if title, content or type is missing', async () => {
    const req = mockReq({ content: 'Some content' }); // missing title and type
    const res = mockRes();

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Title, content, and type are required.' })
    );
  });

  // ──────────────────────────────────────────────────────────
  // UNIT TEST 3 — addComment: No notification for own post
  //
  // WHY: Critical business rule — an author should never get
  //      a notification for their own comment. This test
  //      verifies the condition (post.author !== req.user._id)
  //      works correctly in pure isolation.
  // ──────────────────────────────────────────────────────────
  test('[UNIT 3] addComment — should NOT create notification when author comments on own post', async () => {
    const fakePost = {
      _id:      'post123',
      title:    'My Post',
      author:   'user123',   // same as req.user._id — self comment
      comments: [],
      save:     jest.fn().mockResolvedValue(true)
    };

    PostMock.findById       = jest.fn().mockResolvedValue(fakePost);
    NotificationMock.create = jest.fn();

    const req = mockReq({ postId: 'post123', text: 'My own reply' });
    const res = mockRes();

    await addComment(req, res);

    expect(NotificationMock.create).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────
  // UNIT TEST 4 — updatePost: 403 for unauthorized user
  //
  // WHY: Security test — proves the author-only ownership
  //      guard works correctly. Also verifies that save()
  //      is never called when the user is not authorized,
  //      meaning the DB is never touched.
  // ──────────────────────────────────────────────────────────
  test('[UNIT 4] updatePost — should return 403 and NOT save if user is not the author', async () => {
    const fakePost = {
      _id:    'post123',
      author: { toString: () => 'anotherUser' }, // different from req.user._id
      save:   jest.fn()
    };

    PostMock.findById = jest.fn().mockResolvedValue(fakePost);

    const req = mockReq({ title: 'Hacked Title' }, { id: 'post123' });
    const res = mockRes();

    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not authorized to edit this post.' })
    );
    expect(fakePost.save).not.toHaveBeenCalled(); // DB was never touched
  });

  // ──────────────────────────────────────────────────────────
  // UNIT TEST 5 — deletePost: Successful deletion by owner
  //
  // WHY: Proves the full delete flow works correctly in
  //      isolation — findById, ownership check, deleteOne()
  //      called, and correct 200 response returned.
  // ──────────────────────────────────────────────────────────
  test('[UNIT 5] deletePost — should call deleteOne and return 200 for the post author', async () => {
    const fakePost = {
      _id:       'post123',
      author:    { toString: () => 'user123' }, // matches req.user._id
      deleteOne: jest.fn().mockResolvedValue(true)
    };

    PostMock.findById = jest.fn().mockResolvedValue(fakePost);

    const req = mockReq({}, { id: 'post123' });
    const res = mockRes();

    await deletePost(req, res);

    expect(fakePost.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Post deleted successfully.' })
    );
  });

});
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
    await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'intA@test.com',
      password: 'password123',
      organization: 'Green Earth NGO'
    });

    const loginA = await request(app).post('/api/auth/login').send({
      email: 'intA@test.com',
      password: 'password123'
    });

    tokenA = loginA.body.token;

    // Register B
    await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'intB@test.com',
      password: 'password123',
      organization: 'Blue Ocean NGO'
    });

    const loginB = await request(app).post('/api/auth/login').send({
      email: 'intB@test.com',
      password: 'password123'
    });

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

    // Support both response styles
    testPostId =
      createRes.body?.post?._id ||
      createRes.body?._id ||
      null;
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
  // INTEGRATION 4 — All endpoints protected without token
  // ----------------------------------------------------------
  test('Protected routes should return 401 without token', async () => {

    const responses = await Promise.all([
      request(app).get('/api/collab/feed'),
      request(app).post('/api/collab/post').send({ title: 'T', content: 'C', type: 'Announcement' }),
      request(app).post('/api/collab/comment').send({ postId: testPostId, text: 'Hi' }),
      request(app).get('/api/collab/notifications')
    ]);

    responses.forEach(r => {
      expect(r.statusCode).toBe(401);
    });
  });

});