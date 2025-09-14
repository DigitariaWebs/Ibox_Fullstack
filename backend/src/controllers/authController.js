import User from '../models/User.js';
import authService from '../services/authService.js';
import otpService from '../services/otpService.js';
import { validationResult } from 'express-validator';

class AuthController {
  // OTP: Send code to email
  async sendOTP(req, res) {
    try {
      const { email, firstName } = req.body;
      const result = await otpService.sendOTP(email, firstName || '', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP',
        code: 'OTP_SEND_ERROR'
      });
    }
  }

  // OTP: Verify code
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await otpService.verifyOTP(email, otp, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed',
        code: 'OTP_VERIFY_ERROR'
      });
    }
  }

  // OTP: Resend
  async resendOTP(req, res) {
    try {
      const { email, firstName } = req.body;
      const result = await otpService.resendOTP(email, firstName || '', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to resend OTP',
        code: 'OTP_RESEND_ERROR'
      });
    }
  }

  // Complete registration after OTP verification
  async completeRegistration(req, res) {
    try {
      const { email, otp } = req.body;
      // Verify OTP first
      await otpService.verifyOTP(email, otp, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      // Delegate to existing register logic
      return this.register(req, res);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Registration could not be completed',
        code: 'REGISTRATION_OTP_ERROR'
      });
    }
  }
  // Register new user
  async register(req, res) {
    try {
      // Check for validation errors
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
        firstName, 
        lastName, 
        email, 
        phone, 
        password,
        userType, 
        language = 'en'
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user already exists with this email address.',
          code: 'USER_EXISTS'
        });
      }

      // Check phone number uniqueness
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'A user already exists with this phone number.',
          code: 'PHONE_EXISTS'
        });
      }

      // Create new user
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        userType,
        language
      };

      // Add default address if provided
      if (req.body.address) {
        userData.addresses = [{
          type: 'primary',
          address: req.body.address,
          isDefault: true,
          coordinates: req.body.coordinates || {}
        }];
      }

      const user = new User(userData);
      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user._id, user.userType);

      // Save refresh token with device info
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        platform: req.body.platform || 'unknown'
      };
      
      await authService.saveRefreshToken(user._id, refreshToken, deviceInfo);

      // Generate email verification token
      try {
        const emailVerification = await authService.generateEmailVerificationToken(user._id, user.email);
        // TODO: Send verification email
        console.log(`Email verification token for ${user.email}: ${emailVerification.token}`);
      } catch (emailError) {
        console.error('Failed to generate email verification token:', emailError);
        // Don't fail registration if email verification fails
      }

      // Log registration event
      await authService.logSecurityEvent(user._id, 'user_registered', {
        userType: user.userType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Prepare response (exclude sensitive data)
      const userResponse = user.toJSON();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `A user with this ${field} already exists.`,
          code: 'DUPLICATE_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        code: 'REGISTRATION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login user
  async login(req, res) {
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

      const { email, password } = req.body;
      const identifier = email.toLowerCase().trim();

      // Check rate limiting
      const rateLimit = await authService.checkLoginRateLimit(identifier);
      if (rateLimit.blocked) {
        return res.status(429).json({
          success: false,
          message: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            attempts: rateLimit.attempts,
            maxAttempts: rateLimit.maxAttempts,
            resetTime: rateLimit.resetTime
          }
        });
      }

      // Find user by email and include password for comparison
      const user = await User.findOne({ email: identifier }).select('+password +loginAttempts');
      
      if (!user) {
        await authService.logSecurityEvent(null, 'login_attempt_invalid_email', {
          email: identifier,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        await authService.logSecurityEvent(user._id, 'login_attempt_inactive_account', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Check if account is blocked
      if (user.isBlocked) {
        await authService.logSecurityEvent(user._id, 'login_attempt_blocked_account', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          blockReason: user.blockReason
        });
        
        return res.status(401).json({
          success: false,
          message: 'Account is blocked. Please contact support.',
          code: 'ACCOUNT_BLOCKED',
          details: {
            blockedAt: user.blockedAt,
            reason: user.blockReason
          }
        });
      }

      // Check if account is temporarily locked
      if (user.isAccountLocked()) {
        await authService.logSecurityEvent(user._id, 'login_attempt_locked_account', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          lockedUntil: user.loginAttempts.blockedUntil
        });
        
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts.',
          code: 'ACCOUNT_LOCKED',
          details: {
            lockedUntil: user.loginAttempts.blockedUntil
          }
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts();
        
        await authService.logSecurityEvent(user._id, 'login_attempt_invalid_password', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          attempts: user.loginAttempts.count + 1
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Successful login - reset failed attempts
      if (user.loginAttempts.count > 0) {
        await user.resetLoginAttempts();
      }

      // Reset rate limiting for this identifier
      await authService.resetLoginRateLimit(identifier);

      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip;
      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user._id, user.userType);

      // Save refresh token with device info
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        platform: req.body.platform || 'unknown'
      };
      
      await authService.saveRefreshToken(user._id, refreshToken, deviceInfo);

      // Log successful login
      await authService.logSecurityEvent(user._id, 'user_login_success', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userType: user.userType
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        code: 'LOGIN_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      try {
        const result = await authService.refreshAccessToken(refreshToken);
        
        // Log token refresh
        await authService.logSecurityEvent(result.user.id, 'token_refreshed', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.json({
          success: true,
          message: 'Token refreshed successfully',
          data: result
        });
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        let message = 'Invalid or expired refresh token';
        let code = 'INVALID_REFRESH_TOKEN';
        
        if (refreshError.message === 'User not found or inactive') {
          message = 'User account not found or inactive';
          code = 'USER_NOT_FOUND';
        } else if (refreshError.message === 'Refresh token not found or expired') {
          message = 'Refresh token has expired. Please login again.';
          code = 'REFRESH_TOKEN_EXPIRED';
        }
        
        res.status(401).json({
          success: false,
          message: message,
          code: code
        });
      }
    } catch (error) {
      console.error('Refresh token endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh',
        code: 'REFRESH_ERROR'
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.userId; // From auth middleware

      // Revoke refresh token if provided
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      // If user is authenticated, revoke all their tokens (optional - uncomment for stricter security)
      // if (userId) {
      //   await authService.revokeAllUserTokens(userId);
      // }

      // Log logout
      if (userId) {
        await authService.logSecurityEvent(userId, 'user_logout', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still return success for logout even if there are errors
      res.json({
        success: true,
        message: 'Logout completed'
      });
    }
  }

  // Logout from all devices
  async logoutAll(req, res) {
    try {
      const userId = req.userId; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Revoke all refresh tokens for the user
      await authService.revokeAllUserTokens(userId);

      // Log logout from all devices
      await authService.logSecurityEvent(userId, 'user_logout_all_devices', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out from all devices',
        code: 'LOGOUT_ALL_ERROR'
      });
    }
  }

  // Get current authenticated user
  async getMe(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get fresh user data from database
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user data',
        code: 'USER_RETRIEVAL_ERROR'
      });
    }
  }

  // Update user profile
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
        'preferences', 'addresses'
      ];

      const updates = {};
      
      // Only include allowed fields that were provided
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

  // Change password
  async changePassword(req, res) {
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

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.userId).select('+password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        await authService.logSecurityEvent(req.userId, 'password_change_invalid_current', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Revoke all existing refresh tokens for security
      await authService.revokeAllUserTokens(req.userId);

      // Log password change
      await authService.logSecurityEvent(req.userId, 'password_changed', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again with your new password.'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }

  // Request password reset
  async forgotPassword(req, res) {
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

      const { email } = req.body;
      const user = await User.findByEmail(email);

      // Always return success to prevent email enumeration
      const successResponse = {
        success: true,
        message: 'If a user with this email exists, a password reset link has been sent.'
      };

      if (!user) {
        // Log attempt with non-existent email
        await authService.logSecurityEvent(null, 'password_reset_request_invalid_email', {
          email: email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.json(successResponse);
      }

      if (!user.isActive) {
        // Log attempt for inactive account
        await authService.logSecurityEvent(user._id, 'password_reset_request_inactive_account', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.json(successResponse);
      }

      // Generate password reset token
      const resetToken = await authService.generatePasswordResetToken(user._id);

      // TODO: Send password reset email
      console.log(`Password reset token for ${user.email}: ${resetToken.token}`);

      // Log password reset request
      await authService.logSecurityEvent(user._id, 'password_reset_requested', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(successResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing password reset request',
        code: 'FORGOT_PASSWORD_ERROR'
      });
    }
  }

  // Reset password with token
  async resetPassword(req, res) {
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

      const { token, newPassword } = req.body;

      try {
        const userId = await authService.usePasswordResetToken(token);
        
        // Get user
        const user = await User.findById(userId);
        
        if (!user || !user.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token',
            code: 'INVALID_RESET_TOKEN'
          });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Revoke all existing refresh tokens
        await authService.revokeAllUserTokens(userId);

        // Log password reset
        await authService.logSecurityEvent(userId, 'password_reset_completed', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Password reset successfully. Please login with your new password.'
        });
      } catch (tokenError) {
        await authService.logSecurityEvent(null, 'password_reset_invalid_token', {
          token: token.substring(0, 8) + '...',
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting password',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }

  // Check email availability
  async checkEmailAvailability(req, res) {
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

      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists with this email
      const existingUser = await User.findByEmail(normalizedEmail);
      
      res.json({
        success: true,
        data: {
          available: !existingUser
        }
      });
    } catch (error) {
      console.error('Email availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking email availability',
        code: 'EMAIL_CHECK_ERROR'
      });
    }
  }

  // Get user's active sessions/tokens
  async getActiveSessions(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const activeTokensCount = await authService.getUserActiveTokensCount(req.userId);

      res.json({
        success: true,
        data: {
          activeTokensCount: activeTokensCount,
          currentSession: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            loginTime: req.user.lastLoginAt
          }
        }
      });
    } catch (error) {
      console.error('Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving active sessions',
        code: 'SESSIONS_ERROR'
      });
    }
  }
}

export default new AuthController();