const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const MessResponse = require('../models/MessResponse');
const Student = require('../models/Student');

// --- STUDENT ACTIONS ---
router.post('/complaint', async (req, res) => {
  try {
    const newComplaint = new Complaint(req.body);
    await newComplaint.save();
    res.json({ message: 'Complaint Filed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-complaints/:id', async (req, res) => {
  const complaints = await Complaint.find({ studentId: req.params.id }).sort({ date: -1 });
  res.json(complaints);
});

router.post('/mess-choice', async (req, res) => {
  try {
    const choice = new MessResponse(req.body);
    await choice.save();
    res.json({ message: 'Preference Saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ADMIN ACTIONS ---
router.get('/hostel-complaints/:hostel', async (req, res) => {
  // Only fetch complaints for the Admin's hostel
  const complaints = await Complaint.find({ hostelName: req.params.hostel }).sort({ date: -1 });
  res.json(complaints);
});

router.put('/resolve-complaint/:id', async (req, res) => {
  await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
  res.json({ success: true });
});

router.get('/dashboard-stats/:hostel', async (req, res) => {
  const { hostel } = req.params;
  
  // 1. Total Students in this Hostel
  const totalStudents = await Student.countDocuments({ hostelName: hostel });
  
  // 2. Pending Complaints in this Hostel
  const pendingComplaints = await Complaint.countDocuments({ hostelName: hostel, status: 'Pending' });

  // 3. Today's Mess Stats (AI Data)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const eating = await MessResponse.countDocuments({ 
    hostelName: hostel, 
    date: { $gte: today }, 
    choice: 'Eating' 
  });
  
  const notEating = await MessResponse.countDocuments({ 
    hostelName: hostel, 
    date: { $gte: today }, 
    choice: 'Not Eating' 
  });

  res.json({ totalStudents, pendingComplaints, messStats: { eating, notEating } });
});

// --- STUDENT SEARCH (Added for Admin Dashboard) ---
router.get('/student-search', async (req, res) => {
  const { room, hostel } = req.query;
  try {
    const student = await Student.findOne({ roomNumber: room, hostelName: hostel });
    if (student) {
      res.json(student);
    } else {
      res.json({ notFound: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
