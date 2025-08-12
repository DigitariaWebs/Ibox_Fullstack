// MongoDB initialization script for iBox database
// This script runs when MongoDB container starts for the first time

// Switch to the ibox_dev database
db = db.getSiblingDB('ibox_dev');

// Create application user with read/write permissions
db.createUser({
  user: 'ibox_user',
  pwd: 'ibox_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'ibox_dev'
    }
  ]
});

// Create collections with validation rules
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password', 'userType'],
      properties: {
        firstName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'First name is required and must be between 2-50 characters'
        },
        lastName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'Last name is required and must be between 2-50 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Valid email address is required'
        },
        userType: {
          bsonType: 'string',
          enum: ['customer', 'transporter'],
          description: 'User type must be either customer or transporter'
        },
        isActive: {
          bsonType: 'bool',
          description: 'User active status'
        },
        isEmailVerified: {
          bsonType: 'bool',
          description: 'Email verification status'
        }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['customer', 'serviceType', 'pickupLocation', 'dropoffLocation', 'packageDetails', 'pricing'],
      properties: {
        orderNumber: {
          bsonType: 'string',
          description: 'Unique order number'
        },
        status: {
          bsonType: 'string',
          enum: [
            'pending', 'accepted', 'pickup_scheduled', 'en_route_pickup',
            'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery',
            'delivered', 'cancelled', 'failed', 'returned', 'storage_requested', 'in_storage'
          ],
          description: 'Order status must be a valid status'
        },
        serviceType: {
          bsonType: 'string',
          enum: ['express', 'standard', 'moving', 'storage'],
          description: 'Service type is required'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ userType: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ customer: 1, status: 1 });
db.orders.createIndex({ transporter: 1, status: 1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ serviceType: 1 });
db.orders.createIndex({ 'pickupLocation.coordinates': '2dsphere' });
db.orders.createIndex({ 'dropoffLocation.coordinates': '2dsphere' });
db.orders.createIndex({ scheduledPickupTime: 1 });

// Insert sample data for development
db.users.insertMany([
  {
    firstName: 'John',
    lastName: 'Customer',
    email: 'customer@example.com',
    phone: '+1234567890',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAoHzVhDKzOWuOi', // password: 'Password123'
    userType: 'customer',
    isActive: true,
    isEmailVerified: true,
    language: 'en',
    addresses: [{
      type: 'primary',
      address: '123 Main St, New York, NY 10001',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      isDefault: true
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Jane',
    lastName: 'Transporter',
    email: 'transporter@example.com',
    phone: '+1987654321',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAoHzVhDKzOWuOi', // password: 'Password123'
    userType: 'transporter',
    isActive: true,
    isEmailVerified: true,
    language: 'en',
    transporterDetails: {
      vehicleType: 'van',
      licensePlate: 'ABC-123',
      payloadCapacity: 1000,
      licenseNumber: 'DL123456789',
      isVerified: true,
      isAvailable: true,
      rating: 4.8,
      totalDeliveries: 156
    },
    addresses: [{
      type: 'primary',
      address: '456 Oak Ave, Brooklyn, NY 11201',
      coordinates: { lat: 40.6892, lng: -73.9442 },
      isDefault: true
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create sample order
const customer = db.users.findOne({ email: 'customer@example.com' });
const transporter = db.users.findOne({ email: 'transporter@example.com' });

if (customer && transporter) {
  db.orders.insertOne({
    orderNumber: 'IB-SAMPLE-001',
    customer: customer._id,
    transporter: transporter._id,
    serviceType: 'standard',
    priority: 'normal',
    status: 'pending',
    pickupLocation: {
      address: '123 Main St, New York, NY 10001',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      contactPerson: 'John Customer',
      contactPhone: '+1234567890',
      notes: 'Please call when you arrive'
    },
    dropoffLocation: {
      address: '789 Broadway, New York, NY 10003',
      coordinates: { lat: 40.7282, lng: -73.9942 },
      contactPerson: 'Recipient Name',
      contactPhone: '+1555666777',
      notes: 'Leave at front desk'
    },
    packageDetails: {
      description: 'Small electronics package',
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      specialInstructions: 'Handle with care - fragile items',
      fragile: true,
      requiresSignature: true
    },
    pricing: {
      baseFee: 15.00,
      distanceFee: 5.00,
      totalAmount: 20.00,
      currency: 'USD',
      taxAmount: 1.60
    },
    payment: {
      status: 'pending',
      method: 'card'
    },
    statusHistory: [{
      status: 'pending',
      timestamp: new Date(),
      updatedBy: customer._id
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

print('✅ iBox database initialized successfully with sample data');
print('📊 Collections created: users, orders');
print('🔍 Indexes created for performance optimization');
print('👤 Sample users created: customer@example.com, transporter@example.com');
print('📦 Sample order created with ID: IB-SAMPLE-001');
print('🔐 Password for sample users: Password123');