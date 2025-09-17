import socketManager from '../config/socket.js';

class SocketService {
  constructor() {
    this.socketManager = socketManager;
  }

  // Order-related notifications

  // Notify when a new order is created
  notifyNewOrder(order, nearbyTransporters = []) {
    try {
      // If we have specific nearby transporters, notify them
      if (nearbyTransporters.length > 0) {
        nearbyTransporters.forEach(transporterId => {
          this.socketManager.notifyUser(transporterId, 'new_order_near_you', {
            order: this.sanitizeOrderForTransporter(order),
            distance: null // TODO: Calculate actual distance
          });
        });
      } else {
        // Broadcast to all available transporters
        this.socketManager.notifyNearbyTransporters(
          this.sanitizeOrderForTransporter(order),
          order.pickupLocation.coordinates
        );
      }

      console.log(`📢 New order ${order.orderNumber} broadcasted to transporters`);
    } catch (error) {
      console.error('Error notifying new order:', error);
    }
  }

  // Notify when order is accepted by transporter
  notifyOrderAccepted(order, transporter) {
    try {
      // Notify the customer
      this.socketManager.notifyUser(order.customer._id || order.customer, 'order_accepted', {
        order: this.sanitizeOrderForCustomer(order),
        transporter: this.sanitizeTransporterInfo(transporter)
      });

      // Notify other transporters that order is no longer available
      this.socketManager.broadcastToUserType('transporter', 'order_no_longer_available', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });

      console.log(`✅ Order acceptance notification sent for ${order.orderNumber}`);
    } catch (error) {
      console.error('Error notifying order accepted:', error);
    }
  }

  // Notify order status updates
  notifyOrderStatusUpdate(order, previousStatus, updatedBy) {
    try {
      const statusUpdateData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        previousStatus,
        location: order.tracking?.currentLocation || null,
        updatedBy: this.sanitizeUserInfo(updatedBy),
        eta: order.tracking?.eta || null
      };

      // Notify customer
      if (order.customer) {
        this.socketManager.notifyUser(
          order.customer._id || order.customer, 
          'order_status_updated', 
          statusUpdateData
        );
      }

      // Notify transporter (if different from updater)
      if (order.transporter && order.transporter._id !== updatedBy._id) {
        this.socketManager.notifyUser(
          order.transporter._id || order.transporter, 
          'order_status_updated', 
          statusUpdateData
        );
      }

      // Notify order room
      this.socketManager.notifyOrderStatusUpdate(
        order._id, 
        order.status, 
        order.tracking?.currentLocation, 
        null, 
        this.sanitizeUserInfo(updatedBy)
      );

      console.log(`📱 Status update sent for order ${order.orderNumber}: ${previousStatus} → ${order.status}`);
    } catch (error) {
      console.error('Error notifying order status update:', error);
    }
  }

  // Notify when order is cancelled
  notifyOrderCancelled(order, cancelledBy, reason) {
    try {
      const cancellationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason,
        cancelledBy: this.sanitizeUserInfo(cancelledBy)
      };

      // Notify customer (if not the one who cancelled)
      if (order.customer && (order.customer._id || order.customer) !== cancelledBy._id) {
        this.socketManager.notifyUser(
          order.customer._id || order.customer, 
          'order_cancelled', 
          cancellationData
        );
      }

      // Notify transporter (if assigned and not the one who cancelled)
      if (order.transporter && (order.transporter._id || order.transporter) !== cancelledBy._id) {
        this.socketManager.notifyUser(
          order.transporter._id || order.transporter, 
          'order_cancelled', 
          cancellationData
        );
      }

      // Notify order room
      this.socketManager.io.to(`order:${order._id}`).emit('order_cancelled', cancellationData);

      console.log(`❌ Order cancellation notification sent for ${order.orderNumber}`);
    } catch (error) {
      console.error('Error notifying order cancelled:', error);
    }
  }

  // Location tracking notifications

  // Notify customer of transporter location update
  notifyLocationUpdate(orderId, customerId, transporterLocation, transporterInfo) {
    try {
      this.socketManager.notifyUser(customerId, 'transporter_location_update', {
        orderId,
        transporter: this.sanitizeTransporterInfo(transporterInfo),
        location: transporterLocation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error notifying location update:', error);
    }
  }

  // Chat and messaging notifications

  // Notify new message in order chat
  notifyNewMessage(orderId, message, sender, recipients = []) {
    try {
      const messageData = {
        orderId,
        message: {
          id: message.id,
          content: message.content,
          type: message.type || 'text',
          attachment: message.attachment || null,
          timestamp: message.timestamp || new Date().toISOString()
        },
        sender: this.sanitizeUserInfo(sender)
      };

      // Notify specific recipients
      if (recipients.length > 0) {
        recipients.forEach(recipientId => {
          this.socketManager.notifyUser(recipientId, 'new_message', messageData);
        });
      } else {
        // Notify order room
        this.socketManager.io.to(`order:${orderId}`).emit('new_message', messageData);
      }

      console.log(`💬 New message notification sent for order ${orderId}`);
    } catch (error) {
      console.error('Error notifying new message:', error);
    }
  }

  // System notifications

  // Send push notification (for mobile app)
  sendPushNotification(userId, title, body, data = {}) {
    try {
      this.socketManager.notifyUser(userId, 'push_notification', {
        title,
        body,
        data,
        priority: data.priority || 'normal'
      });

      console.log(`🔔 Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send system announcement
  sendSystemAnnouncement(message, level = 'info', targetUserType = null) {
    try {
      if (targetUserType) {
        this.socketManager.broadcastToUserType(targetUserType, 'system_announcement', {
          message,
          level
        });
      } else {
        this.socketManager.sendSystemAnnouncement(message, level);
      }

      console.log(`📢 System announcement sent (${level}): ${message}`);
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }

  // User account notifications

  // Notify user of account verification status
  notifyVerificationStatusUpdate(userId, verificationType, status, details = {}) {
    try {
      this.socketManager.notifyUser(userId, 'verification_status_updated', {
        type: verificationType,
        status,
        details
      });

      console.log(`✅ Verification status notification sent to user ${userId}: ${verificationType} - ${status}`);
    } catch (error) {
      console.error('Error notifying verification status:', error);
    }
  }

  // Utility methods for real-time features

  // Get online users count
  async getOnlineUsersCount() {
    try {
      return await this.socketManager.getConnectionsInfo();
    } catch (error) {
      console.error('Error getting online users count:', error);
      return { total: 0, byUserType: {}, rooms: 0 };
    }
  }

  // Disconnect user sessions (for security)
  async forceDisconnectUser(userId, reason = 'security_reason') {
    try {
      const disconnectedSockets = await this.socketManager.disconnectUser(userId, reason);
      console.log(`🔌 Force disconnected ${disconnectedSockets} sockets for user ${userId}`);
      return disconnectedSockets;
    } catch (error) {
      console.error('Error force disconnecting user:', error);
      return 0;
    }
  }

  // Check if Socket.io is healthy
  isHealthy() {
    return this.socketManager.isHealthy();
  }

  // Data sanitization methods

  sanitizeOrderForCustomer(order) {
    return {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      serviceType: order.serviceType,
      priority: order.priority,
      pickupLocation: order.pickupLocation,
      dropoffLocation: order.dropoffLocation,
      packageDetails: order.packageDetails,
      pricing: order.pricing,
      scheduledPickupTime: order.scheduledPickupTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      tracking: order.tracking,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  sanitizeOrderForTransporter(order) {
    return {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      serviceType: order.serviceType,
      priority: order.priority,
      pickupLocation: order.pickupLocation,
      dropoffLocation: order.dropoffLocation,
      packageDetails: {
        description: order.packageDetails.description,
        weight: order.packageDetails.weight,
        dimensions: order.packageDetails.dimensions,
        fragile: order.packageDetails.fragile,
        requiresSignature: order.packageDetails.requiresSignature
      },
      pricing: {
        totalAmount: order.pricing.totalAmount,
        currency: order.pricing.currency
      },
      scheduledPickupTime: order.scheduledPickupTime,
      customer: {
        firstName: order.customer.firstName,
        phone: order.customer.phone // Only necessary contact info
      },
      createdAt: order.createdAt
    };
  }

  sanitizeUserInfo(user) {
    return {
      id: user._id || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType
    };
  }

  sanitizeTransporterInfo(transporter) {
    return {
      id: transporter._id || transporter.id,
      firstName: transporter.firstName,
      lastName: transporter.lastName,
      phone: transporter.phone,
      transporterDetails: transporter.transporterDetails ? {
        vehicleType: transporter.transporterDetails.vehicleType,
        licensePlate: transporter.transporterDetails.licensePlate,
        rating: transporter.transporterDetails.rating
      } : null
    };
  }

  // Event emission helpers for controllers

  // Emit event to specific order room
  emitToOrder(orderId, event, data) {
    try {
      this.socketManager.io.to(`order:${orderId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting to order room:', error);
    }
  }

  // Emit event to specific user
  emitToUser(userId, event, data) {
    try {
      this.socketManager.notifyUser(userId, event, data);
    } catch (error) {
      console.error('Error emitting to user:', error);
    }
  }

  // Emit event to all users of a type
  emitToUserType(userType, event, data) {
    try {
      this.socketManager.broadcastToUserType(userType, event, data);
    } catch (error) {
      console.error('Error emitting to user type:', error);
    }
  }

  // Emit system-wide event
  emitSystemWide(event, data) {
    try {
      this.socketManager.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting system-wide:', error);
    }
  }

  // Driver-specific methods
  
  // Update driver availability status
  updateDriverAvailability(driverId, isOnline, location = null) {
    try {
      const statusData = {
        driverId,
        isOnline,
        location,
        timestamp: new Date().toISOString()
      };

      // Notify the driver
      this.socketManager.notifyUser(driverId, 'availability_updated', statusData);
      
      // Notify relevant customers/orders if driver goes offline
      if (!isOnline) {
        this.socketManager.broadcastToUserType('customer', 'driver_availability_changed', {
          driverId,
          isOnline: false
        });
      }

      console.log(`📍 Driver ${driverId} availability updated: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  }

  // Broadcast driver location to tracking orders
  broadcastDriverLocation(orderId, locationData) {
    try {
      // Emit to specific order room
      this.socketManager.emitToRoom(`order:${orderId}`, 'driver_location_update', {
        orderId,
        ...locationData,
        timestamp: new Date().toISOString()
      });

      console.log(`📍 Location broadcast for order ${orderId}`);
    } catch (error) {
      console.error('Error broadcasting driver location:', error);
    }
  }

  // Notify order status update
  notifyOrderStatusUpdate(orderId, status, location = null) {
    try {
      const updateData = {
        orderId,
        status,
        location,
        timestamp: new Date().toISOString()
      };

      // Emit to specific order room
      this.socketManager.emitToRoom(`order:${orderId}`, 'order_status_update', updateData);

      console.log(`📋 Status update broadcast for order ${orderId}: ${status}`);
    } catch (error) {
      console.error('Error notifying order status update:', error);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;