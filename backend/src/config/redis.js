import { createClient } from 'redis';

class RedisConfig {
  constructor() {
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      console.log('🔗 Connecting to Redis...');

      // Create main client
      this.client = createClient({
        url: redisUrl,
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Create pub/sub clients for Socket.io
      this.pubClient = this.client.duplicate();
      this.subClient = this.client.duplicate();

      // Set up event listeners for main client
      this.setupEventListeners(this.client, 'Main');
      this.setupEventListeners(this.pubClient, 'Pub');
      this.setupEventListeners(this.subClient, 'Sub');

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      this.isConnected = true;
      console.log('✅ Redis connection established');
      
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  setupEventListeners(client, clientName) {
    client.on('connect', () => {
      console.log(`🔗 ${clientName} Redis client connecting...`);
    });

    client.on('ready', () => {
      console.log(`✅ ${clientName} Redis client ready`);
    });

    client.on('error', (err) => {
      console.error(`❌ ${clientName} Redis client error:`, err);
      if (clientName === 'Main') {
        this.isConnected = false;
      }
    });

    client.on('end', () => {
      console.log(`⚠️ ${clientName} Redis connection closed`);
      if (clientName === 'Main') {
        this.isConnected = false;
      }
    });

    client.on('reconnecting', () => {
      console.log(`🔄 ${clientName} Redis client reconnecting...`);
    });
  }

  async disconnect() {
    try {
      const disconnectPromises = [];
      
      if (this.client) {
        disconnectPromises.push(this.client.disconnect());
      }
      if (this.pubClient) {
        disconnectPromises.push(this.pubClient.disconnect());
      }
      if (this.subClient) {
        disconnectPromises.push(this.subClient.disconnect());
      }

      await Promise.all(disconnectPromises);
      
      this.client = null;
      this.pubClient = null;
      this.subClient = null;
      this.isConnected = false;
      
      console.log('✅ Redis connections closed');
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error);
      throw error;
    }
  }

  // Helper methods for common Redis operations
  async get(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.get(key);
  }

  async set(key, value, expirationTime) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    
    if (expirationTime) {
      return await this.client.setEx(key, expirationTime, value);
    }
    return await this.client.set(key, value);
  }

  async setex(key, seconds, value) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.setEx(key, seconds, value);
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.exists(key);
  }

  async incr(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.incr(key);
  }

  async expire(key, seconds) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return await this.client.expire(key, seconds);
  }

  // Session management methods
  async setSession(sessionId, data, ttl = 3600) {
    const key = `session:${sessionId}`;
    return await this.setex(key, ttl, JSON.stringify(data));
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  // User token management
  async setUserToken(userId, tokenType, token, ttl) {
    const key = `user:${userId}:${tokenType}`;
    return await this.setex(key, ttl, token);
  }

  async getUserToken(userId, tokenType) {
    const key = `user:${userId}:${tokenType}`;
    return await this.get(key);
  }

  async deleteUserToken(userId, tokenType) {
    const key = `user:${userId}:${tokenType}`;
    return await this.del(key);
  }

  // Rate limiting methods
  async incrementRateLimit(key, windowSeconds) {
    const current = await this.incr(key);
    if (current === 1) {
      await this.expire(key, windowSeconds);
    }
    return current;
  }

  async getRateLimitCount(key) {
    const count = await this.get(key);
    return count ? parseInt(count) : 0;
  }

  // Cache methods
  async setCache(key, data, ttl = 300) { // Default 5 minutes
    return await this.setex(`cache:${key}`, ttl, JSON.stringify(data));
  }

  async getCache(key) {
    const data = await this.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteCache(key) {
    return await this.del(`cache:${key}`);
  }

  // Health check
  isHealthy() {
    return this.isConnected && this.client && this.client.isReady;
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      clientReady: this.client ? this.client.isReady : false,
      pubClientReady: this.pubClient ? this.pubClient.isReady : false,
      subClientReady: this.subClient ? this.subClient.isReady : false
    };
  }

  // Get clients for Socket.io adapter
  getSocketClients() {
    return {
      pubClient: this.pubClient,
      subClient: this.subClient
    };
  }
}

// Create singleton instance
const redisConfig = new RedisConfig();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await redisConfig.disconnect();
  } catch (err) {
    console.error('Error during Redis disconnection:', err);
  }
});

process.on('SIGTERM', async () => {
  try {
    await redisConfig.disconnect();
  } catch (err) {
    console.error('Error during Redis disconnection:', err);
  }
});

export default redisConfig;