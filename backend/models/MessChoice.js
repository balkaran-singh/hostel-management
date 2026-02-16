const mongoose = require('mongoose');

const MessChoiceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: String,
  hostelName: String,
  date: { type: String, required: true }, // Format: "YYYY-MM-DD"
  
  // The 3 Meals (Default is "Not Eating" if they don't vote)
  breakfast: { type: String, default: 'Not Eating' }, 
  lunch: { type: String, default: 'Not Eating' },
  dinner: { type: String, default: 'Not Eating' }
});

// Ensure a student only has one document per day
MessChoiceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MessChoice', MessChoiceSchema);
