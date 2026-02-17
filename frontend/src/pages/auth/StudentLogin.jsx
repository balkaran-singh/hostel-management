import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { loginStudent } from '../../api';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await loginStudent({ email, password });
      if (data.success) {
        localStorage.setItem('student', JSON.stringify(data.data));
        navigate('/student/dashboard');
      }
    } catch (err) {
      alert('Invalid Credentials');
    }
  };

  return (
    <div className="flex-center">
      <div className="card" style={{ width: '400px', position: 'relative' }}>
        
        {/* --- BACK TO HOME --- */}
        <div 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '1rem', left: '1rem', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          <FaArrowLeft /> Home
        </div>

        <h2 className="title" style={{ marginTop: '1.5rem' }}>Student Login</h2>
        <p className="subtitle">Welcome back to HostelSync</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              id="student-email" // Added ID for Selenium
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              id="student-password" // Added ID for Selenium
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button id="student-login-btn" type="submit" className="btn btn-primary">Login</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New Student? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/student/register')}>Register here</span>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
