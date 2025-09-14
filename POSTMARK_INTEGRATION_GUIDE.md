# Postmark Email OTP Integration Guide for iBox App

## Overview
This guide provides complete instructions for integrating Postmark email service with the iBox application's OTP verification system. The integration replaces mock OTP functionality with a production-ready email verification system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Postmark Account Setup](#postmark-account-setup)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Testing Strategy](#testing-strategy)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js v22 LTS or higher
- MongoDB database
- Redis server
- Active Postmark account
- Verified email domain (for production)

### Existing iBox Backend Structure
```
backend/
├── src/
│   ├── models/User.js
│   ├── controllers/authController.js
│   ├── services/authService.js
│   ├── routes/auth.js
│   └── ...
```

## Postmark Account Setup

### Step 1: Create Postmark Account
1. Visit [postmarkapp.com](https://postmarkapp.com)
2. Sign up with a valid email address
3. Verify your email address
4. Complete account setup

### Step 2: Server Configuration
1. Navigate to **Servers** in Postmark dashboard
2. Click **Create a Server**
3. Choose **Transactional** server type
4. Name your server (e.g., "iBox Production")
5. Copy the **Server API Token**

### Step 3: Sender Signature Setup
1. Go to **Sender Signatures** section
2. Add your sending email (e.g., `noreply@ibox-app.com`)
3. Verify the email address
4. Configure DKIM settings (for production)

### Step 4: Domain Verification (Production Only)
1. Navigate to **Domains** section
2. Add your domain (e.g., `ibox-app.com`)
3. Configure DNS records as instructed
4. Wait for domain verification

## Backend Integration

### Step 1: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install Postmark SDK and additional dependencies
npm install postmark node-cron

# Verify installation
npm list postmark
```

### Step 2: Environment Configuration

Update `backend/.env`:
```bash
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your-server-api-token-here
POSTMARK_FROM_EMAIL=noreply@ibox-app.com
POSTMARK_FROM_NAME=iBox App

# For testing (use this token for development)
POSTMARK_API_TEST=POSTMARK_API_TEST

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_PER_HOUR=5
OTP_CLEANUP_INTERVAL=*/15 * * * *
```

Update `backend/.env.example`:
```bash
# Add these lines to your .env.example
POSTMARK_SERVER_TOKEN=your-postmark-server-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
POSTMARK_FROM_NAME=Your App Name
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_PER_HOUR=5
```

### Step 3: Create OTP Model

Create `backend/src/models/OTP.js`:
```javascript
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance and cleanup
otpSchema.index({ email: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
otpSchema.index({ email: 1, createdAt: -1 });

// Static method to clean up expired OTPs
otpSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
};

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.isUsed &&
         this.attempts < 3 &&
         this.expiresAt > new Date();
};

export default mongoose.model('OTP', otpSchema);
```

### Step 4: Create Email Service

Create `backend/src/services/emailService.js`:
```javascript
import postmark from 'postmark';

class EmailService {
  constructor() {
    // Use test token in development, real token in production
    const token = process.env.NODE_ENV === 'development'
      ? 'POSTMARK_API_TEST'
      : process.env.POSTMARK_SERVER_TOKEN;

    this.client = new postmark.ServerClient(token);
    this.fromEmail = process.env.POSTMARK_FROM_EMAIL || 'noreply@ibox-app.com';
    this.fromName = process.env.POSTMARK_FROM_NAME || 'iBox App';
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} - Postmark response
   */
  async sendOTPEmail(email, otp, firstName = '') {
    try {
      const response = await this.client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: email,
        Subject: 'Verify Your iBox Account - OTP Code',
        HtmlBody: this.generateOTPEmailTemplate(otp, firstName),
        TextBody: this.generateOTPTextTemplate(otp, firstName),
        MessageStream: 'outbound'
      });

      console.log('✅ OTP email sent successfully:', {
        messageId: response.MessageID,
        email: email,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: response.MessageID,
        submittedAt: response.SubmittedAt
      };

    } catch (error) {
      console.error('❌ Failed to send OTP email:', {
        email,
        error: error.message,
        code: error.code
      });

      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML email template for OTP
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @returns {string} - HTML template
   */
  generateOTPEmailTemplate(otp, firstName) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your iBox Account</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #0AA5A8, #4DC5C8, #7B68EE, #9370DB); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
            .otp-container { background-color: #f8f9fa; border: 2px solid #0AA5A8; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #0AA5A8; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
            .otp-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .instructions { font-size: 16px; color: #555; line-height: 1.6; margin: 25px 0; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .expiry { color: #e74c3c; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">📦 iBox</h1>
            </div>
            <div class="content">
                <div class="greeting">
                    Hello${firstName ? ` ${firstName}` : ''},
                </div>
                <p class="instructions">
                    Welcome to iBox! To complete your account setup, please verify your email address using the verification code below:
                </p>
                <div class="otp-container">
                    <div class="otp-label">Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">Expires in 5 minutes</div>
                </div>
                <p class="instructions">
                    Enter this code in the iBox app to verify your email address and complete your registration.
                </p>
                <div class="warning">
                    <strong>Security Notice:</strong> Never share this code with anyone. iBox staff will never ask for your verification code.
                </div>
                <p class="instructions">
                    If you didn't request this code, please ignore this email. Your account remains secure.
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2025 iBox App. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text template for OTP (fallback)
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @returns {string} - Plain text template
   */
  generateOTPTextTemplate(otp, firstName) {
    return `
Hello${firstName ? ` ${firstName}` : ''},

Welcome to iBox! To complete your account setup, please verify your email address.

Your verification code is: ${otp}

This code will expire in 5 minutes.

Enter this code in the iBox app to verify your email address and complete your registration.

SECURITY NOTICE: Never share this code with anyone. iBox staff will never ask for your verification code.

If you didn't request this code, please ignore this email.

Best regards,
The iBox Team

© 2025 iBox App. All rights reserved.
This is an automated message, please do not reply.
    `.trim();
  }

  /**
   * Send welcome email after successful registration
   * @param {string} email - User email
   * @param {string} firstName - User's first name
   * @param {string} userType - customer or transporter
   */
  async sendWelcomeEmail(email, firstName, userType) {
    try {
      const response = await this.client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: email,
        Subject: `Welcome to iBox - Your ${userType} account is ready!`,
        HtmlBody: this.generateWelcomeEmailTemplate(firstName, userType),
        MessageStream: 'outbound'
      });

      console.log('✅ Welcome email sent:', response.MessageID);
      return response;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      // Don't throw error for welcome emails - registration should still succeed
    }
  }

  generateWelcomeEmailTemplate(firstName, userType) {
    const features = userType === 'customer'
      ? ['Book express deliveries', 'Track your packages in real-time', 'Manage multiple addresses', 'Rate and review transporters']
      : ['Accept delivery requests', 'Track your earnings', 'Manage your vehicle profile', 'Build your reputation'];

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #0AA5A8, #7B68EE); padding: 40px 20px; text-align: center; color: white; }
            .content { padding: 40px 30px; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 10px 0; border-bottom: 1px solid #eee; }
            .cta-button { background-color: #0AA5A8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📦 Welcome to iBox!</h1>
            </div>
            <div class="content">
                <h2>Hi ${firstName}!</h2>
                <p>Your ${userType} account has been successfully created. You're now part of the iBox community!</p>

                <h3>What you can do:</h3>
                <ul class="feature-list">
                    ${features.map(feature => `<li>✅ ${feature}</li>`).join('')}
                </ul>

                <p>Ready to get started? Open the iBox app and explore all the features available to you.</p>

                <p>If you have any questions, our support team is here to help.</p>

                <p>Happy ${userType === 'customer' ? 'shipping' : 'delivering'}!</p>
                <p>The iBox Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export default new EmailService();
```

### Step 5: Create OTP Service

Create `backend/src/services/otpService.js`:
```javascript
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import emailService from './emailService.js';

class OTPService {
  constructor() {
    this.otpLength = 6;
    this.expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
    this.rateLimitPerHour = parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR) || 5;
  }

  /**
   * Generate a secure 6-digit OTP
   * @returns {string} - 6-digit OTP code
   */
  generateOTP() {
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
   * @returns {Promise<Object>} - Result object
   */
  async sendOTP(email, firstName = '') {
    try {
      // Check rate limiting
      await this.checkRateLimit(email);

      // Invalidate any existing OTPs for this email
      await OTP.updateMany(
        { email, isUsed: false },
        { $set: { isUsed: true } }
      );

      // Generate new OTP
      const otpCode = this.generateOTP();

      // Save OTP to database
      const otpRecord = new OTP({
        email,
        otp: otpCode,
        expiresAt: new Date(Date.now() + this.expiryMinutes * 60 * 1000)
      });

      await otpRecord.save();

      // Send email via Postmark
      const emailResult = await emailService.sendOTPEmail(email, otpCode, firstName);

      console.log('✅ OTP sent successfully:', {
        email,
        messageId: emailResult.messageId,
        expiresAt: otpRecord.expiresAt
      });

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        expiresAt: otpRecord.expiresAt,
        messageId: emailResult.messageId
      };

    } catch (error) {
      console.error('❌ OTP send failed:', error.message);

      if (error.message.includes('rate limit')) {
        throw new Error('Too many OTP requests. Please wait before requesting again.');
      }

      throw new Error('Failed to send OTP. Please try again later.');
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - Email address
   * @param {string} otpCode - OTP code to verify
   * @returns {Promise<Object>} - Verification result
   */
  async verifyOTP(email, otpCode) {
    try {
      // Find the most recent valid OTP for this email
      const otpRecord = await OTP.findOne({
        email,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        throw new Error('Invalid or expired OTP code');
      }

      // Check if maximum attempts exceeded
      if (otpRecord.attempts >= this.maxAttempts) {
        await otpRecord.updateOne({ $set: { isUsed: true } });
        throw new Error('Maximum verification attempts exceeded');
      }

      // Increment attempt count
      otpRecord.attempts += 1;
      await otpRecord.save();

      // Verify OTP code
      if (otpRecord.otp !== otpCode) {
        const attemptsLeft = this.maxAttempts - otpRecord.attempts;
        throw new Error(`Invalid OTP code. ${attemptsLeft} attempts remaining.`);
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      console.log('✅ OTP verified successfully:', { email });

      return {
        success: true,
        message: 'OTP verified successfully',
        verified: true
      };

    } catch (error) {
      console.error('❌ OTP verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Check rate limiting for OTP requests
   * @param {string} email - Email address
   */
  async checkRateLimit(email) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentOTPs = await OTP.countDocuments({
      email,
      createdAt: { $gt: oneHourAgo }
    });

    if (recentOTPs >= this.rateLimitPerHour) {
      throw new Error('rate limit exceeded');
    }
  }

  /**
   * Cleanup expired and used OTPs (called by cron job)
   * @returns {Promise<number>} - Number of cleaned up records
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { isUsed: true, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} expired/used OTP records`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ OTP cleanup failed:', error.message);
      return 0;
    }
  }

  /**
   * Get OTP statistics for monitoring
   * @returns {Promise<Object>} - OTP statistics
   */
  async getStats() {
    try {
      const [total, active, expired, used] = await Promise.all([
        OTP.countDocuments({}),
        OTP.countDocuments({ isUsed: false, expiresAt: { $gt: new Date() } }),
        OTP.countDocuments({ expiresAt: { $lt: new Date() } }),
        OTP.countDocuments({ isUsed: true })
      ]);

      return {
        total,
        active,
        expired,
        used,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get OTP stats:', error.message);
      return null;
    }
  }
}

export default new OTPService();
```

### Step 6: Update Auth Controller

Update `backend/src/controllers/authController.js` to add new OTP endpoints:

```javascript
// Add these imports at the top
import otpService from '../services/otpService.js';
import emailService from '../services/emailService.js';

// Add these new methods to your AuthController class

/**
 * Send OTP to email for verification
 * POST /api/v1/auth/send-otp
 */
async sendOTP(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, firstName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS'
      });
    }

    // Send OTP
    const result = await otpService.sendOTP(email.toLowerCase(), firstName);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        email: email.toLowerCase(),
        expiresAt: result.expiresAt,
        messageId: result.messageId
      }
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code',
      code: 'OTP_SEND_FAILED'
    });
  }
}

/**
 * Verify OTP code
 * POST /api/v1/auth/verify-otp
 */
async verifyOTP(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const result = await otpService.verifyOTP(email.toLowerCase(), otp);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: email.toLowerCase(),
        verified: true
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);

    // Handle specific OTP errors
    const statusCode = error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('Maximum') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'OTP verification failed',
      code: 'OTP_VERIFICATION_FAILED'
    });
  }
}

/**
 * Resend OTP code
 * POST /api/v1/auth/resend-otp
 */
async resendOTP(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, firstName } = req.body;

    // Send new OTP (this will invalidate old ones)
    const result = await otpService.sendOTP(email.toLowerCase(), firstName);

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email',
      data: {
        email: email.toLowerCase(),
        expiresAt: result.expiresAt,
        messageId: result.messageId
      }
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);

    const statusCode = error.message.includes('rate limit') ? 429 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to resend verification code',
      code: error.message.includes('rate limit') ? 'RATE_LIMITED' : 'OTP_RESEND_FAILED'
    });
  }
}

/**
 * Complete registration after OTP verification
 * POST /api/v1/auth/complete-registration
 */
async completeRegistration(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      userType,
      phone = '',
      language = 'en'
    } = req.body;

    // Verify that email was verified via OTP
    // Check if there's a used OTP for this email in the last 10 minutes
    const recentVerifiedOTP = await OTP.findOne({
      email: email.toLowerCase(),
      isUsed: true,
      createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (!recentVerifiedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Email verification required. Please verify your email first.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: password.trim(),
      userType,
      language,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    };

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = await authService.generateTokens(user._id);

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(user.email, user.firstName, user.userType)
      .catch(error => console.error('Welcome email failed:', error.message));

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Complete registration error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'User data validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Account creation failed. Please try again.',
      code: 'REGISTRATION_FAILED'
    });
  }
}
```

### Step 7: Update Auth Routes

Update `backend/src/routes/auth.js` to add new OTP routes:

```javascript
// Add these imports if not already present
import { body } from 'express-validator';

// Add these new routes to your existing auth routes

// Send OTP
router.post('/send-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters')
], authController.sendOTP);

// Verify OTP
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
], authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters')
], authController.resendOTP);

// Complete registration
router.post('/complete-registration', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters'),
  body('userType')
    .isIn(['customer', 'transporter'])
    .withMessage('User type must be customer or transporter'),
  body('phone')
    .optional()
    .trim(),
  body('language')
    .optional()
    .isIn(['en', 'fr'])
    .withMessage('Language must be en or fr')
], authController.completeRegistration);
```

### Step 8: Setup Cleanup Cron Job

Update `backend/src/app.js` to add OTP cleanup:

```javascript
// Add these imports
import cron from 'node-cron';
import otpService from './services/otpService.js';

// Add this after your existing middleware setup
if (process.env.NODE_ENV !== 'test') {
  // Clean up expired OTPs every 15 minutes
  cron.schedule(process.env.OTP_CLEANUP_INTERVAL || '*/15 * * * *', async () => {
    await otpService.cleanupExpiredOTPs();
  });

  console.log('📅 OTP cleanup cron job scheduled');
}
```

### Step 9: Update Package.json Scripts

Add development script for testing:

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test:otp": "node -e \"console.log('OTP Test:', process.env.POSTMARK_SERVER_TOKEN ? 'Production Token' : 'Test Token')\"",
    "postmark:test": "POSTMARK_SERVER_TOKEN=POSTMARK_API_TEST npm run dev"
  }
}
```

## Frontend Integration

### Step 1: Update API Service

Update `Ibox/src/services/api.ts` to add OTP endpoints:

```typescript
// Add these new methods to your API service

/**
 * Send OTP to email address
 */
export const sendOTP = async (email: string, firstName?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim()
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification code');
    }

    return data;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        otp: otp.trim()
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

/**
 * Resend OTP code
 */
export const resendOTP = async (email: string, firstName?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim()
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification code');
    }

    return data;
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};

/**
 * Complete registration after OTP verification
 */
export const completeRegistration = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'customer' | 'transporter';
  phone?: string;
  language?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/complete-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        email: userData.email.toLowerCase().trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Complete registration error:', error);
    throw error;
  }
};
```

### Step 2: Update Signup Screens

Update the signup flow to use the new OTP API:

**ModernBasicInfoStepScreen.tsx**:
```typescript
// Update the handleNext method
const handleNext = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    // Send OTP instead of navigating directly
    await sendOTP(email.trim().toLowerCase(), firstName.trim());

    // Navigate to OTP verification
    navigation.navigate('ModernOTPVerification', {
      accountType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    setGeneralError(error.message || 'Failed to send verification code');
  } finally {
    setIsLoading(false);
  }
};
```

**ModernOTPVerificationScreen.tsx**:
```typescript
// Update the verification logic
const handleVerify = async (otpToVerify?: string) => {
  const otpString = otpToVerify || otp;

  if (otpString.length !== 6) {
    setError('Please enter the complete 6-digit code');
    return;
  }

  setIsLoading(true);

  try {
    // Verify OTP with backend
    await verifyOTP(email, otpString);

    // Navigate to password setup
    navigation.navigate('ModernPasswordSetup', {
      accountType,
      firstName,
      lastName,
      email,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    setError(error.message || 'Invalid verification code');

    // Shake animation
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    setOtp(''); // Clear the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  } finally {
    setIsLoading(false);
  }
};

// Update the resend functionality
const handleResend = async () => {
  if (resendCooldown > 0) return;

  try {
    await resendOTP(email, firstName);

    // Reset cooldown
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } catch (error) {
    console.error('Resend OTP error:', error);
    setError(error.message || 'Failed to resend code');
  }
};
```

**ModernPasswordSetupScreen.tsx**:
```typescript
// Update the handleCreateAccount method
const handleCreateAccount = async () => {
  if (!validateForm()) return;

  setIsLoading(true);

  try {
    // Complete registration with backend
    const response = await completeRegistration({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userType: accountType,
    });

    // Store tokens and user data
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

    // Navigate to completion screen
    navigation.navigate('ModernSignupComplete', {
      accountType,
      firstName: firstName.trim(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    setGeneralError(error.message || 'Account creation failed');
  } finally {
    setIsLoading(false);
  }
};
```

## Testing Strategy

### Backend Testing

1. **Development Setup**:
```bash
cd backend
npm run postmark:test  # Uses test token
```

2. **Test OTP Generation**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test"}'
```

3. **Test OTP Verification**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

4. **Test Rate Limiting**:
Send 6 requests in quick succession to test rate limiting.

### Frontend Testing

1. **Valid Flow**:
   - Enter email → Receive OTP email → Enter valid OTP → Complete registration

2. **Error Scenarios**:
   - Invalid email format
   - Expired OTP codes
   - Wrong OTP codes
   - Rate limiting
   - Network errors

3. **Edge Cases**:
   - Resend functionality
   - Multiple OTP requests
   - App backgrounding/foregrounding

## Production Deployment

### Postmark Production Setup

1. **Domain Verification**:
   - Add your domain to Postmark
   - Configure DNS records (DKIM, SPF)
   - Wait for verification

2. **Sender Signature**:
   - Use verified domain email
   - Set up proper from name
   - Configure reply-to address

3. **Templates** (Optional):
   - Create branded email templates
   - Use Postmark template system
   - A/B test email designs

### Environment Variables

Production `.env`:
```bash
NODE_ENV=production
POSTMARK_SERVER_TOKEN=your-production-server-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
POSTMARK_FROM_NAME=Your App Name
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_PER_HOUR=5
```

### Monitoring

1. **Postmark Dashboard**:
   - Monitor email delivery rates
   - Track bounce rates
   - Monitor spam complaints

2. **Application Logs**:
   - OTP generation and verification
   - Rate limiting events
   - Email delivery failures

3. **Database Monitoring**:
   - OTP table size and cleanup
   - Failed verification attempts
   - User registration success rates

## Troubleshooting

### Common Issues

1. **Emails Not Sending**:
   - Check API token validity
   - Verify sender signature
   - Check environment variables
   - Review Postmark dashboard

2. **OTP Verification Fails**:
   - Check OTP expiration time
   - Verify database records
   - Check rate limiting
   - Review error logs

3. **Rate Limiting Issues**:
   - Adjust rate limits in environment
   - Check MongoDB TTL indexes
   - Monitor cleanup cron jobs

4. **Email Delivery Issues**:
   - Check spam folders
   - Verify domain reputation
   - Review DNS configuration
   - Monitor Postmark metrics

### Debug Commands

```bash
# Check OTP statistics
curl http://localhost:5000/api/v1/auth/otp-stats

# Test email service
node -e "
import emailService from './src/services/emailService.js';
emailService.sendOTPEmail('test@example.com', '123456', 'Test')
  .then(r => console.log('Success:', r))
  .catch(e => console.error('Error:', e));
"

# Check MongoDB OTP records
mongo ibox --eval "db.otps.find().pretty()"

# Test Postmark connection
curl -X POST "https://api.postmarkapp.com/email" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Server-Token: YOUR_TOKEN" \
  -d '{
    "From": "noreply@yourdomain.com",
    "To": "test@example.com",
    "Subject": "Test",
    "TextBody": "Test message"
  }'
```

### Performance Optimization

1. **Database Indexes**:
   - Ensure TTL indexes are working
   - Monitor query performance
   - Optimize lookup queries

2. **Email Delivery**:
   - Use async email sending
   - Implement retry logic
   - Monitor delivery rates

3. **Rate Limiting**:
   - Use Redis for distributed rate limiting
   - Implement IP-based limits
   - Monitor abuse patterns

## Security Considerations

1. **OTP Security**:
   - Use cryptographically secure random generation
   - Implement proper expiration
   - Limit verification attempts
   - Rate limit OTP requests

2. **Email Security**:
   - Use verified domains
   - Implement SPF and DKIM
   - Monitor for phishing attempts
   - Include security warnings in emails

3. **API Security**:
   - Input validation and sanitization
   - Rate limiting on all endpoints
   - Proper error handling
   - Audit logging

4. **Data Protection**:
   - Don't log sensitive data
   - Implement data retention policies
   - Use HTTPS for all communications
   - Regular security audits

---

## Summary

This integration guide provides a complete solution for implementing Postmark email OTP verification in the iBox application. The solution includes:

- **Secure OTP generation** using Node.js crypto
- **Reliable email delivery** via Postmark
- **Production-ready backend** with proper error handling
- **Seamless frontend integration** with React Native
- **Comprehensive testing** and monitoring
- **Security best practices** and rate limiting

The implementation replaces mock OTP functionality with a professional, scalable email verification system suitable for production use.