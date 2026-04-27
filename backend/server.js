require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Student = require('./models/Student');

const app = express();
app.use(cors());
app.use(express.json());

const cleanLegacyStudentIndexes = async () => {
  const indexes = await Student.collection.indexes();
  const allowedUniqueIndexNames = new Set(['_id_', 'email_1']);

  for (const index of indexes) {
    if (index.unique !== true) continue;
    if (allowedUniqueIndexNames.has(index.name)) continue;

    // Keep startup resilient even if one drop fails.
    try {
      await Student.collection.dropIndex(index.name);
      console.log(`Dropped legacy unique index: ${index.name}`);
    } catch (error) {
      console.log(`Failed to drop legacy unique index ${index.name}:`, error.message);
    }
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("---MongoDB Connected---");
    await cleanLegacyStudentIndexes();
  })
  .catch(err => console.log(err));

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
