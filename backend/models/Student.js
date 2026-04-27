const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rollNumber: { type: String, required: true },
  hostelName: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  roommateStatus: {
    type: String,
    enum: ['Unassigned', 'Paired', 'Allotted'],
    default: 'Unassigned'
  },
  requiresAiMatch: { type: Boolean, default: false },
  pairedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  allocatedRoom: { type: String, default: null },
  surveyData: {
    sleep: { type: Number, enum: [1, 5, 10] },
    cleanliness: { type: Number, enum: [1, 5, 10] },
    noise: { type: Number, enum: [1, 5, 10] }
  },
  pendingInvitations: { type: [String], default: [] }
});

module.exports = mongoose.model('Student', studentSchema);
