import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGlobeAsia, FaHandshake, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from your API to calculate stats
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral">
      
      {/* 1. Navbar */}
      <nav className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaGlobeAsia className="text-3xl text-accent" />
            <span className="text-2xl font-bold tracking-wide">PartnerSync</span>
          </div>
          <div className="space-x-8 font-medium">
            <Link to="/" className="hover:text-accent transition">Home</Link>
            <Link to="/projects" className="bg-secondary px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-600 transition">
              Manage Projects
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="bg-white py-24">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-6xl font-extrabold text-primary mb-6 leading-tight">
            Uniting Partners for <br/>
            <span className="text-secondary">Sustainable Impact</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Track Sri Lanka's progress on UN Sustainable Development Goals. 
            Manage projects, visualize data, and sync with partners in real-time.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/projects" className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-opacity-90 transition shadow-xl">
              <FaHandshake /> Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 3. LIVE Status Dashboard (Connected to DB) */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">Live Project Overview</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1: Total Projects */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-blue-500 hover:shadow-xl transition text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FaGlobeAsia className="text-blue-600 text-3xl"/>
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-wider mb-2">Total Projects</h3>
              <p className="text-5xl font-extrabold text-primary">
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