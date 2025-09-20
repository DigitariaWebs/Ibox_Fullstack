import mongoose from 'mongoose';
import User from './src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox';

async function resetLoginAttempts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'test2@test.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.email);
    console.log('🔒 Current login attempts:', user.loginAttempts);

    // Reset login attempts
    user.loginAttempts = {
      count: 0,
      lastAttempt: null,
      blockedUntil: undefined
    };

    await user.save();
    console.log('✅ Login attempts reset successfully');
    console.log('🔓 New login attempts:', user.loginAttempts);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

resetLoginAttempts();

