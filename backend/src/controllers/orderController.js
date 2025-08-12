import Order from '../models/Order.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import socketService from '../services/socketService.js';

class OrderController {
  // Create new order
  async createOrder(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const {
        serviceType,
        pickupLocation,
        dropoffLocation,
        packageDetails,
        scheduledPickupTime,
        priority,
        specialRequirements
      } = req.body;

      // Verify user exists and is a customer
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.userType !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Only customers can create orders',
          code: 'INVALID_USER_TYPE'
        });
      }

      // Calculate estimated pricing based on service type and distance
      const pricing = await this.calculateOrderPricing({
        serviceType,
        pickupLocation,
        dropoffLocation,
        packageDetails
      });

      // Create order object
      const orderData = {
        customer: req.userId,
        serviceType,
        pickupLocation,
        dropoffLocation,
        packageDetails,
        scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
        priority: priority || 'normal',
        pricing,
        payment: {
          status: 'pending'
        },
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          updatedBy: req.userId
        }],
        source: 'mobile_app'
      };

      const order = new Order(orderData);
      await order.save();

      // Populate customer details for response
      await order.populate('customer', 'firstName lastName email phone');

      // Notify nearby transporters about new order
      try {
        socketService.notifyNewOrder(order);
      } catch (socketError) {
        console.error('Socket notification error for new order:', socketError);
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: order.toJSON()
        }
      });


    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating order',
        code: 'ORDER_CREATION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get orders for authenticated user
  async getUserOrders(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
      const skip = (page - 1) * limit;
      const status = req.query.status;
      const serviceType = req.query.serviceType;

      // Build query based on user type
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      let query = {};
      if (user.userType === 'customer') {
        query.customer = req.userId;
      } else if (user.userType === 'transporter') {
        query.transporter = req.userId;
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Add service type filter if provided
      if (serviceType) {
        query.serviceType = serviceType;
      }

      // Get orders with pagination
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate('customer', 'firstName lastName email phone')
          .populate('transporter', 'firstName lastName email phone transporterDetails')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: orders.map(order => order.toJSON()),
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving orders',
        code: 'ORDER_RETRIEVAL_ERROR'
      });
    }
  }

  // Get specific order details
  async getOrderDetails(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName email phone addresses')
        .populate('transporter', 'firstName lastName email phone transporterDetails');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user has access to this order
      const hasAccess = order.customer._id.toString() === req.userId.toString() ||
                       (order.transporter && order.transporter._id.toString() === req.userId.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this order',
          code: 'ORDER_ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        message: 'Order details retrieved successfully',
        data: {
          order: order.toJSON()
        }
      });
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving order details',
        code: 'ORDER_DETAILS_ERROR'
      });
    }
  }

  // Update order status (mainly for transporters)
  async updateOrderStatus(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { orderId } = req.params;
      const { status, note, location } = req.body;

      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName email')
        .populate('transporter', 'firstName lastName email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user can update this order
      const canUpdate = order.transporter && order.transporter._id.toString() === req.userId.toString();
      
      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned transporter can update order status',
          code: 'ORDER_UPDATE_DENIED'
        });
      }

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(order.status);
      if (!validTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${order.status} to ${status}`,
          code: 'INVALID_STATUS_TRANSITION',
          details: {
            currentStatus: order.status,
            attemptedStatus: status,
            validTransitions
          }
        });
      }

      // Update order status
      await order.updateStatus(req.userId, status, note, location);

      // Update tracking location if provided
      if (location) {
        order.tracking.currentLocation = {
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date(),
          accuracy: location.accuracy || null
        };
        order.tracking.lastLocationUpdate = new Date();
        await order.save();
      }

      // Notify customer and other parties about status update
      try {
        const updatedBy = await User.findById(req.userId);
        socketService.notifyOrderStatusUpdate(order, previousStatus, updatedBy);
      } catch (socketError) {
        console.error('Socket notification error for status update:', socketError);
      }

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          order: order.toJSON()
        }
      });


    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating order status',
        code: 'ORDER_STATUS_UPDATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Accept order (for transporters)
  async acceptOrder(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { orderId } = req.params;
      const { estimatedPickupTime } = req.body;

      // Verify transporter
      const transporter = await User.findById(req.userId).session(session);
      if (!transporter || transporter.userType !== 'transporter') {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Only transporters can accept orders',
          code: 'INVALID_USER_TYPE'
        });
      }

      if (!transporter.transporterDetails?.isVerified) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Your transporter account must be verified before accepting orders',
          code: 'TRANSPORTER_NOT_VERIFIED'
        });
      }

      if (!transporter.transporterDetails?.isAvailable) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'You must be available to accept orders',
          code: 'TRANSPORTER_UNAVAILABLE'
        });
      }

      // Find and lock the order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (order.status !== 'pending') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Order is no longer available for acceptance',
          code: 'ORDER_NOT_AVAILABLE',
          details: {
            currentStatus: order.status
          }
        });
      }

      // Accept the order
      order.transporter = req.userId;
      order.status = 'accepted';
      order.acceptedAt = new Date();
      
      if (estimatedPickupTime) {
        order.estimatedPickupTime = new Date(estimatedPickupTime);
      }

      // Add to status history
      order.statusHistory.push({
        status: 'accepted',
        timestamp: new Date(),
        updatedBy: req.userId,
        note: `Order accepted by ${transporter.firstName} ${transporter.lastName}`
      });

      await order.save({ session });

      // Update transporter's active orders count
      if (!transporter.transporterDetails.activeOrders) {
        transporter.transporterDetails.activeOrders = 0;
      }
      transporter.transporterDetails.activeOrders += 1;
      await transporter.save({ session });

      await session.commitTransaction();

      // Populate for response
      await order.populate('customer', 'firstName lastName email phone');
      await order.populate('transporter', 'firstName lastName email phone transporterDetails');

      // Notify customer and other transporters about order acceptance
      try {
        socketService.notifyOrderAccepted(order, transporter);
      } catch (socketError) {
        console.error('Socket notification error for order acceptance:', socketError);
      }

      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: {
          order: order.toJSON()
        }
      });


    } catch (error) {
      await session.abortTransaction();
      console.error('Accept order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error accepting order',
        code: 'ORDER_ACCEPT_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      session.endSession();
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { orderId } = req.params;
      const { reason, description } = req.body;

      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName email')
        .populate('transporter', 'firstName lastName email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user can cancel this order
      const canCancel = order.canBeCancelledBy(req.userId);
      if (!canCancel) {
        return res.status(403).json({
          success: false,
          message: 'You cannot cancel this order at its current status',
          code: 'CANCELLATION_NOT_ALLOWED',
          details: {
            currentStatus: order.status
          }
        });
      }

      // Cancel the order
      order.status = 'cancelled';
      order.cancellation = {
        cancelledBy: req.userId,
        reason: reason || 'user_request',
        description: description,
        cancelledAt: new Date()
      };

      // Add to status history
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        updatedBy: req.userId,
        note: description || `Order cancelled: ${reason || 'user_request'}`
      });

      await order.save();

      // Notify all parties about order cancellation
      try {
        const cancelledBy = await User.findById(req.userId);
        socketService.notifyOrderCancelled(order, cancelledBy, reason);
      } catch (socketError) {
        console.error('Socket notification error for order cancellation:', socketError);
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          order: order.toJSON()
        }
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        code: 'ORDER_CANCEL_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get nearby orders for transporters
  async getNearbyOrders(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const transporter = await User.findById(req.userId);
      if (!transporter || transporter.userType !== 'transporter') {
        return res.status(403).json({
          success: false,
          message: 'Only transporters can view nearby orders',
          code: 'INVALID_USER_TYPE'
        });
      }

      if (!transporter.transporterDetails?.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'You must be available to view nearby orders',
          code: 'TRANSPORTER_UNAVAILABLE'
        });
      }

      const { lat, lng, radius = 10000, serviceType, limit = 20 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates (lat, lng) are required',
          code: 'LOCATION_REQUIRED'
        });
      }

      // Build query for nearby orders
      let query = {
        status: 'pending',
        'pickupLocation.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      };

      // Filter by service type if provided
      if (serviceType) {
        query.serviceType = serviceType;
      }

      const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email phone')
        .sort({ createdAt: 1 })
        .limit(Math.min(50, parseInt(limit) || 20));

      res.json({
        success: true,
        message: 'Nearby orders retrieved successfully',
        data: {
          orders: orders.map(order => order.toJSON()),
          searchParams: {
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: parseInt(radius),
            serviceType: serviceType || 'all',
            count: orders.length
          }
        }
      });
    } catch (error) {
      console.error('Get nearby orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving nearby orders',
        code: 'NEARBY_ORDERS_ERROR'
      });
    }
  }

  // Rate order (for customers and transporters)
  async rateOrder(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { orderId } = req.params;
      const { rating, feedback } = req.body;

      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName')
        .populate('transporter', 'firstName lastName');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Can only rate completed orders',
          code: 'ORDER_NOT_COMPLETED'
        });
      }

      // Check if user is part of this order
      const isCustomer = order.customer._id.toString() === req.userId.toString();
      const isTransporter = order.transporter && order.transporter._id.toString() === req.userId.toString();

      if (!isCustomer && !isTransporter) {
        return res.status(403).json({
          success: false,
          message: 'You can only rate orders you are involved in',
          code: 'RATING_NOT_ALLOWED'
        });
      }

      // Update rating
      if (isCustomer) {
        if (order.rating.customerRating) {
          return res.status(400).json({
            success: false,
            message: 'You have already rated this order',
            code: 'ALREADY_RATED'
          });
        }
        order.rating.customerRating = rating;
        order.rating.customerFeedback = feedback;
      } else if (isTransporter) {
        if (order.rating.transporterRating) {
          return res.status(400).json({
            success: false,
            message: 'You have already rated this order',
            code: 'ALREADY_RATED'
          });
        }
        order.rating.transporterRating = rating;
        order.rating.transporterFeedback = feedback;
      }

      order.rating.feedbackDate = new Date();
      await order.save();

      res.json({
        success: true,
        message: 'Order rated successfully',
        data: {
          rating: order.rating
        }
      });

      // TODO: Update user's average rating
      // this.updateUserRating(isCustomer ? order.transporter._id : order.customer._id);

    } catch (error) {
      console.error('Rate order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error rating order',
        code: 'ORDER_RATING_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper method to calculate order pricing
  async calculateOrderPricing({ serviceType, pickupLocation, dropoffLocation, packageDetails }) {
    // Base pricing structure (in USD)
    const basePrices = {
      express: 15.00,
      standard: 10.00,
      moving: 25.00,
      storage: 20.00
    };

    // Distance calculation (simplified - in production, use Google Maps API)
    const distance = this.calculateDistance(
      pickupLocation.coordinates,
      dropoffLocation.coordinates
    );

    const baseFee = basePrices[serviceType] || basePrices.standard;
    const distanceFee = Math.max(0, (distance - 5) * 1.5); // Free up to 5km, then $1.5/km
    
    let surcharges = [];
    
    // Add surcharges based on package details
    if (packageDetails.fragile) {
      surcharges.push({
        type: 'fragile',
        description: 'Fragile item handling',
        amount: 5.00
      });
    }

    if (packageDetails.weight && packageDetails.weight > 20) {
      surcharges.push({
        type: 'oversized',
        description: 'Heavy item (>20kg)',
        amount: 10.00
      });
    }

    const totalSurcharges = surcharges.reduce((sum, charge) => sum + charge.amount, 0);
    const subtotal = baseFee + distanceFee + totalSurcharges;
    const taxAmount = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + taxAmount;

    return {
      baseFee,
      distanceFee,
      surcharges,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      currency: 'USD'
    };
  }

  // Helper method to calculate distance between two coordinates
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper method to get valid status transitions
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      pending: ['accepted', 'cancelled'],
      accepted: ['pickup_scheduled', 'cancelled'],
      pickup_scheduled: ['en_route_pickup', 'cancelled'],
      en_route_pickup: ['arrived_pickup'],
      arrived_pickup: ['picked_up', 'failed'],
      picked_up: ['en_route_delivery'],
      en_route_delivery: ['arrived_delivery'],
      arrived_delivery: ['delivered', 'failed'],
      delivered: [], // Final state
      cancelled: [], // Final state
      failed: ['pending', 'cancelled'] // Can retry or cancel
    };

    return transitions[currentStatus] || [];
  }

  // Get order tracking information
  async getOrderTracking(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { orderId } = req.params;

      // Find the order and populate necessary fields
      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName phone')
        .populate('transporter', 'firstName lastName phone transporterDetails');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Verify user has access to this order
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const hasAccess = 
        (user.userType === 'customer' && order.customer._id.toString() === req.userId) ||
        (user.userType === 'transporter' && order.transporter && order.transporter._id.toString() === req.userId);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only track your own orders.',
          code: 'ACCESS_DENIED'
        });
      }

      // Prepare tracking information
      const trackingInfo = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        serviceType: order.serviceType,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        
        // Locations
        pickupLocation: {
          address: order.pickupLocation.address,
          coordinates: order.pickupLocation.coordinates
        },
        dropoffLocation: {
          address: order.dropoffLocation.address,
          coordinates: order.dropoffLocation.coordinates
        },

        // Current tracking
        tracking: {
          currentLocation: order.tracking?.currentLocation || null,
          lastLocationUpdate: order.tracking?.lastLocationUpdate || null,
          route: order.tracking?.route || [],
          estimatedArrival: order.tracking?.estimatedArrival || null
        },

        // Status history with timestamps
        statusHistory: order.statusHistory || [],

        // Transporter info (if assigned)
        transporter: order.transporter ? {
          _id: order.transporter._id,
          firstName: order.transporter.firstName,
          lastName: order.transporter.lastName,
          phone: order.transporter.phone,
          vehicle: order.transporter.transporterDetails?.vehicleType || null,
          licensePlate: order.transporter.transporterDetails?.licensePlate || null
        } : null,

        // Package info
        packageDetails: {
          description: order.packageDetails.description,
          weight: order.packageDetails.weight,
          dimensions: order.packageDetails.dimensions
        },

        // Timestamps
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      res.json({
        success: true,
        message: 'Tracking information retrieved successfully',
        data: {
          tracking: trackingInfo
        }
      });

    } catch (error) {
      console.error('Get order tracking error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving tracking information',
        code: 'TRACKING_ERROR'
      });
    }
  }
}

export default new OrderController();