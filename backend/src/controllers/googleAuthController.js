import User from '../models/User.js';
import { getOrCreateFirebaseUser } from '../config/firebase.js';
import authService from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Google Sign-In/Sign-Up Handler
 * Handles both new user registration and existing user login via Google
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { firebaseUser } = req; // Set by verifyFirebaseAuth middleware
    
    if (!firebaseUser) {
      throw new AppError('Firebase user data not found', 401);
    }

    // Get Firebase user details
    const firebaseUserData = await getOrCreateFirebaseUser(firebaseUser);
    
    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: firebaseUserData.firebaseUid },
        { email: firebaseUserData.email },
        { googleId: firebaseUserData.firebaseUid }
      ]
    });

    if (user) {
      // Existing user - update their Google/Firebase info if needed
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUserData.firebaseUid;
      }
      if (!user.googleId) {
        user.googleId = firebaseUserData.firebaseUid;
      }
      if (!user.photoURL && firebaseUserData.photoURL) {
        user.photoURL = firebaseUserData.photoURL;
      }
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      
      // Update email verification status
      if (firebaseUserData.emailVerified && !user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
      
      console.log('✅ Existing user logged in via Google:', user.email);
    } else {
      // New user - create account
      const names = (firebaseUserData.displayName || '').split(' ');
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || '';
      
      // Extract user type from request or default to customer
      const userType = req.body.userType || 'customer';
      
      user = await User.create({
        firstName,
        lastName,
        email: firebaseUserData.email,
        phone: firebaseUserData.phoneNumber || req.body.phone || '',
        authProvider: 'google',
        firebaseUid: firebaseUserData.firebaseUid,
        googleId: firebaseUserData.firebaseUid,
        photoURL: firebaseUserData.photoURL,
        isEmailVerified: firebaseUserData.emailVerified || false,
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

    // Remove sensitive data from user object
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

/**
 * Complete Google user profile
 * For users who signed up with Google but need to provide additional info
 */
export const completeGoogleProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      phone,
      userType,
      addresses,
      businessDetails,
      transporterDetails,
    } = req.body;

    const updateData = {};
    
    // Only update fields that are provided
    if (phone) updateData.phone = phone;
    if (userType) updateData.userType = userType;
    if (addresses) updateData.addresses = addresses;
    
    // Add business details for business customers
    if (userType === 'customer' && businessDetails) {
      updateData.isBusiness = true;
      updateData.businessDetails = businessDetails;
    }
    
    // Add transporter details for transporters
    if (userType === 'transporter' && transporterDetails) {
      updateData.transporterDetails = transporterDetails;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link Google account to existing user
 * For users who signed up with email/password and want to add Google login
 */
export const linkGoogleAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { firebaseUser } = req;
    
    if (!firebaseUser) {
      throw new AppError('Firebase user data not found', 401);
    }

    const firebaseUserData = await getOrCreateFirebaseUser(firebaseUser);
    
    // Check if this Google account is already linked to another user
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      $or: [
        { firebaseUid: firebaseUserData.firebaseUid },
        { googleId: firebaseUserData.firebaseUid }
      ]
    });

    if (existingUser) {
      throw new AppError('This Google account is already linked to another user', 400);
    }

    // Link Google account to current user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        firebaseUid: firebaseUserData.firebaseUid,
        googleId: firebaseUserData.firebaseUid,
        photoURL: firebaseUserData.photoURL || undefined,
        isEmailVerified: true, // Google accounts are pre-verified
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Google account linked successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlink Google account from user
 */
export const unlinkGoogleAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('+password');
    
    // Check if user has a password set (can't unlink if no password)
    if (!user.password && user.authProvider === 'google') {
      throw new AppError('Please set a password before unlinking Google account', 400);
    }

    // Unlink Google account
    await User.findByIdAndUpdate(
      userId,
      {
        $unset: { 
          firebaseUid: 1, 
          googleId: 1,
          photoURL: 1 
        },
        authProvider: 'local',
      }
    );

    res.status(200).json({
      success: true,
      message: 'Google account unlinked successfully',
    });
  } catch (error) {
    next(error);
  }
};