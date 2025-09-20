import express from 'express';
import rateLimit from 'express-rate-limit';
import driverController from '../controllers/driverController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { 
  handleValidationErrors,
  sanitizeInput
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Apply authentication and admin restriction to all routes
router.use(protect);
router.use(restrictTo('admin'));

// ===== ADMIN VERIFICATION ROUTES =====

// Get all pending verifications with pagination
router.get('/verifications', 
  sanitizeInput,
  driverController.getAllPendingVerifications
);

// Get verification statistics
router.get('/verifications/stats',
  sanitizeInput,
  driverController.getVerificationStats
);

// Get detailed verification info for a specific driver
router.get('/verifications/:driverId',
  sanitizeInput,
  driverController.getDriverVerificationDetails
);

// Approve driver verification
router.post('/verifications/:driverId/approve',
  [
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 0, max: 500 })
      .withMessage('Notes must be a string with max 500 characters')
  ],
  handleValidationErrors,
  sanitizeInput,
  driverController.approveDriverVerification
);

// Reject driver verification
router.post('/verifications/:driverId/reject',
  [
    body('reason')
      .notEmpty()
      .isString()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Rejection reason is required and must be 10-200 characters'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 0, max: 500 })
      .withMessage('Notes must be a string with max 500 characters')
  ],
  handleValidationErrors,
  sanitizeInput,
  driverController.rejectDriverVerification
);

// Approve individual driver verification step
router.post('/verifications/:driverId/approve-step',
  [
    body('step')
      .notEmpty()
      .isString()
      .trim()
      .isIn(['profilePhoto', 'phoneVerified', 'driverLicense', 'vehiclePhotos', 'vehiclePlate', 'insurance', 'backgroundCheck'])
      .withMessage('Step is required and must be a valid verification step')
  ],
  handleValidationErrors,
  sanitizeInput,
  driverController.approveDriverStep
);

// Reject individual driver verification step
router.post('/verifications/:driverId/reject-step',
  [
    body('step')
      .notEmpty()
      .isString()
      .trim()
      .isIn(['profilePhoto', 'phoneVerified', 'driverLicense', 'vehiclePhotos', 'vehiclePlate', 'insurance', 'backgroundCheck'])
      .withMessage('Step is required and must be a valid verification step'),
    body('reason')
      .notEmpty()
      .isString()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Rejection reason is required and must be 10-200 characters')
  ],
  handleValidationErrors,
  sanitizeInput,
  driverController.rejectDriverStep
);

// ===== ADMIN DASHBOARD ROUTES =====

// Get admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // This will be expanded with more dashboard data
    res.json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: {
        admin: {
          id: req.userId,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin dashboard data',
      code: 'ADMIN_DASHBOARD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
