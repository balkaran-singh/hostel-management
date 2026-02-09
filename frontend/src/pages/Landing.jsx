import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="title" style={{ fontSize: '3rem' }}>HostelSync</h1>
      <p className="subtitle">Smart Hostel Management System</p>
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Student Card */}
        <div className="card" style={{ width: '300px', textAlign: 'center', cursor: 'pointer' }}
             onClick={() => navigate('/student/login')}>
          <h2>🎓 Student</h2>
          <p>Login to book meals and file complaints.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Enter as Student</button>
        </div>

        {/* Admin Card */}
        <div className="card" style={{ width: '300px', textAlign: 'center', cursor: 'pointer' }}
             onClick={() => navigate('/admin/login')}>
          <h2>🛡️ Admin</h2>
          <p>Login to manage hostel and view analytics.</p>
          <button className="btn btn-outline" style={{ marginTop: '1rem' }}>Enter as Warden</button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
