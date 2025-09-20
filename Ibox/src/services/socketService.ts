import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

interface SocketServiceConfig {
  userId?: string;
  userType?: string;
  token?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners storage
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Don't auto-initialize socket on startup
    // Let AuthContext handle the connection after token validation
  }

  private async initializeSocket() {
    try {
      // Get stored auth data
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        console.log('🔌 No auth data found, skipping socket connection');
        return;
      }

      const user = JSON.parse(userData);
      
      // Get the base URL from API service
      const baseUrl = apiService.getConfig().baseUrl.replace('/api/v1', '');
      
      // Create socket connection
      this.socket = io(baseUrl, {
        auth: {
          token,
          userId: user._id,
          userType: user.userType
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      console.log('🔌 Socket service initialized');
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.handleReconnection();
    });

    // Verification status updates
    this.socket.on('verification_status_updated', (data) => {
      console.log('📋 Verification status update received:', data);
      this.emit('verification_status_updated', data);
    });

    // Push notifications
    this.socket.on('push_notification', (data) => {
      console.log('🔔 Push notification received:', data);
      this.emit('push_notification', data);
    });

    // Order updates
    this.socket.on('new_order_near_you', (data) => {
      console.log('📦 New order notification:', data);
      this.emit('new_order_near_you', data);
    });

    this.socket.on('order_status_updated', (data) => {
      console.log('📋 Order status update:', data);
      this.emit('order_status_updated', data);
    });

    // System announcements
    this.socket.on('system_announcement', (data) => {
      console.log('📢 System announcement:', data);
      this.emit('system_announcement', data);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Public methods
  async connect(userId: string, userType: string, token: string) {
    try {
      // Store auth data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify({ _id: userId, userType }));

      // Disconnect existing connection
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      // Get the base URL from API service
      const baseUrl = apiService.getConfig().baseUrl.replace('/api/v1', '');
      
      // Create new connection
      this.socket = io(baseUrl, {
        auth: {
          token,
          userId,
          userType
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      console.log('🔌 Socket connected with auth data');
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
    
    // Clear stored auth data
    AsyncStorage.removeItem('authToken').catch(console.error);
    AsyncStorage.removeItem('userData').catch(console.error);
  }

  // Event subscription methods
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Join specific rooms
  joinOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_order_room', orderId);
      console.log(`📦 Joined order room: ${orderId}`);
    }
  }

  leaveOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_order_room', orderId);
      console.log(`📦 Left order room: ${orderId}`);
    }
  }

  // Send custom events
  emitCustomEvent(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
