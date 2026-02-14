import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaChartLine, FaDollarSign, FaUsers, FaMoneyBillWave, FaClipboardList, FaTrash, FaEdit, FaTimes, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const ProjectDetails = () => {
  const { id } = useParams();
  
  const [project, setProject] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Edit state
  const [editingReport, setEditingReport] = useState(null);
  const [editForm, setEditForm] = useState({
    reportType: '',
    amountLKR: '',
    peopleImpacted: '',
    description: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parallel API calls
      const [projectRes, statsRes, reportsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/projects/${id}`),
        axios.get(`http://localhost:5000/api/projects/${id}/statistics`),
        axios.get(`http://localhost:5000/api/reports/project/${id}`)
      ]);

      if (projectRes.data.success) setProject(projectRes.data.data);
      if (statsRes.data.success) setStatistics(statsRes.data.data);
      if (reportsRes.data.success) setReports(reportsRes.data.data);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/reports/remove/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Report deleted successfully');
      fetchProjectData(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete report');
    }
  };

  const handleEditClick = (report) => {
    setEditingReport(report._id);
    setEditForm({
      reportType: report.reportType,
      amountLKR: report.amountLKR || '',
      peopleImpacted: report.peopleImpacted || '',
      description: report.description
    });
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditForm({
      reportType: '',
      amountLKR: '',
      peopleImpacted: '',
      description: ''
    });
  };

  const handleUpdateReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/reports/update/${reportId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Report updated successfully');
        setEditingReport(null);
        fetchProjectData(); // Refresh data
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update report');
    }
  };

  const canEditOrDelete = (report) => {
    if (!user) {
      console.log('❌ No user logged in');
      return false;
    }
    
    console.log('🔍 Authorization Check:');
    console.log('User:', user);
    console.log('User ID from localStorage:', user._id || user.id);
    console.log('User Role:', user.role);
    console.log('Report Author ID:', report.reportedBy?._id);
    console.log('Report Author Name:', report.reportedBy?.name);
    
    // Admin can edit/delete any report
    if (user.role === 'admin') {
      console.log('✅ User is admin - access granted');
      return true;
    }
    
    // Owner can edit/delete their own report
    // Backend sends user.id (not user._id) in localStorage
    const userId = user._id || user.id;
    const reportAuthorId = report.reportedBy?._id;
    const isOwner = reportAuthorId?.toString() === userId?.toString();
    console.log('ID Match:', isOwner, `(${reportAuthorId} === ${userId})`);
    
    return isOwner;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
          <p className="text-gray-500 text-xl">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md text-center">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Project</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!project || !statistics) {
    return (
      <div className="min-h-screen bg-neutral p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
        </div>
      </div>
    );
  }

  const budgetUtilization = statistics.budgetUtilization || 0;
  const warningLevel = statistics.warningLevel;

  return (
    <div className="min-h-screen bg-neutral p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-2">{project.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  <strong>Organization:</strong> {project.organization}
                </span>
                <span className="text-gray-500">
                  <strong>SDG Goal:</strong> {project.sdgGoal}
                </span>
              </div>
            </div>
            
            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
              project.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' :
              project.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              project.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-300' :
              'bg-yellow-100 text-yellow-800 border-yellow-300'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard - 4 Tiles */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Budget Tile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 hover:shadow-xl transition">
          <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <FaDollarSign className="text-green-600 text-2xl" />
          </div>
          <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Total Budget</h3>
          <p className="text-3xl font-extrabold text-primary">
            {(project.budget || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">LKR</p>
        </div>

        {/* Spent Tile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500 hover:shadow-xl transition">
          <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <FaMoneyBillWave className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Amount Spent</h3>
          <p className="text-3xl font-extrabold text-primary">
            {(statistics.totalSpent || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">LKR</p>
        </div>

        {/* Remaining Tile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-xl transition">
          <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <FaChartLine className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Budget Remaining</h3>
          <p className="text-3xl font-extrabold text-primary">
            {(statistics.budgetRemaining || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">LKR</p>
        </div>

        {/* People Impacted Tile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500 hover:shadow-xl transition">
          <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <FaUsers className="text-purple-600 text-2xl" />
          </div>
          <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">People Impacted</h3>
          <p className="text-3xl font-extrabold text-primary">
            {(statistics.totalPeopleImpacted || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total</p>
        </div>
      </div>

      {/* Budget Progress Visualization */}
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-md mb-10">
        <h2 className="text-2xl font-bold text-primary mb-6">Budget Utilization</h2>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Progress</span>
            <span className={`text-sm font-bold ${
              warningLevel === 'danger' ? 'text-red-600' :
              warningLevel === 'warning' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                warningLevel === 'danger' ? 'bg-red-500' :
                warningLevel === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Planned Budget</p>
            <p className="text-2xl font-bold text-gray-800">{(project.budget || 0).toLocaleString()} LKR</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Amount Spent</p>
            <p className="text-2xl font-bold text-gray-800">{(statistics.totalSpent || 0).toLocaleString()} LKR</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-gray-800">{(statistics.budgetRemaining || 0).toLocaleString()} LKR</p>
          </div>
        </div>

        {/* Warning Messages */}
        {warningLevel === 'danger' && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center gap-2 text-red-700">
              <FaExclamationTriangle className="text-xl" />
              <strong>Alert:</strong> Project is over budget! Immediate review required.
            </div>
          </div>
        )}
        
        {warningLevel === 'warning' && !statistics.isOverBudget && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-center gap-2 text-yellow-700">
              <FaExclamationTriangle className="text-xl" />
              <strong>Warning:</strong> Budget utilization above 80%. Monitor spending carefully.
            </div>
          </div>
        )}
        
        {!warningLevel && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-2 text-green-700">
              <FaCheckCircle className="text-xl" />
              <strong>On Track:</strong> Budget utilization is healthy.
            </div>
          </div>
        )}
      </div>

      {/* Reports Timeline */}
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          <FaClipboardList /> Reports Timeline
        </h2>
        
        <p className="text-sm text-gray-500 mb-6">
          Total Reports: {statistics.totalReports || 0}
        </p>

        {reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FaClipboardList className="text-5xl mx-auto mb-4 opacity-50" />
            <p>No reports yet for this project</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report._id} className="border rounded-lg p-6 hover:shadow-md transition bg-gray-50">
                {editingReport === report._id ? (
                  /* EDIT MODE */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-primary">Edit Report</h3>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
                      <select
                        className="w-full p-3 border rounded-lg"
                        value={editForm.reportType}
                        onChange={(e) => setEditForm({...editForm, reportType: e.target.value})}
                      >
                        <option value="financial">Financial</option>
                        <option value="people_helped">People Impacted</option>
                        <option value="milestone">Milestone Achievement</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {editForm.reportType === 'financial' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Amount (LKR)</label>
                        <input
                          type="number"
                          className="w-full p-3 border rounded-lg"
                          value={editForm.amountLKR}
                          onChange={(e) => setEditForm({...editForm, amountLKR: e.target.value})}
                        />
                      </div>
                    )}

                    {editForm.reportType === 'people_helped' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">People Impacted</label>
                        <input
                          type="number"
                          className="w-full p-3 border rounded-lg"
                          value={editForm.peopleImpacted}
                          onChange={(e) => setEditForm({...editForm, peopleImpacted: e.target.value})}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                      <textarea
                        className="w-full p-3 border rounded-lg h-24"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReport(report._id)}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReportTypeColor(report.reportType)}`}>
                          {getReportTypeLabel(report.reportType)}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(report.reportDate)}</span>
                      </div>
                      
                      {canEditOrDelete(report) && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditClick(report)}
                            className="text-blue-500 hover:text-blue-700 transition"
                            title="Edit report"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteReport(report._id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete report"
                          >
                            <FaTrash />
                          </button>
                        </div>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
