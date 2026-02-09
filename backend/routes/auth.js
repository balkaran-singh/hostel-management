const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// ==========================================
// 1. STUDENT REGISTER (NO SECRET KEY NEEDED)
// ==========================================
router.post('/student/register', async (req, res) => {
  // --- DEBUG LOG START ---
  console.log("🔔 REGISTER REQUEST RECEIVED!");
  console.log("Data:", req.body);
  // --- DEBUG LOG END ---

  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    console.log("✅ Student Saved to DB");
    res.status(201).json({ message: 'Student registered successfully!' });
  } catch (err) {
    console.log("❌ Error Saving Student:", err.message);
    
    // Check for duplicate key error (MongoDB code 11000)
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or Room already taken!' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ADMIN REGISTER (HAS SECRET KEY CHECK)
// ==========================================
router.post('/admin/register', async (req, res) => {
  const { secretKey, ...data } = req.body;

  // This is the ONLY place a 403 should happen
  if (secretKey !== 'WARDEN_2026') { 
    return res.status(403).json({ error: 'Invalid Secret Key!' });
  }

  try {
    const newAdmin = new Admin(data);
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully!' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists!' });
  }
});

// ==========================================
// 3. LOGINS
// ==========================================
router.post('/student/login', async (req, res) => {
  const { email, password } = req.body;
  const student = await Student.findOne({ email, password });
  if (student) res.json({ success: true, role: 'student', data: student });
  else res.status(401).json({ error: 'Invalid Credentials' });
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email, password });
  if (admin) res.json({ success: true, role: 'admin', data: admin });
  else res.status(401).json({ error: 'Invalid Admin Credentials' });
});

module.exports = router;
