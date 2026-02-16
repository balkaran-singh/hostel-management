import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { registerStudent } from '../../api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    hostelName: 'A',
    roomNumber: ''
  });
  
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- EXPERIMENT-5 VALIDATION LOGIC ---
  const validateForm = () => {
    const { name, password, rollNumber, roomNumber } = formData;

    // 1. Name
    if (name.length < 3 || name.length > 30) {
      return "Name must be between 3 and 30 characters.";
    }

    // 2. PASSWORD VALIDATION (Strict Experiment-5 Rules)
    // Rule 1: Length 8-15
    if (password.length < 8 || password.length > 15) {
      return "Password must be between 8 and 15 characters.";
    }
    // Rule 2: At least one digit
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one digit (0-9).";
    }
    // Rule 3: At least one upper case
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one Upper Case letter (A-Z).";
    }
    // Rule 4: At least one lower case
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one Lower Case letter (a-z).";
    }
    // Rule 5: At least one special character (!@#$%&*()-+=^)
    if (!/[!@#$%&*()\-+=^]/.test(password)) {
      return "Password must contain at least one special character (!@#$%&*()-+=^).";
    }
    // Rule 6: No white space
    if (/\s/.test(password)) {
      return "Password must not contain any white space.";
    }

    // 3. Roll Number
    if (rollNumber.length < 9 || isNaN(rollNumber)) {
      return "Roll Number must be at least 9 digits.";
    }

    // 4. Room Number
    const room = parseInt(roomNumber);
    if (room < 1 || room > 999) {
      return "Room Number must be between 1 and 999.";
    }

    return null; // Validation Passed
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

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
        
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" onChange={handleChange} placeholder="Min 3 chars" required />
          </div>
          
          <div className="form-group">
            <label>Roll Number</label>
            <input name="rollNumber" type="number" onChange={handleChange} placeholder="e.g. 102300123" required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                onChange={handleChange} 
                placeholder="8-15 chars, Upper, Lower, Digit, Special"
                required 
                style={{ paddingRight: '40px' }} 
              />
              <span 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <small style={{ fontSize: '0.7rem', color: '#666' }}>
              Must have: 1 Upper, 1 Lower, 1 Digit, 1 Special Char.
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Hostel Block</label>
              <select name="hostelName" onChange={handleChange}>
                <option value="A">Hostel A</option>
                <option value="B">Hostel B</option>
                <option value="C">Hostel C</option>
                <option value="D">Hostel D</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Room No.</label>
              <input type="number" name="roomNumber" onChange={handleChange} placeholder="1-999" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Register</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/student/login')}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default StudentRegister;
