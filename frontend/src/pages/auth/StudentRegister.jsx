import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'; 
import { registerStudent } from '../../api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    hostelName: 'A',
    requiresAiMatch: false,
    surveyData: {
      sleep: 5,
      cleanliness: 5,
      noise: 5
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSurveyChange = (e) => {
    setFormData({
      ...formData,
      surveyData: {
        ...formData.surveyData,
        [e.target.name]: Number(e.target.value)
      }
    });
    setError('');
  };

  const handlePreferenceChange = (requiresAiMatch) => {
    setFormData({ ...formData, requiresAiMatch });
    setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError('');
  };

  // --- STRICT VALIDATION ---
  const validateForm = () => {
    const { name, password, rollNumber } = formData;

    if (name.length < 3 || name.length > 30) return "Name must be between 3 and 30 characters.";

    // Password Rules
    if (password.length < 8 || password.length > 15) return "Password must be 8-15 characters.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one digit.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one Upper Case letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one Lower Case letter.";
    if (!/[!@#$%&*()\-+=^]/.test(password)) return "Password must contain at least one special character.";
    if (/\s/.test(password)) return "Password must not contain white spaces.";

    if (rollNumber.length < 9 || isNaN(rollNumber)) return "Roll Number must be at least 9 digits.";

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
      const payload = formData.requiresAiMatch
        ? {
            ...formData,
            surveyData: {
              sleep: Number(formData.surveyData.sleep),
              cleanliness: Number(formData.surveyData.cleanliness),
              noise: Number(formData.surveyData.noise)
            }
          }
        : {
            ...formData,
            surveyData: undefined
          };

      await registerStudent(payload);
      alert('Registration Successful! Please Login.');
      navigate('/student/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration Failed');
    }
  };

  return (
    <div id="student-register-page-container" className="flex-center">
      <div id="student-register-card-container" className="card auth-card" style={{ width: '420px', position: 'relative' }}>
        
        {/* --- BACK TO HOME --- */}
        <div 
          id="student-register-back-home-btn"
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '1rem', left: '1rem', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          <FaArrowLeft /> Back to Home
        </div>

        <h2 className="title" style={{ marginTop: '1.5rem' }}>Student Registration</h2>
        <p className="subtitle">New Student Registration Portal</p>
        
        {error && <div id="student-register-error-container" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form id="student-register-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="auth-input" id="student-register-full-name-input" name="name" onChange={handleChange} placeholder="Minimum 3 characters" required />
          </div>
          
          <div className="form-group">
            <label>Roll Number</label>
            <input className="auth-input" id="student-register-roll-number-input" name="rollNumber" type="number" onChange={handleChange} placeholder="Example: 102300123" required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="auth-input" id="student-register-email-input" type="email" name="email" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div id="student-register-password-container" style={{ position: 'relative' }}>
              <input 
                className="auth-input"
                id="student-register-password-input"
                type={showPassword ? "text" : "password"} 
                name="password" 
                onChange={handleChange} 
                placeholder="8-15 characters"
                required 
                style={{ paddingRight: '40px' }}
              />
              <span 
                id="student-register-password-visibility-toggle-btn"
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
              className="auth-input"
              id="student-register-confirm-password-input"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          <div className="form-group">
            <label>Hostel Block</label>
            <select className="auth-input" id="student-register-hostel-block-select" name="hostelName" onChange={handleChange}>
              <option value="A">Hostel A</option>
              <option value="B">Hostel B</option>
              <option value="C">Hostel C</option>
              <option value="D">Hostel D</option>
            </select>
          </div>

          <div className="form-group">
            <label>Roommate Preference</label>
            <div id="student-register-roommate-preference-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                <input
                  id="student-register-roommate-specific-radio"
                  type="radio"
                  name="roommate-preference"
                  checked={!formData.requiresAiMatch}
                  onChange={() => handlePreferenceChange(false)}
                />
                I intend to request a specific roommate
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                <input
                  id="student-register-roommate-ai-match-radio"
                  type="radio"
                  name="roommate-preference"
                  checked={formData.requiresAiMatch}
                  onChange={() => handlePreferenceChange(true)}
                />
                Request compatibility-based roommate matching
              </label>
            </div>
          </div>

          {formData.requiresAiMatch && (
            <>
              <div className="form-group">
                <label>Sleep Preference</label>
                <select
                  className="auth-input"
                  id="student-register-sleep-preference-select"
                  name="sleep"
                  value={formData.surveyData.sleep}
                  onChange={handleSurveyChange}
                >
                  <option value={1}>Early Bird</option>
                  <option value={5}>Normal Sleep Time (Between 10PM-8AM)</option>
                  <option value={10}>Night Owl</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cleanliness Preference</label>
                <select
                  className="auth-input"
                  id="student-register-cleanliness-preference-select"
                  name="cleanliness"
                  value={formData.surveyData.cleanliness}
                  onChange={handleSurveyChange}
                >
                  <option value={1}>Relaxed/Messy</option>
                  <option value={5}>Average</option>
                  <option value={10}>Neat Freak</option>
                </select>
              </div>

              <div className="form-group">
                <label>Noise Preference</label>
                <select
                  className="auth-input"
                  id="student-register-noise-preference-select"
                  name="noise"
                  value={formData.surveyData.noise}
                  onChange={handleSurveyChange}
                >
                  <option value={1}>Quiet/Headphones</option>
                  <option value={5}>Moderate</option>
                  <option value={10}>Loud/Music</option>
                </select>
              </div>
            </>
          )}

          <button id="student-register-submit-btn" type="submit" className="btn btn-primary">Register</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <span id="student-register-proceed-login-link" style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/student/login')}>Proceed to Login</span>
        </p>
      </div>
    </div>
  );
};

export default StudentRegister;
