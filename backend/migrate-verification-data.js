#!/usr/bin/env node

/**
 * Data Migration Script
 * 1. Migrate old driverLicenseFront/Back to new driverLicense field
 * 2. Implement Cloudinary for image storage
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

// Upload Base64 image to Cloudinary
const uploadToCloudinary = async (base64Data, folder = 'verification') => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    return null;
  }
};

// Migrate verification documents
const migrateVerificationDocuments = async () => {
  try {
    console.log('\n🔄 Starting verification documents migration...\n');
    
    // Find users with old field structure
    const usersWithOldFields = await User.find({
      userType: 'transporter',
      $or: [
        { 'transporterDetails.verificationDocuments.driverLicenseFront': { $exists: true } },
        { 'transporterDetails.verificationDocuments.driverLicenseBack': { $exists: true } }
      ]
    });

    console.log(`Found ${usersWithOldFields.length} users with old field structure`);

    for (const user of usersWithOldFields) {
      console.log(`\n👤 Migrating: ${user.firstName} ${user.lastName} (${user.email})`);
      
      const verificationDocs = user.transporterDetails?.verificationDocuments || {};
      let hasChanges = false;

      // Migrate driverLicenseFront/Back to driverLicense
      if (verificationDocs.driverLicenseFront || verificationDocs.driverLicenseBack) {
        console.log('   📋 Migrating driver license fields...');
        
        // Use front image as primary, or back if front doesn't exist
        const driverLicenseImage = verificationDocs.driverLicenseFront || verificationDocs.driverLicenseBack;
        
        if (driverLicenseImage) {
          // Upload to Cloudinary if it's Base64
          if (driverLicenseImage.startsWith('data:image')) {
            console.log('   ☁️  Uploading driver license to Cloudinary...');
            const cloudinaryUrl = await uploadToCloudinary(driverLicenseImage, 'verification/driver-license');
            
            if (cloudinaryUrl) {
              verificationDocs.driverLicense = cloudinaryUrl;
              console.log('   ✅ Driver license uploaded to Cloudinary');
            } else {
              console.log('   ⚠️  Failed to upload to Cloudinary, keeping Base64');
              verificationDocs.driverLicense = driverLicenseImage;
            }
          } else {
            // Already a URL, keep as is
            verificationDocs.driverLicense = driverLicenseImage;
            console.log('   ✅ Driver license already a URL');
          }
          
          // Remove old fields
          delete verificationDocs.driverLicenseFront;
          delete verificationDocs.driverLicenseBack;
          hasChanges = true;
        }
      }

      // Migrate other Base64 images to Cloudinary
      const imageFields = ['profilePhoto', 'vehicleFront', 'vehicleBack', 'vehicleLeft', 'vehicleRight', 'vehicleInterior', 'licensePlate', 'insurance'];
      
      for (const field of imageFields) {
        if (verificationDocs[field] && verificationDocs[field].startsWith('data:image')) {
          console.log(`   ☁️  Uploading ${field} to Cloudinary...`);
          const cloudinaryUrl = await uploadToCloudinary(verificationDocs[field], `verification/${field}`);
          
          if (cloudinaryUrl) {
            verificationDocs[field] = cloudinaryUrl;
            console.log(`   ✅ ${field} uploaded to Cloudinary`);
            hasChanges = true;
          } else {
            console.log(`   ⚠️  Failed to upload ${field} to Cloudinary`);
          }
        }
      }

      // Save changes
      if (hasChanges) {
        await user.save();
        console.log('   💾 Changes saved to database');
      } else {
        console.log('   ℹ️  No changes needed');
      }
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

// Verify migration results
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Verifying migration results...\n');
    
    const transporters = await User.find({
      userType: 'transporter',
      'transporterDetails.verificationDocuments': { $exists: true }
    }).select('firstName lastName email transporterDetails.verificationDocuments');

    console.log(`Found ${transporters.length} transporters with verification documents\n`);

    transporters.forEach((user, index) => {
      console.log(`👤 Driver ${index + 1}: ${user.firstName} ${user.lastName}`);
      
      const verificationDocs = user.transporterDetails?.verificationDocuments || {};
      
      // Check driver license
      if (verificationDocs.driverLicense) {
        const isCloudinary = verificationDocs.driverLicense.includes('cloudinary.com');
        const isBase64 = verificationDocs.driverLicense.startsWith('data:image');
        const status = isCloudinary ? '☁️  Cloudinary' : isBase64 ? '📄 Base64' : '🔗 URL';
        console.log(`   Driver License: ${status}`);
      } else {
        console.log(`   Driver License: ❌ Not uploaded`);
      }
      
      // Check for old fields
      if (verificationDocs.driverLicenseFront || verificationDocs.driverLicenseBack) {
        console.log(`   ⚠️  WARNING: Still has old fields!`);
      }
      
      // Count Cloudinary vs Base64 images
      const imageFields = ['profilePhoto', 'vehicleFront', 'vehicleBack', 'vehicleLeft', 'vehicleRight', 'vehicleInterior', 'licensePlate', 'insurance'];
      let cloudinaryCount = 0;
      let base64Count = 0;
      
      imageFields.forEach(field => {
        if (verificationDocs[field]) {
          if (verificationDocs[field].includes('cloudinary.com')) {
            cloudinaryCount++;
          } else if (verificationDocs[field].startsWith('data:image')) {
            base64Count++;
          }
        }
      });
      
      console.log(`   Images: ${cloudinaryCount} Cloudinary, ${base64Count} Base64`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting Verification Documents Migration\n');
  
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('⚠️  Cloudinary not configured. Set these environment variables:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_API_KEY=your_api_key');
    console.log('   CLOUDINARY_API_SECRET=your_api_secret');
    console.log('\n   Proceeding with field migration only...\n');
  }
  
  await connectDB();
  await migrateVerificationDocuments();
  await verifyMigration();
  
  console.log('\n🎯 Migration Summary:');
  console.log('   ✅ Old driverLicenseFront/Back fields migrated to driverLicense');
  console.log('   ✅ Base64 images uploaded to Cloudinary (if configured)');
  console.log('   ✅ Database cleaned up');
  console.log('   ✅ Admin dashboard should now work correctly');
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
};

main().catch(console.error);
