import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import redisConfig from '../config/redis.js';
import User from '../models/User.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
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

  // Save refresh token to Redis with user association
  async saveRefreshToken(userId, refreshToken, deviceInfo = null) {
    try {
      const decoded = jwt.decode(refreshToken);
      const tokenId = decoded.tokenId;
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      const tokenData = {
        userId: userId.toString(),
        token: refreshToken,
        createdAt: new Date().toISOString(),
        deviceInfo: deviceInfo,
        lastUsed: new Date().toISOString()
      };

      // Store token with its unique ID
      await redisConfig.setex(`refresh_token:${tokenId}`, expiresIn, JSON.stringify(tokenData));

      // Also maintain a list of user's active tokens
      const userTokensKey = `user_tokens:${userId}`;
      await redisConfig.client.sAdd(userTokensKey, tokenId);
      await redisConfig.expire(userTokensKey, expiresIn);

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

      // Check if refresh token exists in Redis
      const tokenKey = `refresh_token:${tokenId}`;
      const storedTokenData = await redisConfig.get(tokenKey);
      
      if (!storedTokenData) {
        throw new Error('Refresh token not found or expired');
      }

      const tokenData = JSON.parse(storedTokenData);
      
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

      // Remove from Redis
      await redisConfig.del(`refresh_token:${tokenId}`);

      // Remove from user's token set
      if (userId) {
        await redisConfig.client.sRem(`user_tokens:${userId}`, tokenId);
      }

      // Add to blacklist for remaining lifetime
      const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
      if (remainingTime > 0) {
        await redisConfig.setex(`blacklist:${tokenId}`, remainingTime, 'revoked');
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
      const tokenIds = await redisConfig.client.sMembers(userTokensKey);

      if (tokenIds && tokenIds.length > 0) {
        // Remove all tokens
        const deletePromises = tokenIds.map(tokenId => 
          redisConfig.del(`refresh_token:${tokenId}`)
        );
        await Promise.all(deletePromises);

        // Add tokens to blacklist
        const blacklistPromises = tokenIds.map(async tokenId => {
          // Get remaining time for blacklist
          const tokenData = await redisConfig.get(`refresh_token:${tokenId}`);
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            const decoded = jwt.decode(parsed.token);
            const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
            if (remainingTime > 0) {
              await redisConfig.setex(`blacklist:${tokenId}`, remainingTime, 'revoked');
            }
          }
        });
        await Promise.all(blacklistPromises);
      }

      // Clear user's token set
      await redisConfig.del(userTokensKey);
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

      const blacklistEntry = await redisConfig.get(`blacklist:${decoded.tokenId}`);
      return blacklistEntry !== null;
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

      // Store in Redis with expiration
      const resetData = {
        userId: userId.toString(),
        createdAt: new Date().toISOString(),
        expiresAt: expires.toISOString()
      };

      await redisConfig.setex(`password_reset:${token}`, 30 * 60, JSON.stringify(resetData));

      return { token, expires };
    } catch (error) {
      console.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  // Verify password reset token
  async verifyPasswordResetToken(token) {
    try {
      const resetData = await redisConfig.get(`password_reset:${token}`);
      
      if (!resetData) {
        throw new Error('Invalid or expired reset token');
      }

      const data = JSON.parse(resetData);
      const expiresAt = new Date(data.expiresAt);

      if (expiresAt < new Date()) {
        await redisConfig.del(`password_reset:${token}`);
        throw new Error('Reset token has expired');
      }

      return data.userId;
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
      await redisConfig.del(`password_reset:${token}`);
      
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
        expiresAt: expires.toISOString()
      };

      await redisConfig.setex(`email_verification:${token}`, 24 * 60 * 60, JSON.stringify(verificationData));

      return { token, expires };
    } catch (error) {
      console.error('Error generating email verification token:', error);
      throw new Error('Failed to generate email verification token');
    }
  }

  // Verify email verification token
  async verifyEmailVerificationToken(token) {
    try {
      const verificationData = await redisConfig.get(`email_verification:${token}`);
      
      if (!verificationData) {
        throw new Error('Invalid or expired verification token');
      }

      const data = JSON.parse(verificationData);
      const expiresAt = new Date(data.expiresAt);

      if (expiresAt < new Date()) {
        await redisConfig.del(`email_verification:${token}`);
        throw new Error('Verification token has expired');
      }

      // Delete the token after successful verification
      await redisConfig.del(`email_verification:${token}`);

      return {
        userId: data.userId,
        email: data.email
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
        ...sessionData
      };

      const ttl = 24 * 60 * 60; // 24 hours
      await redisConfig.setSession(sessionId, sessionInfo, ttl);

      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSession(sessionId) {
    try {
      return await redisConfig.getSession(sessionId);
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
        lastActivity: new Date().toISOString()
      };

      const ttl = 24 * 60 * 60; // 24 hours
      await redisConfig.setSession(sessionId, updatedSession, ttl);

      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      await redisConfig.deleteSession(sessionId);
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
        ...activity
      };

      const key = `user_activity:${userId}`;
      const ttl = 30 * 24 * 60 * 60; // 30 days
      
      await redisConfig.setex(key, ttl, JSON.stringify(activityData));
    } catch (error) {
      console.error('Error updating user activity:', error);
      // Don't throw error for activity tracking
    }
  }

  // Get user's active tokens count
  async getUserActiveTokensCount(userId) {
    try {
      const userTokensKey = `user_tokens:${userId}`;
      const tokenIds = await redisConfig.client.sMembers(userTokensKey);
      return tokenIds ? tokenIds.length : 0;
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
        details: details
      };

      const key = `security_events:${userId}:${Date.now()}`;
      const ttl = 90 * 24 * 60 * 60; // 90 days
      
      await redisConfig.setex(key, ttl, JSON.stringify(securityEvent));
      
      // Also maintain a counter for monitoring
      const counterKey = `security_counter:${userId}:${event}`;
      await redisConfig.incr(counterKey);
      await redisConfig.expire(counterKey, 24 * 60 * 60); // 24 hours
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Rate limiting for login attempts
  async checkLoginRateLimit(identifier, maxAttempts = 5, windowMinutes = 15) {
    try {
      const key = `login_attempts:${identifier}`;
      const windowSeconds = windowMinutes * 60;
      
      const attempts = await redisConfig.incrementRateLimit(key, windowSeconds);
      
      return {
        attempts: attempts,
        maxAttempts: maxAttempts,
        blocked: attempts > maxAttempts,
        resetTime: new Date(Date.now() + windowSeconds * 1000)
      };
    } catch (error) {
      console.error('Error checking login rate limit:', error);
      return { attempts: 0, maxAttempts, blocked: false, resetTime: null };
    }
  }

  async resetLoginRateLimit(identifier) {
    try {
      const key = `login_attempts:${identifier}`;
      await redisConfig.del(key);
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
    return redisConfig.isHealthy() && !!this.jwtSecret;
  }

  // Get service status
  getStatus() {
    return {
      jwtConfigured: !!this.jwtSecret,
      redisConnected: redisConfig.isHealthy(),
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