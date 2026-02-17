const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Complaint = require('../models/Complaint');
// CRITICAL: Import the NEW Model
const MessChoice = require('../models/MessChoice'); 

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

// --- 2. SUBMIT MESS CHOICE (The Logic that was broken) ---
router.post('/mess-choice', async (req, res) => {
  console.log("🔔 VOTE REQUEST RECEIVED:", req.body); // Debug Log

  const { studentId, studentName, hostelName, mealType, choice } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if a record exists for TODAY
    let record = await MessChoice.findOne({ studentId, date: today });

    if (!record) {
      console.log("Creating NEW Record...");
      record = new MessChoice({
        studentId,
        studentName,
        hostelName,
        date: today,
        // Default values are handled by the Model Schema
      });
    }

    // Update the specific meal based on the button clicked
    if (mealType === 'Breakfast') record.breakfast = choice;
    if (mealType === 'Lunch') record.lunch = choice;
    if (mealType === 'Dinner') record.dinner = choice;

    const savedDoc = await record.save();
    console.log("✅ Saved to messchoices collection:", savedDoc);
    
    res.json({ success: true, data: record });
  } catch (err) {
    console.error("❌ SAVE FAILED:", err);
    res.status(500).json({ error: 'Failed to save choice' });
  }
});

// --- 3. GET DASHBOARD STATS (For Admin) ---
router.get('/dashboard-stats/:hostel', async (req, res) => {
  const { hostel } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    const totalStudents = await Student.countDocuments({ hostelName: hostel });
    const pendingComplaints = await Complaint.countDocuments({ hostelName: hostel, status: 'Pending' });

    // Aggregation on the NEW collection
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

    const messData = stats.length > 0 ? stats[0] : { breakfastEating: 0, lunchEating: 0, dinnerEating: 0 };

    res.json({
      totalStudents: totalStudents || 0,
      pendingComplaints: pendingComplaints || 0,
      messStats: {
        breakfastEating: messData.breakfastEating || 0,
        lunchEating: messData.lunchEating || 0,
        dinnerEating: messData.dinnerEating || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. HOSTEL COMPLAINTS ---
router.get('/hostel-complaints/:hostel', async (req, res) => {
  try {
    const complaints = await Complaint.find({ hostelName: req.params.hostel }).sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. MY COMPLAINTS ---
router.get('/my-complaints/:id', async (req, res) => {
  try {
    const complaints = await Complaint.find({ studentId: req.params.id }).sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. FILE COMPLAINT ---
router.post('/complaint', async (req, res) => {
  try {
    const newComplaint = new Complaint({ ...req.body, status: 'Pending', date: new Date() });
    await newComplaint.save();
    res.status(201).json(newComplaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to file complaint' });
  }
});

// --- 7. RESOLVE COMPLAINT ---
router.put('/resolve-complaint/:id', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// --- 8. STUDENT SEARCH ---
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
