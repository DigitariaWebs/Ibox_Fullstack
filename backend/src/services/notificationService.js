import User from '../models/User.js';
import socketService from './socketService.js';
// Redis removed - using in-memory storage for development

class NotificationService {
  constructor() {
    // In-memory storage for development (replace with database in production)
    this.notifications = new Map();
  }

  // Send push notification to user
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Send via Socket.io for real-time delivery
      socketService.sendPushNotification(userId, title, body, data);

      // Store notification for offline users
      await this.storeNotification(userId, {
        title,
        body,
        data,
        type: 'push',
        timestamp: new Date().toISOString(),
        read: false
      });

      // TODO: Integrate with push notification service for mobile notifications
      console.log(`📱 Push notification sent to user ${userId}: ${title}`);

      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  // Send email notification
  async sendEmailNotification(userId, subject, template, templateData = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        throw new Error('User not found or no email address');
      }

      // TODO: Implement email service integration
      console.log(`📧 Email notification queued for ${user.email}: ${subject}`);

      // Store notification record
      await this.storeNotification(userId, {
        title: subject,
        body: `Email sent to ${user.email}`,
        type: 'email',
        template,
        templateData,
        timestamp: new Date().toISOString(),
        read: false
      });

      return true;
    } catch (error) {
      console.error('Email notification error:', error);
      return false;
    }
  }

  // Send SMS notification
  async sendSMSNotification(userId, message) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.phone) {
        throw new Error('User not found or no phone number');
      }

      // TODO: Integrate with SMS service (Twilio, etc.)
      console.log(`📱 SMS notification queued for ${user.phone}: ${message}`);

      // Store notification record
      await this.storeNotification(userId, {
        title: 'SMS Notification',
        body: message,
        type: 'sms',
        phone: user.phone,
        timestamp: new Date().toISOString(),
        read: false
      });

      return true;
    } catch (error) {
      console.error('SMS notification error:', error);
      return false;
    }
  }

  // Order-specific notification helpers

  // Notify customer about order status changes
  async notifyCustomerOrderUpdate(order, message, type = 'order_update') {
    try {
      const customerId = order.customer._id || order.customer;
      
      await this.sendPushNotification(
        customerId,
        `Order ${order.orderNumber}`,
        message,
        {
          type,
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status
        }
      );

      // Send email for important status changes
      if (['accepted', 'delivered', 'cancelled'].includes(order.status)) {
        await this.sendEmailNotification(
          customerId,
          `Your order ${order.orderNumber} has been ${order.status}`,
          'order_status_update',
          { order, message }
        );
      }

      return true;
    } catch (error) {
      console.error('Customer order notification error:', error);
      return false;
    }
  }

  // Notify transporter about order opportunities
  async notifyTransporterNewOrder(transporterId, order) {
    try {
      await this.sendPushNotification(
        transporterId,
        'New order available',
        `${order.serviceType} delivery from ${order.pickupLocation.address}`,
        {
          type: 'new_order',
          orderId: order._id,
          orderNumber: order.orderNumber,
          serviceType: order.serviceType,
          pricing: order.pricing
        }
      );

      return true;
    } catch (error) {
      console.error('Transporter order notification error:', error);
      return false;
    }
  }

  // System-wide notifications
  async sendSystemAnnouncement(message, level = 'info', targetUserType = null) {
    try {
      // Send via Socket.io for real-time delivery
      socketService.sendSystemAnnouncement(message, level, targetUserType);

      // Store for offline users
      let query = {};
      if (targetUserType) {
        query.userType = targetUserType;
      }

      const users = await User.find(query).select('_id');
      
      await Promise.all(users.map(user => 
        this.storeNotification(user._id, {
          title: 'System Announcement',
          body: message,
          type: 'system',
          level,
          timestamp: new Date().toISOString(),
          read: false
        })
      ));

      console.log(`📢 System announcement sent to ${users.length} users: ${message}`);
      return true;
    } catch (error) {
      console.error('System announcement error:', error);
      return false;
    }
  }

  // Notification storage and retrieval

  // Store notification in Redis for quick access
  async storeNotification(userId, notification) {
    try {
      const notificationKey = `notifications:${userId}`;
      const notificationData = JSON.stringify({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification
      });

      // Store in Redis list (most recent first)
      await this.redis.lpush(notificationKey, notificationData);
      
      // Keep only last 100 notifications per user
      await this.redis.ltrim(notificationKey, 0, 99);
      
      // Set expiration (30 days)
      await this.redis.expire(notificationKey, 30 * 24 * 60 * 60);

      return true;
    } catch (error) {
      console.error('Store notification error:', error);
      return false;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const notificationKey = `notifications:${userId}`;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const notifications = await this.redis.lrange(notificationKey, start, end);
      const total = await this.redis.llen(notificationKey);

      return {
        notifications: notifications.map(n => JSON.parse(n)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { notifications: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }
  }

  // Mark notification as read
  async markNotificationRead(userId, notificationId) {
    try {
      const notificationKey = `notifications:${userId}`;
      const notifications = await this.redis.lrange(notificationKey, 0, -1);
      
      let found = false;
      const updatedNotifications = notifications.map(notificationStr => {
        const notification = JSON.parse(notificationStr);
        if (notification.id === notificationId) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          found = true;
        }
        return JSON.stringify(notification);
      });

      if (found) {
        // Replace the entire list
        await this.redis.del(notificationKey);
        if (updatedNotifications.length > 0) {
          await this.redis.rpush(notificationKey, ...updatedNotifications);
          await this.redis.expire(notificationKey, 30 * 24 * 60 * 60);
        }
      }

      return found;
    } catch (error) {
      console.error('Mark notification read error:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(userId) {
    try {
      const notificationKey = `notifications:${userId}`;
      const notifications = await this.redis.lrange(notificationKey, 0, -1);
      
      const updatedNotifications = notifications.map(notificationStr => {
        const notification = JSON.parse(notificationStr);
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
        return JSON.stringify(notification);
      });

      // Replace the entire list
      await this.redis.del(notificationKey);
      if (updatedNotifications.length > 0) {
        await this.redis.rpush(notificationKey, ...updatedNotifications);
        await this.redis.expire(notificationKey, 30 * 24 * 60 * 60);
      }

      return true;
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return false;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const notificationKey = `notifications:${userId}`;
      const notifications = await this.redis.lrange(notificationKey, 0, -1);
      
      const unreadCount = notifications.reduce((count, notificationStr) => {
        const notification = JSON.parse(notificationStr);
        return count + (notification.read ? 0 : 1);
      }, 0);

      return unreadCount;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 30) {
    try {
      // This would typically be run as a cron job
      const keys = await this.redis.keys('notifications:*');
      let cleaned = 0;

      for (const key of keys) {
        const notifications = await this.redis.lrange(key, 0, -1);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const validNotifications = notifications.filter(notificationStr => {
          const notification = JSON.parse(notificationStr);
          const notificationDate = new Date(notification.timestamp);
          return notificationDate > cutoffDate;
        });

        if (validNotifications.length !== notifications.length) {
          await this.redis.del(key);
          if (validNotifications.length > 0) {
            await this.redis.rpush(key, ...validNotifications);
            await this.redis.expire(key, 30 * 24 * 60 * 60);
          }
          cleaned += notifications.length - validNotifications.length;
        }
      }

      console.log(`🧹 Cleaned up ${cleaned} old notifications`);
      return cleaned;
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      return 0;
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const keys = await this.redis.keys('notifications:*');
      let totalNotifications = 0;
      let totalUnread = 0;
      let userCount = keys.length;

      for (const key of keys) {
        const notifications = await this.redis.lrange(key, 0, -1);
        totalNotifications += notifications.length;
        
        const unread = notifications.reduce((count, notificationStr) => {
          const notification = JSON.parse(notificationStr);
          return count + (notification.read ? 0 : 1);
        }, 0);
        totalUnread += unread;
      }

      return {
        totalUsers: userCount,
        totalNotifications,
        totalUnread,
        averagePerUser: userCount > 0 ? Math.round(totalNotifications / userCount) : 0,
        unreadPercentage: totalNotifications > 0 ? Math.round((totalUnread / totalNotifications) * 100) : 0
      };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return {
        totalUsers: 0,
        totalNotifications: 0,
        totalUnread: 0,
        averagePerUser: 0,
        unreadPercentage: 0
      };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;