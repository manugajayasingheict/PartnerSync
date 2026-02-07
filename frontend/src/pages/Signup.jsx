import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaBuilding, FaUserTag } from 'react-icons/fa';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    organization: '', 
    role: 'partner' // Default selection
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // This sends name, email, password, organization, AND role to your backend
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert('Account Created! Please wait for Admin approval to access full features.');
      navigate('/');
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-secondary">
        <h2 className="text-3xl font-bold text-center text-primary mb-2">Create Account</h2>
        <p className="text-center text-gray-500 mb-8">Join the PartnerSync Network</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-bold mb-1 text-sm">Full Name</label>
            <div className="relative">
              <FaUser className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Ex: Manuga Jayasinghe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="block text-gray-700 font-bold mb-1 text-sm">Organization Name</label>
            <div className="relative">
              <FaBuilding className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Ex: UN Sri Lanka / Ministry / NGO"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Role Selection - THE BEST PART */}
          <div>
            <label className="block text-gray-700 font-bold mb-1 text-sm">Account Type</label>
            <div className="relative">
              <FaUserTag className="absolute top-3.5 left-3 text-gray-400" />
              <select 
                className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary appearance-none cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="partner">Partner (NGO/Private Sector)</option>
                <option value="government">Government Official</option>
                <option value="public">General Public / Observer</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1 italic">*Partners and Government accounts require Admin verification.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-bold mb-1 text-sm">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-bold mb-1 text-sm">Password</label>
            <div className="relative">
              <FaLock className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <button className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 mt-4 shadow-md">
            <FaUserPlus /> Create Account
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;