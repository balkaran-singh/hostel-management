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
    <div className="flex-center">
      <div className="card" style={{ width: '400px', borderTop: '4px solid var(--danger)', position: 'relative' }}>
        
        {/* --- BACK TO HOME --- */}
        <div 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '1rem', left: '1rem', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          <FaArrowLeft /> Home
        </div>

        <h2 className="title" style={{ marginTop: '1.5rem' }}>Warden Login</h2>
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
        
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New Warden? <span style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold' }} onClick={() => navigate('/admin/register')}>Register here</span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
