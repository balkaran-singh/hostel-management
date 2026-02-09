const mongoose = require('mongoose');

const messSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  hostelName: String,
  date: { type: Date, default: Date.now },
  choice: { type: String, enum: ['Eating', 'Not Eating'] }
});

module.exports = mongoose.model('MessResponse', messSchema);
