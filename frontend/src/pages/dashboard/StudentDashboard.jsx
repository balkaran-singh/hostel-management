import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for the 3 meals
  const [choices, setChoices] = useState({
    breakfast: 'Not Eating',
    lunch: 'Not Eating',
    dinner: 'Not Eating'
  });

  // Complaint State
  const [category, setCategory] = useState('Electricity');
  const [description, setDescription] = useState('');
  const [complaints, setComplaints] = useState([]);

  // --- DEADLINES (24 Hour Format) ---
  const DEADLINES = {
    Breakfast: 7,  // 7:00 AM
    Lunch: 11,     // 11:00 AM
    Dinner: 18     // 6:00 PM (18:00)
  };

  useEffect(() => {
    // 1. Load User
    const storedUser = localStorage.getItem('student');
    if (!storedUser) { navigate('/student/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // 2. Fetch Today's Choices from Backend
    fetchChoices(parsedUser._id);
    fetchComplaints(parsedUser._id);

    // 3. Start Live Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchChoices = async (id) => {
    try {
      const { data } = await API.get(`/data/mess-choices/${id}`);
      setChoices(data); // Backend returns { breakfast: '...', lunch: '...', dinner: '...' }
    } catch (err) {
      console.error("Error fetching choices", err);
    }
  };

  const fetchComplaints = async (id) => {
    try {
      const { data } = await API.get(`/data/my-complaints/${id}`);
      setComplaints(data);
    } catch (err) { console.error(err); }
  };

  // --- HANDLE VOTE ---
  const handleVote = async (mealType, choice) => {
    // 1. Check Time again instantly before sending (Security)
    const hour = new Date().getHours();
    if (hour >= DEADLINES[mealType]) {
      alert(`Time is up for ${mealType}! Deadline passed.`);
      return;
    }

    // 2. Optimistic UI Update (Update screen immediately)
    setChoices(prev => ({ ...prev, [mealType.toLowerCase()]: choice }));

    // 3. Send to Backend
    try {
      await API.post('/data/mess-choice', {
        studentId: user._id,
        studentName: user.name,
        hostelName: user.hostelName,
        mealType: mealType, // 'Breakfast', 'Lunch', or 'Dinner'
        choice: choice
      });
    } catch (err) {
      alert("Failed to save. Check internet.");
    }
  };

  // --- COMPLAINT HANDLER ---
  const handleComplaint = async (e) => {
    e.preventDefault();
    try {
      await API.post('/data/complaint', {
        studentId: user._id, studentName: user.name, hostelName: user.hostelName,
        roomNumber: user.roomNumber, type: category, description
      });
      alert('Complaint Filed! 📨');
      setDescription('');
      fetchComplaints(user._id);
    } catch (err) { alert('Failed to file complaint'); }
  };

  // --- HELPER: RENDER MEAL ROW ---
  const renderMealRow = (meal, icon) => {
    const hour = currentTime.getHours();
    const isLocked = hour >= DEADLINES[meal];
    const status = choices[meal.toLowerCase()] || 'Not Eating'; // Default to 'Not Eating'

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{icon} {meal}</h3>
          <small style={{ color: isLocked ? 'red' : 'green' }}>
            {isLocked ? `Closed at ${DEADLINES[meal]}:00` : `Open until ${DEADLINES[meal]}:00`}
          </small>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isLocked ? (
            // LOCKED STATE (Just text)
            <span style={{ fontWeight: 'bold', color: '#555' }}>
              Final: {status}
            </span>
          ) : (
            // OPEN STATE (Buttons)
            <>
              <button 
                className={`btn ${status === 'Eating' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => handleVote(meal, 'Eating')}
              >
                Eat
              </button>
              <button 
                className={`btn ${status === 'Not Eating' ? 'btn-danger' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => handleVote(meal, 'Not Eating')}
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = () => { localStorage.removeItem('student'); navigate('/'); };

  if (!user) return <div className="flex-center">Loading...</div>;

  return (
    <div className="container">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title">👋 Welcome, {user.name}</h1>
          <p className="subtitle">
            {currentTime.toLocaleTimeString()} (IST) • Room {user.roomNumber}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto' }}>Logout</button>
      </div>

      <div className="grid-dashboard">
        {/* --- CARD 1: MESS MENU & VOTING (UPDATED) --- */}
        <div className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>🍽️ Daily Meals</h2>
          <div style={{ background: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }}>
            {renderMealRow('Breakfast', '🍳')}
            {renderMealRow('Lunch', '🍛')}
            {renderMealRow('Dinner', '🍲')}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
            *If no option is selected by deadline, it defaults to "Not Eating".
          </p>
        </div>

        {/* --- CARD 2: COMPLAINT BOX (Keep as is) --- */}
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
              <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the issue..." />
            </div>
            <button type="submit" className="btn btn-primary">Submit Complaint</button>
          </form>
        </div>
      </div>

      {/* --- HISTORY TABLE (Keep as is) --- */}
      <h2 className="title" style={{ marginTop: '3rem' }}>📜 Your Complaint History</h2>
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
            {complaints.map((c) => (
              <tr key={c._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem' }}>{new Date(c.date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.type}</td>
                <td style={{ padding: '1rem' }}>{c.description}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${c.status === 'Resolved' ? 'badge-resolved' : 'badge-pending'}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
