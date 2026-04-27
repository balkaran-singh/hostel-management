const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  hostelName: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  dateOut: { type: Date, required: true },
  dateIn: { type: Date, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
});

module.exports = mongoose.model('GatePass', gatePassSchema);
