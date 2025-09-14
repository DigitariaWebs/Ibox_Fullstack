import crypto from 'crypto';
import OTP from '../models/OTP.js';
import emailService from './emailService.js';

class OTPService {
  constructor() {
    this.otpLength = 6;
    this.expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
    this.rateLimitPerHour = parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR) || 5;

    console.log('🔐 OTPService initialized:', {
      otpLength: this.otpLength,
      expiryMinutes: this.expiryMinutes,
      maxAttempts: this.maxAttempts,
      rateLimitPerHour: this.rateLimitPerHour
    });
  }

  /**
   * Generate a cryptographically secure 6-digit OTP
   * @returns {string} - 6-digit OTP code
   */
  generateOTP() {
    // Always generate real random OTPs for security
    let otp = '';
    for (let i = 0; i < this.otpLength; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  }

  /**
   * Send OTP to email address
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name (optional)
   * @param {Object} options - Additional options (ipAddress, userAgent)
   * @returns {Promise<Object>} - Result object
   */
  async sendOTP(email, firstName = '', options = {}) {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      console.log('📧 Sending OTP request:', {
        email: normalizedEmail,
        firstName: firstName,
        timestamp: new Date().toISOString()
      });

      // Check rate limiting
      await this.checkRateLimit(normalizedEmail);

      // Invalidate any existing active OTPs for this email
      const invalidatedCount = await OTP.updateMany(
        {
          email: normalizedEmail,
          isUsed: false,
          expiresAt: { $gt: new Date() }
        },
        { $set: { isUsed: true } }
      );

      if (invalidatedCount.modifiedCount > 0) {
        console.log(`🔄 Invalidated ${invalidatedCount.modifiedCount} existing OTPs for ${normalizedEmail}`);
      }

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

      // Save OTP to database
      const otpRecord = new OTP({
        email: normalizedEmail,
        otp: otpCode,
        expiresAt: expiresAt,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null
      });

      await otpRecord.save();

      console.log('✅ OTP record created:', {
        id: otpRecord._id,
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString()
      });

      // Send email via Postmark
      const emailResult = await emailService.sendOTPEmail(
        normalizedEmail,
        otpCode,
        firstName,
        {
          expiryMinutes: this.expiryMinutes
        }
      );

      console.log('✅ OTP sent successfully:', {
        email: normalizedEmail,
        messageId: emailResult.messageId,
        otpId: otpRecord._id
      });

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        data: {
          email: normalizedEmail,
          expiresAt: expiresAt,
          expiresIn: this.expiryMinutes * 60, // seconds
          messageId: emailResult.messageId
        }
      };

    } catch (error) {
      console.error('❌ OTP send failed:', {
        email: normalizedEmail,
        error: error.message,
        stack: error.stack
      });

      // Handle specific error types
      if (error.message.includes('rate limit')) {
        throw new Error('Too many OTP requests. Please wait before requesting again.');
      }

      if (error.message.includes('Invalid email')) {
        throw new Error('Please provide a valid email address.');
      }

      if (error.message.includes('sender signature')) {
        throw new Error('Email service configuration error. Please contact support.');
      }

      throw new Error('Failed to send OTP. Please try again later.');
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - Email address
   * @param {string} otpCode - OTP code to verify
   * @param {Object} options - Additional options (ipAddress, userAgent)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyOTP(email, otpCode, options = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtpCode = otpCode.toString().trim();

    try {
      console.log('🔍 Verifying OTP:', {
        email: normalizedEmail,
        otpLength: cleanOtpCode.length,
        timestamp: new Date().toISOString()
      });

      // Input validation
      if (!cleanOtpCode || cleanOtpCode.length !== 6 || !/^\d{6}$/.test(cleanOtpCode)) {
        throw new Error('Invalid OTP format. Please enter a 6-digit number.');
      }

      // Find the most recent valid OTP for this email
      const otpRecord = await OTP.findValidOTP(normalizedEmail);

      if (!otpRecord) {
        console.log('❌ No valid OTP found:', {
          email: normalizedEmail,
          searchTime: new Date().toISOString()
        });
        throw new Error('Invalid or expired OTP code. Please request a new one.');
      }

      console.log('🔍 Found OTP record:', {
        id: otpRecord._id,
        attempts: otpRecord.attempts,
        expiresAt: otpRecord.expiresAt,
        timeRemaining: otpRecord.getTimeToExpiry()
      });

      // Check if maximum attempts exceeded
      if (otpRecord.attempts >= this.maxAttempts) {
        await otpRecord.markAsUsed();
        console.log('❌ Max attempts exceeded:', {
          otpId: otpRecord._id,
          attempts: otpRecord.attempts
        });
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }

      // Increment attempt count first
      await otpRecord.incrementAttempts();

      // Verify OTP code
      if (otpRecord.otp !== cleanOtpCode) {
        const attemptsLeft = this.maxAttempts - otpRecord.attempts;
        console.log('❌ Invalid OTP code:', {
          otpId: otpRecord._id,
          attempts: otpRecord.attempts,
          attemptsLeft: attemptsLeft
        });

        const message = attemptsLeft > 0
          ? `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
          : 'Invalid OTP code. Maximum attempts exceeded.';

        // Mark as used if no attempts left
        if (attemptsLeft === 0) {
          await otpRecord.markAsUsed();
        }

        throw new Error(message);
      }

      // Mark OTP as used (successful verification)
      await otpRecord.markAsUsed();

      console.log('✅ OTP verified successfully:', {
        otpId: otpRecord._id,
        email: normalizedEmail,
        verifiedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          email: normalizedEmail,
          verified: true,
          verifiedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ OTP verification failed:', {
        email: normalizedEmail,
        error: error.message
      });
      throw error; // Re-throw to maintain error context
    }
  }

  /**
   * Resend OTP (alias for sendOTP for clarity)
   * @param {string} email - Email address
   * @param {string} firstName - User's first name (optional)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  async resendOTP(email, firstName = '', options = {}) {
    console.log('🔄 Resending OTP:', { email: email.toLowerCase().trim() });
    return this.sendOTP(email, firstName, options);
  }

  /**
   * Check rate limiting for OTP requests
   * @param {string} email - Email address
   * @throws {Error} - If rate limit exceeded
   */
  async checkRateLimit(email) {
    const recentCount = await OTP.getRecentCount(email, 1); // Last 1 hour

    console.log('🚦 Rate limit check:', {
      email,
      recentCount,
      limit: this.rateLimitPerHour
    });

    if (recentCount >= this.rateLimitPerHour) {
      const resetTime = new Date(Date.now() + 60 * 60 * 1000);
      console.log('⛔ Rate limit exceeded:', {
        email,
        recentCount,
        resetTime: resetTime.toISOString()
      });
      throw new Error(`rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()}`);
    }
  }

  /**
   * Cleanup expired and used OTPs (called by cron job)
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupExpiredOTPs() {
    try {
      console.log('🧹 Starting OTP cleanup...');

      const result = await OTP.cleanupExpired();

      console.log(`✅ OTP cleanup completed:`, {
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        deletedCount: result.deletedCount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ OTP cleanup failed:', error.message);
      return {
        success: false,
        error: error.message,
        deletedCount: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get OTP statistics for monitoring
   * @returns {Promise<Object>} - OTP statistics
   */
  async getStats() {
    try {
      const stats = await OTP.getStats();

      console.log('📊 OTP Statistics:', stats);

      return {
        success: true,
        ...stats
      };
    } catch (error) {
      console.error('❌ Failed to get OTP stats:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate OTP format without database lookup
   * @param {string} otp - OTP code to validate
   * @returns {boolean} - True if format is valid
   */
  isValidOTPFormat(otp) {
    const cleanOtp = otp?.toString().trim();
    return cleanOtp && cleanOtp.length === 6 && /^\d{6}$/.test(cleanOtp);
  }

  /**
   * Get remaining time for OTP expiration
   * @param {string} email - Email address
   * @returns {Promise<Object>} - Time information
   */
  async getOTPTimeRemaining(email) {
    try {
      const otpRecord = await OTP.findValidOTP(email.toLowerCase().trim());

      if (!otpRecord) {
        return {
          hasActiveOTP: false,
          timeRemaining: 0,
          expiresAt: null
        };
      }

      const timeRemaining = otpRecord.getTimeToExpiry();

      return {
        hasActiveOTP: true,
        timeRemaining: timeRemaining,
        expiresAt: otpRecord.expiresAt,
        attemptsRemaining: otpRecord.getRemainingAttempts()
      };
    } catch (error) {
      console.error('❌ Error getting OTP time remaining:', error.message);
      return {
        hasActiveOTP: false,
        timeRemaining: 0,
        error: error.message
      };
    }
  }

  /**
   * Cancel/invalidate active OTP for email
   * @param {string} email - Email address
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelOTP(email) {
    try {
      const result = await OTP.updateMany(
        {
          email: email.toLowerCase().trim(),
          isUsed: false,
          expiresAt: { $gt: new Date() }
        },
        { $set: { isUsed: true } }
      );

      console.log('🚫 OTP cancelled:', {
        email: email.toLowerCase().trim(),
        cancelledCount: result.modifiedCount
      });

      return {
        success: true,
        cancelledCount: result.modifiedCount,
        message: 'OTP cancelled successfully'
      };
    } catch (error) {
      console.error('❌ OTP cancellation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Development/testing helper to force generate specific OTP
   * @param {string} email - Email address
   * @param {string} specificOTP - Specific OTP code (for testing)
   * @returns {Promise<Object>} - Result object
   */
  async sendTestOTP(email, specificOTP = null) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test OTP function not available in production');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpCode = specificOTP || this.generateOTP();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    try {
      // Invalidate existing OTPs
      await OTP.updateMany(
        { email: normalizedEmail, isUsed: false },
        { $set: { isUsed: true } }
      );

      // Create test OTP
      const otpRecord = new OTP({
        email: normalizedEmail,
        otp: otpCode,
        expiresAt: expiresAt
      });

      await otpRecord.save();

      console.log('🧪 Test OTP created:', {
        email: normalizedEmail,
        otp: otpCode,
        expiresAt: expiresAt.toISOString()
      });

      return {
        success: true,
        message: 'Test OTP created successfully',
        data: {
          email: normalizedEmail,
          otp: otpCode, // Only returned in test mode
          expiresAt: expiresAt
        }
      };
    } catch (error) {
      console.error('❌ Test OTP creation failed:', error.message);
      throw new Error('Failed to create test OTP');
    }
  }
}

export default new OTPService();