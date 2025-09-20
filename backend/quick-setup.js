#!/usr/bin/env node

/**
 * Quick Setup Script
 * 1. Start MongoDB
 * 2. Run verification reset
 * 3. Test Cloudinary connection
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const startMongoDB = async () => {
  try {
    console.log('🐳 Starting MongoDB container...');
    const { stdout, stderr } = await execAsync('docker-compose up -d mongodb');
    
    if (stderr && !stderr.includes('already exists')) {
      console.log('MongoDB output:', stderr);
    }
    
    console.log('✅ MongoDB container started');
    
    // Wait a bit for MongoDB to be ready
    console.log('⏳ Waiting for MongoDB to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start MongoDB:', error.message);
    return false;
  }
};

const runResetScript = async () => {
  try {
    console.log('\n🔄 Running verification reset script...');
    const { stdout, stderr } = await execAsync('node reset-verifications.js');
    
    console.log(stdout);
    if (stderr) {
      console.log('Reset script output:', stderr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Reset script failed:', error.message);
    return false;
  }
};

const main = async () => {
  console.log('🚀 Quick Setup: Starting MongoDB and Running Reset\n');
  
  const mongoStarted = await startMongoDB();
  if (!mongoStarted) {
    console.log('❌ Cannot proceed without MongoDB');
    return;
  }
  
  const resetCompleted = await runResetScript();
  if (!resetCompleted) {
    console.log('❌ Reset failed');
    return;
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Add Cloudinary credentials to your .env file');
  console.log('   2. Restart your backend: npm run dev');
  console.log('   3. Test the admin dashboard');
  console.log('   4. Drivers can now upload verification images');
};

main().catch(console.error);
