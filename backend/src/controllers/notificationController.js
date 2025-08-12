import notificationService from '../services/notificationService.js';
import { validationResult } from 'express-validator';

class NotificationController {
  // Get user notifications
  async getNotifications(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

      const result = await notificationService.getUserNotifications(req.userId, page, limit);

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: result.notifications,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        code: 'GET_NOTIFICATIONS_ERROR'
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const unreadCount = await notificationService.getUnreadCount(req.userId);

      res.json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: {
          unreadCount
        }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        code: 'GET_UNREAD_COUNT_ERROR'
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
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

      const { notificationId } = req.params;

      const success = await notificationService.markNotificationRead(req.userId, notificationId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          notificationId,
          read: true
        }
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        code: 'MARK_READ_ERROR'
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const success = await notificationService.markAllNotificationsRead(req.userId);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to mark all notifications as read',
          code: 'MARK_ALL_READ_ERROR'
        });
      }

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          markedAsRead: true
        }
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        code: 'MARK_ALL_READ_ERROR'
      });
    }
  }

  // Send test notification (development only)
  async sendTestNotification(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Test notifications not available in production',
          code: 'PRODUCTION_DISABLED'
        });
      }

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

      const { title, body, type = 'push', data = {} } = req.body;

      let success = false;
      switch (type) {
        case 'push':
          success = await notificationService.sendPushNotification(req.userId, title, body, data);
          break;
        case 'email':
          success = await notificationService.sendEmailNotification(
            req.userId, 
            title, 
            'test_template',
            { body, ...data }
          );
          break;
        case 'sms':
          success = await notificationService.sendSMSNotification(req.userId, body);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid notification type',
            code: 'INVALID_TYPE'
          });
      }

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send test notification',
          code: 'SEND_TEST_ERROR'
        });
      }

      res.json({
        success: true,
        message: `Test ${type} notification sent successfully`,
        data: {
          type,
          title,
          body,
          sent: true
        }
      });
    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        code: 'SEND_TEST_ERROR'
      });
    }
  }

  // Send system announcement (admin only)
  async sendSystemAnnouncement(req, res) {
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

      const { message, level = 'info', targetUserType } = req.body;

      // TODO: Add admin role check
      // For now, any authenticated user can send announcements in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'System announcements require admin privileges',
          code: 'ADMIN_REQUIRED'
        });
      }

      const success = await notificationService.sendSystemAnnouncement(
        message, 
        level, 
        targetUserType
      );

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send system announcement',
          code: 'SEND_ANNOUNCEMENT_ERROR'
        });
      }

      res.json({
        success: true,
        message: 'System announcement sent successfully',
        data: {
          message,
          level,
          targetUserType,
          sent: true
        }
      });
    } catch (error) {
      console.error('Send system announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send system announcement',
        code: 'SEND_ANNOUNCEMENT_ERROR'
      });
    }
  }

  // Get notification statistics (admin/development only)
  async getNotificationStats(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Statistics not available in production',
          code: 'PRODUCTION_DISABLED'
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const stats = await notificationService.getNotificationStats();

      res.json({
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: {
          statistics: stats,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        code: 'GET_STATS_ERROR'
      });
    }
  }

  // Clean up old notifications (admin/system only)
  async cleanupOldNotifications(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Manual cleanup not available in production',
          code: 'PRODUCTION_DISABLED'
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const daysOld = Math.max(1, parseInt(req.query.days) || 30);
      const cleanedCount = await notificationService.cleanupOldNotifications(daysOld);

      res.json({
        success: true,
        message: 'Old notifications cleaned up successfully',
        data: {
          cleanedCount,
          daysOld,
          cleanedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old notifications',
        code: 'CLEANUP_ERROR'
      });
    }
  }
}

// Create controller instance
const notificationController = new NotificationController();

export default notificationController;