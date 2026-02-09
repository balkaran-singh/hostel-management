import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import Icons
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
  
  // Separate toggles for Password and Secret Key
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- STRICT VALIDATION ---
  const validateForm = () => {
    const { name, password } = formData;

    if (name.length < 3 || name.length > 30) {
      return "Name must be between 3 and 30 characters.";
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 5 || !hasLetter || !hasNumber) {
      return "Password must be 5+ chars and contain BOTH letters & numbers.";
    }

    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
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
    <div className="flex-center">
      <div className="card" style={{ width: '400px', borderTop: '4px solid var(--danger)' }}>
        <h2 className="title">Warden Registration</h2>
        <p className="subtitle">Authorized Personnel Only</p>
        
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" onChange={handleChange} placeholder="Min 3 chars" required />
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
                placeholder="Letters + Numbers (Min 5)"
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
            <label style={{ color: 'red' }}>Secret Warden Key (WARDEN_2026 FOR TESTING) </label>
            <div style={{ position: 'relative' }}>
              <input 
                name="secretKey" 
                type={showSecret ? "text" : "password"} // Uses separate state
                placeholder="Enter Access Code" 
                onChange={handleChange} 
                required 
                style={{ paddingRight: '40px' }}
              />
              <span 
                onClick={() => setShowSecret(!showSecret)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280'
                }}
              >
                {showSecret ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-danger">Register as Warden</button>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
