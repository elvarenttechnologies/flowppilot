const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>')) {
    console.error('\n MONGODB_URI is missing or still has placeholder values.');
    console.error('   Open backend/.env and paste your real MongoDB Atlas connection string.\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
