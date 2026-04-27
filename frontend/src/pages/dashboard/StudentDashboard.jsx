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

  // Gate Pass State
  const [dateOut, setDateOut] = useState('');
  const [dateIn, setDateIn] = useState('');
  const [dateError, setDateError] = useState('');
  const [gatePassReason, setGatePassReason] = useState('');
  const [gatePasses, setGatePasses] = useState([]);
  const [activeTab, setActiveTab] = useState('meals');

  const [targetRollNumber, setTargetRollNumber] = useState('');
  const [roommateDetails, setRoommateDetails] = useState(null);
  const [roommateDetailsError, setRoommateDetailsError] = useState('');

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
    fetchGatePasses(parsedUser._id);

    // 3. Start Live Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.roommateStatus === 'Unassigned') {
      setActiveTab('roommate');
    }
  }, [user?.roommateStatus]);

  useEffect(() => {
    const fetchRoommateDetails = async () => {
      if (!user?._id || user.roommateStatus !== 'Allotted' || activeTab !== 'roommate') return;

      try {
        setRoommateDetailsError('');
        const { data } = await API.get(`/data/roommate/details/${user._id}`);
        setRoommateDetails(data);
      } catch (err) {
        setRoommateDetails(null);
        setRoommateDetailsError(err.response?.data?.error || 'Failed to fetch roommate details');
      }
    };

    fetchRoommateDetails();
  }, [user?._id, user?.roommateStatus, activeTab]);

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

  const fetchGatePasses = async (id) => {
    try {
      const { data } = await API.get(`/data/gatepass/student/${id}`);
      setGatePasses(data);
    } catch (err) {
      console.error('Error fetching gate passes', err);
    }
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
        allocatedRoom: user.allocatedRoom, type: category, description
      });
      alert('Complaint submitted successfully.');
      setDescription('');
      fetchComplaints(user._id);
    } catch (err) { alert('Failed to file complaint'); }
  };

  const handleGatePassApply = async (e) => {
    e.preventDefault();
    const parsedDateOut = new Date(dateOut);
    const parsedDateIn = new Date(dateIn);

    if (parsedDateIn <= parsedDateOut) {
      setDateError('Return date and time must be after departure.');
      return;
    }

    setDateError('');

    try {
      await API.post('/data/gatepass/apply', {
        studentId: user._id,
        studentName: user.name,
        rollNumber: user.rollNumber,
        hostelName: user.hostelName,
        dateOut,
        dateIn,
        reason: gatePassReason
      });

      alert('Gate pass application submitted');
      setDateOut('');
      setDateIn('');
      setDateError('');
      setGatePassReason('');
      fetchGatePasses(user._id);
    } catch (err) {
      alert('Failed to submit gate pass request');
    }
  };

  const handleRoommateInvite = async (e) => {
    e.preventDefault();
    try {
      await API.post('/data/roommate/invite', {
        senderId: user._id,
        targetRollNumber
      });
      alert('Roommate invite sent');
      setTargetRollNumber('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleAcceptInvitation = async (acceptedRollNumber) => {
    try {
      await API.post('/data/roommate/accept', {
        studentId: user._id,
        acceptedRollNumber
      });

      const updatedUser = {
        ...user,
        roommateStatus: 'Paired',
        pendingInvitations: (user.pendingInvitations || []).filter((roll) => roll !== acceptedRollNumber)
      };
      setUser(updatedUser);
      localStorage.setItem('student', JSON.stringify(updatedUser));
      alert('Roommate invitation accepted');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept invitation');
    }
  };

  // --- HELPER: RENDER MEAL ROW ---
  const renderMealRow = (meal) => {
    const hour = currentTime.getHours();
    const isLocked = hour >= DEADLINES[meal];
    const status = choices[meal.toLowerCase()] || 'Not Eating'; // Default to 'Not Eating'

    return (
      <div id={`student-dashboard-${meal.toLowerCase()}-meal-row`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
        <div id={`student-dashboard-${meal.toLowerCase()}-meal-info-container`}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{meal}</h3>
          <small style={{ color: isLocked ? 'red' : 'green' }}>
            {isLocked ? `Closed at ${DEADLINES[meal]}:00` : `Open until ${DEADLINES[meal]}:00`}
          </small>
        </div>
        
        <div id={`student-dashboard-${meal.toLowerCase()}-meal-actions-container`} style={{ display: 'flex', gap: '0.5rem' }}>
          {isLocked ? (
            // LOCKED STATE (Just text)
            <span id={`student-dashboard-${meal.toLowerCase()}-meal-final-status`} style={{ fontWeight: 'bold', color: '#555' }}>
              Final: {status}
            </span>
          ) : (
            // OPEN STATE (Buttons)
            <>
              <button 
                id={`student-dashboard-${meal.toLowerCase()}-eat-btn`}
                className={`btn ${status === 'Eating' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => handleVote(meal, 'Eating')}
              >
                Eat
              </button>
              <button 
                id={`student-dashboard-${meal.toLowerCase()}-skip-btn`}
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

  if (!user) return <div id="student-dashboard-loading-container" className="flex-center">Loading...</div>;

  const isUnassigned = user.roommateStatus === 'Unassigned';
  const tabBtnStyle = (tab) => ({
    width: 'auto',
    opacity: isUnassigned && tab !== 'roommate' ? 0.5 : 1
  });

  return (
    <div id="student-dashboard-page-container" className="container">
      {/* HEADER */}
      <div id="student-dashboard-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div id="student-dashboard-header-info-container">
          <h1 className="title">Student Services Dashboard</h1>
          <p className="subtitle">
            {user.name} | {currentTime.toLocaleTimeString()} (IST) | Hostel {user.hostelName}
          </p>
        </div>
        <button id="student-dashboard-logout-btn" onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto' }}>Logout</button>
      </div>

      <div id="student-dashboard-tabs-container" className="tab-container" style={{ marginBottom: '1rem' }}>
        <div
          id="student-dashboard-room-status-container"
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            background: '#f9fafb',
            color: '#111827',
            fontWeight: 500
          }}
        >
          {user.allocatedRoom
            ? `Current Status: Allotted - Room ${user.allocatedRoom}`
            : 'Current Status: Room Unassigned'}
        </div>
        <button
          id="student-dashboard-meals-tab-btn"
          className={`tab-button ${activeTab === 'meals' ? 'tab-button-active' : ''}`}
          style={tabBtnStyle('meals')}
          onClick={() => setActiveTab('meals')}
          disabled={isUnassigned}
        >
          Meals
        </button>
        <button
          id="student-dashboard-complaints-tab-btn"
          className={`tab-button ${activeTab === 'complaints' ? 'tab-button-active' : ''}`}
          style={tabBtnStyle('complaints')}
          onClick={() => setActiveTab('complaints')}
          disabled={isUnassigned}
        >
          Complaints
        </button>
        <button
          id="student-dashboard-gatepass-tab-btn"
          className={`tab-button ${activeTab === 'gatepass' ? 'tab-button-active' : ''}`}
          style={tabBtnStyle('gatepass')}
          onClick={() => setActiveTab('gatepass')}
          disabled={isUnassigned}
        >
          Gate Pass Management
        </button>
        <button
          id="student-dashboard-roommate-tab-btn"
          className={`tab-button ${activeTab === 'roommate' ? 'tab-button-active' : ''}`}
          style={tabBtnStyle('roommate')}
          onClick={() => setActiveTab('roommate')}
        >
          Roommate Coordination
        </button>
      </div>

      {activeTab === 'meals' && (
        <div id="student-dashboard-meals-card" className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>Daily Mess Attendance Submission</h2>
          <div id="student-dashboard-meals-list-container" style={{ background: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }}>
            {renderMealRow('Breakfast')}
            {renderMealRow('Lunch')}
            {renderMealRow('Dinner')}
          </div>
          <p id="student-dashboard-meals-note-text" style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
            If no option is selected by the deadline, the attendance status defaults to "Not Eating".
          </p>
        </div>
      )}

      {activeTab === 'complaints' && (
        <>
          <div id="student-dashboard-complaint-form-card" className="card">
            <h2 className="title" style={{ fontSize: '1.5rem' }}>Complaint Submission</h2>
            <form id="student-dashboard-complaint-form" onSubmit={handleComplaint}>
              <div className="form-group">
                <label>Complaint Category</label>
                <select id="student-dashboard-complaint-category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Electricity">Electricity</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Internet">Internet / Wi-Fi</option>
                  <option value="Mess">Mess Quality</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Complaint Description</label>
                <textarea id="student-dashboard-complaint-description-textarea" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Provide a concise description of the issue" />
              </div>
              <button id="student-dashboard-complaint-submit-btn" type="submit" className="btn btn-primary">Submit Complaint</button>
            </form>
          </div>

          <h2 className="title" style={{ marginTop: '2rem' }}>Complaint History</h2>
          <div id="student-dashboard-complaint-history-card" className="card" style={{ padding: '0', overflow: 'hidden', background: '#fff' }}>
            <table id="student-dashboard-complaint-history-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Allocated Room</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Description</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr id={`student-dashboard-complaint-row-${c._id}`} key={c._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>{new Date(c.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.allocatedRoom || 'N/A'}</td>
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
        </>
      )}

      {activeTab === 'gatepass' && (
        <>
          <div id="student-dashboard-gatepass-form-card" className="card">
            <h2 className="title" style={{ fontSize: '1.5rem' }}>Gate Pass Application</h2>
            <form id="student-dashboard-gatepass-application-form" onSubmit={handleGatePassApply}>
              <div className="form-group">
                <label>Departure Date and Time</label>
                <input
                  id="student-dashboard-gatepass-dateout-input"
                  type="datetime-local"
                  value={dateOut}
                  onChange={(e) => {
                    setDateOut(e.target.value);
                    setDateError('');
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Return Date and Time</label>
                <input
                  id="student-dashboard-gatepass-datein-input"
                  type="datetime-local"
                  value={dateIn}
                  onChange={(e) => {
                    setDateIn(e.target.value);
                    setDateError('');
                  }}
                  required
                />
              </div>
              {dateError && (
                <p id="student-dashboard-gatepass-dateerror-text" style={{ color: '#DC2626', marginTop: '-0.25rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  {dateError}
                </p>
              )}
              <div className="form-group">
                <label>Purpose of Leave</label>
                <textarea
                  id="student-dashboard-gatepass-reason-textarea"
                  rows="3"
                  value={gatePassReason}
                  onChange={(e) => setGatePassReason(e.target.value)}
                  placeholder="Provide the purpose of leave"
                  required
                />
              </div>
              <button id="student-dashboard-gatepass-submit-btn" type="submit" className="btn btn-primary">Apply Gate Pass</button>
            </form>
          </div>

          <h2 className="title" style={{ marginTop: '2rem' }}>Gate Pass History</h2>
          <div id="student-dashboard-gatepass-history-card" className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table id="student-dashboard-gatepass-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Date Out</th>
                  <th style={{ padding: '1rem' }}>Date In</th>
                  <th style={{ padding: '1rem' }}>Reason</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.length === 0 ? (
                  <tr id="student-dashboard-gatepass-empty-row">
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No gate pass applications yet.</td>
                  </tr>
                ) : (
                  gatePasses.map((pass) => (
                    <tr id={`student-dashboard-gatepass-row-${pass._id}`} key={pass._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>{new Date(pass.dateOut).toLocaleString()}</td>
                      <td style={{ padding: '1rem' }}>{new Date(pass.dateIn).toLocaleString()}</td>
                      <td style={{ padding: '1rem' }}>{pass.reason}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${pass.status === 'Approved' ? 'badge-resolved' : pass.status === 'Rejected' ? 'btn-danger' : 'badge-pending'}`}>
                          {pass.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'roommate' && (
        <div id="student-dashboard-roommate-card" className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>Roommate Coordination Queue</h2>
          {user.roommateStatus === 'Unassigned' ? (
            user.requiresAiMatch ? (
              <div id="student-dashboard-ai-queue-container" style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                You are currently in the compatibility matching queue. Please wait for hostel administration to finalize your roommate allocation.
              </div>
            ) : (
              <>
                <form id="student-dashboard-invite-form" onSubmit={handleRoommateInvite} style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Target Student Roll Number</label>
                    <input
                      id="student-dashboard-invite-roll-input"
                      type="text"
                      value={targetRollNumber}
                      onChange={(e) => setTargetRollNumber(e.target.value)}
                      placeholder="Enter target student roll number"
                      required
                    />
                  </div>
                  <button id="student-dashboard-invite-submit-btn" type="submit" className="btn btn-primary">Send Invitation</button>
                </form>

                <h3 id="student-dashboard-pending-invitations-title" style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>Pending Invitations</h3>
                {(user.pendingInvitations || []).length === 0 ? (
                  <p id="student-dashboard-pending-invitations-empty-text">No pending invitations are available.</p>
                ) : (
                  <table id="student-dashboard-pending-invitations-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Roll Number</th>
                        <th style={{ padding: '0.75rem' }}>Review Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(user.pendingInvitations || []).map((roll) => (
                        <tr id={`student-dashboard-pending-invite-row-${roll}`} key={roll} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.75rem' }}>{roll}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              id={'student-dashboard-accept-invite-btn-' + roll}
                              className="btn btn-primary"
                              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                              onClick={() => handleAcceptInvitation(roll)}
                            >
                              Accept Invitation
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )
          ) : user.roommateStatus === 'Allotted' ? (
            <div
              id="student-dashboard-roommate-details-card"
              className="card"
              style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Roommate Contact Information</h3>
              {roommateDetailsError ? (
                <p id="student-dashboard-roommate-details-error-text" style={{ margin: 0, color: '#b91c1c' }}>{roommateDetailsError}</p>
              ) : !roommateDetails ? (
                <p id="student-dashboard-roommate-details-loading-text" style={{ margin: 0 }}>Loading roommate details...</p>
              ) : (
                <div id="student-dashboard-roommate-details-grid" style={{ display: 'grid', gap: '0.5rem' }}>
                  <p id="student-dashboard-roommate-name-text" style={{ margin: 0 }}>
                    <strong>Name:</strong> {roommateDetails.name}
                  </p>
                  <p id="student-dashboard-roommate-roll-text" style={{ margin: 0 }}>
                    <strong>Roll Number:</strong> {roommateDetails.rollNumber}
                  </p>
                  <p id="student-dashboard-roommate-email-text" style={{ margin: 0 }}>
                    <strong>Email:</strong> {roommateDetails.email}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div id="student-dashboard-roommate-status-card" style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
              Roommate status: {user.roommateStatus}. Please wait for final room allocation updates from hostel administration.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
