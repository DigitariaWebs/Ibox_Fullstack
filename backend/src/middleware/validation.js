import { body, param, query, validationResult } from 'express-validator';

// Common validation rules
export const commonValidations = {
  // Name validation
  firstName: body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email address cannot exceed 100 characters'),

  // Phone validation
  phone: body('phone')
    .isMobilePhone(['en-US', 'en-CA', 'en-GB', 'fr-FR', 'ar-DZ', 'ar-MA', 'ar-TN', 'ar-EG', 'ar-SA', 'ar-AE', 'hi-IN', 'zh-CN', 'ja-JP', 'en-AU', 'pt-BR', 'es-MX', 'de-DE', 'it-IT', 'es-ES'])
    .withMessage('Please provide a valid phone number')
    .custom((value) => {
      // Remove all non-digit characters and check length
      const digits = value.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        throw new Error('Phone number must be between 10 and 15 digits');
      }
      return true;
    }),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  // Simple password (for development/testing)
  simplePassword: body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters long'),

  // User type validation
  userType: body('userType')
    .isIn(['customer', 'transporter', 'admin'])
    .withMessage('User type must be customer, transporter, or admin'),

  // Language validation
  language: body('language')
    .optional()
    .isIn(['en', 'fr'])
    .withMessage('Language must be either en or fr'),

  // MongoDB ObjectId validation
  objectId: (fieldName) => param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} must be a valid ID`),

  // Coordinates validation
  coordinates: body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object')
    .custom((value) => {
      if (value && typeof value === 'object') {
        if (typeof value.lat !== 'number' || value.lat < -90 || value.lat > 90) {
          throw new Error('Latitude must be a number between -90 and 90');
        }
        if (typeof value.lng !== 'number' || value.lng < -180 || value.lng > 180) {
          throw new Error('Longitude must be a number between -180 and 180');
        }
      }
      return true;
    })
};

// Authentication validation rules
export const authValidation = {
  register: [
    commonValidations.firstName,
    commonValidations.lastName,
    commonValidations.email,
    commonValidations.phone,
    commonValidations.simplePassword, // Using simple password for easier development
    commonValidations.userType,
    commonValidations.language,
    
    // Optional address
    body('address')
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    
    commonValidations.coordinates,
    
    // Platform info
    body('platform')
      .optional()
      .isIn(['ios', 'android', 'web'])
      .withMessage('Platform must be ios, android, or web')
  ],

  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('platform')
      .optional()
      .isIn(['ios', 'android', 'web'])
      .withMessage('Platform must be ios, android, or web'),
    
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be true or false')
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
      .isJWT()
      .withMessage('Invalid refresh token format')
  ],

  checkEmail: [
    commonValidations.email
  ],

  forgotPassword: [
    commonValidations.email
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid reset token format'),
    
    commonValidations.simplePassword
      .withMessage('New password must meet security requirements')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    commonValidations.simplePassword
      .withMessage('New password must meet security requirements'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      })
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

    // Phone validation temporarily disabled - just accept any phone value
    body('phone')
      .optional(),

    body('language')
      .optional()
      .isIn(['en', 'fr'])
      .withMessage('Language must be either en or fr'),

    body('profilePicture')
      .optional()
      .custom((value) => {
        // Skip validation if value is empty or null
        if (!value || value.trim() === '') {
          return true;
        }
        
        // Validate URL format
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Profile picture must be a valid URL');
        }
      }),

    body('dateOfBirth')
      .optional()
      .custom((value) => {
        // Skip validation if value is empty or null
        if (!value || value.trim() === '') {
          return true;
        }
        
        // Validate date format
        if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          throw new Error('Date of birth must be in YYYY-MM-DD format');
        }
        
        const birthDate = new Date(value);
        if (isNaN(birthDate.getTime())) {
          throw new Error('Date of birth must be a valid date');
        }
        
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
          
        if (actualAge < 13 || actualAge > 120) {
          throw new Error('Age must be between 13 and 120 years');
        }
        
        return true;
      }),

    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),

    body('isBusiness')
      .optional()
      .isBoolean()
      .withMessage('isBusiness must be true or false'),

    body('businessDetails')
      .optional()
      .isObject()
      .withMessage('Business details must be an object'),

    body('businessDetails.companyName')
      .if(body('isBusiness').equals(true))
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),

    body('businessDetails.taxId')
      .if(body('isBusiness').equals(true))
      .notEmpty()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('Tax ID must be between 5 and 50 characters'),

    body('businessDetails.businessType')
      .if(body('isBusiness').equals(true))
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business type must be between 2 and 100 characters'),

    body('businessDetails.website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),

    body('addresses')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 addresses allowed')
      .custom((addresses) => {
        if (addresses && addresses.length > 0) {
          for (const address of addresses) {
            if (!address.type || !['primary', 'secondary'].includes(address.type)) {
              throw new Error('Address type must be primary or secondary');
            }
            if (!address.address || address.address.trim().length < 10) {
              throw new Error('Address must be at least 10 characters long');
            }
          }
        }
        return true;
      })
  ]
};

// Order validation rules
export const orderValidation = {
  create: [
    body('serviceType')
      .isIn(['express', 'standard', 'moving', 'storage'])
      .withMessage('Service type must be express, standard, moving, or storage'),

    body('pickupLocation')
      .isObject()
      .withMessage('Pickup location is required'),

    body('pickupLocation.address')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Pickup address must be between 10 and 200 characters'),

    body('pickupLocation.coordinates')
      .isObject()
      .withMessage('Pickup coordinates are required'),

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
      .isLength({ min: 10, max: 200 })
      .withMessage('Dropoff address must be between 10 and 200 characters'),

    body('dropoffLocation.coordinates')
      .isObject()
      .withMessage('Dropoff coordinates are required'),

    body('dropoffLocation.coordinates.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Dropoff latitude must be between -90 and 90'),

    body('dropoffLocation.coordinates.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Dropoff longitude must be between -180 and 180'),

    body('packageDetails')
      .isObject()
      .withMessage('Package details are required'),

    body('packageDetails.description')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Package description must be between 5 and 1000 characters'),

    body('packageDetails.weight')
      .optional()
      .isFloat({ min: 0.1, max: 50000 })
      .withMessage('Package weight must be between 0.1 and 50000 kg'),

    body('scheduledPickupTime')
      .optional()
      .isISO8601()
      .withMessage('Scheduled pickup time must be a valid date')
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('Scheduled pickup time must be in the future');
        }
        return true;
      }),

    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Priority must be low, normal, high, or urgent')
  ],

  updateStatus: [
    commonValidations.objectId('orderId'),
    
    body('status')
      .isIn([
        'pending', 'accepted', 'pickup_scheduled', 'en_route_pickup',
        'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery',
        'delivered', 'cancelled', 'failed', 'returned', 'storage_requested', 'in_storage'
      ])
      .withMessage('Invalid order status'),

    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters'),

    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object'),

    body('location.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),

    body('location.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],

  rating: [
    commonValidations.objectId('orderId'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),

    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback cannot exceed 1000 characters')
  ]
};

// Query parameter validation
export const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('sort')
      .optional()
      .matches(/^[a-zA-Z_]+$/)
      .withMessage('Sort field can only contain letters and underscores'),

    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc')
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters'),

    query('category')
      .optional()
      .isIn(['orders', 'users', 'all'])
      .withMessage('Category must be orders, users, or all')
  ],

  location: [
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
      .isInt({ min: 100, max: 50000 })
      .withMessage('Radius must be between 100 and 50000 meters')
  ]
};

// User management validation
export const userValidation = {
  updateTransporterDetails: [
    body('vehicleType')
      .optional()
      .isIn(['bike', 'car', 'van', 'truck'])
      .withMessage('Vehicle type must be bike, car, van, or truck'),

    body('licensePlate')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('License plate must be between 2 and 20 characters')
      .matches(/^[A-Z0-9\-\s]+$/i)
      .withMessage('License plate can only contain letters, numbers, hyphens, and spaces'),

    body('payloadCapacity')
      .optional()
      .isInt({ min: 1, max: 50000 })
      .withMessage('Payload capacity must be between 1 and 50000 kg'),

    body('licenseNumber')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('License number must be between 5 and 50 characters'),

    body('licenseExpiry')
      .optional()
      .isISO8601()
      .withMessage('License expiry must be a valid date')
      .custom((value) => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('License expiry date must be in the future');
        }
        return true;
      }),

    body('vehiclePhotos')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 vehicle photos allowed'),

    body('vehiclePhotos.*')
      .optional()
      .isURL()
      .withMessage('Vehicle photos must be valid URLs'),

    body('insuranceDocument')
      .optional()
      .isURL()
      .withMessage('Insurance document must be a valid URL'),

    body('bankingDetails')
      .optional()
      .isObject()
      .withMessage('Banking details must be an object'),

    body('workingHours')
      .optional()
      .isObject()
      .withMessage('Working hours must be an object'),

    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('isAvailable must be true or false'),

    body('serviceArea')
      .optional()
      .isObject()
      .withMessage('Service area must be an object')
  ]
};

// File upload validation
export const fileValidation = {
  image: [
    body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Image file is required');
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('File must be a valid image (JPEG, PNG, GIF, or WebP)');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new Error('Image file size must be less than 5MB');
        }
        
        return true;
      })
  ],

  document: [
    body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Document file is required');
        }
        
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('File must be a PDF, JPEG, or PNG');
        }
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
          throw new Error('Document file size must be less than 10MB');
        }
        
        return true;
      })
  ]
};

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Custom sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string values in req.body
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potentially harmful characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=\s*["|'][^"|']*["|']/gi, '') // Remove event handlers
        .trim();
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    } else if (value && typeof value === 'object') {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  next();
};

// Google Auth validation
export const validateGoogleAuth = [
  body('userType')
    .optional()
    .isIn(['customer', 'transporter'])
    .withMessage('User type must be customer or transporter'),
  
  body('language')
    .optional()
    .isIn(['en', 'fr'])
    .withMessage('Language must be en or fr'),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors,
];

export const validateProfileCompletion = [
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('userType')
    .optional()
    .isIn(['customer', 'transporter'])
    .withMessage('User type must be customer or transporter'),
  
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  
  body('addresses.*.type')
    .optional()
    .isIn(['primary', 'secondary', 'work', 'other'])
    .withMessage('Address type must be primary, secondary, work, or other'),
  
  body('addresses.*.address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  
  body('businessDetails')
    .optional()
    .isObject()
    .withMessage('Business details must be an object'),
  
  body('transporterDetails')
    .optional()
    .isObject()
    .withMessage('Transporter details must be an object'),
  
  handleValidationErrors,
];

// Rate limiting validation
export const rateLimitValidation = {
  checkIdentifier: (req, res, next) => {
    // Ensure we have some identifier for rate limiting
    const identifier = req.ip || req.get('X-Forwarded-For') || req.connection.remoteAddress;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify request source',
        code: 'IDENTIFIER_REQUIRED'
      });
    }
    
    req.rateLimitIdentifier = identifier;
    next();
  }
};

export default {
  commonValidations,
  authValidation,
  orderValidation,
  queryValidation,
  userValidation,
  fileValidation,
  handleValidationErrors,
  sanitizeInput,
  rateLimitValidation
};