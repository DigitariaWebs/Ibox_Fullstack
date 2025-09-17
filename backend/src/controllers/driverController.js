import User from '../models/User.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import authService from '../services/authService.js';
import notificationService from '../services/notificationService.js';
import socketService from '../services/socketService.js';
import twilioService from '../services/twilioService.js';
import mongoose from 'mongoose';

// ===== VERIFICATION METHODS =====

const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || user.userType !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only transporters can access verification status.',
        code: 'ACCESS_DENIED'
      });
    }

    const transporterDetails = user.transporterDetails || {};
    const verificationDocuments = transporterDetails.verificationDocuments || {};

    // Calculate verification progress
    const completedSteps = {
      profilePhoto: !!user.profilePicture,
      phoneVerified: !!user.isPhoneVerified,
      driverLicense: !!(verificationDocuments.driverLicenseFront && verificationDocuments.driverLicenseBack),
      vehiclePhotos: !!(verificationDocuments.vehicleFront && verificationDocuments.vehicleBack),
      vehiclePlate: !!verificationDocuments.licensePlate,
      insurance: !!verificationDocuments.insurance,
      backgroundCheck: !!transporterDetails.backgroundCheckConsent
    };

    const totalSteps = Object.keys(completedSteps).length;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const verificationStep = completedCount;
    
    const verificationStatus = {
      isVerified: transporterDetails.isVerified || false,
      verificationStep,
      totalSteps,
      completedSteps,
      pendingReview: completedCount === totalSteps && !transporterDetails.isVerified,
      documents: verificationDocuments,
      backgroundCheckConsent: transporterDetails.backgroundCheckConsent || false,
      verifiedAt: transporterDetails.verifiedAt || null,
      rejectionReason: transporterDetails.rejectionReason || null
    };

    res.json({
      success: true,
      message: 'Verification status retrieved successfully',
      data: verificationStatus
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving verification status',
      code: 'VERIFICATION_STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const uploadVerificationDocument = async (req, res) => {
  try {
    const { documentType, documentUrl } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Initialize transporterDetails and verificationDocuments if not exists
    if (!user.transporterDetails) {
      user.transporterDetails = {};
    }
    if (!user.transporterDetails.verificationDocuments) {
      user.transporterDetails.verificationDocuments = {};
    }

    // Store document URL
    user.transporterDetails.verificationDocuments[documentType] = documentUrl;
    user.transporterDetails.lastDocumentUpload = new Date();

    await user.save();

    // Log security event
    await authService.logSecurityEvent(req.userId, 'verification_document_uploaded', {
      documentType,
      timestamp: new Date(),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentType,
        uploaded: true,
        verificationDocuments: user.transporterDetails.verificationDocuments
      }
    });

  } catch (error) {
    console.error('Upload verification document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading verification document',
      code: 'DOCUMENT_UPLOAD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const submitBackgroundConsent = async (req, res) => {
  try {
    const { consentGiven, consentDate } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.transporterDetails) {
      user.transporterDetails = {};
    }

    user.transporterDetails.backgroundCheckConsent = consentGiven;
    user.transporterDetails.backgroundCheckConsentDate = new Date(consentDate);
    
    await user.save();

    // Log security event
    await authService.logSecurityEvent(req.userId, 'background_consent_submitted', {
      consentGiven,
      timestamp: new Date(),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Background check consent submitted successfully',
      data: {
        consentGiven,
        consentDate: user.transporterDetails.backgroundCheckConsentDate
      }
    });

  } catch (error) {
    console.error('Submit background consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting background consent',
      code: 'CONSENT_SUBMISSION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== PHONE VERIFICATION METHODS =====

const sendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || user.userType !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only transporters can request phone verification.',
        code: 'ACCESS_DENIED'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified.',
        code: 'PHONE_ALREADY_VERIFIED'
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in user profile.',
        code: 'PHONE_NOT_FOUND'
      });
    }

    // Send verification code using Twilio
    const verificationResult = await twilioService.sendVerificationCode(user.phone);

    if (verificationResult.success) {
      // Log security event
      await authService.logSecurityEvent(req.userId, 'phone_verification_sent', {
        phone: user.phone,
        channel: 'sms',
        timestamp: new Date(),
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: {
          phone: user.phone,
          status: verificationResult.status,
          channel: verificationResult.channel
        }
      });
    } else {
      throw new Error('Failed to send verification code');
    }

  } catch (error) {
    console.error('Send phone verification error:', error);
    
    // Handle specific error cases
    let statusCode = 500;
    let message = 'Error sending verification code';
    let code = 'VERIFICATION_SEND_ERROR';
    
    if (error.message.includes('Invalid phone number')) {
      statusCode = 400;
      message = error.message;
      code = 'INVALID_PHONE_NUMBER';
    } else if (error.message.includes('limit exceeded')) {
      statusCode = 429;
      message = error.message;
      code = 'RATE_LIMIT_EXCEEDED';
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyPhoneCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please enter a 6-digit code.',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user || user.userType !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only transporters can verify phone.',
        code: 'ACCESS_DENIED'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified.',
        code: 'PHONE_ALREADY_VERIFIED'
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in user profile.',
        code: 'PHONE_NOT_FOUND'
      });
    }

    // Verify code using Twilio
    const verificationResult = await twilioService.verifyCode(user.phone, code);

    if (verificationResult.success) {
      // Update user's phone verification status
      user.isPhoneVerified = true;
      user.phoneVerifiedAt = new Date();
      
      // Clear any existing verification codes
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpires = undefined;
      
      await user.save();

      // Log security event
      await authService.logSecurityEvent(req.userId, 'phone_verified', {
        phone: user.phone,
        verifiedAt: user.phoneVerifiedAt,
        timestamp: new Date(),
        ip: req.ip
      });

      // Create notification for successful verification
      await notificationService.createNotification(
        req.userId,
        'Phone Verified',
        'Your phone number has been successfully verified!',
        'verification'
      );

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          phone: user.phone,
          verified: true,
          verifiedAt: user.phoneVerifiedAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
        code: 'INVALID_VERIFICATION_CODE'
      });
    }

  } catch (error) {
    console.error('Verify phone code error:', error);
    
    // Handle specific error cases
    let statusCode = 500;
    let message = 'Error verifying code';
    let code = 'VERIFICATION_ERROR';
    
    if (error.message.includes('Invalid verification code')) {
      statusCode = 400;
      message = error.message;
      code = 'INVALID_CODE';
    } else if (error.message.includes('expired')) {
      statusCode = 400;
      message = 'Verification code has expired. Please request a new code.';
      code = 'CODE_EXPIRED';
    } else if (error.message.includes('attempts exceeded')) {
      statusCode = 429;
      message = error.message;
      code = 'MAX_ATTEMPTS_EXCEEDED';
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const resendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || user.userType !== 'transporter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only transporters can request phone verification.',
        code: 'ACCESS_DENIED'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified.',
        code: 'PHONE_ALREADY_VERIFIED'
      });
    }

    // Cancel any pending verifications first
    try {
      await twilioService.cancelVerification(user.phone);
    } catch (cancelError) {
      // Continue even if cancel fails
      console.warn('Could not cancel previous verification:', cancelError.message);
    }

    // Send new verification code
    const verificationResult = await twilioService.sendVerificationCode(user.phone);

    if (verificationResult.success) {
      // Log security event
      await authService.logSecurityEvent(req.userId, 'phone_verification_resent', {
        phone: user.phone,
        channel: 'sms',
        timestamp: new Date(),
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'New verification code sent successfully',
        data: {
          phone: user.phone,
          status: verificationResult.status,
          channel: verificationResult.channel
        }
      });
    } else {
      throw new Error('Failed to resend verification code');
    }

  } catch (error) {
    console.error('Resend phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification code',
      code: 'VERIFICATION_RESEND_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== STATISTICS METHODS =====

const getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's completed deliveries
    const todayOrders = await Order.find({
      transporter: req.userId,
      status: 'delivered',
      deliveredAt: { $gte: today, $lt: tomorrow }
    });

    // Calculate today's stats
    const deliveries = todayOrders.length;
    const earnings = todayOrders.reduce((sum, order) => sum + (order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0), 0);
    
    // Calculate hours worked (estimate based on delivery times)
    const hours = todayOrders.reduce((total, order) => {
      if (order.pickedUpAt && order.deliveredAt) {
        const duration = (new Date(order.deliveredAt) - new Date(order.pickedUpAt)) / (1000 * 60 * 60);
        return total + duration;
      }
      return total;
    }, 0);

    // Get average rating for today's deliveries
    const ratedOrders = todayOrders.filter(order => order.rating?.transporterRating);
    const averageRating = ratedOrders.length > 0 
      ? ratedOrders.reduce((sum, order) => sum + order.rating.transporterRating, 0) / ratedOrders.length
      : 0;

    const todayStats = {
      deliveries,
      earnings: Math.round(earnings * 100) / 100,
      hours: Math.round(hours * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      onlineTime: hours, // For now, same as hours worked
      date: today.toISOString().split('T')[0]
    };

    res.json({
      success: true,
      message: 'Today\'s statistics retrieved successfully',
      data: todayStats
    });

  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving today\'s statistics',
      code: 'STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weeklyOrders = await Order.find({
      transporter: req.userId,
      status: 'delivered',
      deliveredAt: { $gte: weekStart, $lt: weekEnd }
    });

    const deliveries = weeklyOrders.length;
    const earnings = weeklyOrders.reduce((sum, order) => sum + (order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0), 0);
    const hours = weeklyOrders.reduce((total, order) => {
      if (order.pickedUpAt && order.deliveredAt) {
        const duration = (new Date(order.deliveredAt) - new Date(order.pickedUpAt)) / (1000 * 60 * 60);
        return total + duration;
      }
      return total;
    }, 0);

    const weeklyStats = {
      deliveries,
      earnings: Math.round(earnings * 100) / 100,
      hours: Math.round(hours * 10) / 10,
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: new Date(weekEnd.getTime() - 1).toISOString().split('T')[0]
      }
    };

    res.json({
      success: true,
      message: 'Weekly statistics retrieved successfully',
      data: weeklyStats
    });

  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving weekly statistics',
      code: 'WEEKLY_STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthlyOrders = await Order.find({
      transporter: req.userId,
      status: 'delivered',
      deliveredAt: { $gte: monthStart, $lt: monthEnd }
    });

    const deliveries = monthlyOrders.length;
    const earnings = monthlyOrders.reduce((sum, order) => sum + (order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0), 0);
    
    const monthlyStats = {
      deliveries,
      earnings: Math.round(earnings * 100) / 100,
      period: {
        start: monthStart.toISOString().split('T')[0],
        end: new Date(monthEnd.getTime() - 1).toISOString().split('T')[0]
      }
    };

    res.json({
      success: true,
      message: 'Monthly statistics retrieved successfully',
      data: monthlyStats
    });

  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monthly statistics',
      code: 'MONTHLY_STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== DELIVERY METHODS =====

const getAvailableDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType, maxDistance = 25 } = req.query;
    
    // Check if driver is verified and available
    const driver = await User.findById(req.userId);
    if (!driver.transporterDetails?.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Driver must be verified to view available deliveries',
        code: 'DRIVER_NOT_VERIFIED'
      });
    }

    if (!driver.transporterDetails?.isAvailable) {
      return res.status(200).json({
        success: true,
        message: 'No deliveries available while offline',
        data: {
          deliveries: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    // Build query for available orders
    const query = {
      status: 'pending',
      transporter: { $exists: false }
    };

    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Get available orders
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Transform orders to delivery requests format
    const deliveries = orders.map(order => ({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      serviceType: order.serviceType,
      pickupAddress: order.pickupLocation.address,
      deliveryAddress: order.deliveryLocation.address,
      distance: order.distance || '5.2 km',
      estimatedTime: order.estimatedDeliveryTime || '30-45 min',
      price: order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0,
      weight: order.packageDetails?.weight || null,
      description: order.packageDetails?.description || order.specialInstructions?.join(', ') || 'Package delivery',
      urgency: order.priority || 'normal',
      createdAt: order.createdAt,
      expiresIn: Math.max(0, 3600 - Math.floor((Date.now() - order.createdAt) / 1000)) // 1 hour expiry
    }));

    res.json({
      success: true,
      message: 'Available deliveries retrieved successfully',
      data: {
        deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available deliveries',
      code: 'DELIVERIES_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const acceptDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if order is available
      if (order.status !== 'pending' || order.transporter) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Order is no longer available',
          code: 'ORDER_NOT_AVAILABLE'
        });
      }

      // Verify driver
      const driver = await User.findById(req.userId).session(session);
      if (!driver?.transporterDetails?.isVerified) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Driver must be verified to accept deliveries',
          code: 'DRIVER_NOT_VERIFIED'
        });
      }

      if (!driver.transporterDetails?.isAvailable) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Driver must be online to accept deliveries',
          code: 'DRIVER_OFFLINE'
        });
      }

      // Accept the order
      order.transporter = req.userId;
      order.status = 'accepted';
      order.acceptedAt = new Date();
      
      // Add status history
      order.statusHistory.push({
        status: 'accepted',
        timestamp: new Date(),
        note: `Order accepted by ${driver.firstName} ${driver.lastName}`
      });

      await order.save({ session });

      // Update driver's active orders count
      if (!driver.transporterDetails.activeOrders) {
        driver.transporterDetails.activeOrders = 0;
      }
      driver.transporterDetails.activeOrders += 1;
      await driver.save({ session });

      await session.commitTransaction();

      // Populate order details
      await order.populate('customer', 'firstName lastName phone');

      // Notify customer and other drivers via socket
      if (socketService) {
        socketService.notifyOrderAccepted(order._id, req.userId, driver);
      }

      // Send notification to customer
      await notificationService.createNotification({
        userId: order.customer._id,
        title: 'Driver Found!',
        message: `${driver.firstName} ${driver.lastName} will handle your ${order.serviceType.toLowerCase()} delivery`,
        type: 'order',
        data: { orderId: order._id, driverId: req.userId }
      });

      res.json({
        success: true,
        message: 'Delivery accepted successfully',
        data: {
          orderId: order._id,
          status: order.status,
          acceptedAt: order.acceptedAt,
          customer: {
            name: `${order.customer.firstName} ${order.customer.lastName}`,
            phone: order.customer.phone
          },
          pickup: order.pickupLocation,
          delivery: order.deliveryLocation,
          earnings: order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting delivery',
      code: 'ACCEPT_DELIVERY_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getActiveDeliveries = async (req, res) => {
  try {
    const activeOrders = await Order.find({
      transporter: req.userId,
      status: { $in: ['accepted', 'picked_up', 'in_transit'] }
    })
    .populate('customer', 'firstName lastName phone')
    .sort({ acceptedAt: -1 });

    const deliveries = activeOrders.map(order => ({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerPhone: order.customer.phone,
      serviceType: order.serviceType,
      status: order.status,
      pickupAddress: order.pickupLocation.address,
      deliveryAddress: order.deliveryLocation.address,
      acceptedAt: order.acceptedAt,
      pickedUpAt: order.pickedUpAt,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      earnings: order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0,
      specialInstructions: order.specialInstructions || []
    }));

    res.json({
      success: true,
      message: 'Active deliveries retrieved successfully',
      data: { deliveries }
    });

  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving active deliveries',
      code: 'ACTIVE_DELIVERIES_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDeliveryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {
      transporter: req.userId,
      status: { $in: ['delivered', 'cancelled'] }
    };

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName')
      .sort({ deliveredAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const deliveries = orders.map(order => ({
      id: order._id,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      serviceType: order.serviceType,
      status: order.status,
      pickupAddress: order.pickupLocation.address,
      deliveryAddress: order.deliveryLocation.address,
      completedAt: order.deliveredAt || order.updatedAt,
      earnings: order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0,
      rating: order.rating?.transporterRating || null,
      feedback: order.rating?.transporterFeedback || null
    }));

    res.json({
      success: true,
      message: 'Delivery history retrieved successfully',
      data: {
        deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving delivery history',
      code: 'DELIVERY_HISTORY_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, location } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      transporter: req.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;

    // Set timestamp for status
    if (status === 'picked_up') {
      order.pickedUpAt = new Date();
    } else if (status === 'in_transit') {
      order.inTransitAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // Update driver's active orders count
      const driver = await User.findById(req.userId);
      if (driver.transporterDetails?.activeOrders > 0) {
        driver.transporterDetails.activeOrders -= 1;
        await driver.save();
      }
    }

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: notes || `Status updated to ${status}`,
      location: location || null
    });

    await order.save();

    // Notify customer via socket
    if (socketService) {
      socketService.notifyOrderStatusUpdate(orderId, status, location);
    }

    // Send push notification to customer
    await notificationService.createNotification({
      userId: order.customer,
      title: 'Delivery Update',
      message: `Your ${order.serviceType.toLowerCase()} delivery is now ${status.replace('_', ' ')}`,
      type: 'order',
      data: { orderId, status, location }
    });

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: {
        orderId,
        previousStatus,
        currentStatus: status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      code: 'UPDATE_STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== STATUS & AVAILABILITY METHODS =====

const updateOnlineStatus = async (req, res) => {
  try {
    const { online, location } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.transporterDetails) {
      user.transporterDetails = {};
    }

    // Update online status
    user.transporterDetails.isAvailable = online;
    user.transporterDetails.lastOnlineStatusUpdate = new Date();

    // Update location if provided
    if (location && location.latitude && location.longitude) {
      user.transporterDetails.currentLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy || null,
        timestamp: new Date()
      };
    }

    await user.save();

    // Update socket connection status
    if (socketService) {
      socketService.updateDriverAvailability(req.userId, online, location);
    }

    res.json({
      success: true,
      message: `Driver is now ${online ? 'online' : 'offline'}`,
      data: {
        online,
        location: user.transporterDetails.currentLocation || null,
        updatedAt: user.transporterDetails.lastOnlineStatusUpdate
      }
    });

  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating online status',
      code: 'STATUS_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDriverStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const transporterDetails = user.transporterDetails || {};
    const status = {
      isOnline: transporterDetails.isAvailable || false,
      isVerified: transporterDetails.isVerified || false,
      activeOrders: transporterDetails.activeOrders || 0,
      currentLocation: transporterDetails.currentLocation || null,
      lastOnlineStatusUpdate: transporterDetails.lastOnlineStatusUpdate || null,
      vehicleType: transporterDetails.vehicleType || null,
      rating: transporterDetails.rating || 0,
      totalDeliveries: transporterDetails.totalDeliveries || 0
    };

    res.json({
      success: true,
      message: 'Driver status retrieved successfully',
      data: status
    });

  } catch (error) {
    console.error('Get driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving driver status',
      code: 'STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== NOTIFICATION METHODS =====

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    
    const query = { userId: req.userId };
    
    if (type) {
      query.type = type;
    }
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      code: 'NOTIFICATIONS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      userId: req.userId, 
      read: false 
    });

    res.json({
      success: true,
      message: 'Notification count retrieved successfully',
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification count',
      code: 'NOTIFICATION_COUNT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notificationId, readAt: notification.readAt }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      code: 'MARK_READ_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== EARNINGS METHODS =====

const getEarnings = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        deliveredAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateFilter = { deliveredAt: { $gte: today, $lt: tomorrow } };
          break;
        case 'week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter = { deliveredAt: { $gte: weekStart } };
          break;
        case 'month':
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          dateFilter = { deliveredAt: { $gte: monthStart } };
          break;
        case 'year':
          const yearStart = new Date();
          yearStart.setMonth(0, 1);
          yearStart.setHours(0, 0, 0, 0);
          dateFilter = { deliveredAt: { $gte: yearStart } };
          break;
      }
    }

    const orders = await Order.find({
      transporter: req.userId,
      status: 'delivered',
      ...dateFilter
    });

    const totalEarnings = orders.reduce((sum, order) => 
      sum + (order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0), 0
    );
    
    const deliveryCount = orders.length;
    const avgEarningsPerDelivery = deliveryCount > 0 ? totalEarnings / deliveryCount : 0;

    // Calculate earnings by service type
    const earningsByType = orders.reduce((acc, order) => {
      const serviceType = order.serviceType;
      const earnings = order.pricing?.driverEarnings || order.pricing?.total * 0.8 || 0;
      
      if (!acc[serviceType]) {
        acc[serviceType] = { count: 0, earnings: 0 };
      }
      acc[serviceType].count += 1;
      acc[serviceType].earnings += earnings;
      
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Earnings retrieved successfully',
      data: {
        period,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        deliveryCount,
        avgEarningsPerDelivery: Math.round(avgEarningsPerDelivery * 100) / 100,
        earningsByType,
        dateRange: dateFilter.deliveredAt || null
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving earnings',
      code: 'EARNINGS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getEarningsBreakdown = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Get delivered orders for the specified period
    let groupBy;
    let dateFilter = {};
    
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { deliveredAt: { $gte: weekStart } };
        groupBy = { $dayOfWeek: '$deliveredAt' };
        break;
      case 'month':
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        dateFilter = { deliveredAt: { $gte: monthStart } };
        groupBy = { $dayOfMonth: '$deliveredAt' };
        break;
      case 'year':
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        dateFilter = { deliveredAt: { $gte: yearStart } };
        groupBy = { $month: '$deliveredAt' };
        break;
      default:
        groupBy = { $dayOfMonth: '$deliveredAt' };
    }

    const breakdown = await Order.aggregate([
      {
        $match: {
          transporter: new mongoose.Types.ObjectId(req.userId),
          status: 'delivered',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: groupBy,
          totalEarnings: {
            $sum: {
              $ifNull: ['$pricing.driverEarnings', { $multiply: ['$pricing.total', 0.8] }]
            }
          },
          deliveryCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      message: 'Earnings breakdown retrieved successfully',
      data: {
        period,
        breakdown: breakdown.map(item => ({
          period: item._id,
          earnings: Math.round(item.totalEarnings * 100) / 100,
          deliveries: item.deliveryCount
        }))
      }
    });

  } catch (error) {
    console.error('Get earnings breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving earnings breakdown',
      code: 'EARNINGS_BREAKDOWN_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== PERFORMANCE METHODS =====

const getPerformanceMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const transporterDetails = user.transporterDetails || {};

    // Get performance data from completed orders
    const completedOrders = await Order.find({
      transporter: req.userId,
      status: 'delivered'
    });

    const totalDeliveries = completedOrders.length;
    const totalRatings = completedOrders.filter(order => order.rating?.transporterRating);
    const averageRating = totalRatings.length > 0 
      ? totalRatings.reduce((sum, order) => sum + order.rating.transporterRating, 0) / totalRatings.length 
      : 0;

    // Calculate completion rate (delivered vs accepted)
    const acceptedOrders = await Order.countDocuments({
      transporter: req.userId,
      status: { $in: ['delivered', 'cancelled'] }
    });
    const completionRate = acceptedOrders > 0 ? (totalDeliveries / acceptedOrders) * 100 : 0;

    // Calculate on-time delivery rate (mock calculation)
    const onTimeRate = totalDeliveries > 0 ? Math.min(95, 85 + (averageRating * 2)) : 0;

    const performanceMetrics = {
      totalDeliveries,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
      totalRatingsReceived: totalRatings.length,
      isVerified: transporterDetails.isVerified || false,
      memberSince: user.createdAt,
      badges: [] // Can add achievement badges here
    };

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: performanceMetrics
    });

  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving performance metrics',
      code: 'PERFORMANCE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getRatingDetails = async (req, res) => {
  try {
    const ratedOrders = await Order.find({
      transporter: req.userId,
      'rating.transporterRating': { $exists: true }
    })
    .populate('customer', 'firstName lastName')
    .select('rating serviceType deliveredAt customer')
    .sort({ deliveredAt: -1 })
    .limit(50);

    const ratings = ratedOrders.map(order => ({
      orderId: order._id,
      rating: order.rating.transporterRating,
      feedback: order.rating.transporterFeedback || null,
      serviceType: order.serviceType,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      date: order.deliveredAt
    }));

    // Calculate rating distribution
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      ratingCounts[rating.rating] = (ratingCounts[rating.rating] || 0) + 1;
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
      : 0;

    res.json({
      success: true,
      message: 'Rating details retrieved successfully',
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingDistribution: ratingCounts,
        recentRatings: ratings.slice(0, 10),
        allRatings: ratings
      }
    });

  } catch (error) {
    console.error('Get rating details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving rating details',
      code: 'RATING_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== LOCATION METHODS =====

const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, heading } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.transporterDetails) {
      user.transporterDetails = {};
    }

    // Update location
    user.transporterDetails.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      accuracy: accuracy || null,
      heading: heading || null,
      timestamp: new Date()
    };

    await user.save();

    // Broadcast location to active orders (via socket)
    if (socketService) {
      const activeOrders = await Order.find({
        transporter: req.userId,
        status: { $in: ['accepted', 'picked_up', 'in_transit'] }
      });

      activeOrders.forEach(order => {
        socketService.broadcastDriverLocation(order._id.toString(), {
          driverId: req.userId,
          latitude,
          longitude,
          accuracy,
          heading,
          timestamp: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        accuracy,
        heading,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      code: 'LOCATION_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  // Verification
  getVerificationStatus,
  uploadVerificationDocument,
  submitBackgroundConsent,
  
  // Phone Verification
  sendPhoneVerification,
  verifyPhoneCode,
  resendPhoneVerification,
  
  // Statistics  
  getTodayStats,
  getWeeklyStats,
  getMonthlyStats,
  
  // Deliveries
  getAvailableDeliveries,
  acceptDelivery,
  getActiveDeliveries,
  getDeliveryHistory,
  updateDeliveryStatus,
  
  // Status & Availability
  updateOnlineStatus,
  getDriverStatus,
  
  // Notifications
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  
  // Earnings
  getEarnings,
  getEarningsBreakdown,
  
  // Performance
  getPerformanceMetrics,
  getRatingDetails,
  
  // Location
  updateLocation
};

