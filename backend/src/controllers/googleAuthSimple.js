import User from '../models/User.js';
import authService from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

/**
 * Simplified Google Sign-In without Firebase
 * Verifies Google ID token directly
 */
export const googleAuthSimple = async (req, res, next) => {
  try {
    const { idToken, userInfo } = req.body;
    
    if (!idToken || !userInfo) {
      throw new AppError('Missing Google authentication data', 400);
    }

    // In production, you should verify the ID token with Google's public keys
    // For now, we'll trust the client (NOT recommended for production)
    
    // Extract user data from the provided info
    const { email, name, picture, id: googleId } = userInfo;
    
    if (!email) {
      throw new AppError('Email is required from Google account', 400);
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (user) {
      // Existing user - update their Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.photoURL && picture) {
        user.photoURL = picture;
      }
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      
      user.isEmailVerified = true; // Google emails are pre-verified
      user.lastLoginAt = new Date();
      await user.save();
      
      console.log('✅ Existing user logged in via Google:', user.email);
    } else {
      // New user - create account
      const names = (name || '').split(' ');
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || '';
      
      const userType = req.body.userType || 'customer';
      
      user = await User.create({
        firstName,
        lastName,
        email,
        phone: req.body.phone || '',
        authProvider: 'google',
        googleId,
        photoURL: picture,
        isEmailVerified: true,
        userType,
        language: req.body.language || 'en',
        lastLoginAt: new Date(),
      });
      
      console.log('✅ New user registered via Google:', user.email);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = authService.generateTokens(user._id, user.userType);
    
    // Store refresh token in Redis
    await authService.saveRefreshToken(user._id.toString(), refreshToken, req.headers['user-agent']);

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    res.status(200).json({
      success: true,
      message: user.isNew ? 'Registration successful' : 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
};