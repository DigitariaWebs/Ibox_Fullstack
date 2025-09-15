import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// Redis removed - using in-memory storage for development
import User from '../models/User.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    // In-memory storage for development (replace with database in production)
    this.refreshTokens = new Map();
    this.blacklistedTokens = new Map();
    this.sessions = new Map();
    this.userTokens = new Map(); // Track tokens per user
    this.rateLimits = new Map(); // Rate limiting storage
    this.passwordResets = new Map(); // Password reset tokens
    this.emailVerifications = new Map(); // Email verification tokens
    this.userActivity = new Map(); // User activity tracking
    this.securityEvents = new Map(); // Security event tracking

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    // Cleanup expired items every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  // Cleanup expired items from in-memory storage
  cleanupExpired() {
    const now = Date.now();

    // Clean up refresh tokens
    for (const [key, data] of this.refreshTokens) {
      if (data.expiresAt && now > data.expiresAt) {
        this.refreshTokens.delete(key);
      }
    }

    // Clean up blacklisted tokens
    for (const [key, data] of this.blacklistedTokens) {
      if (data.expiresAt && now > data.expiresAt) {
        this.blacklistedTokens.delete(key);
      }
    }

    // Clean up password reset tokens
    for (const [key, data] of this.passwordResets) {
      if (data.expiresAt && now > data.expiresAt) {
        this.passwordResets.delete(key);
      }
    }

    // Clean up email verification tokens
    for (const [key, data] of this.emailVerifications) {
      if (data.expiresAt && now > data.expiresAt) {
        this.emailVerifications.delete(key);
      }
    }

    // Clean up sessions
    for (const [key, data] of this.sessions) {
      if (data.expiresAt && now > data.expiresAt) {
        this.sessions.delete(key);
      }
    }

    // Clean up user activity
    for (const [key, data] of this.userActivity) {
      if (data.expiresAt && now > data.expiresAt) {
        this.userActivity.delete(key);
      }
    }

    // Clean up security events
    for (const [key, data] of this.securityEvents) {
      if (data.expiresAt && now > data.expiresAt) {
        this.securityEvents.delete(key);
      }
    }

    // Clean up rate limits
    for (const [key, data] of this.rateLimits) {
      if (data.expiresAt && now > data.expiresAt) {
        this.rateLimits.delete(key);
      }
    }

    console.log('🧹 Cleaned up expired tokens and data');
  }

  // Generate JWT tokens (access + refresh)
  generateTokens(userId, userType = null) {
    try {
      const payload = { 
        userId: userId.toString(),
        type: 'access'
      };

      if (userType) {
        payload.userType = userType;
      }

      const accessToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'ibox-api',
        audience: 'ibox-app'
      });

      const refreshPayload = {
        userId: userId.toString(),
        type: 'refresh',
        tokenId: crypto.randomUUID() // Unique token ID for tracking
      };

      const refreshToken = jwt.sign(refreshPayload, this.jwtSecret, {
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: 'ibox-api',
        audience: 'ibox-app'
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error generating tokens:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  // Verify JWT token
  async verifyToken(token, expectedType = 'access') {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'ibox-api',
        audience: 'ibox-app'
      });

      // Check token type
      if (decoded.type !== expectedType) {
        throw new Error(`Invalid token type. Expected ${expectedType}, got ${decoded.type}`);
      }

      // For refresh tokens, check if it's blacklisted
      if (expectedType === 'refresh') {
        const isBlacklisted = await this.isTokenBlacklisted(token);
        if (isBlacklisted) {
          throw new Error('Token has been revoked');
        }
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  // Save refresh token to in-memory storage with user association
  async saveRefreshToken(userId, refreshToken, deviceInfo = null) {
    try {
      const decoded = jwt.decode(refreshToken);
      const tokenId = decoded.tokenId;
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds

      const tokenData = {
        userId: userId.toString(),
        token: refreshToken,
        createdAt: new Date().toISOString(),
        deviceInfo: deviceInfo,
        lastUsed: new Date().toISOString(),
        expiresAt
      };

      // Store token with its unique ID
      this.refreshTokens.set(`refresh_token:${tokenId}`, tokenData);

      // Also maintain a list of user's active tokens
      const userTokensKey = `user_tokens:${userId}`;
      if (!this.userTokens.has(userTokensKey)) {
        this.userTokens.set(userTokensKey, new Set());
      }
      this.userTokens.get(userTokensKey).add(tokenId);

      return tokenId;
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw new Error('Failed to save refresh token');
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = await this.verifyToken(refreshToken, 'refresh');
      const userId = payload.userId;
      const tokenId = payload.tokenId;

      // Check if user still exists and is active
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Check if refresh token exists in memory
      const tokenKey = `refresh_token:${tokenId}`;
      const tokenData = this.refreshTokens.get(tokenKey);

      if (!tokenData) {
        throw new Error('Refresh token not found or expired');
      }

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        this.refreshTokens.delete(tokenKey);
        throw new Error('Refresh token expired');
      }
      
      if (tokenData.token !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(userId, user.userType);

      // Save new refresh token
      await this.saveRefreshToken(userId, newRefreshToken, tokenData.deviceInfo);

      // Optionally revoke the old refresh token (for security)
      await this.revokeRefreshToken(refreshToken);

      // Update user's last login
      user.lastLoginAt = new Date();
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: user.toJSON()
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Revoke specific refresh token
  async revokeRefreshToken(refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      if (!decoded || !decoded.tokenId) {
        return; // Invalid token, nothing to revoke
      }

      const tokenId = decoded.tokenId;
      const userId = decoded.userId;

      // Remove from in-memory storage
      this.refreshTokens.delete(`refresh_token:${tokenId}`);

      // Remove from user's token set
      if (userId) {
        const userTokensKey = `user_tokens:${userId}`;
        const userTokensSet = this.userTokens.get(userTokensKey);
        if (userTokensSet) {
          userTokensSet.delete(tokenId);
          if (userTokensSet.size === 0) {
            this.userTokens.delete(userTokensKey);
          }
        }
      }

      // Add to blacklist for remaining lifetime
      const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
      if (remainingTime > 0) {
        const expiresAt = Date.now() + (remainingTime * 1000);
        this.blacklistedTokens.set(`blacklist:${tokenId}`, {
          reason: 'revoked',
          expiresAt
        });
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      // Don't throw error for revocation failures
    }
  }

  // Revoke all refresh tokens for a user
  async revokeAllUserTokens(userId) {
    try {
      const userTokensKey = `user_tokens:${userId}`;
      const userTokensSet = this.userTokens.get(userTokensKey);

      if (userTokensSet && userTokensSet.size > 0) {
        // Convert Set to Array for processing
        const tokenIds = Array.from(userTokensSet);

        // Remove all tokens and add to blacklist
        for (const tokenId of tokenIds) {
          const tokenKey = `refresh_token:${tokenId}`;
          const tokenData = this.refreshTokens.get(tokenKey);

          if (tokenData) {
            // Remove from refresh tokens
            this.refreshTokens.delete(tokenKey);

            // Add to blacklist
            const decoded = jwt.decode(tokenData.token);
            if (decoded) {
              const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
              if (remainingTime > 0) {
                const expiresAt = Date.now() + (remainingTime * 1000);
                this.blacklistedTokens.set(`blacklist:${tokenId}`, {
                  reason: 'revoked',
                  expiresAt
                });
              }
            }
          }
        }
      }

      // Clear user's token set
      this.userTokens.delete(userTokensKey);
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw new Error('Failed to revoke user tokens');
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.tokenId) {
        return false;
      }

      const blacklistKey = `blacklist:${decoded.tokenId}`;
      const blacklistEntry = this.blacklistedTokens.get(blacklistKey);

      if (!blacklistEntry) {
        return false;
      }

      // Check if blacklist entry is expired
      if (blacklistEntry.expiresAt && Date.now() > blacklistEntry.expiresAt) {
        this.blacklistedTokens.delete(blacklistKey);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false; // Assume not blacklisted if we can't check
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(userId) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store in memory with expiration
      const resetData = {
        userId: userId.toString(),
        createdAt: new Date().toISOString(),
        expiresAt: expires.getTime() // Store as timestamp for easier comparison
      };

      this.passwordResets.set(`password_reset:${token}`, resetData);

      return { token, expires };
    } catch (error) {
      console.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  // Verify password reset token
  async verifyPasswordResetToken(token) {
    try {
      const resetKey = `password_reset:${token}`;
      const resetData = this.passwordResets.get(resetKey);

      if (!resetData) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      if (Date.now() > resetData.expiresAt) {
        this.passwordResets.delete(resetKey);
        throw new Error('Reset token has expired');
      }

      return resetData.userId;
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      throw error;
    }
  }

  // Use password reset token (one-time use)
  async usePasswordResetToken(token) {
    try {
      const userId = await this.verifyPasswordResetToken(token);

      // Delete the token after use
      this.passwordResets.delete(`password_reset:${token}`);

      return userId;
    } catch (error) {
      throw error;
    }
  }

  // Generate email verification token
  async generateEmailVerificationToken(userId, email) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const verificationData = {
        userId: userId.toString(),
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
        expiresAt: expires.getTime() // Store as timestamp for easier comparison
      };

      this.emailVerifications.set(`email_verification:${token}`, verificationData);

      return { token, expires };
    } catch (error) {
      console.error('Error generating email verification token:', error);
      throw new Error('Failed to generate email verification token');
    }
  }

  // Verify email verification token
  async verifyEmailVerificationToken(token) {
    try {
      const verificationKey = `email_verification:${token}`;
      const verificationData = this.emailVerifications.get(verificationKey);

      if (!verificationData) {
        throw new Error('Invalid or expired verification token');
      }

      // Check if token is expired
      if (Date.now() > verificationData.expiresAt) {
        this.emailVerifications.delete(verificationKey);
        throw new Error('Verification token has expired');
      }

      // Delete the token after successful verification
      this.emailVerifications.delete(verificationKey);

      return {
        userId: verificationData.userId,
        email: verificationData.email
      };
    } catch (error) {
      console.error('Error verifying email verification token:', error);
      throw error;
    }
  }

  // Session management
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = crypto.randomUUID();
      const sessionInfo = {
        userId: userId.toString(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        ...sessionData
      };

      this.sessions.set(sessionId, sessionInfo);

      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSession(sessionId) {
    try {
      const sessionData = this.sessions.get(sessionId);

      if (!sessionData) {
        return null;
      }

      // Check if session is expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        this.sessions.delete(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async updateSession(sessionId, updates = {}) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession = {
        ...session,
        ...updates,
        lastActivity: new Date().toISOString(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Reset expiration to 24 hours
      };

      this.sessions.set(sessionId, updatedSession);

      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
      // Don't throw error for cleanup operations
    }
  }

  // User activity tracking
  async updateUserActivity(userId, activity = {}) {
    try {
      const activityData = {
        userId: userId.toString(),
        timestamp: new Date().toISOString(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        ...activity
      };

      const key = `user_activity:${userId}`;
      this.userActivity.set(key, activityData);
    } catch (error) {
      console.error('Error updating user activity:', error);
      // Don't throw error for activity tracking
    }
  }

  // Get user's active tokens count
  async getUserActiveTokensCount(userId) {
    try {
      const userTokensKey = `user_tokens:${userId}`;
      const userTokensSet = this.userTokens.get(userTokensKey);
      return userTokensSet ? userTokensSet.size : 0;
    } catch (error) {
      console.error('Error getting user tokens count:', error);
      return 0;
    }
  }

  // Security helpers
  async logSecurityEvent(userId, event, details = {}) {
    try {
      const securityEvent = {
        userId: userId.toString(),
        event: event,
        timestamp: new Date().toISOString(),
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
        details: details
      };

      const key = `security_events:${userId}:${Date.now()}`;
      this.securityEvents.set(key, securityEvent);

      // Also maintain a counter for monitoring
      const counterKey = `security_counter:${userId}:${event}`;
      const existingCounter = this.securityEvents.get(counterKey) || { count: 0, expiresAt: Date.now() + (24 * 60 * 60 * 1000) };

      // Check if counter is expired
      if (Date.now() > existingCounter.expiresAt) {
        existingCounter.count = 1;
        existingCounter.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      } else {
        existingCounter.count++;
      }

      this.securityEvents.set(counterKey, existingCounter);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Rate limiting for login attempts
  async checkLoginRateLimit(identifier, maxAttempts = 5, windowMinutes = 15) {
    try {
      const key = `login_attempts:${identifier}`;
      const windowMs = windowMinutes * 60 * 1000;
      const now = Date.now();

      let rateLimitData = this.rateLimits.get(key);

      // Initialize or reset if window expired
      if (!rateLimitData || now > rateLimitData.expiresAt) {
        rateLimitData = {
          attempts: 1,
          expiresAt: now + windowMs,
          firstAttempt: now
        };
      } else {
        rateLimitData.attempts++;
      }

      this.rateLimits.set(key, rateLimitData);

      return {
        attempts: rateLimitData.attempts,
        maxAttempts: maxAttempts,
        blocked: rateLimitData.attempts > maxAttempts,
        resetTime: new Date(rateLimitData.expiresAt)
      };
    } catch (error) {
      console.error('Error checking login rate limit:', error);
      return { attempts: 0, maxAttempts, blocked: false, resetTime: null };
    }
  }

  async resetLoginRateLimit(identifier) {
    try {
      const key = `login_attempts:${identifier}`;
      this.rateLimits.delete(key);
    } catch (error) {
      console.error('Error resetting login rate limit:', error);
    }
  }

  // Cleanup expired data
  async cleanupExpiredData() {
    try {
      // This would be called by a cron job
      // Redis automatically handles TTL expiration, but we can add custom cleanup logic here
      console.log('Running auth service cleanup...');
      
      // Add any custom cleanup logic here
      
    } catch (error) {
      console.error('Error during auth service cleanup:', error);
    }
  }

  // Health check
  isHealthy() {
    return !!this.jwtSecret;
  }

  // Get service status
  getStatus() {
    return {
      jwtConfigured: !!this.jwtSecret,
      refreshTokenCount: this.refreshTokens.size,
      blacklistedTokenCount: this.blacklistedTokens.size,
      sessionCount: this.sessions.size,
      userTokensCount: this.userTokens.size,
      rateLimitsCount: this.rateLimits.size,
      passwordResetsCount: this.passwordResets.size,
      emailVerificationsCount: this.emailVerifications.size,
      userActivityCount: this.userActivity.size,
      securityEventsCount: this.securityEvents.size,
      tokenExpirations: {
        access: this.jwtExpiresIn,
        refresh: this.jwtRefreshExpiresIn
      }
    };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;