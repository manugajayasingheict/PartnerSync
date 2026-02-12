import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SDGDropdown.css';

const API_URL = 'http://localhost:5000/api/sdg';

const SDGDropdown = ({ selectedSDG, onSelect, label = "Select SDG Target", required = false }) => {
  const [sdgs, setSdgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSDGs();
  }, []);

  const fetchSDGs = async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      setSdgs(response.data.data);
    } catch (error) {
      console.error('Error fetching SDGs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdg-dropdown-container">
      <label className="sdg-dropdown-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        value={selectedSDG}
        onChange={(e) => onSelect(e.target.value)}
        className="sdg-dropdown-select"
        disabled={loading}
        required={required}
      >
        <option value="">-- Select an SDG Target --</option>
        {sdgs.map((sdg) => (
          <option key={sdg._id} value={sdg._id}>
            {sdg.targetNumber} - {sdg.title} {sdg.isOfficialUN ? '🌍' : ''}
          </option>
        ))}
      </select>
      {loading && <p className="loading-text">Loading targets...</p>}
      {!loading && sdgs.length === 0 && (
        <p className="no-targets-text">No targets available. Please add some first.</p>
      )}
    </div>
  );
};

export default SDGDropdown;