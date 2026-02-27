import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaLeaf, FaEdit, FaTrash, FaTimes, FaDollarSign, FaSearch, FaFilePdf, FaArrowRight } from 'react-icons/fa';
import jsPDF from 'jspdf'; // Import PDF Library

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // 🔍 NEW: Search State
  const [searchTerm, setSearchTerm] = useState("");

  // 🌍 EXTERNAL API STATE: Live Exchange Rate
  const [exchangeRate, setExchangeRate] = useState(null);

  // 🔐 AUTH STATE: Get current user role
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sdgGoal: 'No Poverty',
    organization: '',
    budget: '',
    status: 'Proposed'
  });

  useEffect(() => {
    fetchProjects();
    fetchExchangeRate(); // <--- Call External API on load
    
    // Get user info from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  // Define simple role checks
  const isAdmin = user?.role === 'admin';
  const canEditOrCreate = user?.role === 'admin' || user?.role === 'partner' || user?.role === 'government';

  // 1. Fetch Projects (Internal API)
  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🌍 2. Fetch Live Currency Rates (EXTERNAL API)
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/LKR');
      const data = await response.json();
      setExchangeRate(data.rates.USD);
      console.log("Live USD Rate:", data.rates.USD);
    } catch (error) {
      console.error("Failed to fetch external exchange rates:", error);
    }
  };

  // 3. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId 
        ? `http://localhost:5000/api/projects/${editId}` 
        : 'http://localhost:5000/api/projects';

      const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Pass token for security
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.success) {
        alert(editId ? 'Project Updated!' : 'Project Added!');
        resetForm();
        fetchProjects();
      }
    } catch (error) {
      alert('Error saving project');
    }
  };

  const handleEdit = (project) => {
    setEditId(project._id);
    setFormData({
        title: project.title,
        description: project.description,
        sdgGoal: project.sdgGoal,
        organization: project.organization,
        budget: project.budget,
        status: project.status
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ 
        title: '', description: '', sdgGoal: 'No Poverty', 
        organization: '', budget: '', status: 'Proposed' 
    });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? Only Admin can perform this action.")) return;
    try {
        await fetch(`http://localhost:5000/api/projects/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setProjects(projects.filter(project => project._id !== id));
    } catch (error) {
        console.error("Error deleting:", error);
    }
  };

  // 📄 NEW: Generate PDF for a Single Project
  const generatePDF = (project) => {
    const doc = new jsPDF();
    
    // Add Header
    doc.setFillColor(25, 72, 106); // Your primary color
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Project Proposal", 20, 25);
    
    // Reset Text Color
    doc.setTextColor(0, 0, 0);
    
    // Project Details
    doc.setFontSize(16);
    doc.text(`Title: ${project.title}`, 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Organization: ${project.organization}`, 20, 75);
    doc.text(`SDG Goal: ${project.sdgGoal}`, 20, 85);
    doc.text(`Budget: LKR ${project.budget ? project.budget.toLocaleString() : '0'}`, 20, 95);
    doc.text(`Current Status: ${project.status}`, 20, 105);
    
    // Description
    doc.setFontSize(14);
    doc.text("Description:", 20, 125);
    doc.setFontSize(11);
    const splitDesc = doc.splitTextToSize(project.description, 170); // Wrap text
    doc.text(splitDesc, 20, 135);
    
    // Save
    doc.save(`${project.title}_proposal.pdf`);
  };

  // 🔍 NEW: Search Logic
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    project.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Project Registry</h1>
          <p className="text-gray-500">
            Manage sustainable development initiatives. 
            {exchangeRate && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Live Rates Active</span>}
          </p>
        </div>
        
        {/* 🔍 SEARCH BAR & BUTTON GROUP */}
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary outline-none w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* 🛡️ RULE: ONLY Partners, Gov, or Admin can see the 'New Project' button */}
            {canEditOrCreate && (
                <button 
                    onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
                    className={`${showForm ? 'bg-red-500' : 'bg-secondary'} text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg whitespace-nowrap`}
                >
                    {showForm ? <><FaTimes /> Close</> : <><FaPlus /> New Project</>}
                </button>
            )}
        </div>
      </div>

      {showForm && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md mb-10 border-t-4 border-secondary animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{editId ? 'Edit Project' : 'New Project'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Project Title</label>
              <input type="text" className="w-full p-3 border rounded-lg" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SDG Goal</label>
              <select className="w-full p-3 border rounded-lg" value={formData.sdgGoal} onChange={(e) => setFormData({...formData, sdgGoal: e.target.value})}>
                <option>No Poverty</option><option>Zero Hunger</option><option>Good Health</option><option>Quality Education</option><option>Clean Water</option><option>Climate Action</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Organization</label>
              <input type="text" className="w-full p-3 border rounded-lg" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Budget (LKR)</label>
              <input type="number" className="w-full p-3 border rounded-lg" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select className="w-full p-3 border rounded-lg" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option>Proposed</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea className="w-full p-3 border rounded-lg h-24" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required></textarea>
            </div>
            <div className="col-span-2">
              <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg transition shadow-lg ${editId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-gray-800'}`}>
                {editId ? 'Update Project' : 'Submit Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 text-xl">Loading projects...</p>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          
          {/* Empty State for Search */}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-xl">No projects found matching "{searchTerm}"</p>
            </div>
          )}

          {/* 🔍 Mapped FILTERED Projects */}
          {filteredProjects.map((project) => (
            <div key={project._id} className="relative bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col justify-between h-full group">
              
              <div className="absolute top-4 right-4 flex gap-2">
                {/* 📄 PDF Button - Everyone can see */}
                <button 
                    onClick={() => generatePDF(project)} 
                    className="text-gray-300 hover:text-green-600 transition p-2"
                    title="Download Proposal PDF"
                >
                    <FaFilePdf />
                </button>

                {/* 🛡️ RULE: Only Admin, Partner, and Gov can EDIT */}
                {canEditOrCreate && (
                    <button onClick={() => handleEdit(project)} className="text-gray-300 hover:text-blue-500 transition p-2"><FaEdit /></button>
                )}

                {/* 🛡️ RULE: Only ADMIN can DELETE */}
                {isAdmin && (
                    <button onClick={() => handleDelete(project._id)} className="text-gray-300 hover:text-red-500 transition p-2"><FaTrash /></button>
                )}
                
                {/* View Details Arrow - Everyone can see */}
                <button 
                    onClick={() => navigate(`/projects/${project._id}`)} 
                    className="text-gray-300 hover:text-primary transition p-2"
                    title="View Details & Reports"
                >
                    <FaArrowRight />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4 pr-24"> 
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase">{project.sdgGoal}</span>
              </div>

              <h3 className="text-xl font-bold text-primary mb-2 pr-4">{project.title}</h3>
              
              <div className="flex flex-col mb-4 bg-gray-50 p-3 rounded-lg">
                 <span className="text-sm font-bold text-gray-900">
                    LKR {project.budget ? parseInt(project.budget).toLocaleString() : '0'}
                </span>
                {exchangeRate && project.budget && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <FaDollarSign /> 
                        {(project.budget * exchangeRate).toFixed(2)} USD
                    </span>
                )}
              </div>

              <p className="text-gray-500 text-sm mb-6 line-clamp-3">{project.description}</p>
              
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-2 text-gray-600 mb-3 text-sm">
                  <FaLeaf className="text-green-500"/> 
                  <span className="font-semibold">{project.organization}</span>
                </div>
                
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    project.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}>
                    {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;