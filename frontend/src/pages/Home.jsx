import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGlobeAsia, FaHandshake, FaCheckCircle, FaSpinner, FaUserCircle, FaSignOutAlt, FaUserShield, FaBullseye } from 'react-icons/fa';

const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Check if user is logged in on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Fetch real data from your API to calculate stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        const data = await response.json();
        
        if (data.success) {
          const projects = data.data;
          setStats({
            total: projects.length,
            inProgress: projects.filter(p => p.status === 'In Progress').length,
            completed: projects.filter(p => p.status === 'Completed').length
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 3. Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral">
      
      {/* 1. Navbar */}
      <nav className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaGlobeAsia className="text-3xl text-accent" />
            <span className="text-2xl font-bold tracking-wide">PartnerSync</span>
          </div>
          
          <div className="flex items-center space-x-6 font-medium">
            <Link to="/" className="hover:text-accent transition">Home</Link>
            <Link to="/projects" className="hover:text-accent transition">Projects</Link>
<<<<<<< HEAD
            
            {/* SDG Management Link in Navbar */}
            <Link to="/sdg-management" className="hover:text-accent transition flex items-center gap-1">
              <FaBullseye /> SDG Targets
            </Link>
=======
            <Link to="/reports" className="hover:text-accent transition">Reports</Link>
>>>>>>> develop

            {/* Admin Dashboard link - Only visible if user role is admin */}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-accent flex items-center gap-1 hover:underline transition">
                <FaUserShield /> Admin Panel
              </Link>
            )}
            
            {/* Auth Logic: Show User Name or Login/Signup */}
            {user ? (
              <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2">
                  <FaUserCircle className="text-accent text-xl" />
                  <span className="text-sm font-bold uppercase">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 transition text-sm flex items-center gap-1 border-l border-gray-500 pl-4"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-accent transition border border-white px-4 py-1.5 rounded-lg">
                  Login
                </Link>
                <Link to="/signup" className="px-5 py-2 rounded-lg font-bold shadow-md transition text-white" style={{ background: '#2980b9' }} onMouseOver={(e) => e.target.style.background = '#1e5a7d'} onMouseOut={(e) => e.target.style.background = '#2980b9'}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="bg-white py-24">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Uniting Partners for <br/>
            <span style={{ color: '#2980b9' }}>Sustainable Impact</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Track Sri Lanka's progress on UN Sustainable Development Goals. 
            Manage projects, visualize data, and sync with partners in real-time.
          </p>
          <div className="flex justify-center gap-6">
            {/* Get Started button - Dark blue theme */}
            <Link to="/sdg-management" className="flex items-center gap-2 text-white px-8 py-4 rounded-lg text-lg font-bold hover:shadow-lg transition shadow-xl" style={{ background: 'linear-gradient(135deg, #1e5a7d 0%, #2980b9 100%)' }}>
              <FaHandshake /> Get Started
            </Link>
            
            {/* Manage SDG Targets Button - Dark blue theme */}
            <Link to="/sdg-management" className="flex items-center gap-2 text-white px-8 py-4 rounded-lg text-lg font-bold hover:shadow-lg transition shadow-xl" style={{ background: 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)' }}>
              <FaBullseye /> Manage SDG Targets
            </Link>
          </div>
        </div>
      </header>

      {/* 3. LIVE Status Dashboard (Connected to DB) */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Live Project Overview</h2>
            <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: '#2980b9' }}></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1: Total Projects */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition text-center" style={{ borderTop: '4px solid #2980b9' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0f8ff' }}>
                 <FaGlobeAsia className="text-3xl" style={{ color: '#1e5a7d' }}/>
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-wider mb-2">Total Projects</h3>
              <p className="text-5xl font-extrabold" style={{ color: '#1e5a7d' }}>
                {loading ? <FaSpinner className="animate-spin inline text-2xl"/> : stats.total}
              </p>
            </div>

            {/* Card 2: In Progress */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-yellow-400 hover:shadow-xl transition text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FaSpinner className="text-yellow-600 text-3xl"/>
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-wider mb-2">In Progress</h3>
              <p className="text-5xl font-extrabold text-yellow-600">
                {loading ? <FaSpinner className="animate-spin inline text-2xl"/> : stats.inProgress}
              </p>
            </div>

            {/* Card 3: Completed */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-green-500 hover:shadow-xl transition text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FaCheckCircle className="text-green-600 text-3xl"/>
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-wider mb-2">Completed</h3>
              <p className="text-5xl font-extrabold text-green-600">
                {loading ? <FaSpinner className="animate-spin inline text-2xl"/> : stats.completed}
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;