const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  hostelName: String, // Copied from student for admin filtering
  roomNumber: Number,
  type: { type: String, enum: ['Electricity', 'Plumbing', 'Mess', 'Internet', 'Other'] },
  description: String,
  status: { type: String, default: 'Pending', enum: ['Pending', 'Resolved'] },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
