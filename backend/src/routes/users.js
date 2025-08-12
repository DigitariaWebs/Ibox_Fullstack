import express from 'express';
import rateLimit from 'express-rate-limit';
import userController from '../controllers/userController.js';
import { protect, restrictTo, requireVerification, rateLimitByUser } from '../middleware/auth.js';
import { 
  authValidation,
  userValidation,
  handleValidationErrors,
  sanitizeInput 
} from '../middleware/validation.js';
import { body, param } from 'express-validator';

const router = express.Router();

// Rate limiting for user operations
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Too many user requests from this IP, please try again later.',
    code: 'USER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Apply rate limiting to all user routes
router.use(userRateLimit);

// Apply input sanitization to all routes
router.use(sanitizeInput);

// All user routes require authentication
router.use(protect);

// Get user profile (extended profile information)
router.get('/profile', 
  userController.getProfile
);

// Update user profile
router.put('/profile',
  rateLimitByUser(10, 60), // 10 profile updates per hour
  authValidation.updateProfile,
  handleValidationErrors,
  userController.updateProfile
);

// Get user statistics
router.get('/stats',
  userController.getUserStats
);

// Address management routes
router.get('/addresses',
  userController.getAddresses
);

// Add new address
router.post('/addresses',
  rateLimitByUser(5, 60), // 5 addresses per hour
  [
    body('address')
      .notEmpty()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    
    body('type')
      .optional()
      .isIn(['primary', 'secondary', 'work', 'other'])
      .withMessage('Address type must be primary, secondary, work, or other'),
    
    body('coordinates')
      .optional()
      .isObject()
      .withMessage('Coordinates must be an object'),
    
    body('coordinates.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    
    body('coordinates.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    
    body('contactPerson')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Contact person name cannot exceed 100 characters'),
    
    body('contactPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be true or false')
  ],
  handleValidationErrors,
  userController.addAddress
);

// Update address
router.put('/addresses/:addressId',
  rateLimitByUser(10, 60), // 10 address updates per hour
  [
    param('addressId')
      .isMongoId()
      .withMessage('Invalid address ID'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    
    body('type')
      .optional()
      .isIn(['primary', 'secondary', 'work', 'other'])
      .withMessage('Address type must be primary, secondary, work, or other'),
    
    body('coordinates')
      .optional()
      .isObject()
      .withMessage('Coordinates must be an object'),
    
    body('coordinates.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    
    body('coordinates.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    
    body('contactPerson')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Contact person name cannot exceed 100 characters'),
    
    body('contactPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be true or false')
  ],
  handleValidationErrors,
  userController.updateAddress
);

// Delete address
router.delete('/addresses/:addressId',
  rateLimitByUser(5, 60), // 5 address deletions per hour
  [
    param('addressId')
      .isMongoId()
      .withMessage('Invalid address ID')
  ],
  handleValidationErrors,
  userController.deleteAddress
);

// Transporter-specific routes
router.put('/transporter-details',
  restrictTo('transporter'),
  rateLimitByUser(5, 60), // 5 transporter updates per hour
  userValidation.updateTransporterDetails,
  handleValidationErrors,
  userController.updateTransporterDetails
);

// Account management routes
router.post('/deactivate',
  rateLimitByUser(1, 1440), // 1 deactivation per day
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
    
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback cannot exceed 1000 characters')
  ],
  handleValidationErrors,
  userController.deactivateAccount
);

// File upload routes (redirect to upload service)
router.post('/upload-avatar',
  rateLimitByUser(3, 60), // 3 avatar uploads per hour
  (req, res) => {
    res.json({
      success: true,
      message: 'Use /api/v1/upload/profile-picture endpoint for file uploads',
      redirect: '/api/v1/upload/profile-picture',
      method: 'POST'
    });
  }
);

router.post('/upload-document',
  restrictTo('transporter'),
  rateLimitByUser(5, 60), // 5 document uploads per hour
  (req, res) => {
    res.json({
      success: true,
      message: 'Use /api/v1/upload/documents endpoint for document uploads',
      redirect: '/api/v1/upload/documents',
      method: 'POST'
    });
  }
);

// Development routes (only in development environment)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/routes', (req, res) => {
    const routes = [];
    
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: layer.route.path,
          methods: methods,
          description: getRouteDescription(layer.route.path, methods)
        });
      }
    });

    res.json({
      success: true,
      message: 'User management routes',
      data: {
        routes: routes,
        baseUrl: '/api/v1/users',
        authenticatedUser: req.user ? {
          id: req.user.id,
          email: req.user.email,
          userType: req.user.userType
        } : null
      }
    });
  });
}

function getRouteDescription(path, method) {
  const descriptions = {
    'GET /profile': 'Get extended user profile information',
    'PUT /profile': 'Update user profile details',
    'GET /stats': 'Get user statistics and metrics',
    'GET /addresses': 'Get all user addresses',
    'POST /addresses': 'Add new address',
    'PUT /addresses/:addressId': 'Update existing address',
    'DELETE /addresses/:addressId': 'Delete address',
    'PUT /transporter-details': 'Update transporter-specific details',
    'POST /deactivate': 'Deactivate user account',
    'POST /upload-avatar': 'Upload profile picture',
    'POST /upload-document': 'Upload transporter documents'
  };

  return descriptions[`${method} ${path}`] || 'User management endpoint';
}

// Error handling middleware specific to user routes
router.use((err, req, res, next) => {
  console.error('User route error:', err);

  // Handle specific user-related errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error in user request',
      code: 'USER_VALIDATION_ERROR',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err.name === 'CastError' && err.path === '_id') {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format',
      code: 'INVALID_USER_ID'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error in user management service',
    code: 'USER_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;