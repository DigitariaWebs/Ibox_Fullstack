# iBox Backend Implementation Plan 🚀

## Project Overview
This document outlines the complete implementation plan for building a modern Express.js backend server for the iBox transportation app. The backend will provide email authentication, real-time features, and database management to replace all mock data in the React Native frontend.

## Technology Stack (Latest 2025 Compatible Versions)

### Core Technologies
- **Node.js**: v22 LTS (Current LTS with native ESM and require(esm) support)
- **Express.js**: v4.21+ with ESM modules
- **TypeScript**: Latest with ESM support and verbatimModuleSyntax
- **ESM Modules**: Native ES6 modules throughout the project

### Database & Caching
- **MongoDB**: Latest version with Mongoose v8.17.1
- **Redis**: v5.8.0 for session management and caching
- **Mongoose**: v8.17.1 for MongoDB object modeling

### Authentication & Security
- **Firebase Admin SDK**: v13.4.0 for future Google Auth integration
- **JWT**: For token-based authentication
- **bcryptjs**: For password hashing
- **helmet**: Security headers middleware
- **express-rate-limit**: Rate limiting protection

### Communication & HTTP
- **Socket.io**: v4.x with Redis adapter for real-time communication
- **@socket.io/redis-adapter**: For scalable WebSocket connections
- **Axios**: v1.11.0 for external API calls
- **CORS**: v2.8.5 for cross-origin resource sharing

### Development & Quality
- **nodemon**: Development server with hot reload
- **dotenv**: Environment variable management
- **express-validator**: Input validation middleware
- **morgan**: HTTP request logging

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── redis.js             # Redis connection
│   │   ├── firebase.js          # Firebase Admin setup
│   │   └── socket.js            # Socket.io configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   ├── orderController.js   # Order/booking logic
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validation.js        # Input validation
│   │   ├── errorHandler.js      # Error handling
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Order.js             # Order schema
│   │   ├── Session.js           # Session schema
│   │   └── Notification.js      # Notification schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── orders.js            # Order management routes
│   │   └── notifications.js     # Notification routes
│   ├── services/
│   │   ├── authService.js       # Authentication business logic
│   │   ├── emailService.js      # Email sending service
│   │   ├── notificationService.js # Push notifications
│   │   └── socketService.js     # WebSocket event handling
│   ├── utils/
│   │   ├── validators.js        # Custom validation functions
│   │   ├── helpers.js           # Utility functions
│   │   ├── constants.js         # App constants
│   │   └── logger.js            # Logging utility
│   └── app.js                   # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── api/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── CLAUDE.md
```

## Phase 1: Environment Setup & Project Initialization

### Step 1.1: Create Project Structure
```bash
mkdir backend
cd backend
npm init -y
```

### Step 1.2: Configure Package.json for ESM
```json
{
  "name": "ibox-backend",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest",
    "build": "tsc"
  }
}
```

### Step 1.3: Install Dependencies
```bash
# Core dependencies
npm install express mongoose redis socket.io cors helmet morgan
npm install @socket.io/redis-adapter express-rate-limit express-validator
npm install firebase-admin axios bcryptjs jsonwebtoken dotenv

# Development dependencies
npm install -D nodemon jest supertest @types/node typescript
npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 1.4: TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 1.5: Environment Configuration
```bash
# .env.example
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ibox
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Email (for future implementation)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
FRONTEND_URL=http://localhost:3000
API_VERSION=v1
```

## Phase 2: Database Models & Schemas

### Step 2.1: User Model (MongoDB/Mongoose)
```javascript
// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Account Details
  userType: { 
    type: String, 
    enum: ['customer', 'transporter'], 
    required: true 
  },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  
  // Profile Information
  profilePicture: { type: String },
  language: { type: String, enum: ['en', 'fr'], default: 'en' },
  
  // Address Information
  addresses: [{
    type: { type: String, enum: ['primary', 'secondary'] },
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: { type: Boolean, default: false }
  }],
  
  // Customer-specific fields
  paymentMethods: [{
    type: { type: String, enum: ['card', 'paypal', 'bank'] },
    isDefault: { type: Boolean, default: false },
    cardLast4: String,
    expiryDate: String,
    // Encrypted payment data
    encryptedData: String
  }],
  
  // Business account fields
  isBusiness: { type: Boolean, default: false },
  businessDetails: {
    companyName: String,
    taxId: String,
    businessType: String
  },
  
  // Transporter-specific fields
  transporterDetails: {
    vehicleType: { 
      type: String, 
      enum: ['bike', 'car', 'van', 'truck'] 
    },
    licensePlate: String,
    payloadCapacity: Number, // in kg
    licenseNumber: String,
    licenseExpiry: Date,
    vehiclePhotos: [String], // URLs to vehicle images
    insuranceDocument: String, // URL to insurance doc
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    bankingDetails: {
      accountHolder: String,
      iban: String,
      routingNumber: String,
      accountNumber: String
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 }
  },
  
  // Security & Status
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'addresses.coordinates': '2dsphere' });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
```

### Step 2.2: Order Model
```javascript
// src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true, required: true },
  
  // Parties involved
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Service details
  serviceType: {
    type: String,
    enum: ['express', 'standard', 'moving', 'storage'],
    required: true
  },
  
  // Location details
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactPerson: String,
    contactPhone: String,
    notes: String
  },
  
  dropoffLocation: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactPerson: String,
    contactPhone: String,
    notes: String
  },
  
  // Package details
  packageDetails: {
    description: String,
    weight: Number, // in kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    photos: [String], // URLs to package photos
    specialInstructions: String
  },
  
  // Timing
  scheduledPickupTime: Date,
  actualPickupTime: Date,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending', 'accepted', 'pickup_scheduled', 'en_route_pickup',
      'picked_up', 'en_route_delivery', 'delivered', 'cancelled',
      'storage_requested', 'in_storage'
    ],
    default: 'pending'
  },
  
  // Pricing
  pricing: {
    baseFee: { type: Number, required: true },
    distanceFee: Number,
    timeFee: Number,
    additionalFees: [{
      description: String,
      amount: Number
    }],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  
  // Payment
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    method: String,
    transactionId: String,
    paidAt: Date
  },
  
  // Real-time tracking
  tracking: {
    currentLocation: {
      lat: Number,
      lng: Number,
      timestamp: Date
    },
    route: [{
      lat: Number,
      lng: Number,
      timestamp: Date
    }]
  },
  
  // Communication
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' }
  }],
  
  // Completion details
  deliveryProof: {
    photos: [String],
    signature: String, // Base64 signature
    recipientName: String,
    deliveredAt: Date
  },
  
  // Rating and feedback
  rating: {
    customerRating: { type: Number, min: 1, max: 5 },
    transporterRating: { type: Number, min: 1, max: 5 },
    customerFeedback: String,
    transporterFeedback: String
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ transporter: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
orderSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.orderNumber = `IB-${timestamp}-${randomStr}`.toUpperCase();
  }
  next();
});

export default mongoose.model('Order', orderSchema);
```

## Phase 3: Authentication System Implementation

### Step 3.1: Authentication Controller
```javascript
// src/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import authService from '../services/authService.js';

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        firstName, lastName, email, phone, password,
        userType, language = 'en'
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password,
        userType,
        language
      });

      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user._id);

      // Save refresh token (in production, use Redis)
      await authService.saveRefreshToken(user._id, refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = authService.generateTokens(user._id);

      // Save refresh token
      await authService.saveRefreshToken(user._id, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token'
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?._id;

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      if (userId) {
        await authService.revokeAllUserTokens(userId);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new AuthController();
```

### Step 3.2: Authentication Service
```javascript
// src/services/authService.js
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import User from '../models/User.js';

class AuthService {
  // Generate JWT tokens
  generateTokens(userId) {
    const payload = { userId };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    return { accessToken, refreshToken };
  }

  // Save refresh token to Redis
  async saveRefreshToken(userId, refreshToken) {
    const key = `refresh_token:${userId}`;
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    
    await redis.setex(key, expiresIn, refreshToken);
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const userId = payload.userId;

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${userId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Check if user still exists and is active
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(userId);

      // Save new refresh token
      await this.saveRefreshToken(userId, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const userId = payload.userId;
      
      await redis.del(`refresh_token:${userId}`);
    } catch (error) {
      // Token might be invalid, but we don't throw error
      console.log('Error revoking token:', error.message);
    }
  }

  // Revoke all user tokens
  async revokeAllUserTokens(userId) {
    await redis.del(`refresh_token:${userId}`);
  }

  // Verify access token
  async verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}

export default new AuthService();
```

### Step 3.3: Authentication Middleware
```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authService from '../services/authService.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const payload = await authService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(payload.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Restrict to certain user types
export const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Optional authentication - for routes that work with or without auth
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const payload = await authService.verifyAccessToken(token);
        const user = await User.findById(payload.userId);
        
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
```

## Phase 4: API Routes & Validation

### Step 4.1: Authentication Routes
```javascript
// src/routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('userType')
    .isIn(['customer', 'transporter'])
    .withMessage('User type must be either customer or transporter'),
  body('language')
    .optional()
    .isIn(['en', 'fr'])
    .withMessage('Language must be either en or fr')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/register', 
  rateLimiter.authLimiter, 
  registerValidation, 
  authController.register
);

router.post('/login', 
  rateLimiter.authLimiter, 
  loginValidation, 
  authController.login
);

router.post('/refresh-token', 
  rateLimiter.authLimiter, 
  authController.refreshToken
);

router.post('/logout', 
  rateLimiter.authLimiter, 
  authController.logout
);

router.get('/me', 
  protect, 
  authController.getMe
);

export default router;
```

### Step 4.2: Rate Limiting Middleware
```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (more restrictive)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  apiLimiter,
  authLimiter
};
```

## Phase 5: Database & Redis Configuration

### Step 5.1: MongoDB Configuration
```javascript
// src/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const connection = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### Step 5.2: Redis Configuration
```javascript
// src/config/redis.js
import { createClient } from 'redis';

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Event listeners
      this.client.on('connect', () => {
        console.log('🔗 Connecting to Redis...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connection established');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  // Helper methods
  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return await this.client.get(key);
  }

  async set(key, value, expirationTime) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    if (expirationTime) {
      return await this.client.setEx(key, expirationTime, value);
    }
    return await this.client.set(key, value);
  }

  async setex(key, seconds, value) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return await this.client.setEx(key, seconds, value);
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    return await this.client.exists(key);
  }

  // Session methods
  async setSession(sessionId, data, ttl = 3600) {
    const key = `session:${sessionId}`;
    return await this.setex(key, ttl, JSON.stringify(data));
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }
}

const redisConfig = new RedisConfig();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await redisConfig.disconnect();
    console.log('Redis connection closed through app termination');
  } catch (err) {
    console.error('Error during Redis disconnection:', err);
  }
});

export default redisConfig.client || redisConfig;
```

## Phase 6: Socket.io Configuration

### Step 6.1: Socket.io Server Setup
```javascript
// src/config/socket.js
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import redisConfig from './redis.js';
import authService from '../services/authService.js';
import socketService from '../services/socketService.js';

class SocketConfig {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  async initialize(httpServer) {
    try {
      // Create Socket.io server
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      // Set up Redis adapter for clustering
      if (redisConfig.isConnected) {
        const pubClient = redisConfig.client;
        const subClient = pubClient.duplicate();
        
        await subClient.connect();
        
        this.io.adapter(createAdapter(pubClient, subClient));
        console.log('✅ Socket.io Redis adapter configured');
      }

      // Authentication middleware
      this.io.use(async (socket, next) => {
        try {
          const token = socket.handshake.auth.token;
          
          if (!token) {
            throw new Error('No token provided');
          }

          const payload = await authService.verifyAccessToken(token);
          const user = await User.findById(payload.userId);
          
          if (!user || !user.isActive) {
            throw new Error('User not found or inactive');
          }

          socket.userId = user._id.toString();
          socket.userType = user.userType;
          socket.user = user;
          
          next();
        } catch (error) {
          console.error('Socket auth error:', error);
          next(new Error('Authentication failed'));
        }
      });

      // Connection handling
      this.io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.user.firstName} (${socket.userId})`);
        
        this.connectedUsers.set(socket.userId, {
          socketId: socket.id,
          user: socket.user,
          connectedAt: new Date()
        });

        // Join user to their personal room
        socket.join(`user_${socket.userId}`);
        
        // Join transporter to transporter room
        if (socket.userType === 'transporter') {
          socket.join('transporters');
        }

        // Handle order-related events
        this.setupOrderEvents(socket);
        
        // Handle real-time location updates
        this.setupLocationEvents(socket);
        
        // Handle messaging
        this.setupMessageEvents(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
          console.log(`❌ User disconnected: ${socket.user.firstName} (${reason})`);
          this.connectedUsers.delete(socket.userId);
          
          // Update user's last seen
          socketService.updateUserLastSeen(socket.userId);
        });
      });

      console.log('✅ Socket.io server configured');
      return this.io;
    } catch (error) {
      console.error('❌ Socket.io configuration failed:', error);
      throw error;
    }
  }

  setupOrderEvents(socket) {
    // Customer creates new order
    socket.on('create_order', async (orderData) => {
      try {
        const result = await socketService.handleCreateOrder(socket.userId, orderData);
        
        // Notify nearby transporters
        socket.to('transporters').emit('new_order_available', result.order);
        
        // Confirm to customer
        socket.emit('order_created', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Transporter accepts order
    socket.on('accept_order', async (orderId) => {
      try {
        const result = await socketService.handleAcceptOrder(socket.userId, orderId);
        
        // Notify customer
        this.io.to(`user_${result.order.customer}`).emit('order_accepted', result);
        
        // Confirm to transporter
        socket.emit('order_acceptance_confirmed', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Order status updates
    socket.on('update_order_status', async ({ orderId, status, data }) => {
      try {
        const result = await socketService.handleOrderStatusUpdate(orderId, status, data);
        
        // Notify all parties involved
        this.io.to(`user_${result.order.customer}`).emit('order_status_updated', result);
        this.io.to(`user_${result.order.transporter}`).emit('order_status_updated', result);
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupLocationEvents(socket) {
    // Real-time location updates from transporter
    socket.on('location_update', async ({ orderId, location }) => {
      try {
        await socketService.handleLocationUpdate(orderId, location);
        
        // Notify customer of transporter's location
        const order = await Order.findById(orderId);
        if (order) {
          this.io.to(`user_${order.customer}`).emit('transporter_location_updated', {
            orderId,
            location,
            timestamp: new Date()
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupMessageEvents(socket) {
    // Join order chat room
    socket.on('join_order_chat', (orderId) => {
      socket.join(`order_chat_${orderId}`);
    });

    // Send message in order chat
    socket.on('send_message', async ({ orderId, message, type = 'text' }) => {
      try {
        const result = await socketService.handleSendMessage(
          socket.userId, 
          orderId, 
          message, 
          type
        );
        
        // Broadcast to order chat room
        this.io.to(`order_chat_${orderId}`).emit('new_message', result);
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
  }

  // Utility methods
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitToTransporters(event, data) {
    this.io.to('transporters').emit(event, data);
  }
}

export default new SocketConfig();
```

## Phase 7: Express App Setup

### Step 7.1: Main Application File
```javascript
// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Import configurations
import connectDB from './config/database.js';
import redisConfig from './config/redis.js';
import socketConfig from './config/socket.js';

// Import middleware
import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';

// Load environment variables
dotenv.config();

class App {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = process.env.PORT || 5000;
  }

  // Initialize all configurations
  async initialize() {
    try {
      // Connect to databases
      await this.connectDatabases();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Create HTTP server
      this.server = createServer(this.app);
      
      // Initialize Socket.io
      await socketConfig.initialize(this.server);
      
      console.log('✅ App initialized successfully');
      return this;
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      throw error;
    }
  }

  async connectDatabases() {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await redisConfig.connect();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('combined'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting
    this.app.use(apiLimiter);

    // Request timestamp
    this.app.use((req, res, next) => {
      req.timestamp = new Date().toISOString();
      next();
    });
  }

  setupRoutes() {
    const apiVersion = process.env.API_VERSION || 'v1';

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        version: apiVersion,
        environment: process.env.NODE_ENV
      });
    });

    // API routes
    this.app.use(`/api/${apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${apiVersion}/users`, userRoutes);
    this.app.use(`/api/${apiVersion}/orders`, orderRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  // Start the server
  async start() {
    try {
      this.server.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`📡 API Base URL: http://localhost:${this.port}/api/v1`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    this.server.close(() => {
      console.log('✅ HTTP server closed');
    });

    try {
      // Close database connections
      await redisConfig.disconnect();
      console.log('✅ Redis disconnected');
      
      // MongoDB will close automatically due to process termination
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const createApp = async () => {
  try {
    const app = new App();
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    process.exit(1);
  }
};

// Only start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createApp();
}

export default App;
```

### Step 7.2: Error Handler Middleware
```javascript
// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message: message.join(', '), statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
```

## Phase 8: Frontend Integration

### Step 8.1: Update React Native AuthContext
```javascript
// In React Native app: src/contexts/AuthContext.tsx
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

// Replace mock login function
const login = async (userData: User, userType?: 'customer' | 'transporter') => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password, // This needs to come from the login form
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens
    await AsyncStorage.multiSet([
      ['@ibox:accessToken', data.data.accessToken],
      ['@ibox:refreshToken', data.data.refreshToken],
      ['@ibox:userData', JSON.stringify(data.data.user)],
      ['@ibox:isAuthenticated', 'true'],
    ]);

    setIsAuthenticated(true);
    setUser(data.data.user);

    console.log('✅ User logged in successfully:', data.data.user.email);
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};
```

### Step 8.2: Update Signup Screens
```javascript
// In ConfirmationScreen.tsx - replace mock API call
const handleSubmit = async () => {
  if (!confirmAll) {
    Alert.alert('Confirmation Required', 'Please confirm that all information is correct.');
    return;
  }

  setIsSubmitting(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        email: signUpData.email,
        phone: signUpData.phone,
        password: signUpData.password,
        userType: signUpData.accountType,
        language: signUpData.language || 'en'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Store authentication data
    await AsyncStorage.multiSet([
      ['@ibox:accessToken', data.data.accessToken],
      ['@ibox:refreshToken', data.data.refreshToken],
      ['@ibox:userData', JSON.stringify(data.data.user)],
      ['@ibox:isAuthenticated', 'true'],
    ]);

    // Update auth context
    await login(data.data.user, data.data.user.userType);
    
    Alert.alert(
      'Registration Successful!',
      `Welcome to iBox, ${signUpData.firstName}! Your ${signUpData.accountType} account has been created successfully.`,
      [
        {
          text: 'Get Started',
          onPress: () => {
            resetSignUpData();
            // Navigation will be handled by AuthContext
          }
        }
      ]
    );
  } catch (error) {
    Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Phase 9: Testing & Deployment Preparation

### Step 9.1: API Testing Setup
```javascript
// tests/integration/auth.test.js
import request from 'supertest';
import App from '../../src/app.js';

describe('Authentication Endpoints', () => {
  let app;
  
  beforeAll(async () => {
    const appInstance = new App();
    app = await appInstance.initialize();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'Password123',
        userType: 'customer'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      // First register a user
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+1234567891',
        password: 'Password123',
        userType: 'transporter'
      };

      await request(app.app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Then login
      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });
});
```

## Implementation Timeline

### Week 1: Foundation Setup
- [ ] Create backend folder structure
- [ ] Install and configure all dependencies
- [ ] Set up MongoDB and Redis connections
- [ ] Create basic Express app with middleware

### Week 2: Database & Authentication
- [ ] Design and implement database schemas
- [ ] Build authentication system (register, login, JWT)
- [ ] Create authentication middleware and validation
- [ ] Implement password hashing and security measures

### Week 3: API Development
- [ ] Create authentication endpoints
- [ ] Build user management routes
- [ ] Implement CORS and rate limiting
- [ ] Add comprehensive error handling

### Week 4: Real-time Features
- [ ] Set up Socket.io with Redis adapter
- [ ] Implement real-time order tracking
- [ ] Create notification system
- [ ] Add WebSocket authentication

### Week 5: Frontend Integration
- [ ] Update React Native app to use real APIs
- [ ] Replace all mock authentication calls
- [ ] Test complete email signup flow
- [ ] Add proper error handling and loading states

### Week 6: Testing & Optimization
- [ ] Write comprehensive API tests
- [ ] Performance optimization and caching
- [ ] Security audit and improvements
- [ ] Documentation and deployment preparation

## Next Steps After Email Authentication

1. **Google Authentication Integration**
   - Set up Firebase Auth in backend
   - Implement Google OAuth flow
   - Create account linking functionality

2. **Advanced Features**
   - File upload system for documents/photos
   - Email verification system
   - Push notifications
   - Advanced order management

3. **Production Preparation**
   - Docker containerization
   - CI/CD pipeline setup
   - Environment-specific configurations
   - Monitoring and logging

This comprehensive plan provides a solid foundation for building a production-ready Express.js backend that seamlessly integrates with your React Native frontend, replacing all mock data with real authentication and database operations.