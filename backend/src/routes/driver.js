import express from 'express';
import rateLimit from 'express-rate-limit';
import driverController from '../controllers/driverController.js';
import { protect, restrictTo, requireVerification, rateLimitByUser } from '../middleware/auth.js';
import { 
  handleValidationErrors,
  sanitizeInput 
} from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Rate limiting for driver operations
const driverRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window (higher for real-time updates)
  message: {
    success: false,
    message: 'Too many driver requests from this IP, please try again later.',
    code: 'DRIVER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Apply rate limiting and input sanitization
router.use(driverRateLimit);
router.use(sanitizeInput);

// All driver routes require authentication and transporter user type
router.use(protect);
router.use(restrictTo('transporter'));

// ===== VERIFICATION ENDPOINTS =====

// Get driver verification status
router.get('/verification/status',
  driverController.getVerificationStatus
);

// Submit verification document
router.post('/verification/upload',
  rateLimitByUser(10, 60), // 10 uploads per hour
  [
    body('documentType')
      .isIn(['profile_photo', 'driver_license_front', 'driver_license_back', 'vehicle_front', 'vehicle_back', 'vehicle_side', 'license_plate', 'insurance'])
      .withMessage('Invalid document type'),
    body('documentUrl')
      .isURL()
      .withMessage('Valid document URL is required')
  ],
  handleValidationErrors,
  driverController.uploadVerificationDocument
);

// Submit background check consent
router.post('/verification/consent',
  rateLimitByUser(5, 60), // 5 consent submissions per hour
  [
    body('consentGiven')
      .isBoolean()
      .withMessage('Consent must be true or false'),
    body('consentDate')
      .isISO8601()
      .withMessage('Valid consent date is required')
  ],
  handleValidationErrors,
  driverController.submitBackgroundConsent
);

// ===== PHONE VERIFICATION ENDPOINTS =====

// Send phone verification SMS
router.post('/verification/phone/send',
  rateLimitByUser(10, 60), // Temporarily increased to 10 SMS sends per hour for testing
  driverController.sendPhoneVerification
);

// Verify phone with SMS code
router.post('/verification/phone/verify',
  rateLimitByUser(10, 60), // 10 verification attempts per hour
  [
    body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Verification code must be a 6-digit number')
  ],
  handleValidationErrors,
  driverController.verifyPhoneCode
);

// Resend phone verification SMS
router.post('/verification/phone/resend',
  rateLimitByUser(5, 60), // Temporarily increased to 5 resends per hour for testing
  driverController.resendPhoneVerification
);

// ===== STATISTICS ENDPOINTS =====

// Get today's driver statistics
router.get('/stats/today',
  driverController.getTodayStats
);

// Get weekly driver statistics
router.get('/stats/weekly',
  driverController.getWeeklyStats
);

// Get monthly driver statistics
router.get('/stats/monthly',
  driverController.getMonthlyStats
);

// ===== DELIVERY ENDPOINTS =====

// Get available deliveries for driver
router.get('/deliveries/available',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('serviceType')
      .optional()
      .isIn(['Express', 'Standard', 'Moving', 'Food'])
      .withMessage('Invalid service type'),
    query('maxDistance')
      .optional()
      .isFloat({ min: 1, max: 100 })
      .withMessage('Max distance must be between 1 and 100 km')
  ],
  handleValidationErrors,
  driverController.getAvailableDeliveries
);

// Accept a delivery request
router.post('/deliveries/:orderId/accept',
  requireVerification(['email', 'transporter']),
  rateLimitByUser(20, 60), // 20 accepts per hour
  [
    param('orderId')
      .isMongoId()
      .withMessage('Valid order ID is required')
  ],
  handleValidationErrors,
  driverController.acceptDelivery
);

// Get driver's active deliveries
router.get('/deliveries/active',
  driverController.getActiveDeliveries
);

// Get driver's delivery history
router.get('/deliveries/history',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  driverController.getDeliveryHistory
);

// Update delivery status
router.put('/deliveries/:orderId/status',
  rateLimitByUser(50, 60), // 50 status updates per hour
  [
    param('orderId')
      .isMongoId()
      .withMessage('Valid order ID is required'),
    body('status')
      .isIn(['accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object with lat and lng')
  ],
  handleValidationErrors,
  driverController.updateDeliveryStatus
);

// ===== STATUS & AVAILABILITY ENDPOINTS =====

// Update driver online/offline status
router.put('/status',
  rateLimitByUser(30, 60), // 30 status changes per hour
  [
    body('online')
      .isBoolean()
      .withMessage('Online status must be true or false'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object with lat and lng coordinates')
  ],
  handleValidationErrors,
  driverController.updateOnlineStatus
);

// Get driver status
router.get('/status',
  driverController.getDriverStatus
);

// ===== NOTIFICATION ENDPOINTS =====

// Get driver notifications (driver-specific filtering)
router.get('/notifications',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('type')
      .optional()
      .isIn(['delivery', 'earning', 'alert', 'system'])
      .withMessage('Invalid notification type'),
    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('UnreadOnly must be true or false')
  ],
  handleValidationErrors,
  driverController.getNotifications
);

// Get notification count
router.get('/notifications/count',
  driverController.getNotificationCount
);

// Mark notification as read
router.patch('/notifications/:notificationId/read',
  [
    param('notificationId')
      .isMongoId()
      .withMessage('Valid notification ID is required')
  ],
  handleValidationErrors,
  driverController.markNotificationRead
);

// ===== EARNINGS ENDPOINTS =====

// Get driver earnings summary
router.get('/earnings',
  [
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'year'])
      .withMessage('Invalid period. Must be today, week, month, or year'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  driverController.getEarnings
);

// Get earnings breakdown
router.get('/earnings/breakdown',
  [
    query('period')
      .optional()
      .isIn(['week', 'month', 'year'])
      .withMessage('Invalid period. Must be week, month, or year')
  ],
  handleValidationErrors,
  driverController.getEarningsBreakdown
);

// ===== PERFORMANCE ENDPOINTS =====

// Get driver performance metrics
router.get('/performance',
  driverController.getPerformanceMetrics
);

// Get driver rating details
router.get('/rating',
  driverController.getRatingDetails
);

// ===== LOCATION ENDPOINTS =====

// Update driver location (for real-time tracking)
router.put('/location',
  rateLimitByUser(60, 60), // 60 location updates per hour
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    body('accuracy')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Accuracy must be a positive number'),
    body('heading')
      .optional()
      .isFloat({ min: 0, max: 360 })
      .withMessage('Heading must be between 0 and 360 degrees')
  ],
  handleValidationErrors,
  driverController.updateLocation
);

// ===== DOCUMENTATION ENDPOINT =====

// Get API documentation for driver endpoints
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API Documentation',
    version: '1.0.0',
    endpoints: {
      'GET /verification/status': 'Get driver verification status',
      'POST /verification/upload': 'Upload verification document',
      'POST /verification/consent': 'Submit background check consent',
      'GET /stats/today': 'Get today\'s statistics',
      'GET /stats/weekly': 'Get weekly statistics', 
      'GET /stats/monthly': 'Get monthly statistics',
      'GET /deliveries/available': 'Get available deliveries',
      'POST /deliveries/:orderId/accept': 'Accept a delivery',
      'GET /deliveries/active': 'Get active deliveries',
      'GET /deliveries/history': 'Get delivery history',
      'PUT /deliveries/:orderId/status': 'Update delivery status',
      'PUT /status': 'Update online/offline status',
      'GET /status': 'Get current driver status',
      'GET /notifications': 'Get driver notifications',
      'GET /notifications/count': 'Get notification count',
      'PATCH /notifications/:id/read': 'Mark notification as read',
      'GET /earnings': 'Get earnings summary',
      'GET /earnings/breakdown': 'Get earnings breakdown',
      'GET /performance': 'Get performance metrics',
      'GET /rating': 'Get rating details',
      'PUT /location': 'Update driver location'
    },
    authentication: 'Bearer token required',
    userType: 'transporter only',
    rateLimit: '200 requests per 15 minutes'
  });
});

export default router;

