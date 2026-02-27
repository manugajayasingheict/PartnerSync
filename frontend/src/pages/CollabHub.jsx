import React, { useState, useEffect, useCallback } from 'react';
import './CollabHub.css';

const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const api = {
  get: (path) =>
    fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json()),
  post: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  put: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  delete: (path) =>
    fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json()),
};

// ── ICONS ────────────────────────────────────────────────────
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconChat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

// ── AVATAR ───────────────────────────────────────────────────
const Avatar = ({ name, size = 40 }) => {
  const url = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=10b981,3b82f6,8b5cf6,f59e0b,ef4444&backgroundType=gradientLinear`;
  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  );
};

// ── BADGE ────────────────────────────────────────────────────
const TypeBadge = ({ type }) => (
  <span className={`ch-badge ${type === 'Call for Partnership' ? 'ch-badge--partner' : 'ch-badge--announce'}`}>
    {type}
  </span>
);

// ── TIME FORMATTER ───────────────────────────────────────────
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── CREATE POST MODAL ────────────────────────────────────────
const CreatePostModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', content: '', type: 'Announcement' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/collab/post', form);
      if (res.post) {
        onCreated(res.post);
        onClose();
      } else {
        setError(res.error || 'Failed to create post.');
      }
    } catch {
      setError('Server error. Is your backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ch-modal__header">
          <h2>New Post</h2>
          <button className="ch-icon-btn" onClick={onClose}><IconX /></button>
        </div>

        <div className="ch-modal__body">
          <div className="ch-field">
            <label>Type</label>
            <div className="ch-toggle">
              {['Announcement', 'Call for Partnership'].map((t) => (
                <button
                  key={t}
                  className={`ch-toggle__btn ${form.type === t ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, type: t })}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className="ch-field">
            <label>Title</label>
            <input
              className="ch-input"
              placeholder="e.g. Seeking partners for tree planting SDG..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="ch-field">
            <label>Content</label>
            <textarea
              className="ch-input ch-textarea"
              placeholder="Describe your initiative, what kind of help you need..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
            />
          </div>

          {error && <p className="ch-error">{error}</p>}
        </div>

        <div className="ch-modal__footer">
          <button className="ch-btn ch-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ch-btn ch-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── EDIT POST MODAL ──────────────────────────────────────────
const EditPostModal = ({ post, onClose, onUpdated }) => {
  const [form, setForm] = useState({ title: post.title, content: post.content, type: post.type });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/collab/post/${post._id}`, form);
      if (res.post) {
        onUpdated(res.post);
        onClose();
      } else {
        setError(res.error || 'Failed to update post.');
      }
    } catch {
      setError('Server error. Is your backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ch-modal__header">
          <h2>Edit Post</h2>
          <button className="ch-icon-btn" onClick={onClose}><IconX /></button>
        </div>

        <div className="ch-modal__body">
          <div className="ch-field">
            <label>Type</label>
            <div className="ch-toggle">
              {['Announcement', 'Call for Partnership'].map((t) => (
                <button
                  key={t}
                  className={`ch-toggle__btn ${form.type === t ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, type: t })}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className="ch-field">
            <label>Title</label>
            <input
              className="ch-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="ch-field">
            <label>Content</label>
            <textarea
              className="ch-input ch-textarea"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
            />
          </div>

          {error && <p className="ch-error">{error}</p>}
        </div>

        <div className="ch-modal__footer">
          <button className="ch-btn ch-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ch-btn ch-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── COMMENT SECTION ──────────────────────────────────────────
const CommentSection = ({ post, onClose }) => {
  const [text, setText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/collab/comment', { postId: post._id, text });
      if (res.post) {
        setComments(res.post.comments);
        setText('');
      }
    } catch {
      alert('Failed to add comment.');
    }
    setLoading(false);
  };

  return (
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-modal ch-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="ch-modal__header">
          <div>
            <h2>Comments</h2>
            <p className="ch-modal__subtitle">{post.title}</p>
          </div>
          <button className="ch-icon-btn" onClick={onClose}><IconX /></button>
        </div>

        <div className="ch-modal__body ch-comments-list">
          {comments.length === 0 && (
            <div className="ch-empty">No comments yet. Be the first to offer help!</div>
          )}
          {comments.map((c, i) => (
            <div className="ch-comment" key={i}>
              <Avatar name={c.userName} size={34} />
              <div className="ch-comment__body">
                <div className="ch-comment__meta">
                  <span className="ch-comment__name">{c.userName}</span>
                  <span className="ch-comment__time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="ch-comment__text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ch-modal__footer ch-comment-input">
          <input
            className="ch-input"
            placeholder="Offer help or resources..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button className="ch-btn ch-btn--primary ch-btn--icon" onClick={handleSubmit} disabled={loading}>
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── NOTIFICATIONS PANEL ──────────────────────────────────────
const NotificationsPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/collab/notifications').then((data) => {
      setNotifications(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="ch-notif-panel">
      <div className="ch-notif-panel__header">
        <h3>Notifications</h3>
        <button className="ch-icon-btn" onClick={onClose}><IconX /></button>
      </div>
      <div className="ch-notif-panel__body">
        {loading && <div className="ch-empty">Loading...</div>}
        {!loading && notifications.length === 0 && (
          <div className="ch-empty">You're all caught up! 🎉</div>
        )}
        {notifications.map((n, i) => (
          <div className={`ch-notif-item ${n.isRead ? '' : 'ch-notif-item--unread'}`} key={i}>
            <div className="ch-notif-dot" />
            <div>
              <p className="ch-notif-msg">{n.message}</p>
              <span className="ch-notif-time">{timeAgo(n.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── POST CARD ────────────────────────────────────────────────
const PostCard = ({ post, onComment, onEdit, onDelete, currentUserId }) => (
  <div className="ch-card">
    <div className="ch-card__header">
      <Avatar name={post.organization || post.authorName} />
      <div className="ch-card__meta">
        <span className="ch-card__author">{post.authorName}</span>
        <span className="ch-card__org">{post.organization}</span>
      </div>
      <div className="ch-card__right">
        <TypeBadge type={post.type} />
        <span className="ch-card__time">{timeAgo(post.createdAt)}</span>
      </div>
    </div>

    <div className="ch-card__body">
      <h3 className="ch-card__title">{post.title}</h3>
      <p className="ch-card__content">{post.content}</p>
    </div>

    <div className="ch-card__footer">
      <button className="ch-btn ch-btn--ghost ch-btn--sm" onClick={() => onComment(post)}>
        <IconChat />
        <span>{post.comments?.length || 0} Comments</span>
      </button>

      {/* Only show Edit/Delete to the post author */}
      {currentUserId && post.author === currentUserId && (
        <div className="ch-card__actions">
          <button className="ch-btn ch-btn--ghost ch-btn--sm ch-btn--edit" onClick={() => onEdit(post)}>
            <IconEdit /> Edit
          </button>
          <button className="ch-btn ch-btn--ghost ch-btn--sm ch-btn--delete" onClick={() => onDelete(post._id)}>
            <IconTrash /> Delete
          </button>
        </div>
      )}
    </div>
  </div>
);

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function CollabHub() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [filter, setFilter] = useState('All');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get logged in user id from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUserId(parsed._id || parsed.id);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const data = await api.get('/collab/feed');
    setFeed(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
    api.get('/collab/notifications').then((data) => {
      if (Array.isArray(data)) {
        setNotifCount(data.filter((n) => !n.isRead).length);
      }
    });
  }, [loadFeed]);

  const handleCreated = (post) => setFeed((prev) => [post, ...prev]);
  const handleUpdated = (updated) => setFeed((prev) => prev.map((p) => p._id === updated._id ? updated : p));
  const handleDelete  = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const res = await api.delete(`/collab/post/${postId}`);
    if (res.message) {
      setFeed((prev) => prev.filter((p) => p._id !== postId));
    } else {
      alert(res.error || 'Failed to delete post.');
    }
  };

  const filtered = filter === 'All' ? feed : feed.filter((p) => p.type === filter);

  return (
    <div className="ch-root">
      {/* ── HEADER ── */}
      <header className="ch-header">
        <div className="ch-header__left">
          <div className="ch-header__logo">🤝</div>
          <div>
            <h1 className="ch-header__title">Collab Hub</h1>
            <p className="ch-header__sub">Knowledge & Communication Centre</p>
          </div>
        </div>
        <div className="ch-header__right">
          <div className="ch-notif-wrap">
            <button
              className="ch-icon-btn ch-icon-btn--notif"
              onClick={() => { setShowNotifs(!showNotifs); setNotifCount(0); }}
            >
              <IconBell />
              {notifCount > 0 && <span className="ch-badge-dot">{notifCount}</span>}
            </button>
            {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
          </div>
          <button className="ch-btn ch-btn--primary" onClick={() => setShowCreate(true)}>
            <IconPlus /> New Post
          </button>
        </div>
      </header>

      {/* ── FILTERS ── */}
      <div className="ch-filters">
        {['All', 'Announcement', 'Call for Partnership'].map((f) => (
          <button
            key={f}
            className={`ch-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
        <span className="ch-filter-count">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── FEED ── */}
      <main className="ch-feed">
        {loading && (
          <div className="ch-loading">
            {[1, 2, 3].map((i) => <div key={i} className="ch-skeleton" />)}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="ch-empty-feed">
            <span>📭</span>
            <p>No posts yet. Be the first to post!</p>
            <button className="ch-btn ch-btn--primary" onClick={() => setShowCreate(true)}>
              Create First Post
            </button>
          </div>
        )}
        {!loading && filtered.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onComment={setCommentPost}
            onEdit={setEditPost}
            onDelete={handleDelete}
            currentUserId={currentUserId}
          />
        ))}
      </main>

      {/* ── MODALS ── */}
      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {editPost && (
        <EditPostModal post={editPost} onClose={() => setEditPost(null)} onUpdated={handleUpdated} />
      )}
      {commentPost && (
        <CommentSection post={commentPost} onClose={() => setCommentPost(null)} />
      )}
    </div>
  );
}
