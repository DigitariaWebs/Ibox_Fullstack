import express from 'express';
import { verifyFirebaseAuth } from '../middleware/firebaseAuth.js';
import { protect } from '../middleware/auth.js';
import { validateGoogleAuth, validateProfileCompletion } from '../middleware/validation.js';
import {
  googleAuth,
  completeGoogleProfile,
  linkGoogleAccount,
  unlinkGoogleAccount,
} from '../controllers/googleAuthController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/google
 * @desc    Sign in/up with Google using Firebase ID token
 * @access  Public
 * @body    { userType?: 'customer' | 'transporter', language?: string, phone?: string }
 * @header  Authorization: Bearer {firebase_id_token}
 */
router.post(
  '/google',
  verifyFirebaseAuth,
  validateGoogleAuth,
  googleAuth
);

/**
 * @route   PUT /api/v1/auth/google/complete-profile
 * @desc    Complete profile for Google-authenticated users
 * @access  Private
 * @body    { phone, userType, addresses, businessDetails?, transporterDetails? }
 */
router.put(
  '/google/complete-profile',
  protect,
  validateProfileCompletion,
  completeGoogleProfile
);

/**
 * @route   POST /api/v1/auth/google/link
 * @desc    Link Google account to existing user
 * @access  Private
 * @header  Authorization: Bearer {jwt_token}
 * @header  X-Firebase-Token: {firebase_id_token}
 */
router.post(
  '/google/link',
  protect,
  verifyFirebaseAuth,
  linkGoogleAccount
);

/**
 * @route   DELETE /api/v1/auth/google/unlink
 * @desc    Unlink Google account from user
 * @access  Private
 */
router.delete(
  '/google/unlink',
  protect,
  unlinkGoogleAccount
);

export default router;