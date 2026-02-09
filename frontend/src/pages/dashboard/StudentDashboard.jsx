import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [messStatus, setMessStatus] = useState(null); // 'Eating', 'Not Eating', or null
  
  // Form State
  const [category, setCategory] = useState('Electricity'); // Renamed for clarity
  const [description, setDescription] = useState('');

  // 1. Load User & Data on Mount
  useEffect(() => {
    const storedUser = localStorage.getItem('student');
    if (!storedUser) {
      navigate('/student/login'); 
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchComplaints(parsedUser._id);

    // --- NEW: Check if they already voted TODAY ---
    const today = new Date().toISOString().split('T')[0]; // e.g. "2026-02-09"
    const savedChoice = localStorage.getItem(`messChoice_${parsedUser._id}_${today}`);
    if (savedChoice) {
      setMessStatus(savedChoice);
    }
  }, []);

  const fetchComplaints = async (id) => {
    try {
      const { data } = await API.get(`/data/my-complaints/${id}`);
      setComplaints(data); // In the backend, we sort by date automatically
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  // 2. Handle Mess Choice (With Locking)
  const handleMessChoice = async (choice) => {
    try {
      await API.post('/data/mess-choice', {
        studentId: user._id,
        hostelName: user.hostelName,
        choice: choice
      });
      
      // Lock the choice in LocalStorage so it persists on refresh
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`messChoice_${user._id}_${today}`, choice);
      
      setMessStatus(choice);
      alert(`Preference Saved: ${choice} ✅`);
    } catch (err) {
      alert('Error saving preference');
    }
  };

  // 3. Handle New Complaint (Fixed Category)
  const handleComplaint = async (e) => {
    e.preventDefault();
    try {
      await API.post('/data/complaint', {
        studentId: user._id,
        studentName: user.name,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
        
        // --- FIX: Send as 'type' to match MongoDB Schema ---
        type: category, 
        description
      });
      
      alert('Complaint Filed! 📨');
      setDescription('');
      fetchComplaints(user._id); // Refresh list instantly
    } catch (err) {
      alert('Failed to file complaint');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student');
    navigate('/');
  };

  if (!user) return <div className="flex-center">Loading...</div>;

  return (
    <div className="container">
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title">👋 Welcome, {user.name}</h1>
          <p className="subtitle">Room {user.roomNumber} • Hostel {user.hostelName}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto' }}>Logout</button>
      </div>

      <div className="grid-dashboard">
        
        {/* --- CARD 1: MESS MENU (Locked if Voted) --- */}
        <div className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>🍽️ Today's Menu</h2>
          <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>Lunch:</strong> Rajma Chawal & Curd <br/>
            <strong>Dinner:</strong> Mix Veg & Roti
          </div>
          
          <p style={{ marginBottom: '1rem' }}>
            {messStatus ? <strong>You have already voted: {messStatus}</strong> : "Will you be eating?"}
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Logic: If messStatus exists (already voted), disable BOTH buttons */}
            <button 
              className={`btn ${messStatus === 'Eating' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleMessChoice('Eating')}
              disabled={!!messStatus} 
              style={{ opacity: messStatus && messStatus !== 'Eating' ? 0.5 : 1 }}
            >
              {messStatus === 'Eating' ? 'Eating ✅' : "Yes, I'm Eating 😋"}
            </button>
            
            <button 
              className={`btn ${messStatus === 'Not Eating' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => handleMessChoice('Not Eating')}
              disabled={!!messStatus}
              style={{ opacity: messStatus && messStatus !== 'Not Eating' ? 0.5 : 1 }}
            >
              {messStatus === 'Not Eating' ? 'Skipping ❌' : "No, I'm Out"}
            </button>
          </div>
        </div>

        {/* --- CARD 2: COMPLAINT BOX --- */}
        <div className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>📢 File Complaint</h2>
          <form onSubmit={handleComplaint}>
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Electricity">Electricity</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Internet">Internet / Wi-Fi</option>
                <option value="Mess">Mess Quality</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                rows="3" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                placeholder="Describe the issue..."
              />
            </div>
            <button type="submit" className="btn btn-primary">Submit Complaint</button>
          </form>
        </div>
      </div>

      {/* --- SECTION 3: COMPLAINT HISTORY (Fixed Columns) --- */}
      <h2 className="title" style={{ marginTop: '3rem' }}>📜 Your History</h2>
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Description</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No complaints found.</td></tr>
            ) : (
              complaints.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>{new Date(c.date).toLocaleDateString()}</td>
                  
                  {/* FIX: Use c.type, not c.title */}
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.type}</td>
                  
                  <td style={{ padding: '1rem' }}>{c.description}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${c.status === 'Resolved' ? 'badge-resolved' : 'badge-pending'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
