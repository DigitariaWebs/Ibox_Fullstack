import { verifyFirebaseToken } from '../config/firebase.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify Firebase ID tokens
 */
export const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No Firebase token provided',
      });
    }

    const idToken = authHeader.split(' ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // Attach decoded token to request
    req.firebaseUser = decodedToken;
    
    // Try to find the user in MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token',
      error: error.message,
    });
  }
};

/**
 * Optional Firebase auth - doesn't fail if no token provided
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const idToken = authHeader.split(' ')[1];
    
    try {
      const decodedToken = await verifyFirebaseToken(idToken);
      req.firebaseUser = decodedToken;
      
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silent fail - optional auth
      console.log('Optional Firebase auth failed:', error.message);
    }
    
    next();
  } catch (error) {
    next();
  }
};