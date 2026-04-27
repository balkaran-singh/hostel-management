const express = require('express');
const axios = require('axios');
const router = express.Router();
const Student = require('../models/Student');
const Complaint = require('../models/Complaint');
const GatePass = require('../models/GatePass');
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
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const student = await Student.findById(studentId).select('allocatedRoom');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const newComplaint = new Complaint({
      ...req.body,
      allocatedRoom: student.allocatedRoom || null,
      status: 'Pending',
      date: new Date()
    });

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
  const { searchTerm, hostel } = req.query;

  if (!searchTerm || !hostel) {
    return res.status(400).json({ error: 'searchTerm and hostel are required' });
  }

  const trimmedSearchTerm = String(searchTerm).trim();
  const escapedSearchTerm = trimmedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const students = await Student.find({
      hostelName: hostel,
      $or: [
        { name: { $regex: escapedSearchTerm, $options: 'i' } },
        { rollNumber: trimmedSearchTerm },
        { allocatedRoom: trimmedSearchTerm }
      ]
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 9. APPLY GATE PASS ---
router.post('/gatepass/apply', async (req, res) => {
  try {
    const { dateOut, dateIn } = req.body;
    const parsedDateOut = new Date(dateOut);
    const parsedDateIn = new Date(dateIn);

    if (
      Number.isNaN(parsedDateOut.getTime()) ||
      Number.isNaN(parsedDateIn.getTime()) ||
      parsedDateIn <= parsedDateOut
    ) {
      return res.status(400).json({
        error: 'Return date and time must be strictly after the departure date and time.'
      });
    }

    const newGatePass = new GatePass({
      ...req.body,
      dateOut: parsedDateOut,
      dateIn: parsedDateIn
    });
    await newGatePass.save();
    res.status(201).json(newGatePass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 10. GET GATE PASSES FOR A STUDENT ---
router.get('/gatepass/student/:studentId', async (req, res) => {
  try {
    const passes = await GatePass.find({ studentId: req.params.studentId }).sort({ dateOut: -1 });
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 11. GET PENDING GATE PASSES FOR A HOSTEL ---
router.get('/gatepass/hostel/:hostelName', async (req, res) => {
  try {
    const passes = await GatePass.find({
      hostelName: req.params.hostelName,
      status: 'Pending'
    }).sort({ dateOut: 1 });
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 12. UPDATE GATE PASS STATUS ---
router.put('/gatepass/status/:id', async (req, res) => {
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  try {
    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedPass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    res.json(updatedPass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 13. SEND ROOMMATE INVITE ---
router.post('/roommate/invite', async (req, res) => {
  const { senderId, targetRollNumber } = req.body;

  if (!senderId || !targetRollNumber) {
    return res.status(400).json({ error: 'senderId and targetRollNumber are required' });
  }

  try {
    const sender = await Student.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender student not found' });
    }

    const targetStudent = await Student.findOne({ rollNumber: targetRollNumber });
    if (!targetStudent) {
      return res.status(404).json({ error: 'Target student not found' });
    }

    if (targetStudent._id.toString() === sender._id.toString()) {
      return res.status(400).json({ error: 'You cannot invite yourself' });
    }

    if (targetStudent.pendingInvitations.includes(sender.rollNumber)) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    targetStudent.pendingInvitations.push(sender.rollNumber);
    await targetStudent.save();

    res.json({ success: true, message: 'Roommate invitation sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 14. ACCEPT ROOMMATE INVITE ---
router.post('/roommate/accept', async (req, res) => {
  const { studentId, acceptedRollNumber } = req.body;

  if (!studentId || !acceptedRollNumber) {
    return res.status(400).json({ error: 'studentId and acceptedRollNumber are required' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const acceptedStudent = await Student.findOne({ rollNumber: acceptedRollNumber });
    if (!acceptedStudent) {
      return res.status(404).json({ error: 'Accepted student not found' });
    }

    if (!student.pendingInvitations.includes(acceptedRollNumber)) {
      return res.status(400).json({ error: 'No pending invitation from this roll number' });
    }

    student.roommateStatus = 'Paired';
    acceptedStudent.roommateStatus = 'Paired';
    student.pairedWith = acceptedStudent._id;
    acceptedStudent.pairedWith = student._id;

    student.pendingInvitations = student.pendingInvitations.filter(
      (roll) => roll !== acceptedRollNumber
    );

    await student.save();
    await acceptedStudent.save();

    res.json({ success: true, message: 'Roommate pairing confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 15. GET STUDENTS FOR ROOM ALLOTMENT ---
router.get('/admin/room-allotment/:hostelName', async (req, res) => {
  try {
    const students = await Student.find({
      hostelName: req.params.hostelName,
      roommateStatus: { $in: ['Unassigned', 'Paired'] }
    }).select('name email rollNumber hostelName roommateStatus allocatedRoom pairedWith surveyData');

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 16. ALLOT ROOM (SINGLE OR PAIR) ---
router.post('/admin/allot-room', async (req, res) => {
  const { studentId, roommateId, roomNumber } = req.body;

  if (!studentId || !roomNumber) {
    return res.status(400).json({ error: 'studentId and roomNumber are required' });
  }

  try {
    const primaryStudent = await Student.findById(studentId);
    if (!primaryStudent) {
      return res.status(404).json({ error: 'Primary student not found' });
    }

    let roommateStudent = null;

    if (roommateId) {
      roommateStudent = await Student.findById(roommateId);
      if (!roommateStudent) {
        return res.status(404).json({ error: 'Roommate student not found' });
      }
    } else if (primaryStudent.pairedWith) {
      roommateStudent = await Student.findById(primaryStudent.pairedWith);
    }

    const requestedRoomNumber = String(roomNumber);
    const incomingStudents = roommateStudent ? [primaryStudent, roommateStudent] : [primaryStudent];
    const currentOccupants = await Student.countDocuments({ allocatedRoom: requestedRoomNumber });
    const totalFutureCapacity = currentOccupants + incomingStudents.length;

    if (totalFutureCapacity > 2) {
      return res.status(400).json({ error: 'Room capacity exceeded. Maximum 2 students per room.' });
    }

    primaryStudent.allocatedRoom = requestedRoomNumber;
    primaryStudent.roommateStatus = 'Allotted';

    if (roommateStudent) {
      primaryStudent.pairedWith = roommateStudent._id;
      roommateStudent.allocatedRoom = requestedRoomNumber;
      roommateStudent.roommateStatus = 'Allotted';
      roommateStudent.pairedWith = primaryStudent._id;
      roommateStudent.pendingInvitations = [];
      await roommateStudent.save();
    }

    primaryStudent.pendingInvitations = [];
    await primaryStudent.save();

    res.json({
      success: true,
      students: roommateStudent ? [primaryStudent, roommateStudent] : [primaryStudent]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 17. RUN AI ROOMMATE MATCH ---
router.post('/admin/run-ai-match', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  try {
    const hasValidSurveyData = (student) => {
      const survey = student?.surveyData || {};
      return ['sleep', 'cleanliness', 'noise'].every((key) => typeof survey[key] === 'number');
    };

    const targetStudent = await Student.findOne({
      _id: studentId,
      roommateStatus: 'Unassigned'
    });

    if (!targetStudent) {
      return res.status(404).json({ error: 'Unassigned target student not found' });
    }

    if (!hasValidSurveyData(targetStudent)) {
      return res.status(400).json({
        error: 'Target student survey is incomplete. Please ensure sleep, cleanliness, and noise are set.'
      });
    }

    const queueStudents = await Student.find({
      _id: { $ne: studentId },
      roommateStatus: 'Unassigned'
    });

    const eligibleQueueStudents = queueStudents.filter(hasValidSurveyData);
    if (eligibleQueueStudents.length === 0) {
      return res.status(400).json({
        error: 'No eligible students found for AI match. Survey data is incomplete for all candidates.'
      });
    }

    const targetPayload = {
      id: targetStudent._id.toString(),
      sleep: targetStudent.surveyData?.sleep,
      cleanliness: targetStudent.surveyData?.cleanliness,
      noise: targetStudent.surveyData?.noise
    };

    const queuePayload = eligibleQueueStudents.map((student) => ({
      id: student._id.toString(),
      sleep: student.surveyData?.sleep,
      cleanliness: student.surveyData?.cleanliness,
      noise: student.surveyData?.noise
    }));

    const aiServiceUrls = [
      process.env.AI_MATCH_URL,
      'http://127.0.0.1:5050/match',
      'http://127.0.0.1:5000/match'
    ].filter(Boolean);

    let aiResponse = null;
    let lastConnectionError = null;

    for (const aiUrl of aiServiceUrls) {
      try {
        aiResponse = await axios.post(
          aiUrl,
          {
            target_student: targetPayload,
            queue: queuePayload
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        break;
      } catch (err) {
        if (err.response?.data) {
          throw err;
        }

        lastConnectionError = err;
        const retryableConnectionErrors = ['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'];
        if (!retryableConnectionErrors.includes(err.code)) {
          throw err;
        }
      }
    }

    if (!aiResponse) {
      throw lastConnectionError || new Error('Unable to connect to any AI match service URL');
    }

    const rawMatches = Array.isArray(aiResponse.data?.matches) ? aiResponse.data.matches : [];
    const matchedIds = rawMatches.map((match) => String(match.id));

    if (matchedIds.length === 0) {
      return res.json({ matches: [] });
    }

    const matchedStudents = await Student.find({ _id: { $in: matchedIds } })
      .select('name rollNumber')
      .lean();

    const studentById = new Map(
      matchedStudents.map((student) => [String(student._id), student])
    );

    const matches = rawMatches.map((match) => {
      const student = studentById.get(String(match.id));
      return {
        id: String(match.id),
        name: student?.name || 'Unknown',
        rollNumber: student?.rollNumber || 'N/A',
        score: match.compatibility
      };
    });

    res.json({ matches });
  } catch (err) {
    const fallbackDetails = err?.code || err?.message || err?.cause?.message || 'Unknown AI service connection error';
    console.error('AI match route error:', err.response?.data || fallbackDetails);

    if (err.response?.data) {
      const pythonErrorText = err.response.data?.error;
      return res.status(502).json({
        error: pythonErrorText ? `AI service error: ${pythonErrorText}` : 'AI service error',
        details: err.response.data
      });
    }

    res.status(500).json({
      error: `Failed to reach AI service: ${fallbackDetails}. Ensure Flask API is running (python3 app.py) and listening on port 5050.`
    });
  }
});

// --- 18. GET ROOMMATE DETAILS BY STUDENT ID ---
router.get('/roommate/details/:studentId', async (req, res) => {
  try {
    const currentStudent = await Student.findById(req.params.studentId).select('allocatedRoom');

    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!currentStudent.allocatedRoom) {
      return res.status(404).json({ error: 'No allocated room found for student' });
    }

    const roommate = await Student.findOne({
      allocatedRoom: currentStudent.allocatedRoom,
      _id: { $ne: currentStudent._id }
    }).select('name rollNumber email');

    if (!roommate) {
      return res.status(404).json({ error: 'Roommate not found' });
    }

    res.json(roommate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
