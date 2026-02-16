const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const MessChoice = require('../models/MessChoice');
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

// --- 1. GET MESS CHOICES FOR TODAY ---
router.get('/mess-choices/:studentId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let choice = await MessChoice.findOne({ studentId: req.params.studentId, date: today });
    
    // If no choice exists yet, return defaults
    if (!choice) {
      return res.json({ breakfast: 'Not Eating', lunch: 'Not Eating', dinner: 'Not Eating' });
    }
    res.json(choice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. SUBMIT MESS CHOICE (Handles Updates too) ---
router.post('/mess-choice', async (req, res) => {
  const { studentId, studentName, hostelName, mealType, choice } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Find today's record, or create it if it doesn't exist
    let record = await MessChoice.findOne({ studentId, date: today });

    if (!record) {
      record = new MessChoice({
        studentId,
        studentName,
        hostelName,
        date: today
      });
    }

    // Update the specific meal (breakfast, lunch, or dinner)
    if (mealType === 'Breakfast') record.breakfast = choice;
    if (mealType === 'Lunch') record.lunch = choice;
    if (mealType === 'Dinner') record.dinner = choice;

    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save choice' });
  }
});

// --- 3. GET DASHBOARD STATS (UPDATED FOR 3 MEALS) ---
router.get('/dashboard-stats/:hostel', async (req, res) => {
  const { hostel } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Total Students in this Hostel
    const totalStudents = await Student.countDocuments({ hostelName: hostel });

    // 2. Pending Complaints
    const pendingComplaints = await Complaint.countDocuments({ hostelName: hostel, status: 'Pending' });

    // 3. Mess Stats (The Hard Part: Aggregating 3 columns)
    const stats = await MessChoice.aggregate([
      { $match: { hostelName: hostel, date: today } },
      {
        $group: {
          _id: null,
          breakfastEating: { $sum: { $cond: [{ $eq: ["$breakfast", "Eating"] }, 1, 0] } },
          lunchEating: { $sum: { $cond: [{ $eq: ["$lunch", "Eating"] }, 1, 0] } },
          dinnerEating: { $sum: { $cond: [{ $eq: ["$dinner", "Eating"] }, 1, 0] } }
        }
      }
    ]);

    const messData = stats[0] || { breakfastEating: 0, lunchEating: 0, dinnerEating: 0 };

    res.json({
      totalStudents,
      pendingComplaints,
      messStats: messData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
