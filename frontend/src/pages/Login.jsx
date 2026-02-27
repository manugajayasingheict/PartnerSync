import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios'; // Import Axios

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); // State for error messages
  const navigate = useNavigate(); // For redirection

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // 1. Send data to Backend
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);

      // 2. Save the Token (The "Key")
      localStorage.setItem('token', res.data.token);
      
      // (Optional) Save user info to display name later
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // 3. Success! Redirect to Home Page
      alert('Login Successful!');
      navigate('/home'); 
      window.location.reload(); // Refresh to update Navbar
      
    } catch (err) {
      // 4. Handle Errors (e.g., Wrong password)
      console.error(err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-primary">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">Welcome Back</h2>
        
        {/* Display Error Message if any */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="admin@partnersync.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Password</label>
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

          <button className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2">
            <FaSignInAlt /> Login
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Don't have an account? <Link to="/signup" className="text-secondary font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;