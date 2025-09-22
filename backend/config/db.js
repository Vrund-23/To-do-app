const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGO_URI?.substring(0, 20) + '...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Connection string being used:', process.env.MONGO_URI);
    
    // More specific error messages
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Suggestion: Check if MongoDB is running or if your Atlas connection string is correct');
    }
    if (error.message.includes('authentication failed')) {
      console.error('💡 Suggestion: Check your MongoDB username and password');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;