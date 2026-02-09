import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        localStorage.setItem('student', JSON.stringify(data.data)); // Save user
        navigate('/student/dashboard');
      }
    } catch (err) {
      alert('Invalid Credentials');
    }
  };

  return (
    <div className="flex-center">
      <div className="card" style={{ width: '400px' }}>
        <h2 className="title">Student Login</h2>
        <p className="subtitle">Welcome back to your hostel.</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              id="student-email" // Selenium ID
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              id="student-password" // Selenium ID
            />
          </div>
          <button type="submit" className="btn btn-primary" id="student-login-btn">Login</button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          New here? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/student/register')}>Register</span>
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
