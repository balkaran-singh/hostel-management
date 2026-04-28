const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Admin = require('../models/Admin');

router.post('/student/register', async (req, res) => {
  // --- DEBUG LOG START ---
  console.log("REGISTER REQUEST RECEIVED!");
  console.log("Data:", req.body);
  // --- DEBUG LOG END ---

  try {
    const { rollNumber } = req.body;
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ error: 'A student with this roll number is already registered.' });
    }

    const newStudent = new Student(req.body);
    await newStudent.save();
    console.log("Student Saved to DB");
    res.status(201).json({ message: 'Student registered successfully!' });
  } catch (err) {
    console.log("Error Saving Student:", err.message);
    
    // Check for duplicate key error (MongoDB code 11000)
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
      const duplicateValue = err.keyValue?.[duplicateField];
      const allowedUniqueFields = new Set(['email', 'rollNumber']);

      if (duplicateField === 'email') {
        return res.status(400).json({ error: 'Email already taken!' });
      }

      if (duplicateField === 'rollNumber') {
        return res.status(400).json({ error: 'Roll Number already registered!' });
      }
      
      if (!allowedUniqueFields.has(duplicateField)) {
        return res.status(500).json({
          error: `Index misconfiguration detected on '${duplicateField}'. Please restart server and try again.`
        });
      }

      return res.status(400).json({
        error: `Duplicate value for ${duplicateField || 'a unique field'}${
          duplicateValue !== undefined ? `: ${duplicateValue}` : ''
        }`
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/register', async (req, res) => {
  const { secretKey, ...data } = req.body;

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
