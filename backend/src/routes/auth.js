import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import { protect, optionalAuth, rateLimitByUser } from '../middleware/auth.js';
import { 
  authValidation, 
  handleValidationErrors,
  sanitizeInput,
  rateLimitValidation 
} from '../middleware/validation.js';

const router = express.Router();

// Rate limiting configurations for different endpoints
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Apply general rate limiting to all auth routes
router.use(generalRateLimit);

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Public authentication routes
router.post('/register', 
  strictRateLimit,
  rateLimitValidation.checkIdentifier,
  authValidation.register,
  handleValidationErrors,
  authController.register
);

router.post('/login',
  strictRateLimit, 
  rateLimitValidation.checkIdentifier,
  authValidation.login,
  handleValidationErrors,
  authController.login
);

router.post('/refresh-token',
  moderateRateLimit,
  authValidation.refreshToken,
  handleValidationErrors,
  authController.refreshToken
);

router.post('/check-email',
  moderateRateLimit,
  authValidation.checkEmail,
  handleValidationErrors,
  authController.checkEmailAvailability
);

router.post('/forgot-password',
  strictRateLimit,
  rateLimitValidation.checkIdentifier,
  authValidation.forgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

router.post('/reset-password',
  strictRateLimit,
  rateLimitValidation.checkIdentifier,
  authValidation.resetPassword,
  handleValidationErrors,
  authController.resetPassword
);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString(),
    service: 'auth'
  });
});

// Protected authentication routes (require valid JWT)
router.use(protect); // All routes below require authentication

router.post('/logout',
  authController.logout
);

router.post('/logout-all',
  authController.logoutAll
);

router.get('/me',
  authController.getMe
);

router.put('/profile',
  rateLimitByUser(20, 60), // 20 requests per hour per user
  authValidation.updateProfile,
  handleValidationErrors,
  authController.updateProfile
);

router.post('/change-password',
  strictRateLimit,
  rateLimitByUser(3, 60), // 3 password changes per hour per user
  authValidation.changePassword,
  handleValidationErrors,
  authController.changePassword
);

router.get('/sessions',
  authController.getActiveSessions
);

// Route information endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/routes', optionalAuth, (req, res) => {
    const routes = [];
    
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: layer.route.path,
          methods: methods,
          auth: layer.route.path.includes('/me') || 
                layer.route.path.includes('/profile') || 
                layer.route.path.includes('/logout') ||
                layer.route.path.includes('/change-password') ||
                layer.route.path.includes('/sessions') ? 'required' : 'none'
        });
      }
    });

    res.json({
      success: true,
      message: 'Authentication routes',
      data: {
        routes: routes,
        baseUrl: '/api/v1/auth',
        authenticatedUser: req.user ? {
          id: req.user.id,
          email: req.user.email,
          userType: req.user.userType
        } : null
      }
    });
  });
}

// Error handling middleware specific to auth routes
router.use((err, req, res, next) => {
  console.error('Auth route error:', err);

  // Handle specific authentication errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error in authentication request',
      code: 'AUTH_VALIDATION_ERROR',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `A user with this ${field} already exists`,
      code: 'DUPLICATE_ERROR',
      field: field
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error in authentication service',
    code: 'AUTH_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;