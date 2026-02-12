import React, { useState, useEffect } from 'react';
import { FaChartLine, FaDollarSign, FaUsers, FaPlus, FaTimes, FaTrash, FaSpinner, FaMoneyBillWave, FaClipboardList } from 'react-icons/fa';
import axios from 'axios';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectReports, setProjectReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    project: '',
    reportType: 'financial',
    amountLKR: '',
    peopleImpacted: '',
    description: ''
  });

  useEffect(() => {
    fetchStats();
    fetchProjects();
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const canSubmitReport = user?.role === 'admin' || user?.role === 'partner' || user?.role === 'government';

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

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectReports = async (projectId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/project/${projectId}`);
      if (response.data.success) {
        setProjectReports(response.data.data);
        setSelectedProject(projectId);
      }
    } catch (error) {
      console.error('Error fetching project reports:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project) {
      alert('Please select a project');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/reports/submit',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(response.data.message);
        resetForm();
        fetchStats();
        if (selectedProject === formData.project) {
          fetchProjectReports(formData.project);
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/reports/remove/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Report deleted successfully');
      fetchStats();
      if (selectedProject) {
        fetchProjectReports(selectedProject);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete report');
    }
  };

  const resetForm = () => {
    setFormData({
      project: '',
      reportType: 'financial',
      amountLKR: '',
      peopleImpacted: '',
      description: ''
    });
    setShowForm(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeColor = (type) => {
    const colors = {
      financial: 'bg-green-100 text-green-700 border-green-300',
      people_helped: 'bg-blue-100 text-blue-700 border-blue-300',
      milestone: 'bg-purple-100 text-purple-700 border-purple-300',
      other: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[type] || colors.other;
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      financial: 'Financial',
      people_helped: 'People Helped',
      milestone: 'Milestone',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-neutral p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
              <FaChartLine /> Progress & Impact Reports
            </h1>
            <p className="text-gray-500">Track financial impact and milestones across all projects</p>
          </div>
          
          {canSubmitReport && (
            <button 
              onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
              className={`${showForm ? 'bg-red-500' : 'bg-secondary'} text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg`}
            >
              {showForm ? <><FaTimes /> Close</> : <><FaPlus /> New Report</>}
            </button>
          )}
        </div>
      </div>

      {/* Report Submission Form */}
      {showForm && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md mb-10 border-t-4 border-secondary animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Progress Report</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Project</label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={formData.project}
                  onChange={(e) => setFormData({...formData, project: e.target.value})}
                  required
                >
                  <option value="">-- Choose a project --</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.title} ({project.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={formData.reportType}
                  onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                >
                  <option value="financial">Financial Report</option>
                  <option value="people_helped">People Impacted</option>
                  <option value="milestone">Milestone Achievement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formData.reportType === 'financial' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount Spent (LKR)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border rounded-lg"
                    placeholder="50000"
                    value={formData.amountLKR}
                    onChange={(e) => setFormData({...formData, amountLKR: e.target.value})}
                    required={formData.reportType === 'financial'}
                  />
                  <p className="text-xs text-gray-400 mt-1">USD conversion will be automatic</p>
                </div>
              )}

              {formData.reportType === 'people_helped' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Number of People</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border rounded-lg"
                    placeholder="150"
                    value={formData.peopleImpacted}
                    onChange={(e) => setFormData({...formData, peopleImpacted: e.target.value})}
                    required={formData.reportType === 'people_helped'}
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full p-3 border rounded-lg h-24"
                  placeholder="Describe the progress or impact..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                ></textarea>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition shadow-lg"
            >
              Submit Report
            </button>
          </form>
        </div>
      )}

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

          {/* Project Reports Section */}
          <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <FaClipboardList /> Project Reports Timeline
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Project</label>
              <select 
                className="w-full md:w-96 p-3 border rounded-lg"
                onChange={(e) => e.target.value ? fetchProjectReports(e.target.value) : setSelectedProject(null)}
                value={selectedProject || ''}
              >
                <option value="">-- Show all or select a project --</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="space-y-4">
                {projectReports.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">No reports found for this project</p>
                ) : (
                  projectReports.map(report => (
                    <div key={report._id} className="border rounded-lg p-6 hover:shadow-md transition bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReportTypeColor(report.reportType)}`}>
                            {getReportTypeLabel(report.reportType)}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(report.reportDate)}</span>
                        </div>
                        
                        {(user?.role === 'admin' || user?._id === report.reportedBy?._id) && (
                          <button 
                            onClick={() => handleDelete(report._id)}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3">{report.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {report.reportType === 'financial' && (
                          <>
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                              <FaMoneyBillWave />
                              LKR {report.amountLKR?.toLocaleString()}
                            </div>
                            {report.amountUSD && (
                              <div className="flex items-center gap-2 text-blue-600 font-bold">
                                <FaDollarSign />
                                ${parseFloat(report.amountUSD).toFixed(2)} USD
                              </div>
                            )}
                          </>
                        )}

                        {report.reportType === 'people_helped' && (
                          <div className="flex items-center gap-2 text-purple-600 font-bold">
                            <FaUsers />
                            {report.peopleImpacted} people impacted
                          </div>
                        )}

                        <div className="ml-auto text-xs text-gray-400">
                          by {report.reportedBy?.name} ({report.reportedBy?.organization})
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!selectedProject && (
              <div className="text-center py-10 text-gray-400">
                <FaChartLine className="text-5xl mx-auto mb-4 opacity-50" />
                <p>Select a project to view its report timeline</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
