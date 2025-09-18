import express from 'express';
import rateLimit from 'express-rate-limit';
import serviceController from '../controllers/serviceController.js';
import { protect, restrictTo, rateLimitByUser } from '../middleware/auth.js';
import { 
  authValidation,
  handleValidationErrors,
  sanitizeInput 
} from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Rate limiting for different endpoints
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // requests per window
  message: {
    success: false,
    message: 'Too many search requests, please try again later.',
    code: 'SEARCH_RATE_LIMIT'
  }
});

const bookingRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // bookings per window
  message: {
    success: false,
    message: 'Too many booking attempts, please try again later.',
    code: 'BOOKING_RATE_LIMIT'
  }
});

// Validation schemas
const coordinatesValidation = [
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

const locationValidation = [
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  ...coordinatesValidation.map(validator => 
    validator.optional()
  )
];

const packageDetailsValidation = [
  body('packageDetails.description')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Package description must be between 5 and 1000 characters'),
  body('packageDetails.weight')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Weight must be between 0 and 50000 kg'),
  body('packageDetails.dimensions.length')
    .optional()
    .custom((value, { req }) => {
      // Only validate if dimensions object exists
      if (req.body.packageDetails?.dimensions && value !== undefined) {
        if (typeof value !== 'number' || value <= 0) {
          throw new Error('Length must be a positive number');
        }
      }
      return true;
    }),
  body('packageDetails.dimensions.width')
    .optional()
    .custom((value, { req }) => {
      // Only validate if dimensions object exists
      if (req.body.packageDetails?.dimensions && value !== undefined) {
        if (typeof value !== 'number' || value <= 0) {
          throw new Error('Width must be a positive number');
        }
      }
      return true;
    }),
  body('packageDetails.dimensions.height')
    .optional()
    .custom((value, { req }) => {
      // Only validate if dimensions object exists
      if (req.body.packageDetails?.dimensions && value !== undefined) {
        if (typeof value !== 'number' || value <= 0) {
          throw new Error('Height must be a positive number');
        }
      }
      return true;
    }),
  body('packageDetails.fragile')
    .optional()
    .isBoolean()
    .withMessage('Fragile must be a boolean'),
  body('packageDetails.perishable')
    .optional()
    .isBoolean()
    .withMessage('Perishable must be a boolean'),
  body('packageDetails.hazardous')
    .optional()
    .isBoolean()
    .withMessage('Hazardous must be a boolean')
];

const pricingValidation = [
  body('pickupLocation')
    .isObject()
    .withMessage('Pickup location is required'),
  body('pickupLocation.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Pickup address must be between 5 and 200 characters'),
  body('pickupLocation.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  body('pickupLocation.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  body('dropoffLocation')
    .isObject()
    .withMessage('Dropoff location is required'),
  body('dropoffLocation.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Dropoff address must be between 5 and 200 characters'),
  body('dropoffLocation.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Dropoff latitude must be between -90 and 90'),
  body('dropoffLocation.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Dropoff longitude must be between -180 and 180'),
  body('packageDetails')
    .isObject()
    .withMessage('Package details are required'),
  ...packageDetailsValidation,
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Scheduled time must be a valid ISO 8601 date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  body('additionalServices')
    .optional()
    .isArray()
    .withMessage('Additional services must be an array'),
  body('additionalServices.*.type')
    .optional()
    .isIn([
      'fragile_handling', 'temperature_controlled', 'white_glove',
      'assembly_required', 'disassembly_required', 'packing_service',
      'unpacking_service', 'furniture_moving', 'appliance_moving',
      'piano_moving', 'art_handling'
    ])
    .withMessage('Invalid additional service type')
];

const bookingValidation = [
  ...pricingValidation,
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be low, normal, high, or urgent'),
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer', 'cash', 'wallet'])
    .withMessage('Invalid payment method'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions cannot exceed 1000 characters')
];

// Query parameter validation
const serviceQueryValidation = [
  query('category')
    .optional()
    .isIn(['delivery', 'moving', 'storage', 'logistics', 'express', 'specialized'])
    .withMessage('Invalid service category'),
  query('serviceType')
    .optional()
    .isIn(['express', 'standard', 'moving', 'storage', 'same_day', 'next_day', 'scheduled', 'on_demand'])
    .withMessage('Invalid service type'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isInt({ min: 1000, max: 100000 })
    .withMessage('Radius must be between 1000 and 100000 meters'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('sortBy')
    .optional()
    .isIn(['popularity', 'rating', 'price_low', 'price_high', 'newest', 'name'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const searchQueryValidation = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('category')
    .optional()
    .isIn(['delivery', 'moving', 'storage', 'logistics', 'express', 'specialized'])
    .withMessage('Invalid service category'),
  query('serviceType')
    .optional()
    .isIn(['express', 'standard', 'moving', 'storage', 'same_day', 'next_day', 'scheduled', 'on_demand'])
    .withMessage('Invalid service type'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Apply general rate limiting to all routes
router.use(generalRateLimit);

// Public routes (no authentication required)

// Get all services with filtering and pagination
router.get('/',
  serviceQueryValidation,
  handleValidationErrors,
  sanitizeInput,
  serviceController.getServices
);

// Search services
router.get('/search',
  searchRateLimit,
  searchQueryValidation,
  handleValidationErrors,
  sanitizeInput,
  serviceController.searchServices
);

// Get service categories
router.get('/categories',
  serviceController.getServiceCategories
);

// Get popular services
router.get('/popular',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('category')
    .optional()
    .isIn(['delivery', 'moving', 'storage', 'logistics', 'express', 'specialized'])
    .withMessage('Invalid service category'),
  handleValidationErrors,
  sanitizeInput,
  serviceController.getPopularServices
);

// Get service details by ID or slug
router.get('/:serviceId',
  param('serviceId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Service ID is required'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors,
  sanitizeInput,
  serviceController.getServiceDetails
);

// Get service availability
router.get('/:serviceId/availability',
  param('serviceId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Service ID is required'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  handleValidationErrors,
  sanitizeInput,
  serviceController.getServiceAvailability
);

// Protected routes (authentication required)

// Calculate service pricing
router.post('/:serviceId/pricing',
  protect,
  rateLimitByUser(20, 60), // 20 requests per minute per user
  param('serviceId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Service ID is required'),
  pricingValidation,
  handleValidationErrors,
  sanitizeInput,
  serviceController.calculatePricing
);

// Book a service
router.post('/:serviceId/book',
  protect,
  restrictTo('customer'), // Only customers can book services
  bookingRateLimit,
  rateLimitByUser(5, 300), // 5 bookings per 5 minutes per user
  param('serviceId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Service ID is required'),
  bookingValidation,
  handleValidationErrors,
  sanitizeInput,
  serviceController.bookService
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Services route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      })),
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;
