import mongoose from 'mongoose';

// Custom error class for application-specific errors
export class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB CastError
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Handle MongoDB duplicate field errors
const handleDuplicateFieldsDB = (err) => {
  const duplicatedFields = Object.keys(err.keyPattern);
  const field = duplicatedFields[0];
  const value = err.keyValue[field];
  
  let message = `A record with this ${field} already exists`;
  if (field === 'email') {
    message = 'A user with this email address already exists';
  } else if (field === 'phone') {
    message = 'A user with this phone number already exists';
  } else if (field === 'orderNumber') {
    message = 'An order with this number already exists';
  }

  return new AppError(message, 400, 'DUPLICATE_ERROR', {
    field: field,
    value: value,
    duplicatedFields: duplicatedFields
  });
};

// Handle MongoDB validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value,
    kind: error.kind
  }));

  const message = `Invalid input data: ${errors.map(e => e.message).join('. ')}`;
  
  return new AppError(message, 400, 'VALIDATION_ERROR', {
    errors: errors,
    errorCount: errors.length
  });
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new AppError('Your authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

// Handle Redis connection errors
const handleRedisError = (err) => {
  console.error('Redis connection error:', err);
  return new AppError('Cache service temporarily unavailable', 503, 'CACHE_ERROR');
};

// Handle Mongoose connection errors
const handleMongooseConnectionError = (err) => {
  console.error('MongoDB connection error:', err);
  return new AppError('Database service temporarily unavailable', 503, 'DATABASE_ERROR');
};

// Send error response for development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    code: err.code || 'UNKNOWN_ERROR',
    details: err.details,
    stack: err.stack
  });
};

// Send error response for production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
      code: err.code || 'OPERATION_ERROR'
    };

    // Only include details for client-safe operational errors
    if (err.details && err.statusCode < 500) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again later.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Main error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // Handle specific error types
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    } else if (error.name === 'RedisError' || error.code === 'ECONNREFUSED') {
      error = handleRedisError(error);
    } else if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
      error = handleMongooseConnectionError(error);
    }

    sendErrorProd(error, res);
  }
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('UNHANDLED PROMISE REJECTION! Shutting down...');
    console.error('Error:', err.message);
    console.error('Promise:', promise);
    
    // Close server gracefully
    process.exit(1);
  });
};

// Handle uncaught exceptions
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  });
};

// Async error wrapper for route handlers
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const handleUndefinedRoutes = (req, res, next) => {
  const err = new AppError(
    `Cannot ${req.method} ${req.originalUrl} on this server`,
    404,
    'ROUTE_NOT_FOUND',
    {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  );
  next(err);
};

// Request timeout handler
export const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const err = new AppError('Request timeout', 408, 'REQUEST_TIMEOUT');
        next(err);
      }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    
    next();
  };
};

// Health check endpoint helper
export const healthCheck = (req, res) => {
  const healthData = {
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    platform: process.platform,
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
    },
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      // Redis health check would be added here if redis client is available
    }
  };

  res.status(200).json(healthData);
};

// Graceful shutdown helper
export const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      console.log('HTTP server closed.');
      
      // Close database connections
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(err ? 1 : 0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Rate limit error helper
export const rateLimitHandler = (req, res) => {
  const error = new AppError(
    'Too many requests from this IP, please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      resetTime: req.rateLimit?.resetTime || new Date(Date.now() + 15 * 60 * 1000)
    }
  );
  
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    details: error.details
  });
};

// Validation error helper
export const validationErrorHandler = (errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    {
      errors: formattedErrors,
      errorCount: formattedErrors.length
    }
  );
};

// Database transaction error helper  
export const transactionErrorHandler = (err, session) => {
  if (session) {
    session.abortTransaction();
  }
  
  console.error('Database transaction error:', err);
  
  return new AppError(
    'Transaction failed. Please try again.',
    500,
    'TRANSACTION_ERROR'
  );
};

// File upload error helper
export const fileUploadErrorHandler = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'File size too large. Maximum allowed size is 5MB.',
      400,
      'FILE_SIZE_ERROR'
    );
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError(
      'Too many files. Maximum allowed is 10 files.',
      400,
      'FILE_COUNT_ERROR'
    );
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(
      'Unexpected file field. Please check your form.',
      400,
      'UNEXPECTED_FILE_ERROR'
    );
  }
  
  return new AppError(
    'File upload failed. Please try again.',
    400,
    'FILE_UPLOAD_ERROR'
  );
};

export default {
  AppError,
  globalErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  catchAsync,
  handleUndefinedRoutes,
  requestTimeout,
  healthCheck,
  gracefulShutdown,
  rateLimitHandler,
  validationErrorHandler,
  transactionErrorHandler,
  fileUploadErrorHandler
};