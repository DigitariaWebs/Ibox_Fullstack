import express from 'express';
import rateLimit from 'express-rate-limit';
import orderController from '../controllers/orderController.js';
import { protect, restrictTo, requireVerification, rateLimitByUser } from '../middleware/auth.js';
import { 
  orderValidation,
  queryValidation,
  handleValidationErrors,
  sanitizeInput 
} from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Rate limiting for order operations
const orderRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many order requests from this IP, please try again later.',
    code: 'ORDER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Stricter rate limiting for order creation
const orderCreationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 order creations per window
  message: {
    success: false,
    message: 'Too many order creation requests. Please try again in a few minutes.',
    code: 'ORDER_CREATION_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Apply rate limiting to all order routes
router.use(orderRateLimit);

// Apply input sanitization to all routes
router.use(sanitizeInput);

// All order routes require authentication
router.use(protect);

// Create new order (customers only)
router.post('/',
  restrictTo('customer'),
  orderCreationRateLimit,
  rateLimitByUser(5, 60), // 5 orders per hour per customer
  orderValidation.create,
  handleValidationErrors,
  orderController.createOrder
);

// Get user's orders (with pagination and filtering)
router.get('/',
  [
    ...queryValidation.pagination,
    query('status')
      .optional()
      .isIn([
        'pending', 'accepted', 'pickup_scheduled', 'en_route_pickup',
        'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery',
        'delivered', 'cancelled', 'failed', 'returned', 'storage_requested', 'in_storage'
      ])
      .withMessage('Invalid status filter'),
    
    query('serviceType')
      .optional()
      .isIn(['express', 'standard', 'moving', 'storage'])
      .withMessage('Invalid service type filter')
  ],
  handleValidationErrors,
  orderController.getUserOrders
);

// Get nearby orders (transporters only)
router.get('/nearby',
  restrictTo('transporter'),
  requireVerification(['email', 'transporter']),
  [
    query('lat')
      .notEmpty()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    
    query('lng')
      .notEmpty()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    
    query('radius')
      .optional()
      .isInt({ min: 100, max: 50000 })
      .withMessage('Radius must be between 100 and 50000 meters'),
    
    query('serviceType')
      .optional()
      .isIn(['express', 'standard', 'moving', 'storage'])
      .withMessage('Invalid service type filter'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  orderController.getNearbyOrders
);

// Get specific order details
router.get('/:orderId',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  orderController.getOrderDetails
);

// Update order status (transporters only)
router.put('/:orderId/status',
  restrictTo('transporter'),
  rateLimitByUser(20, 60), // 20 status updates per hour per transporter
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    ...orderValidation.updateStatus
  ],
  handleValidationErrors,
  orderController.updateOrderStatus
);

// Accept order (transporters only)
router.post('/:orderId/accept',
  restrictTo('transporter'),
  requireVerification(['email', 'transporter']),
  rateLimitByUser(10, 60), // 10 order accepts per hour per transporter
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    body('estimatedPickupTime')
      .optional()
      .isISO8601()
      .withMessage('Estimated pickup time must be a valid date')
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('Estimated pickup time must be in the future');
        }
        return true;
      })
  ],
  handleValidationErrors,
  orderController.acceptOrder
);

// Cancel order
router.post('/:orderId/cancel',
  rateLimitByUser(5, 60), // 5 cancellations per hour per user
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    body('reason')
      .optional()
      .isIn([
        'customer_request', 'transporter_unavailable', 'pickup_failed',
        'delivery_failed', 'payment_failed', 'system_error', 'other'
      ])
      .withMessage('Invalid cancellation reason'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],
  handleValidationErrors,
  orderController.cancelOrder
);

// Rate order (customers and transporters)
router.post('/:orderId/rate',
  rateLimitByUser(10, 1440), // 10 ratings per day per user
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    ...orderValidation.rating
  ],
  handleValidationErrors,
  orderController.rateOrder
);

// Order tracking and real-time updates (placeholder for Socket.io integration)
router.get('/:orderId/tracking',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  orderController.getOrderTracking
);

// Update order location (transporters only, for real-time tracking)
router.put('/:orderId/location',
  restrictTo('transporter'),
  rateLimitByUser(60, 60), // 60 location updates per hour
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    body('lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    
    body('lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    
    body('accuracy')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Accuracy must be a positive number'),
    
    body('bearing')
      .optional()
      .isFloat({ min: 0, max: 360 })
      .withMessage('Bearing must be between 0 and 360 degrees'),
    
    body('speed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Speed must be a positive number')
  ],
  handleValidationErrors,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Real-time location updates not implemented yet. Coming with Socket.io integration.',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

// Order messaging (placeholder for chat feature)
router.post('/:orderId/messages',
  rateLimitByUser(50, 60), // 50 messages per hour per user
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    
    body('type')
      .optional()
      .isIn(['text', 'image', 'location'])
      .withMessage('Message type must be text, image, or location')
  ],
  handleValidationErrors,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Order messaging not implemented yet. Coming with Socket.io integration.',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

router.get('/:orderId/messages',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    
    ...queryValidation.pagination
  ],
  handleValidationErrors,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Order messaging not implemented yet. Coming with Socket.io integration.',
      code: 'NOT_IMPLEMENTED'
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
          description: getRouteDescription(layer.route.path, methods),
          access: getRouteAccess(layer.route.path)
        });
      }
    });

    res.json({
      success: true,
      message: 'Order management routes',
      data: {
        routes: routes,
        baseUrl: '/api/v1/orders',
        authenticatedUser: req.user ? {
          id: req.user.id,
          email: req.user.email,
          userType: req.user.userType
        } : null
      }
    });
  });

  // Debug endpoint to get order statistics
  router.get('/debug/stats', async (req, res) => {
    try {
      const Order = (await import('../models/Order.js')).default;
      
      const stats = await Order.getOrderStats();
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const activeOrders = await Order.countDocuments({ 
        status: { $in: ['accepted', 'pickup_scheduled', 'en_route_pickup', 'picked_up', 'en_route_delivery'] }
      });
      
      res.json({
        success: true,
        message: 'Order statistics',
        data: {
          totalOrders,
          pendingOrders,
          activeOrders,
          statusDistribution: stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting order statistics',
        error: error.message
      });
    }
  });
}

function getRouteDescription(path, method) {
  const descriptions = {
    'POST /': 'Create new order (customers only)',
    'GET /': 'Get user orders with pagination and filtering',
    'GET /nearby': 'Get nearby pending orders (transporters only)',
    'GET /:orderId': 'Get specific order details',
    'PUT /:orderId/status': 'Update order status (transporters only)',
    'POST /:orderId/accept': 'Accept order (transporters only)',
    'POST /:orderId/cancel': 'Cancel order',
    'POST /:orderId/rate': 'Rate completed order',
    'GET /:orderId/tracking': 'Get order tracking info (coming soon)',
    'PUT /:orderId/location': 'Update transporter location (coming soon)',
    'POST /:orderId/messages': 'Send message in order chat (coming soon)',
    'GET /:orderId/messages': 'Get order messages (coming soon)'
  };

  return descriptions[`${method} ${path}`] || 'Order management endpoint';
}

function getRouteAccess(path) {
  if (path.includes('/nearby') || path.includes('/accept') || path.includes('/location') || path.includes('/status')) {
    return 'transporters only';
  }
  if (path === '/') {
    return 'customers only (POST), all authenticated (GET)';
  }
  return 'all authenticated users';
}

// Error handling middleware specific to order routes
router.use((err, req, res, next) => {
  console.error('Order route error:', err);

  // Handle specific order-related errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error in order request',
      code: 'ORDER_VALIDATION_ERROR',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err.name === 'CastError' && err.path === '_id') {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID format',
      code: 'INVALID_ORDER_ID'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate order operation not allowed',
      code: 'DUPLICATE_ORDER_OPERATION'
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error in order management service',
    code: 'ORDER_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;