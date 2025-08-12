import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import redisConfig from './redis.js';
import authService from '../services/authService.js';

class SocketManager {
  constructor() {
    this.io = null;
    this.redisAdapter = null;
  }

  // Initialize Socket.io server
  async initialize(httpServer) {
    try {
      // Create Socket.io server
      this.io = new Server(httpServer, {
        cors: {
          origin: [
            'http://localhost:3000',     // React development
            'http://localhost:19006',    // Expo development
            'http://localhost:8081',     // React Native Metro
            process.env.FRONTEND_URL,    // Production frontend
          ].filter(Boolean),
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        maxHttpBufferSize: 1e6, // 1MB
        allowEIO3: true
      });

      // Setup Redis adapter for scalability
      await this.setupRedisAdapter();

      // Setup authentication middleware
      this.setupAuthentication();

      // Setup event handlers
      this.setupEventHandlers();

      console.log('✅ Socket.io server initialized successfully');
      return this.io;
    } catch (error) {
      console.error('❌ Failed to initialize Socket.io server:', error);
      throw error;
    }
  }

  // Setup Redis adapter for horizontal scaling
  async setupRedisAdapter() {
    try {
      // Use the existing pub/sub clients from redisConfig
      const pubClient = redisConfig.pubClient;
      const subClient = redisConfig.subClient;

      if (!pubClient || !subClient) {
        throw new Error('Redis pub/sub clients not initialized');
      }

      this.redisAdapter = createAdapter(pubClient, subClient);
      this.io.adapter(this.redisAdapter);

      console.log('✅ Socket.io Redis adapter configured');
    } catch (error) {
      console.error('❌ Failed to setup Redis adapter:', error);
      // Continue without Redis adapter (single instance mode)
      console.log('⚠️ Continuing without Redis adapter (single instance mode)');
    }
  }

  // Authentication middleware for Socket.io
  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Extract token if it has Bearer prefix
        const cleanToken = token.replace('Bearer ', '');

        // Verify JWT token
        const payload = await authService.verifyToken(cleanToken, 'access');
        
        if (!payload.userId) {
          return next(new Error('Invalid token payload'));
        }

        // Get user info (you might want to cache this)
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(payload.userId);
        
        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        // Attach user info to socket
        socket.userId = user._id.toString();
        socket.userType = user.userType;
        socket.user = {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType
        };

        // Log connection
        await authService.logSecurityEvent(socket.userId, 'socket_connected', {
          socketId: socket.id,
          ip: socket.request.connection.remoteAddress,
          userAgent: socket.request.headers['user-agent']
        });

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup main event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.email} (${socket.user.userType})`);

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);
      
      // Join user type specific room
      socket.join(`${socket.userType}s`);

      // Setup event handlers for this socket
      this.setupSocketEvents(socket);

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`🔌 User disconnected: ${socket.user.email} - ${reason}`);
        
        try {
          await authService.logSecurityEvent(socket.userId, 'socket_disconnected', {
            socketId: socket.id,
            reason,
            duration: Date.now() - socket.handshake.time
          });
        } catch (error) {
          console.error('Error logging disconnect:', error);
        }
      });
    });
  }

  // Setup individual socket event handlers
  setupSocketEvents(socket) {
    // Order-related events
    this.setupOrderEvents(socket);
    
    // Location tracking events
    this.setupLocationEvents(socket);
    
    // Chat/messaging events
    this.setupChatEvents(socket);
    
    // General events
    this.setupGeneralEvents(socket);
  }

  // Order-related Socket events
  setupOrderEvents(socket) {
    // Join order room for real-time updates
    socket.on('join_order', (orderId) => {
      if (!orderId) return;
      
      socket.join(`order:${orderId}`);
      console.log(`📦 ${socket.user.email} joined order room: ${orderId}`);
    });

    // Leave order room
    socket.on('leave_order', (orderId) => {
      if (!orderId) return;
      
      socket.leave(`order:${orderId}`);
      console.log(`📦 ${socket.user.email} left order room: ${orderId}`);
    });

    // Transporter accepts order
    socket.on('accept_order', async (data) => {
      try {
        const { orderId } = data;
        
        if (socket.userType !== 'transporter') {
          socket.emit('error', { message: 'Only transporters can accept orders' });
          return;
        }

        // Notify customer and other transporters
        this.notifyOrderAccepted(orderId, socket.userId, socket.user);
        
        console.log(`✅ Order ${orderId} accepted by ${socket.user.email}`);
      } catch (error) {
        console.error('Accept order socket error:', error);
        socket.emit('error', { message: 'Failed to accept order' });
      }
    });

    // Order status update
    socket.on('update_order_status', async (data) => {
      try {
        const { orderId, status, location, note } = data;
        
        if (socket.userType !== 'transporter') {
          socket.emit('error', { message: 'Only transporters can update order status' });
          return;
        }

        // Broadcast status update to order room
        this.notifyOrderStatusUpdate(orderId, status, location, note, socket.user);
        
        console.log(`📱 Order ${orderId} status updated to ${status} by ${socket.user.email}`);
      } catch (error) {
        console.error('Update order status socket error:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });
  }

  // Location tracking events
  setupLocationEvents(socket) {
    // Real-time location updates from transporter
    socket.on('location_update', (data) => {
      if (socket.userType !== 'transporter') {
        socket.emit('error', { message: 'Only transporters can send location updates' });
        return;
      }

      const { orderId, lat, lng, bearing, speed, accuracy } = data;
      
      if (!orderId || !lat || !lng) {
        socket.emit('error', { message: 'Order ID and coordinates are required' });
        return;
      }

      // Broadcast location to order participants
      const locationData = {
        transporterId: socket.userId,
        transporter: socket.user,
        location: { lat, lng, bearing, speed, accuracy },
        timestamp: new Date().toISOString()
      };

      this.io.to(`order:${orderId}`).emit('transporter_location_update', locationData);
    });

    // Request transporter's current location
    socket.on('request_transporter_location', (data) => {
      const { orderId, transporterId } = data;
      
      // Forward request to specific transporter
      this.io.to(`user:${transporterId}`).emit('location_request', {
        orderId,
        requestedBy: socket.userId,
        requester: socket.user
      });
    });
  }

  // Chat/messaging events
  setupChatEvents(socket) {
    // Send message in order chat
    socket.on('send_message', async (data) => {
      try {
        const { orderId, message, type = 'text', attachment } = data;
        
        if (!orderId || !message) {
          socket.emit('error', { message: 'Order ID and message are required' });
          return;
        }

        const messageData = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          sender: socket.user,
          message: message.trim(),
          type,
          attachment,
          timestamp: new Date().toISOString(),
          isRead: false
        };

        // Broadcast message to order room
        this.io.to(`order:${orderId}`).emit('new_message', messageData);

        // TODO: Save message to database
        console.log(`💬 Message sent in order ${orderId} by ${socket.user.email}`);
      } catch (error) {
        console.error('Send message socket error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_messages_read', (data) => {
      const { orderId, messageIds } = data;
      
      // Notify other participants that messages were read
      socket.to(`order:${orderId}`).emit('messages_read', {
        orderId,
        messageIds,
        readBy: socket.user
      });
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { orderId } = data;
      socket.to(`order:${orderId}`).emit('user_typing', {
        orderId,
        user: socket.user,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { orderId } = data;
      socket.to(`order:${orderId}`).emit('user_typing', {
        orderId,
        user: socket.user,
        typing: false
      });
    });
  }

  // General events
  setupGeneralEvents(socket) {
    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Get online users count
    socket.on('get_online_users', async () => {
      try {
        const sockets = await this.io.fetchSockets();
        const onlineCount = {
          total: sockets.length,
          customers: sockets.filter(s => s.userType === 'customer').length,
          transporters: sockets.filter(s => s.userType === 'transporter').length
        };
        
        socket.emit('online_users', onlineCount);
      } catch (error) {
        console.error('Get online users error:', error);
        socket.emit('error', { message: 'Failed to get online users' });
      }
    });

    // Join custom room
    socket.on('join_room', (roomName) => {
      if (roomName && typeof roomName === 'string' && roomName.length < 100) {
        socket.join(roomName);
        socket.emit('joined_room', roomName);
      }
    });

    // Leave custom room
    socket.on('leave_room', (roomName) => {
      if (roomName && typeof roomName === 'string') {
        socket.leave(roomName);
        socket.emit('left_room', roomName);
      }
    });
  }

  // Notification methods for controllers to use

  // Notify when order is accepted
  notifyOrderAccepted(orderId, transporterId, transporterInfo) {
    this.io.to(`order:${orderId}`).emit('order_accepted', {
      orderId,
      transporter: transporterInfo,
      timestamp: new Date().toISOString()
    });
  }

  // Notify order status updates
  notifyOrderStatusUpdate(orderId, status, location, note, updatedBy) {
    this.io.to(`order:${orderId}`).emit('order_status_updated', {
      orderId,
      status,
      location,
      note,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  }

  // Notify nearby transporters of new orders
  notifyNearbyTransporters(orderData, coordinates, radiusKm = 10) {
    // Broadcast to all online transporters (in production, filter by location)
    this.io.to('transporters').emit('new_order_available', {
      order: orderData,
      distance: null, // TODO: Calculate actual distance
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to specific user
  notifyUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast to all users of a specific type
  broadcastToUserType(userType, event, data) {
    this.io.to(`${userType}s`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Send system-wide announcement
  sendSystemAnnouncement(message, level = 'info') {
    this.io.emit('system_announcement', {
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  // Get current connections info
  async getConnectionsInfo() {
    try {
      const sockets = await this.io.fetchSockets();
      
      return {
        total: sockets.length,
        byUserType: {
          customers: sockets.filter(s => s.userType === 'customer').length,
          transporters: sockets.filter(s => s.userType === 'transporter').length
        },
        rooms: Object.keys(this.io.sockets.adapter.rooms).length
      };
    } catch (error) {
      console.error('Error getting connections info:', error);
      return { total: 0, byUserType: {}, rooms: 0 };
    }
  }

  // Disconnect user from all sockets
  async disconnectUser(userId, reason = 'admin_action') {
    try {
      const sockets = await this.io.fetchSockets();
      const userSockets = sockets.filter(socket => socket.userId === userId);
      
      for (const socket of userSockets) {
        socket.emit('force_disconnect', { reason });
        socket.disconnect(true);
      }
      
      return userSockets.length;
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return 0;
    }
  }

  // Health check
  isHealthy() {
    return this.io !== null;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;