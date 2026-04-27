import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa'; 
import { loginAdmin } from '../../api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await loginAdmin({ email, password });
      if (data.success) {
        localStorage.setItem('admin', JSON.stringify(data.data));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      alert('Invalid Admin Credentials');
    }
  };

  return (
    <div id="admin-login-page-container" className="flex-center">
      <div id="admin-login-card-container" className="card auth-card" style={{ width: '420px', position: 'relative' }}>
        
        {/* --- BACK TO HOME --- */}
        <div 
          id="admin-login-back-home-btn"
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '1rem', left: '1rem', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          <FaArrowLeft /> Back to Home
        </div>

        <h2 className="title" style={{ marginTop: '1.5rem' }}>Administrator Login</h2>
        <p className="subtitle">Hostel Administration Portal</p>
        
        <form id="admin-login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input id="admin-login-email-input" className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input id="admin-login-password-input" className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button id="admin-login-sign-in-btn" type="submit" className="btn btn-primary">Sign In</button>
        </form>
        
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New Administrator? <span id="admin-login-access-registration-link" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }} onClick={() => navigate('/admin/register')}>Access Registration</span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
