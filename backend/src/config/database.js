import mongoose from 'mongoose';

class DatabaseConfig {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox';
      
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false // Disable mongoose buffering
        // Note: useNewUrlParser, useUnifiedTopology, and bufferMaxEntries are deprecated/removed in Mongoose 8+
      };

      this.connection = await mongoose.connect(mongoURI, options);
      this.isConnected = true;

      console.log(`✅ MongoDB Connected: ${this.connection.connection.host}:${this.connection.connection.port}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        this.isConnected = false;
        this.connection = null;
      }
    } catch (err) {
      console.error('❌ Error during MongoDB disconnection:', err);
      throw err;
    }
  }

  // Health check method
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Get connection status
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

// Export the connect function for backward compatibility
export const connectDB = () => databaseConfig.connect();

export default databaseConfig;