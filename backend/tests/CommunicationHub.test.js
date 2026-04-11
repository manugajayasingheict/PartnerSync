describe('SECTION A — UNIT TESTS', () => {

  jest.mock('../models/Post');
  jest.mock('../models/Notification');

  const {
    createPost,
    addComment,
    updatePost,
    deletePost,
    updateComment
  } = require('../controllers/collabController');

  const PostMock         = require('../models/Post');
  const NotificationMock = require('../models/Notification');

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

  test('[UNIT 2] createPost — should return 400 if title, content or type is missing', async () => {
    const req = mockReq({ content: 'Some content' }); // missing title and type
    const res = mockRes();

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Title, content, and type are required.' })
    );
  });

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

  test('[UNIT 6] updateComment — should update comment text and return 200 for the commenter', async () => {
    const fakeComment = {
      _id: 'comment123',
      user: { toString: () => 'user123' }, // matches req.user._id
      text: 'Old text'
    };

    const fakePost = {
      comments: {
        id: jest.fn().mockReturnValue(fakeComment)
      },
      save: jest.fn().mockResolvedValue(true)
    };

    PostMock.findOne = jest.fn().mockResolvedValue(fakePost);

    const req = mockReq({ text: 'Updated text' }, { commentId: 'comment123' });
    const res = mockRes();

    await updateComment(req, res);

    expect(fakeComment.text).toBe('Updated text');
    expect(fakePost.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Comment updated successfully.' })
    );
  });

});