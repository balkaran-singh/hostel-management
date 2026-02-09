const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rollNumber: { type: String, required: true },
  hostelName: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  roomNumber: { type: Number, required: true }
});

// Compound Index: Ensures Room 101 in Hostel A is unique
studentSchema.index({ hostelName: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
