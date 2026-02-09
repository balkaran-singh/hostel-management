import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerStudent } from '../../api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    hostelName: 'A', // Default to A
    roomNumber: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerStudent(formData);
      alert('Registration Successful! Please Login.');
      navigate('/student/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration Failed');
    }
  };

  return (
    <div className="flex-center">
      <div className="card" style={{ width: '400px' }}>
        <h2 className="title">Student Registration</h2>
        <p className="subtitle">Join the hostel community.</p>
        
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" onChange={handleChange} required id="reg-name" />
          </div>
          
          <div className="form-group">
            <label>Roll Number</label>
            <input name="rollNumber" onChange={handleChange} required id="reg-roll" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} required id="reg-email" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} required id="reg-pass" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Hostel Block</label>
              <select name="hostelName" onChange={handleChange} id="reg-hostel">
                <option value="A">Hostel A</option>
                <option value="B">Hostel B</option>
                <option value="C">Hostel C</option>
                <option value="D">Hostel D</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Room No.</label>
              <input type="number" name="roomNumber" onChange={handleChange} required id="reg-room" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" id="reg-btn">Register</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/student/login')}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default StudentRegister;
