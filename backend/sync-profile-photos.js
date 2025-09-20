#!/usr/bin/env node

/**
 * Migration script to sync existing verification profile photos to user.profilePicture field
 * This ensures existing drivers have their verification profile photos displayed in the driver screen
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const syncProfilePhotos = async () => {
  try {
    console.log('🔄 Starting profile photo synchronization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox');
    console.log('✅ Connected to MongoDB');

    // Find all transporters with verification profile photos but no profilePicture
    const transporters = await User.find({
      userType: 'transporter',
      'transporterDetails.verificationDocuments.profilePhoto': { $exists: true, $ne: null },
      $or: [
        { profilePicture: { $exists: false } },
        { profilePicture: null },
        { profilePicture: '' }
      ]
    });

    console.log(`📊 Found ${transporters.length} transporters with verification profile photos to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const transporter of transporters) {
      try {
        const verificationProfilePhoto = transporter.transporterDetails.verificationDocuments.profilePhoto;
        
        if (verificationProfilePhoto) {
          transporter.profilePicture = verificationProfilePhoto;
          await transporter.save();
          
          console.log(`✅ Synced profile photo for ${transporter.firstName} ${transporter.lastName} (${transporter._id})`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing profile photo for ${transporter.firstName} ${transporter.lastName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Synchronization complete:`);
    console.log(`   ✅ Successfully synced: ${syncedCount} profiles`);
    console.log(`   ❌ Errors: ${errorCount} profiles`);
    console.log(`   📊 Total processed: ${transporters.length} profiles`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
syncProfilePhotos();
