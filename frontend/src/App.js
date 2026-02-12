import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import ALL your pages
import Home from './pages/Home';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import SDGManagement from './pages/SDGManagement';

// 🛡️ Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// 🛡️ Protected Route Component for Authenticated Users (Optional)
const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Projects - Public or Protected (choose one below) */}
        <Route path="/projects" element={<Projects />} />
        {/* OR make it protected: */}
        {/* <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} /> */}

        {/* SDG Management - Protected for Member 02 */}
        <Route 
          path="/sdg-management" 
          element={
            <PrivateRoute>
              <SDGManagement />
            </PrivateRoute>
          } 
        />
        
        {/* Shorter alias for SDG Management */}
        <Route 
          path="/sdg" 
          element={<Navigate to="/sdg-management" replace />} 
        />

        {/* 🔐 Admin Route */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;