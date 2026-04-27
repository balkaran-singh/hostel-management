import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    pendingComplaints: 0, 
    messStats: { breakfastEating: 0, lunchEating: 0, dinnerEating: 0 } 
  });
  const [complaints, setComplaints] = useState([]);
  const [pendingGatePasses, setPendingGatePasses] = useState([]);
  const [roomAllotmentStudents, setRoomAllotmentStudents] = useState([]);
  const [roomInputByStudent, setRoomInputByStudent] = useState({});
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTargetStudent, setAiTargetStudent] = useState(null);
  const [aiMatches, setAiMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [modalRoom, setModalRoom] = useState('');
  const [allotmentError, setAllotmentError] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  
  // Directory Search State
  const [directorySearchTerm, setDirectorySearchTerm] = useState('');
  const [directoryResults, setDirectoryResults] = useState([]);
  const [hasDirectorySearch, setHasDirectorySearch] = useState(false);

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
    fetchPendingGatePasses(parsedAdmin.hostelManaged);
    fetchRoomAllotmentStudents(parsedAdmin.hostelManaged);
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

  const fetchPendingGatePasses = async (hostel) => {
    try {
      const { data } = await API.get(`/data/gatepass/hostel/${hostel}`);
      setPendingGatePasses(data);
    } catch (err) {
      console.error('Gate pass fetch error', err);
    }
  };

  const fetchRoomAllotmentStudents = async (hostel) => {
    try {
      const { data } = await API.get(`/data/admin/room-allotment/${hostel}`);
      setRoomAllotmentStudents(data);
    } catch (err) {
      console.error('Room allotment fetch error', err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.put(`/data/resolve-complaint/${id}`);
      fetchComplaints(admin.hostelManaged);
      fetchStats(admin.hostelManaged);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleGatePassStatus = async (id, status) => {
    try {
      await API.put(`/data/gatepass/status/${id}`, { status });
      fetchPendingGatePasses(admin.hostelManaged);
    } catch (err) {
      alert('Failed to update gate pass status');
    }
  };

  const handleDirectorySearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.get('/data/student-search', {
        params: {
          searchTerm: directorySearchTerm,
          hostel: admin.hostelManaged
        }
      });
      setDirectoryResults(Array.isArray(data) ? data : []);
      setHasDirectorySearch(true);
    } catch (err) {
      setDirectoryResults([]);
      setHasDirectorySearch(true);
    }
  };

  const handleRoomInputChange = (studentId, value) => {
    setAllotmentError('');
    setRoomInputByStudent((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleAllotRoomForPaired = async (studentId) => {
    const roomNumber = roomInputByStudent[studentId];
    if (!roomNumber) {
      alert('Please enter a room number');
      return;
    }

    try {
      setAllotmentError('');
      await API.post('/data/admin/allot-room', { studentId, roomNumber });
      alert('Room allotted successfully');
      fetchRoomAllotmentStudents(admin.hostelManaged);
    } catch (err) {
      const backendMessage = err.response?.data?.error || 'Failed to allot room';
      if (err.response?.status === 400 && backendMessage.includes('Room capacity exceeded')) {
        setAllotmentError(backendMessage);
        return;
      }

      setAllotmentError(backendMessage);
    }
  };

  const handleRunAiMatch = async (student) => {
    try {
      const { data } = await API.post('/data/admin/run-ai-match', { studentId: student._id });
      const matches = data.matches || [];

      setAiTargetStudent(student);
      setAiMatches(matches);
      setSelectedMatchId(matches.length > 0 ? matches[0].id : '');
      setModalRoom('');
      setAllotmentError('');
      setShowAiModal(true);
    } catch (err) {
      const backendError = err.response?.data;
      const errorMessage =
        backendError?.details?.error ||
        backendError?.error ||
        err.message ||
        'Failed to run AI match';
      alert(errorMessage);
    }
  };

  const handleConfirmAllotment = async () => {
    if (!aiTargetStudent || !selectedMatchId) {
      alert('Please select a match');
      return;
    }

    if (!modalRoom) {
      alert('Please enter room number');
      return;
    }

    try {
      setAllotmentError('');
      await API.post('/data/admin/allot-room', {
        studentId: aiTargetStudent._id,
        roommateId: selectedMatchId,
        roomNumber: modalRoom
      });

      alert('Allotment confirmed');
      setShowAiModal(false);
      setAiTargetStudent(null);
      setAiMatches([]);
      setSelectedMatchId('');
      setModalRoom('');
      setAllotmentError('');
      fetchRoomAllotmentStudents(admin.hostelManaged);
    } catch (err) {
      const backendMessage = err.response?.data?.error || 'Failed to confirm allotment';
      if (err.response?.status === 400 && backendMessage.includes('Room capacity exceeded')) {
        setAllotmentError(backendMessage);
        return;
      }

      setAllotmentError(backendMessage);
    }
  };

  const handleCloseAiModal = () => {
    setShowAiModal(false);
    setAiTargetStudent(null);
    setAiMatches([]);
    setSelectedMatchId('');
    setModalRoom('');
    setAllotmentError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/');
  };

  if (!admin) return <div id="admin-dashboard-loading-container" className="flex-center">Loading Hostel Administration Portal...</div>;

  const pairedStudents = roomAllotmentStudents.filter((student) => student.roommateStatus === 'Paired');
  const unassignedStudents = roomAllotmentStudents.filter((student) => student.roommateStatus === 'Unassigned');
  const tabStyle = (tab) => ({
    width: 'auto'
  });

  return (
    <div id="admin-dashboard-page-container" className="container">
      {/* --- HEADER --- */}
      <div id="admin-dashboard-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div id="admin-dashboard-header-title-container">
          <h1 className="title">Hostel Administration Portal</h1>
          <p className="subtitle">Managing Hostel Block {admin.hostelManaged}</p>
        </div>
        <button id="admin-dashboard-logout-btn" onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto' }}>Logout</button>
      </div>

      <div id="admin-dashboard-tabs-container" className="tab-container" style={{ marginBottom: '1.25rem' }}>
        <button id="admin-dashboard-overview-tab-btn" className={`tab-button ${activeAdminTab === 'overview' ? 'tab-button-active' : ''}`} style={tabStyle('overview')} onClick={() => setActiveAdminTab('overview')}>Overview</button>
        <button id="admin-dashboard-complaints-tab-btn" className={`tab-button ${activeAdminTab === 'complaints' ? 'tab-button-active' : ''}`} style={tabStyle('complaints')} onClick={() => setActiveAdminTab('complaints')}>Complaints</button>
        <button id="admin-dashboard-gatepass-tab-btn" className={`tab-button ${activeAdminTab === 'gatepass' ? 'tab-button-active' : ''}`} style={tabStyle('gatepass')} onClick={() => setActiveAdminTab('gatepass')}>Gate Passes</button>
        <button id="admin-dashboard-allotment-tab-btn" className={`tab-button ${activeAdminTab === 'allotment' ? 'tab-button-active' : ''}`} style={tabStyle('allotment')} onClick={() => setActiveAdminTab('allotment')}>Room Allotment</button>
        <button id="admin-dashboard-directory-tab-btn" className={`tab-button ${activeAdminTab === 'directory' ? 'tab-button-active' : ''}`} style={tabStyle('directory')} onClick={() => setActiveAdminTab('directory')}>Student Directory</button>
      </div>

      {activeAdminTab === 'overview' && (
        <div id="admin-dashboard-overview-tab-panel">
          <div id="admin-dashboard-overview-stats-grid-container" className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '0', marginBottom: '1.5rem' }}>
            <div className="card">
              <h3>Total Registered Students</h3>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.totalStudents}</span>
            </div>
            <div className="card">
              <h3>Pending Grievances</h3>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.pendingComplaints}</span>
            </div>
          </div>

          <h2 className="title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Daily Mess Attendance Overview</h2>
          <div id="admin-dashboard-overview-mess-grid-container" className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '0' }}>
            <div className="card">
              <h3>Breakfast Attendance</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.messStats.breakfastEating}</span>
                  <small style={{ display: 'block', color: '#666' }}>Participating Students</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', color: '#ccc' }}>{stats.totalStudents - stats.messStats.breakfastEating}</span>
                  <small style={{ display: 'block', color: '#999' }}>Not Participating</small>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Lunch Attendance</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.messStats.lunchEating}</span>
                  <small style={{ display: 'block', color: '#666' }}>Participating Students</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', color: '#ccc' }}>{stats.totalStudents - stats.messStats.lunchEating}</span>
                  <small style={{ display: 'block', color: '#999' }}>Not Participating</small>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Dinner Attendance</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.messStats.dinnerEating}</span>
                  <small style={{ display: 'block', color: '#666' }}>Participating Students</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', color: '#ccc' }}>{stats.totalStudents - stats.messStats.dinnerEating}</span>
                  <small style={{ display: 'block', color: '#999' }}>Not Participating</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'complaints' && (
        <div id="admin-dashboard-complaints-tab-panel" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="title" style={{ fontSize: '1.5rem' }}>Grievance Management</h2>
            <span className="badge badge-pending">{stats.pendingComplaints} Pending Review</span>
          </div>

          <table id="admin-dashboard-complaints-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', background: '#fff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', background: '#fff' }}>
                <th style={{ padding: '0.5rem' }}>Student Name</th>
                <th style={{ padding: '0.5rem' }}>Allocated Room</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Issue</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr id="admin-dashboard-complaint-empty-row"><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No complaints found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr id={`admin-dashboard-complaint-row-${c._id}`} key={c._id} style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{c.studentName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{c.allocatedRoom || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{c.type}</td>
                    <td style={{ padding: '0.75rem', color: '#555' }}>{c.description}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.status === 'Pending' ? (
                        <button
                          id={`admin-dashboard-complaint-resolve-btn-${c._id}`}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => handleResolve(c._id)}
                        >
                          Mark as Resolved
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
      )}

      {activeAdminTab === 'directory' && (
        <div id="admin-dashboard-directory-tab-panel" className="card">
          <h2 className="title" style={{ fontSize: '1.5rem' }}>Student Directory</h2>

          <form id="admin-dashboard-directory-search-form" onSubmit={handleDirectorySearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input
              id="admin-dashboard-directory-search-input"
              placeholder="Search by Name, Roll No, or Room"
              value={directorySearchTerm}
              onChange={(e) => setDirectorySearchTerm(e.target.value)}
              required
            />
            <button id="admin-dashboard-directory-search-btn" type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              Search
            </button>
          </form>

          {hasDirectorySearch && (
            directoryResults.length === 0 ? (
              <p style={{ margin: 0 }}>No matching records found</p>
            ) : (
              <table id="admin-dashboard-directory-results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Roll No</th>
                    <th style={{ padding: '0.5rem' }}>Room</th>
                    <th style={{ padding: '0.5rem' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {directoryResults.map((student) => (
                    <tr id={`admin-dashboard-directory-result-row-${student._id}`} key={student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{student.roomNumber || student.allocatedRoom || 'N/A'}</td>
                      <td style={{ padding: '0.75rem' }}>{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      {activeAdminTab === 'gatepass' && (
        <div id="admin-dashboard-gatepass-tab-panel" className="card" style={{ marginTop: '0' }}>
          <h2 className="title" style={{ fontSize: '1.5rem' }}>Gate Pass Requests</h2>
          <table id="admin-dashboard-gatepass-requests-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Student</th>
                <th style={{ padding: '0.5rem' }}>Roll No</th>
                <th style={{ padding: '0.5rem' }}>Date Out</th>
                <th style={{ padding: '0.5rem' }}>Date In</th>
                <th style={{ padding: '0.5rem' }}>Reason</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingGatePasses.length === 0 ? (
                <tr id="admin-dashboard-gatepass-request-empty-row">
                  <td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No pending gate pass requests.</td>
                </tr>
              ) : (
                pendingGatePasses.map((pass) => (
                  <tr id={`admin-dashboard-gatepass-request-row-${pass._id}`} key={pass._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>{pass.studentName}</td>
                    <td style={{ padding: '0.75rem' }}>{pass.rollNumber}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(pass.dateOut).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(pass.dateIn).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{pass.reason}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        id={'admin-dashboard-gatepass-approve-btn-' + pass._id}
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleGatePassStatus(pass._id, 'Approved')}
                      >
                        Approve
                      </button>
                      <button
                        id={'admin-dashboard-gatepass-reject-btn-' + pass._id}
                        className="btn btn-danger"
                        style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleGatePassStatus(pass._id, 'Rejected')}
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeAdminTab === 'allotment' && (
        <div id="admin-dashboard-allotment-tab-panel">
          <div id="admin-dashboard-allotment-paired-container" className="card" style={{ marginTop: '0' }}>
            <h2 className="title" style={{ fontSize: '1.5rem' }}>Paired Students</h2>
            {allotmentError && (
              <p style={{ margin: '0.5rem 0 0', color: '#DC2626', fontSize: '0.9rem' }}>
                {allotmentError}
              </p>
            )}
            <table id="admin-dashboard-room-allotment-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Roll No</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pairedStudents.length === 0 ? (
                  <tr id="admin-dashboard-room-allotment-empty-row">
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No paired students available for room allotment.</td>
                  </tr>
                ) : (
                  pairedStudents.map((student) => (
                    <tr id={`admin-dashboard-room-allotment-row-${student._id}`} key={student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{student.roommateStatus}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            id={'admin-dashboard-allot-room-input-' + student._id}
                            type="text"
                            placeholder="Room Number"
                            value={roomInputByStudent[student._id] || ''}
                            onChange={(e) => handleRoomInputChange(student._id, e.target.value)}
                            style={{ maxWidth: '160px' }}
                          />
                          <button
                            id={'admin-dashboard-allot-room-btn-' + student._id}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleAllotRoomForPaired(student._id)}
                          >
                            Assign Room
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div id="admin-dashboard-allotment-unassigned-container" className="card" style={{ marginTop: '1.25rem' }}>
            <h2 className="title" style={{ fontSize: '1.5rem' }}>Unassigned Students</h2>
            <table id="admin-dashboard-room-allotment-unassigned-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Roll No</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {unassignedStudents.length === 0 ? (
                  <tr id="admin-dashboard-room-allotment-unassigned-empty-row">
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No unassigned students available for AI matching.</td>
                  </tr>
                ) : (
                  unassignedStudents.map((student) => (
                    <tr id={`admin-dashboard-room-allotment-unassigned-row-${student._id}`} key={student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{student.roommateStatus}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          id={'admin-dashboard-ai-match-btn-' + student._id}
                          className="btn btn-outline"
                          style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleRunAiMatch(student)}
                        >
                          Run Compatibility Match
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAiModal && (
        <div
          id="admin-dashboard-ai-match-modal-container"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div id="admin-dashboard-ai-match-modal-content" className="card" style={{ background: '#fff', borderRadius: '12px', width: 'min(720px, 90vw)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Top 3 Compatibility Matches</h3>
              <button
                id="admin-dashboard-ai-modal-close-btn"
                className="btn btn-outline"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={handleCloseAiModal}
              >
                Close
              </button>
            </div>

            <p style={{ color: '#666' }}>Target Student Record: {aiTargetStudent?.name} ({aiTargetStudent?.rollNumber})</p>

            <table id="admin-dashboard-ai-match-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', background: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', background: '#fff' }}>
                  <th style={{ padding: '0.5rem', color: '#374151' }}>Student Name</th>
                  <th style={{ padding: '0.5rem', color: '#374151' }}>Roll Number</th>
                  <th style={{ padding: '0.5rem', color: '#374151' }}>Compatibility Score</th>
                  <th style={{ padding: '0.5rem', color: '#374151' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {aiMatches.length === 0 ? (
                  <tr id="admin-dashboard-ai-match-empty-row">
                    <td colSpan="4" style={{ padding: '0.75rem', color: '#4b5563' }}>No compatibility matches were returned.</td>
                  </tr>
                ) : (
                  aiMatches.map((match) => (
                    <tr
                      id={`admin-dashboard-ai-match-row-${match.id}`}
                      key={match.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: selectedMatchId === match.id ? '#f9fafb' : '#fff'
                      }}
                    >
                      <td style={{ padding: '0.5rem', color: '#374151', fontWeight: 500 }}>{match.name}</td>
                      <td style={{ padding: '0.5rem', color: '#374151' }}>{match.rollNumber}</td>
                      <td style={{ padding: '0.5rem', color: '#374151', fontWeight: 600 }}>
                        {match.score}%
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <button
                          id={'admin-dashboard-select-match-btn-' + match.id}
                          className={`btn ${selectedMatchId === match.id ? 'btn-primary' : 'btn-outline'}`}
                          style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => setSelectedMatchId(match.id)}
                        >
                          {selectedMatchId === match.id ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <input
                id="admin-dashboard-modal-room-input"
                type="text"
                placeholder="Enter room number"
                value={modalRoom}
                onChange={(e) => {
                  setModalRoom(e.target.value);
                  setAllotmentError('');
                }}
              />
              <button
                id="admin-dashboard-modal-confirm-btn"
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={handleConfirmAllotment}
              >
                Confirm Allotment
              </button>
            </div>
            {allotmentError && (
              <p style={{ marginTop: '0.75rem', marginBottom: 0, color: '#DC2626', fontSize: '0.9rem' }}>
                {allotmentError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
