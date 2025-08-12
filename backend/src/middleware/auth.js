import User from '../models/User.js';
import authService from '../services/authService.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // Also check cookies for web clients
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const payload = await authService.verifyToken(token, 'access');
      
      // Get user from database
      const user = await User.findById(payload.userId).select('+loginAttempts');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      if (user.isBlocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is blocked. Please contact support.',
          code: 'ACCOUNT_BLOCKED',
          details: {
            blockedAt: user.blockedAt,
            reason: user.blockReason
          }
        });
      }

      // Check if account is locked due to failed login attempts
      if (user.isAccountLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts.',
          code: 'ACCOUNT_LOCKED',
          details: {
            lockedUntil: user.loginAttempts.blockedUntil
          }
        });
      }

      // Add user to request object (without sensitive data)
      req.user = user.toJSON();
      req.userId = user._id;
      req.userType = user.userType;

      // Update user activity
      authService.updateUserActivity(user._id, {
        action: 'api_access',
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      
      let errorMessage = 'Invalid authentication token.';
      let errorCode = 'INVALID_TOKEN';
      
      if (tokenError.message === 'Token has expired') {
        errorMessage = 'Authentication token has expired. Please login again.';
        errorCode = 'TOKEN_EXPIRED';
      } else if (tokenError.message === 'Token has been revoked') {
        errorMessage = 'Authentication token has been revoked. Please login again.';
        errorCode = 'TOKEN_REVOKED';
      }

      return res.status(401).json({
        success: false,
        message: errorMessage,
        code: errorCode
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Restrict to certain user types
export const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!userTypes.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${userTypes.join(' or ')}.`,
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          requiredRoles: userTypes,
          currentRole: req.userType
        }
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
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const payload = await authService.verifyToken(token, 'access');
        const user = await User.findById(payload.userId);
        
        if (user && user.isActive && !user.isBlocked && !user.isAccountLocked()) {
          req.user = user.toJSON();
          req.userId = user._id;
          req.userType = user.userType;
          req.isAuthenticated = true;
        }
      } catch (error) {
        // Continue without authentication if token is invalid
        console.log('Optional auth token invalid:', error.message);
      }
    }

    req.isAuthenticated = req.isAuthenticated || false;
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.isAuthenticated = false;
    next();
  }
};

// Check if user owns resource or is admin
export const checkOwnership = (resourceUserIdField = 'customer') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Allow if user is accessing their own resource
    const resourceUserId = req.body[resourceUserIdField] || 
                          req.params[resourceUserIdField] || 
                          req.query[resourceUserIdField];

    if (resourceUserId && resourceUserId.toString() === req.userId.toString()) {
      return next();
    }

    // For orders, check if user is either customer or assigned transporter
    if (req.originalUrl.includes('/orders/') && req.body.transporter) {
      if (req.body.transporter.toString() === req.userId.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
      code: 'RESOURCE_ACCESS_DENIED'
    });
  };
};

// Verify account status for sensitive operations
export const requireVerification = (verificationTypes = ['email']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const missingVerifications = [];

    if (verificationTypes.includes('email') && !req.user.isEmailVerified) {
      missingVerifications.push('email');
    }

    if (verificationTypes.includes('phone') && !req.user.isPhoneVerified) {
      missingVerifications.push('phone');
    }

    if (verificationTypes.includes('transporter') && 
        req.user.userType === 'transporter' && 
        !req.user.transporterDetails?.isVerified) {
      missingVerifications.push('transporter_identity');
    }

    if (missingVerifications.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Account verification required to perform this action.',
        code: 'VERIFICATION_REQUIRED',
        details: {
          requiredVerifications: verificationTypes,
          missingVerifications: missingVerifications
        }
      });
    }

    next();
  };
};

// Check if transporter is available for orders
export const requireTransporterAvailability = async (req, res, next) => {
  try {
    if (!req.user || req.userType !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Transporter access required.',
        code: 'TRANSPORTER_REQUIRED'
      });
    }

    // Get fresh user data to check availability
    const user = await User.findById(req.userId);
    
    if (!user.transporterDetails?.isAvailable) {
      return res.status(403).json({
        success: false,
        message: 'You must be available to accept orders. Please update your availability status.',
        code: 'TRANSPORTER_UNAVAILABLE'
      });
    }

    if (!user.transporterDetails?.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your transporter account must be verified before accepting orders.',
        code: 'TRANSPORTER_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Transporter availability check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking transporter availability.',
      code: 'AVAILABILITY_CHECK_ERROR'
    });
  }
};

// Rate limiting middleware for sensitive operations
export const rateLimitByUser = (maxRequests = 10, windowMinutes = 15) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for rate limiting.',
          code: 'AUTH_REQUIRED'
        });
      }

      const identifier = `user:${req.userId}:${req.originalUrl}`;
      const rateLimit = await authService.checkLoginRateLimit(identifier, maxRequests, windowMinutes);

      if (rateLimit.blocked) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            maxRequests: rateLimit.maxAttempts,
            currentAttempts: rateLimit.attempts,
            resetTime: rateLimit.resetTime
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on rate limiting errors
    }
  };
};

// Session-based authentication (alternative to JWT for web)
export const sessionAuth = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'No session found. Please login.',
        code: 'NO_SESSION'
      });
    }

    const session = await authService.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please login again.',
        code: 'INVALID_SESSION'
      });
    }

    // Check session age (optional additional security)
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      await authService.deleteSession(sessionId);
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Get user
    const user = await User.findById(session.userId);
    
    if (!user || !user.isActive) {
      await authService.deleteSession(sessionId);
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user.toJSON();
    req.userId = user._id;
    req.userType = user.userType;
    req.sessionId = sessionId;

    // Update session activity
    await authService.updateSession(sessionId, {
      lastActivity: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Session authentication error.',
      code: 'SESSION_AUTH_ERROR'
    });
  }
};

// Middleware to log authentication events
export const logAuthEvents = (eventType) => {
  return (req, res, next) => {
    // Log the event after response is sent
    res.on('finish', () => {
      if (req.userId && res.statusCode < 400) {
        authService.logSecurityEvent(req.userId, eventType, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        });
      }
    });
    
    next();
  };
};

// Export all middleware functions
export default {
  protect,
  restrictTo,
  optionalAuth,
  checkOwnership,
  requireVerification,
  requireTransporterAvailability,
  rateLimitByUser,
  sessionAuth,
  logAuthEvents
};