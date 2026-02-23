import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SDGManagement.css';

const API_URL = 'http://localhost:5000/api/sdg';

const SDGManagement = () => {
  const [sdgs, setSdgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    targetNumber: '',
    title: '',
    description: '',
    indicatorCode: '',
    benchmark: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ✅ FIXED: Wrap fetchAllSDGs in useCallback
  const fetchAllSDGs = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching SDGs from:', `${API_URL}/all`);
      const response = await axios.get(`${API_URL}/all`);
      console.log('Response:', response.data);
      setSdgs(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      showMessage('error', 'Error fetching SDG targets: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSDGs();
  }, [fetchAllSDGs]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/update/${editingId}`, formData);
        showMessage('success', 'SDG target updated successfully!');
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/create`, formData);
        showMessage('success', 'SDG target created successfully!');
      }

      setFormData({
        targetNumber: '',
        title: '',
        description: '',
        indicatorCode: '',
        benchmark: ''
      });

      fetchAllSDGs();
    } catch (error) {
      console.error('Submit error:', error);
      showMessage('error', error.response?.data?.message || 'An error occurred');
    }
  };

  const handleEdit = (sdg) => {
    setFormData({
      targetNumber: sdg.targetNumber,
      title: sdg.title,
      description: sdg.description,
      indicatorCode: sdg.indicatorCode || '',
      benchmark: sdg.benchmark || ''
    });
    setEditingId(sdg._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SDG target?')) return;

    try {
      await axios.delete(`${API_URL}/delete/${id}`);
      showMessage('success', 'SDG target deleted successfully!');
      fetchAllSDGs();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('error', 'Error deleting SDG target');
    }
  };

  const handleUNSync = async () => {
    if (!window.confirm('Sync with UN Global Standards? This may take a minute.')) return;

    try {
      setSyncing(true);
      const response = await axios.post(`${API_URL}/sync-un`);

      // Build message including failed targets if any
      let msg = `✅ ${response.data.message}\nNew targets: ${response.data.stats.newTargets}\nUpdated targets: ${response.data.stats.updatedTargets}`;
      if (response.data.stats.failedTargets && response.data.stats.failedTargets.length > 0) {
        msg += `\n⚠️ Failed targets: ${response.data.stats.failedTargets.map(t => t.targetNumber).join(', ')}`;
      }

      showMessage('success', msg);

      fetchAllSDGs();
    } catch (error) {
      console.error('Sync error:', error);
      showMessage('error', error.response?.data?.message || 'Error syncing with UN');
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      targetNumber: '',
      title: '',
      description: '',
      indicatorCode: '',
      benchmark: ''
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className="sdg-management-container">
      <h1>🎯 SDG Target Management - Goal 17</h1>
      <p className="subtitle">Partnerships for the Goals</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}

      <div className="sync-section">
        <button onClick={handleUNSync} disabled={syncing} className="btn-sync">
          {syncing ? '⏳ Syncing...' : '🌍 Sync with UN Global Standards'}
        </button>
        <p className="sync-hint">
          Fetch official Goal 17 definitions from the United Nations database
        </p>
      </div>

      <div className="form-section">
        <h2>{editingId ? '📝 Edit SDG Target' : '➕ Add New SDG Target'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Target Number *</label>
              <input
                type="text"
                name="targetNumber"
                value={formData.targetNumber}
                onChange={handleChange}
                placeholder="e.g., 17.1"
                required
                disabled={editingId !== null}
              />
            </div>
            <div className="form-group">
              <label>Indicator Code</label>
              <input
                type="text"
                name="indicatorCode"
                value={formData.indicatorCode}
                onChange={handleChange}
                placeholder="e.g., 17.1.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Target title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Full description"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Benchmark / Target</label>
            <input
              type="text"
              name="benchmark"
              value={formData.benchmark}
              onChange={handleChange}
              placeholder="Optional benchmark"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? '✏️ Update' : '➕ Add Target'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="list-section">
        <h2>📋 All SDG Targets ({sdgs.length})</h2>
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : sdgs.length === 0 ? (
          <div className="no-data">
            <p>No SDG targets yet!</p>
            <p>Add your first target above or click "Sync with UN Global Standards"</p>
          </div>
        ) : (
          <div className="sdg-grid">
            {sdgs.map((sdg) => (
              <div key={sdg._id} className={`sdg-card ${sdg.isOfficialUN ? 'official-un' : ''}`}>
                <div className="sdg-header">
                  <h3>{sdg.targetNumber}</h3>
                  {sdg.isOfficialUN && <span className="un-badge">🌍 UN Official</span>}
                </div>
                <h4>{sdg.title}</h4>
                <p className="description">{sdg.description}</p>
                {sdg.indicatorCode && (
                  <p className="indicator"><strong>Indicator:</strong> {sdg.indicatorCode}</p>
                )}
                {sdg.benchmark && (
                  <p className="benchmark"><strong>Benchmark:</strong> {sdg.benchmark}</p>
                )}
                {sdg.lastSynced && (
                  <p className="sync-date">
                    <small>Last synced: {new Date(sdg.lastSynced).toLocaleDateString()}</small>
                  </p>
                )}
                <div className="card-actions">
                  <button onClick={() => handleEdit(sdg)} className="btn-edit">✏️ Edit</button>
                  <button onClick={() => handleDelete(sdg._id)} className="btn-delete">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SDGManagement;