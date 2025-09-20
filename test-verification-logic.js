import mongoose from 'mongoose';
import User from './backend/src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testVerificationLogic = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox');
    console.log('Connected to MongoDB');

    // Find a transporter user
    const transporter = await User.findOne({ userType: 'transporter' });
    if (!transporter) {
      console.log('No transporter found');
      process.exit(0);
    }

    console.log('Testing verification logic for:', transporter.email);
    console.log('Phone verified:', transporter.isPhoneVerified);
    console.log('Phone verified at:', transporter.phoneVerifiedAt);

    // Test verification status calculation
    const transporterDetails = transporter.transporterDetails || {};
    const verificationDocuments = transporterDetails.verificationDocuments || {};
    
    const completedSteps = {
      profilePhoto: !!(verificationDocuments.profilePhoto || transporter.profilePicture),
      phoneVerified: !!transporter.isPhoneVerified,
      driverLicense: !!(verificationDocuments.driverLicenseFront || verificationDocuments.driverLicenseBack),
      vehiclePhotos: !!(verificationDocuments.vehicleFront && verificationDocuments.vehicleBack),
      vehiclePlate: !!verificationDocuments.licensePlate,
      insurance: !!verificationDocuments.insurance,
      backgroundCheck: !!transporterDetails.backgroundCheckConsent
    };

    console.log('\nCompleted steps:');
    Object.entries(completedSteps).forEach(([step, completed]) => {
      console.log(`  ${step}: ${completed ? '✅' : '❌'}`);
    });

    // Test submission status
    const submissionStatus = transporterDetails.submissionStatus || {};
    const stepSubmissionStatus = {
      profilePhoto: submissionStatus.profilePhoto || { submitted: false, status: 'pending' },
      phoneVerified: transporter.isPhoneVerified ? { submitted: true, status: 'approved', verifiedAt: transporter.phoneVerifiedAt } : { submitted: false, status: 'pending' },
      driverLicense: submissionStatus.driverLicense || { submitted: false, status: 'pending' },
      vehiclePhotos: submissionStatus.vehiclePhotos || { submitted: false, status: 'pending' },
      vehiclePlate: submissionStatus.vehiclePlate || { submitted: false, status: 'pending' },
      insurance: submissionStatus.insurance || { submitted: false, status: 'pending' }
    };

    console.log('\nSubmission status:');
    Object.entries(stepSubmissionStatus).forEach(([step, status]) => {
      console.log(`  ${step}: ${status.submitted ? 'Submitted' : 'Not submitted'} - ${status.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testVerificationLogic();
