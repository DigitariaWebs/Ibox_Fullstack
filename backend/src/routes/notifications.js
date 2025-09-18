import express from 'express';
import rateLimit from 'express-rate-limit';
import notificationController from '../controllers/notificationController.js';
import { protect, rateLimitByUser } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// Rate limiting for notification operations
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many notification requests from this IP, please try again later.',
    code: 'NOTIFICATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Apply rate limiting and input sanitization
router.use(notificationRateLimit);
router.use(sanitizeInput);

// All notification routes require authentication
router.use(protect);

// Get user notifications (paginated)
router.get('/',
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
  notificationController.getNotifications
);

// Get unread notification count
router.get('/unread-count',
  notificationController.getUnreadCount
);

// Mark specific notification as read
router.patch('/:notificationId/read',
  rateLimitByUser(20, 60), // 20 mark-as-read operations per hour
  [
    param('notificationId')
      .matches(/^notif_[0-9]+_[a-zA-Z0-9]{9}$/)
      .withMessage('Invalid notification ID format')
  ],
  handleValidationErrors,
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/mark-all-read',
  rateLimitByUser(5, 60), // 5 mark-all-read operations per hour
  notificationController.markAllAsRead
);

// Development and testing routes
if (process.env.NODE_ENV === 'development') {
  // Send test notification
  router.post('/test',
    rateLimitByUser(10, 60), // 10 test notifications per hour
    [
      body('title')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
      
      body('body')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Body must be between 1 and 500 characters'),
      
      body('type')
        .optional()
        .isIn(['push', 'email', 'sms'])
        .withMessage('Type must be push, email, or sms'),
      
      body('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object')
    ],
    handleValidationErrors,
    notificationController.sendTestNotification
  );

  // Send system announcement
  router.post('/system-announcement',
    rateLimitByUser(2, 60), // 2 system announcements per hour
    [
      body('message')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),
      
      body('level')
        .optional()
        .isIn(['info', 'warning', 'error', 'success'])
        .withMessage('Level must be info, warning, error, or success'),
      
      body('targetUserType')
        .optional()
        .isIn(['customer', 'transporter'])
        .withMessage('Target user type must be customer or transporter')
    ],
    handleValidationErrors,
    notificationController.sendSystemAnnouncement
  );

  // Get notification statistics
  router.get('/stats',
    rateLimitByUser(10, 60), // 10 stats requests per hour
    notificationController.getNotificationStats
  );

  // Clean up old notifications
  router.post('/cleanup',
    rateLimitByUser(1, 60), // 1 cleanup per hour
    [
      query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365')
    ],
    handleValidationErrors,
    notificationController.cleanupOldNotifications
  );

  // Debug route
  router.get('/debug/routes', (req, res) => {
    const routes = [];
    
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: layer.route.path,
          methods: methods,
          description: getRouteDescription(layer.route.path, methods),
          access: getRouteAccess(layer.route.path)
        });
      }
    });

    res.json({
      success: true,
      message: 'Notification system routes',
      data: {
        routes: routes,
        baseUrl: '/api/v1/notifications',
        features: {
          realTimeDelivery: 'Socket.io integration',
          offlineStorage: 'Redis-based storage with 30-day retention',
          pushNotifications: 'Push notification service integration (TODO)',
          emailNotifications: 'SMTP integration (TODO)',
          smsNotifications: 'Twilio integration (TODO)'
        },
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
    'GET /': 'Get user notifications (paginated)',
    'GET /unread-count': 'Get unread notification count',
    'PATCH /:notificationId/read': 'Mark specific notification as read',
    'PATCH /mark-all-read': 'Mark all notifications as read',
    'POST /test': 'Send test notification (development only)',
    'POST /system-announcement': 'Send system announcement (development only)',
    'GET /stats': 'Get notification statistics (development only)',
    'POST /cleanup': 'Clean up old notifications (development only)'
  };

  return descriptions[`${method} ${path}`] || 'Notification endpoint';
}

function getRouteAccess(path) {
  if (path.includes('/test') || path.includes('/system-announcement') || 
      path.includes('/stats') || path.includes('/cleanup')) {
    return 'development only';
  }
  return 'authenticated users';
}

// Error handling middleware specific to notification routes
router.use((err, req, res, next) => {
  console.error('Notification route error:', err);

  // Handle specific notification-related errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error in notification request',
      code: 'NOTIFICATION_VALIDATION_ERROR',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err.message && err.message.includes('Redis')) {
    return res.status(503).json({
      success: false,
      message: 'Notification service temporarily unavailable',
      code: 'NOTIFICATION_SERVICE_UNAVAILABLE'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error in notification service',
    code: 'NOTIFICATION_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;