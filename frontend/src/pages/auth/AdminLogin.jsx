import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        localStorage.setItem('admin', JSON.stringify(data.data)); // Save Admin info
        navigate('/admin/dashboard');
      }
    } catch (err) {
      alert('Invalid Admin Credentials');
    }
  };

  return (
    <div className="flex-center">
      <div className="card" style={{ width: '400px', borderTop: '4px solid var(--danger)' }}>
        <h2 className="title">Warden Login</h2>
        <p className="subtitle">Hostel Management Console</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-danger">Login to Console</button>
        </form>
        
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span style={{ cursor: 'pointer', color: 'gray' }} onClick={() => navigate('/admin/register')}>
            Register New Warden
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
