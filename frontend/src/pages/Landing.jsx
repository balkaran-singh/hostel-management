import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div id="landing-root-container" className="flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 id="landing-title-heading" className="title" style={{ fontSize: '3rem' }}>HostelSync</h1>
      <p id="landing-subtitle-text" className="subtitle">Smart Hostel Management System</p>
      
      <div id="landing-role-cards-container" style={{ display: 'flex', gap: '2rem' }}>
        {/* Student Card */}
        <div id="landing-student-card-container" className="card" style={{ width: '300px', textAlign: 'center', cursor: 'pointer' }}
             onClick={() => navigate('/student/login')}>
          <h2 id="landing-student-card-heading">🎓 Student</h2>
          <p id="landing-student-card-description-text">Login to book meals and file complaints.</p>
          <button id="landing-student-enter-btn" className="btn btn-primary" style={{ marginTop: '1rem' }}>Enter as Student</button>
        </div>

        {/* Admin Card */}
        <div id="landing-admin-card-container" className="card" style={{ width: '300px', textAlign: 'center', cursor: 'pointer' }}
             onClick={() => navigate('/admin/login')}>
          <h2 id="landing-admin-card-heading">🛡️ Admin</h2>
          <p id="landing-admin-card-description-text">Login to manage hostel and view analytics.</p>
          <button id="landing-admin-enter-btn" className="btn btn-outline" style={{ marginTop: '1rem' }}>Enter as Warden</button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
