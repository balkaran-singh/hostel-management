import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAdmin } from '../../api';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hostelManaged: 'A', // Default to A
    secretKey: '' // The Security Check
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerAdmin(formData);
      alert('Admin Account Created! Please Login.');
      navigate('/admin/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration Failed');
    }
  };

  return (
    <div className="flex-center">
      <div className="card" style={{ width: '400px', borderTop: '4px solid var(--danger)' }}>
        <h2 className="title">Warden Registration</h2>
        <p className="subtitle">Authorized Personnel Only</p>
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Assign Hostel Block</label>
            <select name="hostelManaged" onChange={handleChange}>
              <option value="A">Hostel A</option>
              <option value="B">Hostel B</option>
              <option value="C">Hostel C</option>
              <option value="D">Hostel D</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: 'red' }}>Secret Warden Key</label>
            <input 
              name="secretKey" 
              type="password" 
              placeholder="Enter Access Code" 
              onChange={handleChange} 
              required 
            />
            <small style={{ color: '#666' }}>Hint: WARDEN_2026</small>
          </div>

          <button type="submit" className="btn btn-danger">Register as Warden</button>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
