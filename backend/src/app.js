import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
// Configuration imports
import databaseConfig from './config/database.js';
import socketManager from './config/socket.js';

// Middleware imports
import {
  globalErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleUndefinedRoutes,
  requestTimeout,
  healthCheck,
  gracefulShutdown,
  AppError
} from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle uncaught exceptions
handleUncaughtException();

// Create Express app
const app = express();

// Set up trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Environment variables validation
const requiredEnvVars = [
  'NODE_ENV',
  'JWT_SECRET',
  'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',     // React development
      'http://localhost:19006',    // Expo development
      'http://localhost:8081',     // React Native Metro
      'https://localhost:3000',    // HTTPS development
      process.env.FRONTEND_URL,    // Production frontend
      process.env.ADMIN_URL        // Admin panel
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new AppError('Access denied by CORS policy', 403, 'CORS_ERROR'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Session-ID',
    'X-Client-Version',
    'X-Platform'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
};

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Request timeout (30 seconds)
app.use(requestTimeout(30000));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress if response is larger than 1KB
  level: 6 // Compression level (1-9, 6 is default)
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// Request logging (only in development and staging)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
} else {
  // Simplified logging in production
  app.use(morgan('common', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'GLOBAL_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in development for localhost
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

app.use(globalRateLimit);

// Add request ID for tracking
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Add request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// API versioning and base path
const API_VERSION = process.env.API_VERSION || 'v1';
const API_BASE_PATH = `/api/${API_VERSION}`;

// Health check routes (before API versioning)
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// API status endpoint
app.get(`${API_BASE_PATH}/status`, (req, res) => {
  res.json({
    success: true,
    message: 'iBox API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: databaseConfig.isConnected() ? 'connected' : 'disconnected'
    }
  });
});

// API Routes
app.use(`${API_BASE_PATH}/auth`, authRoutes);
app.use(`${API_BASE_PATH}/users`, userRoutes);
app.use(`${API_BASE_PATH}/orders`, orderRoutes);
app.use(`${API_BASE_PATH}/upload`, uploadRoutes);
app.use(`${API_BASE_PATH}/notifications`, notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to iBox API',
    version: API_VERSION,
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      auth: `${req.protocol}://${req.get('host')}${API_BASE_PATH}/auth`,
      health: `${req.protocol}://${req.get('host')}/health`,
      status: `${req.protocol}://${req.get('host')}${API_BASE_PATH}/status`
    }
  });
});

// API Documentation endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    res.json({
      success: true,
      message: 'iBox API Documentation',
      version: API_VERSION,
      baseUrl: `${req.protocol}://${req.get('host')}${API_BASE_PATH}`,
      endpoints: {
        authentication: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          refreshToken: 'POST /auth/refresh-token',
          profile: 'GET /auth/me',
          updateProfile: 'PUT /auth/profile',
          changePassword: 'POST /auth/change-password',
          forgotPassword: 'POST /auth/forgot-password',
          resetPassword: 'POST /auth/reset-password'
        },
        utility: {
          health: 'GET /health',
          status: 'GET /api/v1/status',
          docs: 'GET /api/docs (dev only)'
        }
      },
      examples: {
        register: {
          url: `${API_BASE_PATH}/auth/register`,
          method: 'POST',
          body: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            password: 'Password123',
            userType: 'customer'
          }
        },
        login: {
          url: `${API_BASE_PATH}/auth/login`,
          method: 'POST',
          body: {
            email: 'john@example.com',
            password: 'Password123'
          }
        }
      }
    });
  });
}

// Handle undefined routes (404)
app.all('*', handleUndefinedRoutes);

// Global error handling middleware
app.use(globalErrorHandler);

// Database connection
const connectServices = async () => {
  try {
    console.log('🔌 Connecting to services...');
    
    // Connect to MongoDB
    await databaseConfig.connect();
    console.log('✅ MongoDB connected successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to services:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    // Connect to external services first
    await connectServices();
    
    // Start HTTP server
    const server = app.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 Server running on port ${PORT} (all interfaces)`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://192.168.1.12:${PORT}${API_BASE_PATH}`);
      console.log(`💚 Health Check: http://192.168.1.12:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      }
      
      // Initialize Socket.io server
      try {
        await socketManager.initialize(server);
        console.log('🔌 Socket.io server initialized');
      } catch (socketError) {
        console.error('⚠️ Socket.io initialization failed:', socketError);
        console.log('📱 Continuing without real-time features');
      }
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
    
    // Graceful shutdown handling
    gracefulShutdown(server);
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
handleUnhandledRejection();

// Start the application
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;