import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, pendingComplaints: 0, messStats: { eating: 0, notEating: 0 } });
  const [complaints, setComplaints] = useState([]);
  
  // Search State
  const [searchRoom, setSearchRoom] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin/login');
      return;
    }
    const parsedAdmin = JSON.parse(storedAdmin);
    setAdmin(parsedAdmin);
    
    // Fetch Initial Data
    fetchStats(parsedAdmin.hostelManaged);
    fetchComplaints(parsedAdmin.hostelManaged);
  }, []);

  const fetchStats = async (hostel) => {
    try {
      const { data } = await API.get(`/data/dashboard-stats/${hostel}`);
      setStats(data);
    } catch (err) {
      console.error("Stats Error", err);
    }
  };

  const fetchComplaints = async (hostel) => {
    try {
      const { data } = await API.get(`/data/hostel-complaints/${hostel}`);
      setComplaints(data);
    } catch (err) {
      console.error("Complaints Error", err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.put(`/data/resolve-complaint/${id}`);
      // Refresh Data
      fetchComplaints(admin.hostelManaged);
      fetchStats(admin.hostelManaged); // Update pending count
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.get(`/data/student-search?room=${searchRoom}&hostel=${admin.hostelManaged}`);
      setSearchResult(data);
    } catch (err) {
      setSearchResult({ notFound: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/');
  };

  if (!admin) return <div className="flex-center">Loading Admin Console...</div>;

  return (
    <div className="container">
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ color: 'var(--danger)' }}>🛡️ Warden Console</h1>
          <p className="subtitle">Managing Hostel Block {admin.hostelManaged}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline">Logout</button>
      </div>

      {/* --- SECTION 1: ANALYTICS CARDS --- */}
      <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        
        {/* Card 1: Occupancy */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Total Residents</h3>
          <p className="title" style={{ fontSize: '3rem', margin: '0' }}>{stats.totalStudents}</p>
          <small>Registered in Block {admin.hostelManaged}</small>
        </div>

        {/* Card 2: MESS ANALYTICS (AI Data) */}
        <div className="card" style={{ textAlign: 'center', border: '2px solid var(--primary)' }}>
          <h3>🍽️ Mess Analytics (Today)</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '2rem', color: 'var(--success)', fontWeight: 'bold' }}>
                {stats.messStats?.eating || 0}
              </span>
              <small>Eating</small>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '2rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                {stats.messStats?.notEating || 0}
              </span>
              <small>Skipping</small>
            </div>
          </div>
        </div>

        {/* Card 3: Issues */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Pending Issues</h3>
          <p className="title" style={{ fontSize: '3rem', margin: '0', color: 'orange' }}>
            {stats.pendingComplaints}
          </p>
          <small>Needs Attention</small>
        </div>
      </div>

      <div className="grid-dashboard" style={{ marginTop: '2rem', gridTemplateColumns: '2fr 1fr' }}>
        
        {/* --- SECTION 2: COMPLAINT MANAGEMENT --- */}
        <div className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>📢 Complaint Board</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Room</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Issue</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No complaints found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{c.roomNumber}</td>
                    <td>{c.type}</td>
                    <td style={{ color: '#555' }}>{c.description}</td>
                    <td>
                      {c.status === 'Pending' ? (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => handleResolve(c._id)}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="badge badge-resolved">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- SECTION 3: STUDENT SEARCH --- */}
        <div className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>🔍 Find Student</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              placeholder="Room No (e.g. 101)" 
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Go</button>
          </form>

          {searchResult && (
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
              {searchResult.notFound ? (
                <p style={{ color: 'red' }}>No student found in Room {searchRoom}</p>
              ) : (
                <>
                  <p><strong>Name:</strong> {searchResult.name}</p>
                  <p><strong>Roll No:</strong> {searchResult.rollNumber}</p>
                  <p><strong>Email:</strong> {searchResult.email}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
