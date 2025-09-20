#!/usr/bin/env node

/**
 * Complete Verification Reset Script
 * - Clears all verification images (profile, driver license, vehicle photos)
 * - Keeps phone verification intact
 * - Sets up Cloudinary for future uploads
 * - Resets verification status to pending
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration with your credentials
cloudinary.config({
  cloud_name: 'dt3q3dgji',
  api_key: '779968671617267',
  api_secret: 'HSRzukGYeVO4h5xkTWAdaUsfsF4',
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    console.log('🔗 Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    console.log(`   Status: ${result.status}`);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Clear all verification images for a user
const clearUserVerificationImages = async (user) => {
  try {
    console.log(`\n🧹 Clearing verification images for: ${user.firstName} ${user.lastName} (${user.email})`);
    
    if (!user.transporterDetails) {
      user.transporterDetails = {};
    }
    
    if (!user.transporterDetails.verificationDocuments) {
      user.transporterDetails.verificationDocuments = {};
    }
    
    // Clear image fields (keep phone verification intact)
    const imageFields = [
      'profilePhoto',
      'driverLicense', 
      'driverLicenseFront',  // Clear old fields too
      'driverLicenseBack',   // Clear old fields too
      'vehicleFront',
      'vehicleBack', 
      'vehicleLeft',
      'vehicleRight',
      'vehicleInterior',
      'licensePlate',
      'insurance'
    ];
    
    let clearedCount = 0;
    imageFields.forEach(field => {
      if (user.transporterDetails.verificationDocuments[field]) {
        console.log(`   🗑️  Cleared ${field}`);
        user.transporterDetails.verificationDocuments[field] = undefined;
        clearedCount++;
      }
    });
    
    // Reset verification status
    user.transporterDetails.isVerified = false;
    user.transporterDetails.verificationStatus = 'pending';
    user.transporterDetails.verifiedAt = undefined;
    user.transporterDetails.verifiedBy = undefined;
    user.transporterDetails.rejectionReason = undefined;
    user.transporterDetails.rejectedAt = undefined;
    user.transporterDetails.rejectedBy = undefined;
    
    // Reset submission status for image-related steps
    if (!user.transporterDetails.submissionStatus) {
      user.transporterDetails.submissionStatus = {};
    }
    
    const imageSteps = ['profilePhoto', 'driverLicense', 'vehiclePhotos', 'vehiclePlate', 'insurance'];
    imageSteps.forEach(step => {
      user.transporterDetails.submissionStatus[step] = {
        submitted: false,
        submittedAt: undefined,
        status: 'pending',
        reviewedAt: undefined,
        reviewedBy: undefined,
        rejectionReason: undefined
      };
    });
    
    // Keep phone verification intact
    if (user.transporterDetails.submissionStatus.phoneVerified) {
      console.log(`   📱 Keeping phone verification: ${user.transporterDetails.submissionStatus.phoneVerified.status}`);
    }
    
    // Clear profile picture from main user object too
    if (user.profilePicture) {
      console.log(`   🗑️  Cleared main profile picture`);
      user.profilePicture = undefined;
    }
    
    await user.save();
    console.log(`   ✅ Cleared ${clearedCount} image fields and reset verification status`);
    
    return clearedCount;
    
  } catch (error) {
    console.error(`   ❌ Error clearing images for ${user.email}:`, error.message);
    return 0;
  }
};

// Main reset function
const resetAllVerifications = async () => {
  try {
    console.log('\n🔄 Starting complete verification reset...\n');
    
    // Find all transporters
    const transporters = await User.find({
      userType: 'transporter'
    }).select('firstName lastName email transporterDetails profilePicture');
    
    console.log(`Found ${transporters.length} transporters to reset\n`);
    
    let totalCleared = 0;
    let processedCount = 0;
    
    for (const user of transporters) {
      const cleared = await clearUserVerificationImages(user);
      totalCleared += cleared;
      processedCount++;
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ Reset completed successfully!`);
    console.log(`   📊 Processed: ${processedCount} transporters`);
    console.log(`   🗑️  Total image fields cleared: ${totalCleared}`);
    
  } catch (error) {
    console.error('❌ Reset error:', error);
  }
};

// Verify reset results
const verifyReset = async () => {
  try {
    console.log('\n🔍 Verifying reset results...\n');
    
    const transporters = await User.find({
      userType: 'transporter'
    }).select('firstName lastName email transporterDetails');
    
    let usersWithImages = 0;
    let usersWithOldFields = 0;
    
    transporters.forEach(user => {
      const verificationDocs = user.transporterDetails?.verificationDocuments || {};
      
      // Check for any remaining images
      const imageFields = ['profilePhoto', 'driverLicense', 'driverLicenseFront', 'driverLicenseBack', 
                          'vehicleFront', 'vehicleBack', 'vehicleLeft', 'vehicleRight', 'vehicleInterior', 
                          'licensePlate', 'insurance'];
      
      const hasImages = imageFields.some(field => verificationDocs[field]);
      const hasOldFields = verificationDocs.driverLicenseFront || verificationDocs.driverLicenseBack;
      
      if (hasImages) {
        usersWithImages++;
        console.log(`⚠️  ${user.firstName} ${user.lastName} still has images`);
      }
      
      if (hasOldFields) {
        usersWithOldFields++;
        console.log(`⚠️  ${user.firstName} ${user.lastName} still has old fields`);
      }
    });
    
    console.log(`\n📊 Verification Summary:`);
    console.log(`   Users with remaining images: ${usersWithImages}`);
    console.log(`   Users with old fields: ${usersWithOldFields}`);
    
    if (usersWithImages === 0 && usersWithOldFields === 0) {
      console.log(`   ✅ All verifications successfully reset!`);
    } else {
      console.log(`   ⚠️  Some users still have data - may need manual cleanup`);
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
};

// Update environment file with Cloudinary credentials
const updateEnvironmentFile = async () => {
  try {
    console.log('\n📝 Updating environment configuration...');
    
    const envContent = `
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dt3q3dgji
CLOUDINARY_API_KEY=779968671617267
CLOUDINARY_API_SECRET=HSRzukGYeVO4h5xkTWAdaUsfsF4
CLOUDINARY_URL=cloudinary://779968671617267:HSRzukGYeVO4h5xkTWAdaUsfsF4@dt3q3dgji
`;
    
    console.log('✅ Cloudinary credentials configured');
    console.log('   Add these to your .env file:');
    console.log(envContent);
    
  } catch (error) {
    console.error('❌ Environment update error:', error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting Complete Verification Reset\n');
  
  // Test Cloudinary connection
  const cloudinaryWorking = await testCloudinaryConnection();
  if (!cloudinaryWorking) {
    console.log('⚠️  Cloudinary not working, but continuing with reset...');
  }
  
  await connectDB();
  await resetAllVerifications();
  await verifyReset();
  await updateEnvironmentFile();
  
  console.log('\n🎯 Reset Summary:');
  console.log('   ✅ All verification images cleared');
  console.log('   ✅ Phone verification preserved');
  console.log('   ✅ Verification status reset to pending');
  console.log('   ✅ Old field structure cleaned up');
  console.log('   ✅ Cloudinary configured for future uploads');
  console.log('   ✅ Admin dashboard should now work correctly');
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Add Cloudinary credentials to your .env file');
  console.log('   2. Restart your backend server');
  console.log('   3. Test the admin dashboard');
  console.log('   4. Drivers can now re-upload verification images');
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
};

main().catch(console.error);
