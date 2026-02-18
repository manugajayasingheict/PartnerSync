import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaDollarSign, FaUsers, FaTimes, FaSpinner, FaMoneyBillWave, FaClipboardList, FaExclamationTriangle, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';

const Reports = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [projectsWithStats, setProjectsWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const limit = 12;

  // Filter state
  const [filters, setFilters] = useState({
    sdgGoal: '',
    status: '',
    organization: ''
  });
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchOrganizations(); // For filter dropdown
    fetchProjectsWithStats(1); // For cards grid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/stats/summary');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects/organizations');
      if (response.data.success) {
        setOrganizations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchProjectsWithStats = async (page) => {
    try {
      // Build query string with filters
      let queryString = `page=${page}&limit=${limit}`;
      if (filters.sdgGoal) queryString += `&sdgGoal=${encodeURIComponent(filters.sdgGoal)}`;
      if (filters.status) queryString += `&status=${encodeURIComponent(filters.status)}`;
      if (filters.organization) queryString += `&organization=${encodeURIComponent(filters.organization)}`;
      
      const response = await axios.get(`http://localhost:5000/api/projects/with-stats?${queryString}`);
      if (response.data.success) {
        setProjectsWithStats(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotalProjects(response.data.totalProjects);
      }
    } catch (error) {
      console.error('Error fetching projects with stats:', error);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProjectsWithStats(page);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProjectsWithStats(1);
  };

  const handleClearFilters = () => {
    setFilters({
      sdgGoal: '',
      status: '',
      organization: ''
    });
    setCurrentPage(1);
    setTimeout(() => {
      fetchProjectsWithStats(1);
    }, 0);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const handleProjectCardClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-neutral p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
            <FaChartLine /> Progress & Impact Reports
          </h1>
          <p className="text-gray-500">Track financial impact and milestones across all projects</p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {loading ? (
        <div className="text-center py-20">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Total Financial Impact (LKR) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 hover:shadow-xl transition">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaMoneyBillWave className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Total Spent (LKR)</h3>
              <p className="text-3xl font-extrabold text-primary">
                {stats?.financial?.totalLKR?.toLocaleString() || '0'}
              </p>
            </div>

            {/* Total Financial Impact (USD) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-xl transition">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaDollarSign className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Total Spent (USD)</h3>
              <p className="text-3xl font-extrabold text-primary">
                ${stats?.financial?.totalUSD?.toFixed(2) || '0'}
              </p>
            </div>

            {/* People Impacted */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500 hover:shadow-xl transition">
              <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">People Helped</h3>
              <p className="text-3xl font-extrabold text-primary">
                {stats?.people?.totalPeople?.toLocaleString() || '0'}
              </p>
            </div>

            {/* Total Reports */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-orange-500 hover:shadow-xl transition">
              <div className="bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaClipboardList className="text-orange-600 text-2xl" />
              </div>
              <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Total Reports</h3>
              <p className="text-3xl font-extrabold text-primary">
                {stats?.totalReports || '0'}
              </p>
            </div>
          </div>

          {/* Project Selection Panel - NEW SECTION */}
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <FaClipboardList /> Projects Overview
              </h2>
              <div className="text-sm text-gray-600">
                {activeFiltersCount > 0 && (
                  <span className="text-secondary font-bold">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* SDG Goal Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">SDG Goal</label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    value={filters.sdgGoal}
                    onChange={(e) => handleFilterChange('sdgGoal', e.target.value)}
                  >
                    <option value="">All SDG Goals</option>
                    <option value="No Poverty">No Poverty</option>
                    <option value="Zero Hunger">Zero Hunger</option>
                    <option value="Good Health">Good Health</option>
                    <option value="Quality Education">Quality Education</option>
                    <option value="Gender Equality">Gender Equality</option>
                    <option value="Clean Water">Clean Water</option>
                    <option value="Clean Energy">Clean Energy</option>
                    <option value="Decent Work">Decent Work</option>
                    <option value="Industry">Industry</option>
                    <option value="Reduced Inequalities">Reduced Inequalities</option>
                    <option value="Sustainable Cities">Sustainable Cities</option>
                    <option value="Responsible Consumption">Responsible Consumption</option>
                    <option value="Climate Action">Climate Action</option>
                    <option value="Life Below Water">Life Below Water</option>
                    <option value="Life on Land">Life on Land</option>
                    <option value="Peace & Justice">Peace & Justice</option>
                    <option value="Partnerships">Partnerships</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Status</label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Proposed">Proposed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Organization Filter */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Organization</label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    value={filters.organization}
                    onChange={(e) => handleFilterChange('organization', e.target.value)}
                  >
                    <option value="">All Organizations</option>
                    {organizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleApplyFilters}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-sm flex-1 md:flex-none"
                >
                  Apply Filters
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition flex-1 md:flex-none"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-600 font-bold">Active filters:</span>
                    {filters.sdgGoal && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        SDG: {filters.sdgGoal}
                        <button onClick={() => { handleFilterChange('sdgGoal', ''); handleApplyFilters(); }} className="hover:text-blue-900">
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {filters.status && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Status: {filters.status}
                        <button onClick={() => { handleFilterChange('status', ''); handleApplyFilters(); }} className="hover:text-green-900">
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {filters.organization && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                        Org: {filters.organization}
                        <button onClick={() => { handleFilterChange('organization', ''); handleApplyFilters(); }} className="hover:text-purple-900">
                          <FaTimes />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {projectsWithStats.map(project => {
                const budgetUtilization = project.budgetUtilization || 0;
                const warningLevel = project.warningLevel;
                
                return (
                  <div 
                    key={project._id}
                    onClick={() => handleProjectCardClick(project._id)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition cursor-pointer border border-gray-100 group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        project.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' :
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        project.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-300' :
                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {project.status}
                      </span>
                      
                      <FaArrowRight className="text-gray-300 group-hover:text-primary transition" />
                    </div>

                    {/* Project Info */}
                    <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-secondary transition">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{project.organization}</p>
                    <p className="text-xs text-gray-400 mb-4">{project.sdgGoal}</p>

                    {/* Budget Info */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-bold text-gray-800">
                          {(project.budget || 0).toLocaleString()} LKR
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent:</span>
                        <span className={`font-bold ${
                          warningLevel === 'danger' ? 'text-red-600' :
                          warningLevel === 'warning' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {(project.totalSpent || 0).toLocaleString()} LKR
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Utilization</span>
                        <span className={`font-bold ${
                          warningLevel === 'danger' ? 'text-red-600' :
                          warningLevel === 'warning' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {budgetUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            warningLevel === 'danger' ? 'bg-red-500' :
                            warningLevel === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Warning Badges */}
                    {warningLevel === 'danger' && (
                      <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-red-700 font-bold">
                        <FaExclamationTriangle />
                        Over Budget!
                      </div>
                    )}
                    
                    {warningLevel === 'warning' && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-yellow-700 font-bold">
                        <FaExclamationTriangle />
                        Approaching Limit
                      </div>
                    )}

                    {/* Stats Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                      <span>👥 {project.totalPeopleImpacted || 0} impacted</span>
                      <span>📊 {project.totalReports || 0} reports</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalProjects)} of {totalProjects} projects
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    <FaChevronLeft /> Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg font-bold transition ${
                              page === currentPage
                                ? 'bg-primary text-white'
                                : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>


        </>
      )}
    </div>
  );
};

export default Reports;
