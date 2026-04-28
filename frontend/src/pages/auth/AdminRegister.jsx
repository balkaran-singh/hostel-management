import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'; // Added FaArrowLeft
import { registerAdmin } from '../../api';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hostelManaged: 'A',
    secretKey: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError('');
  };

  // --- STRICT VALIDATION (Experiment-5) ---
  const validateForm = () => {
    const { name, password } = formData;

    if (name.length < 3 || name.length > 30) {
      return "Name must be between 3 and 30 characters.";
    }

    // Password Rules: 8-15 chars, Upper, Lower, Digit, Special, No Spaces
    if (password.length < 8 || password.length > 15) return "Password must be 8-15 characters.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one digit.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one Upper Case letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one Lower Case letter.";
    if (!/[!@#$%&*()\-+=^]/.test(password)) return "Password must contain at least one special character.";
    if (/\s/.test(password)) return "Password must not contain white spaces.";

    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await registerAdmin(formData);
      alert('Admin Account Created! Please Login.');
      navigate('/admin/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration Failed');
    }
  };

  return (
    <div id="admin-register-page-container" className="flex-center">
      <div id="admin-register-card-container" className="card auth-card" style={{ width: '420px', position: 'relative' }}>
        
        {/* --- NAVIGATION: BACK TO HOME --- */}
        <div 
          id="admin-register-back-home-btn"
          onClick={() => navigate('/')} 
          style={{ 
            position: 'absolute', top: '1rem', left: '1rem', 
            cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' 
          }}
        >
          <FaArrowLeft /> Back to Home
        </div>

        <h2 className="title" style={{ marginTop: '1.5rem' }}>Administrator Registration</h2>
        <p className="subtitle">Administrative Access Registration Portal</p>
        
        {error && <div id="admin-register-error-container" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form id="admin-register-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input id="admin-register-full-name-input" className="auth-input" name="name" onChange={handleChange} placeholder="Minimum 3 characters" required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input id="admin-register-email-input" className="auth-input" type="email" name="email" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div id="admin-register-password-container" style={{ position: 'relative' }}>
              <input 
                id="admin-register-password-input"
                className="auth-input"
                type={showPassword ? "text" : "password"} 
                name="password" 
                onChange={handleChange} 
                placeholder="8-15 characters"
                required 
                style={{ paddingRight: '40px' }}
              />
              <span 
                id="admin-register-password-visibility-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280' }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <small style={{ fontSize: '0.7rem', color: '#666' }}>1 Upper, 1 Lower, 1 Digit, 1 Special Char.</small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              id="admin-register-confirm-password-input"
              className="auth-input"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          <div className="form-group">
            <label>Assign Hostel Block</label>
            <select id="admin-register-hostel-block-select" className="auth-input" name="hostelManaged" onChange={handleChange}>
              <option value="A">Hostel A</option>
              <option value="B">Hostel B</option>
              <option value="C">Hostel C</option>
              <option value="D">Hostel D</option>
            </select>
          </div>

          <div className="form-group">
            <label>Administrative Authorization Key</label>
            <div id="admin-register-secret-key-container" style={{ position: 'relative' }}>
              <input 
                id="admin-register-secret-key-input"
                className="auth-input"
                name="secretKey" 
                type={showSecret ? "text" : "password"} 
                placeholder="Enter authorization key" 
                onChange={handleChange} 
                required 
                style={{ paddingRight: '40px' }}
              />
              <span 
                id="admin-register-secret-key-visibility-toggle-btn"
                onClick={() => setShowSecret(!showSecret)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280' }}
              >
                {showSecret ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button id="admin-register-submit-btn" type="submit" className="btn btn-primary">Register Administrator</button>
        </form>

        {/* --- NAVIGATION: SWITCH TO LOGIN --- */}
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <span id="admin-register-proceed-login-link" style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/admin/login')}>Proceed to Login</span>
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
