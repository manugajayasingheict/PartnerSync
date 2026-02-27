import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheck, FaUserShield, FaClock, FaTrash, FaSyncAlt, FaSpinner } from 'react-icons/fa';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Added console log to see exactly what the backend sends
      console.log("Fetching users with token:", token);
      
      const res = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response data:", res.data);

      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) { 
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/auth/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User Approved!');
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.error || 'Action failed'); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User Deleted');
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.error || 'Delete failed'); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FaUserShield /> Admin Panel</h1>
          <button 
            onClick={fetchUsers} 
            className={`transition-all ${loading ? 'animate-spin' : 'hover:rotate-180'}`}
          >
            <FaSyncAlt />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 text-center font-bold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-primary mb-4" />
            <p className="text-gray-500 font-bold">Loading User Registry...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400 italic">
                    No users found in the system.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.organization}</div>
                    </td>
                    <td className="p-4 text-sm font-mono uppercase text-blue-600">
                      {user.requestedRole || 'None'}
                    </td>
                    <td className="p-4">
                      {user.role === 'public' ? 
                        <span className="text-yellow-600 flex items-center gap-1 text-sm font-bold"><FaClock /> Pending Approval</span> : 
                        <span className="text-green-600 flex items-center gap-1 text-sm font-bold"><FaCheck /> Verified {user.role}</span>
                      }
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      {user.role === 'public' && (
                        <button 
                          onClick={() => handleApprove(user._id)} 
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold transition shadow-md"
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(user._id)} 
                        className="text-red-500 p-2 hover:bg-red-50 text-lg transition-colors"
                        title="Delete User"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Debug Info Footer */}
      <div className="max-w-6xl mx-auto mt-4 text-xs text-gray-400 text-center">
        Logged in as: {JSON.parse(localStorage.getItem('user'))?.email} | 
        Total Records Found: {users.length}
      </div>
    </div>
  );
};

export default AdminDashboard;