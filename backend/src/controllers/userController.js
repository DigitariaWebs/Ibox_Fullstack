import User from '../models/User.js';
import authService from '../services/authService.js';
import { validationResult } from 'express-validator';
import twilioService from '../services/twilioService.js';
import notificationService from '../services/notificationService.js';
import socketService from '../services/socketService.js';

class UserController {
  // Get user profile (extended version of auth/me)
  async getProfile(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Include additional profile stats
      const profileData = {
        ...user.toJSON(),
        stats: {
          totalOrders: 0, // TODO: Calculate from orders collection
          completedOrders: 0,
          cancelledOrders: 0,
          averageRating: user.userType === 'transporter' ? user.transporterDetails?.rating : 0
        }
      };

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: profileData
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving profile',
        code: 'PROFILE_RETRIEVAL_ERROR'
      });
    }
  }

  // ===== PHONE VERIFICATION (CUSTOMER) =====
  async sendPhoneVerification(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number not found in user profile.',
          code: 'PHONE_NOT_FOUND'
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already verified.',
          code: 'PHONE_ALREADY_VERIFIED'
        });
      }

      // Send verification code using Twilio Verify
      const verificationResult = await twilioService.sendVerificationCode(user.phone);

      if (verificationResult.success) {
        await authService.logSecurityEvent(req.userId, 'customer_phone_verification_sent', {
          phone: user.phone,
          channel: 'sms',
          timestamp: new Date(),
          ip: req.ip
        });

        return res.json({
          success: true,
          message: 'Verification code sent successfully',
          data: {
            phone: user.phone,
            status: verificationResult.status,
            channel: verificationResult.channel
          }
        });
      }

      throw new Error('Failed to send verification code');
    } catch (error) {
      console.error('Send customer phone verification error:', error);

      let statusCode = 500;
      let message = 'Error sending verification code';
      let code = 'VERIFICATION_SEND_ERROR';

      if (error.message.includes('Invalid phone number')) {
        statusCode = 400;
        message = error.message;
        code = 'INVALID_PHONE_NUMBER';
      } else if (error.message.includes('limit exceeded')) {
        statusCode = 429;
        message = error.message;
        code = 'RATE_LIMIT_EXCEEDED';
      }

      return res.status(statusCode).json({
        success: false,
        message,
        code,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async verifyPhoneCode(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { code } = req.body;

      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please enter a 6-digit code.',
          code: 'INVALID_CODE_FORMAT'
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number not found in user profile.',
          code: 'PHONE_NOT_FOUND'
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already verified.',
          code: 'PHONE_ALREADY_VERIFIED'
        });
      }

      const verificationResult = await twilioService.verifyCode(user.phone, code);

      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code',
          code: 'INVALID_VERIFICATION_CODE'
        });
      }

      // Mark phone verified
      user.isPhoneVerified = true;
      user.phoneVerifiedAt = new Date();
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpires = undefined;
      
      // Initialize transporterDetails and submissionStatus if not exists (for transporters)
      if (user.userType === 'transporter') {
        if (!user.transporterDetails) {
          user.transporterDetails = {};
        }
        if (!user.transporterDetails.submissionStatus) {
          user.transporterDetails.submissionStatus = {};
        }
        
        // Automatically mark phone verification as approved in submission status
        user.transporterDetails.submissionStatus.phoneVerified = {
          submitted: true,
          submittedAt: user.phoneVerifiedAt,
          status: 'approved',
          reviewedAt: user.phoneVerifiedAt,
          reviewedBy: 'system',
          verifiedAt: user.phoneVerifiedAt
        };
      }
      
      await user.save();

      await authService.logSecurityEvent(req.userId, 'customer_phone_verified', {
        phone: user.phone,
        verifiedAt: user.phoneVerifiedAt,
        timestamp: new Date(),
        ip: req.ip
      });

      // Notify user
      try {
        await notificationService.createNotification(
          req.userId,
          'Phone Verified',
          'Your phone number has been successfully verified!',
          'verification'
        );
      } catch {}

      // Send real-time notification via WebSocket
      if (socketService) {
        socketService.notifyVerificationStatusUpdate(req.userId, 'verification_step', 'approved', {
          step: 'phoneVerified',
          approvedAt: user.phoneVerifiedAt,
          approvedBy: 'system',
          overallStatus: 'pending'
        });
      }

      return res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          phone: user.phone,
          verified: true,
          verifiedAt: user.phoneVerifiedAt
        }
      });
    } catch (error) {
      console.error('Verify customer phone code error:', error);

      let statusCode = 500;
      let message = 'Error verifying code';
      let code = 'VERIFICATION_ERROR';

      if (error.message.includes('Invalid verification code')) {
        statusCode = 400;
        message = error.message;
        code = 'INVALID_CODE';
      } else if (error.message.includes('expired')) {
        statusCode = 400;
        message = 'Verification code has expired. Please request a new code.';
        code = 'CODE_EXPIRED';
      } else if (error.message.includes('attempts exceeded')) {
        statusCode = 429;
        message = error.message;
        code = 'MAX_ATTEMPTS_EXCEEDED';
      }

      return res.status(statusCode).json({
        success: false,
        message,
        code,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async resendPhoneVerification(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already verified.',
          code: 'PHONE_ALREADY_VERIFIED'
        });
      }

      // Cancel any pending verifications if possible
      try {
        await twilioService.cancelVerification(user.phone);
      } catch (e) {
        console.warn('Could not cancel previous verification:', e.message);
      }

      const verificationResult = await twilioService.sendVerificationCode(user.phone);

      if (!verificationResult.success) {
        throw new Error('Failed to resend verification code');
      }

      await authService.logSecurityEvent(req.userId, 'customer_phone_verification_resent', {
        phone: user.phone,
        channel: 'sms',
        timestamp: new Date(),
        ip: req.ip
      });

      return res.json({
        success: true,
        message: 'New verification code sent successfully',
        data: {
          phone: user.phone,
          status: verificationResult.status,
          channel: verificationResult.channel
        }
      });
    } catch (error) {
      console.error('Resend customer phone verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error resending verification code',
        code: 'VERIFICATION_RESEND_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update user profile (extended version)
  async updateProfile(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const allowedUpdates = [
        'firstName', 'lastName', 'phone', 'language', 'profilePicture',
        'preferences', 'dateOfBirth', 'emergencyContact', 'isBusiness', 'businessDetails'
      ];

      const updates = {};
      
      // Only include allowed fields that were provided
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });
      
      // Special handling for phone number - if it hasn't changed, don't update it
      const currentUser = await User.findById(req.userId);
      if (updates.phone && currentUser && currentUser.phone === updates.phone) {
        console.log('Phone number unchanged, skipping validation for:', updates.phone);
        delete updates.phone; // Don't update if it's the same
      } else if (updates.phone) {
        console.log('Phone number changing from', currentUser?.phone, 'to', updates.phone);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update',
          code: 'NO_UPDATES'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Log profile update
      await authService.logSecurityEvent(req.userId, 'profile_updated', {
        updatedFields: Object.keys(updates),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        code: 'PROFILE_UPDATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user addresses
  async getAddresses(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId).select('addresses');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Addresses retrieved successfully',
        data: {
          addresses: user.addresses || []
        }
      });
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving addresses',
        code: 'ADDRESSES_RETRIEVAL_ERROR'
      });
    }
  }

  // Add new address
  async addAddress(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { type, address, coordinates, contactPerson, contactPhone, isDefault } = req.body;

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check maximum addresses limit
      if (user.addresses && user.addresses.length >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 5 addresses allowed',
          code: 'ADDRESS_LIMIT_EXCEEDED'
        });
      }

      // If this is set as default, unset other default addresses
      if (isDefault) {
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }

      // Create new address
      const newAddress = {
        type: type || 'secondary',
        address,
        coordinates,
        contactPerson,
        contactPhone,
        isDefault: isDefault || false
      };

      user.addresses.push(newAddress);
      await user.save();

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: {
          address: user.addresses[user.addresses.length - 1]
        }
      });
    } catch (error) {
      console.error('Add address error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding address',
        code: 'ADDRESS_ADD_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update address
  async updateAddress(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { addressId } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const addressIndex = user.addresses.findIndex(
        addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found',
          code: 'ADDRESS_NOT_FOUND'
        });
      }

      const { type, address, coordinates, contactPerson, contactPhone, isDefault } = req.body;

      // If this is set as default, unset other default addresses
      if (isDefault) {
        user.addresses.forEach((addr, index) => {
          if (index !== addressIndex) {
            addr.isDefault = false;
          }
        });
      }

      // Update address fields
      const updatedAddress = user.addresses[addressIndex];
      if (type !== undefined) updatedAddress.type = type;
      if (address !== undefined) updatedAddress.address = address;
      if (coordinates !== undefined) updatedAddress.coordinates = coordinates;
      if (contactPerson !== undefined) updatedAddress.contactPerson = contactPerson;
      if (contactPhone !== undefined) updatedAddress.contactPhone = contactPhone;
      if (isDefault !== undefined) updatedAddress.isDefault = isDefault;

      await user.save();

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: {
          address: updatedAddress
        }
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating address',
        code: 'ADDRESS_UPDATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete address
  async deleteAddress(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { addressId } = req.params;
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const addressIndex = user.addresses.findIndex(
        addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found',
          code: 'ADDRESS_NOT_FOUND'
        });
      }

      // Don't allow deleting the last address if it's the default
      if (user.addresses.length === 1 && user.addresses[0].isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only default address',
          code: 'CANNOT_DELETE_DEFAULT'
        });
      }

      const wasDefault = user.addresses[addressIndex].isDefault;
      user.addresses.splice(addressIndex, 1);

      // If we deleted the default address, make the first remaining address default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting address',
        code: 'ADDRESS_DELETE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update transporter details (for transporter users only)
  async updateTransporterDetails(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.userType !== 'transporter') {
        return res.status(403).json({
          success: false,
          message: 'Only transporters can update transporter details',
          code: 'INVALID_USER_TYPE'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const allowedUpdates = [
        'vehicleType', 'licensePlate', 'payloadCapacity', 'licenseNumber', 
        'licenseExpiry', 'vehiclePhotos', 'insuranceDocument', 'bankingDetails',
        'workingHours', 'isAvailable', 'serviceArea'
      ];

      const updates = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update',
          code: 'NO_UPDATES'
        });
      }

      // Update transporter details
      if (!user.transporterDetails) {
        user.transporterDetails = {};
      }

      Object.keys(updates).forEach(key => {
        user.transporterDetails[key] = updates[key];
      });

      await user.save();

      // Log transporter details update
      await authService.logSecurityEvent(req.userId, 'transporter_details_updated', {
        updatedFields: Object.keys(updates),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Transporter details updated successfully',
        data: {
          transporterDetails: user.transporterDetails
        }
      });
    } catch (error) {
      console.error('Update transporter details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating transporter details',
        code: 'TRANSPORTER_UPDATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // TODO: Calculate real statistics from orders collection
      const stats = {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        averageRating: user.userType === 'transporter' ? user.transporterDetails?.rating || 0 : 0,
        accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
        verificationStatus: {
          email: user.isEmailVerified,
          phone: user.isPhoneVerified,
          identity: user.userType === 'transporter' ? user.transporterDetails?.isVerified : true
        }
      };

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user statistics',
        code: 'STATS_RETRIEVAL_ERROR'
      });
    }
  }

  // Deactivate user account
  async deactivateAccount(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { reason, feedback } = req.body;

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Account is already deactivated',
          code: 'ALREADY_DEACTIVATED'
        });
      }

      // Deactivate account
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivationReason = reason || 'User requested';
      user.deactivationFeedback = feedback;

      await user.save();

      // Revoke all user tokens
      await authService.revokeAllUserTokens(req.userId);

      // Log account deactivation
      await authService.logSecurityEvent(req.userId, 'account_deactivated', {
        reason: reason || 'User requested',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Account deactivated successfully. You have been logged out from all devices.'
      });
    } catch (error) {
      console.error('Account deactivation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deactivating account',
        code: 'DEACTIVATION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default new UserController();