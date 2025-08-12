import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { 
    type: String, 
    unique: true,
    index: true
  },
  
  // Parties involved
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Customer is required'],
    index: true
  },
  transporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  
  // Service details
  serviceType: {
    type: String,
    enum: {
      values: ['express', 'standard', 'moving', 'storage'],
      message: 'Service type must be express, standard, moving, or storage'
    },
    required: [true, 'Service type is required'],
    index: true
  },
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Location details
  pickupLocation: {
    address: { 
      type: String, 
      required: [true, 'Pickup address is required'],
      trim: true
    },
    coordinates: {
      lat: { 
        type: Number, 
        required: [true, 'Pickup latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: { 
        type: Number, 
        required: [true, 'Pickup longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        },
        message: 'Invalid phone number format'
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Pickup notes cannot exceed 500 characters']
    },
    floor: String,
    apartmentNumber: String,
    accessCode: String
  },
  
  dropoffLocation: {
    address: { 
      type: String, 
      required: [true, 'Dropoff address is required'],
      trim: true
    },
    coordinates: {
      lat: { 
        type: Number, 
        required: [true, 'Dropoff latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: { 
        type: Number, 
        required: [true, 'Dropoff longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        },
        message: 'Invalid phone number format'
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Dropoff notes cannot exceed 500 characters']
    },
    floor: String,
    apartmentNumber: String,
    accessCode: String
  },
  
  // Distance and route information
  estimatedDistance: {
    type: Number, // in meters
    min: [0, 'Distance cannot be negative']
  },
  estimatedDuration: {
    type: Number, // in seconds
    min: [0, 'Duration cannot be negative']
  },
  actualDistance: {
    type: Number, // in meters
    min: [0, 'Distance cannot be negative']
  },
  actualDuration: {
    type: Number, // in seconds
    min: [0, 'Duration cannot be negative']
  },
  
  // Package details
  packageDetails: {
    description: {
      type: String,
      required: [true, 'Package description is required'],
      trim: true,
      maxlength: [1000, 'Package description cannot exceed 1000 characters']
    },
    weight: {
      type: Number, // in kg
      min: [0, 'Weight cannot be negative'],
      max: [50000, 'Weight cannot exceed 50000 kg']
    },
    dimensions: {
      length: {
        type: Number, // in cm
        min: [0, 'Length cannot be negative']
      },
      width: {
        type: Number, // in cm
        min: [0, 'Width cannot be negative']
      },
      height: {
        type: Number, // in cm
        min: [0, 'Height cannot be negative']
      }
    },
    photos: [{
      type: String, // URLs to package photos
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Invalid image URL format'
      }
    }],
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
    },
    fragile: { type: Boolean, default: false },
    perishable: { type: Boolean, default: false },
    hazardous: { type: Boolean, default: false },
    requiresSignature: { type: Boolean, default: true }
  },
  
  // Timing
  scheduledPickupTime: {
    type: Date,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Scheduled pickup time must be in the future'
    }
  },
  actualPickupTime: Date,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  // Time windows
  pickupTimeWindow: {
    start: Date,
    end: Date
  },
  deliveryTimeWindow: {
    start: Date,
    end: Date
  },
  
  // Status tracking
  status: {
    type: String,
    enum: {
      values: [
        'pending',           // Order created, waiting for transporter
        'accepted',          // Transporter accepted the order
        'pickup_scheduled',  // Pickup time scheduled
        'en_route_pickup',   // Transporter heading to pickup
        'arrived_pickup',    // Transporter arrived at pickup location
        'picked_up',         // Package picked up
        'en_route_delivery', // Transporter heading to delivery
        'arrived_delivery',  // Transporter arrived at delivery location
        'delivered',         // Package delivered successfully
        'cancelled',         // Order cancelled
        'failed',           // Delivery failed
        'returned',         // Package returned to sender
        'storage_requested', // Customer requested storage
        'in_storage'        // Package in storage facility
      ],
      message: 'Invalid order status'
    },
    default: 'pending',
    index: true
  },
  
  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'pending', 'accepted', 'pickup_scheduled', 'en_route_pickup',
        'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery',
        'delivered', 'cancelled', 'failed', 'returned', 'storage_requested', 'in_storage'
      ],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    note: String,
    location: {
      lat: Number,
      lng: Number
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Pricing
  pricing: {
    baseFee: { 
      type: Number, 
      required: [true, 'Base fee is required'],
      min: [0, 'Base fee cannot be negative']
    },
    distanceFee: {
      type: Number,
      min: [0, 'Distance fee cannot be negative'],
      default: 0
    },
    timeFee: {
      type: Number,
      min: [0, 'Time fee cannot be negative'],
      default: 0
    },
    surcharges: [{
      type: {
        type: String,
        enum: ['peak_hours', 'weekend', 'holiday', 'express', 'fragile', 'oversized'],
        required: true
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: [0, 'Surcharge amount cannot be negative']
      }
    }],
    discounts: [{
      type: {
        type: String,
        enum: ['promo_code', 'loyalty', 'bulk', 'referral'],
        required: true
      },
      code: String,
      description: String,
      amount: {
        type: Number,
        required: true,
        min: [0, 'Discount amount cannot be negative']
      }
    }],
    totalAmount: { 
      type: Number, 
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    currency: { 
      type: String, 
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    taxAmount: {
      type: Number,
      min: [0, 'Tax amount cannot be negative'],
      default: 0
    },
    tipAmount: {
      type: Number,
      min: [0, 'Tip amount cannot be negative'],
      default: 0
    }
  },
  
  // Payment
  payment: {
    status: {
      type: String,
      enum: {
        values: ['pending', 'authorized', 'captured', 'paid', 'failed', 'refunded', 'partially_refunded'],
        message: 'Invalid payment status'
      },
      default: 'pending',
      index: true
    },
    method: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'cash', 'wallet']
    },
    transactionId: {
      type: String,
      index: true
    },
    paymentIntentId: String, // For Stripe or similar
    refundId: String,
    paidAt: Date,
    refundedAt: Date,
    failureReason: String
  },
  
  // Real-time tracking
  tracking: {
    currentLocation: {
      lat: Number,
      lng: Number,
      timestamp: Date,
      accuracy: Number // GPS accuracy in meters
    },
    route: [{
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      speed: Number, // km/h
      bearing: Number // degrees
    }],
    eta: Date, // Estimated time of arrival
    lastLocationUpdate: Date
  },
  
  // Communication
  messages: [{
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    type: { 
      type: String, 
      enum: ['text', 'image', 'location', 'system'], 
      default: 'text' 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    attachment: {
      url: String,
      type: String,
      size: Number
    }
  }],
  
  // Completion details
  deliveryProof: {
    photos: [{
      type: String, // URLs to delivery proof photos
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Invalid image URL format'
      }
    }],
    signature: String, // Base64 encoded signature
    signatureMethod: {
      type: String,
      enum: ['electronic', 'photo', 'pin'],
      default: 'electronic'
    },
    recipientName: {
      type: String,
      trim: true,
      maxlength: [100, 'Recipient name cannot exceed 100 characters']
    },
    recipientId: String, // ID verification
    deliveredAt: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Delivery notes cannot exceed 500 characters']
    }
  },
  
  // Rating and feedback
  rating: {
    customerRating: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5'] 
    },
    transporterRating: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5'] 
    },
    customerFeedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    transporterFeedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    feedbackDate: Date
  },
  
  // Cancellation details
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: [
        'customer_request', 'transporter_unavailable', 'pickup_failed',
        'delivery_failed', 'payment_failed', 'system_error', 'other'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation description cannot exceed 500 characters']
    },
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    cancellationFee: {
      type: Number,
      min: [0, 'Cancellation fee cannot be negative'],
      default: 0
    }
  },
  
  // Storage details (for storage service)
  storage: {
    facilityId: String,
    facilityName: String,
    facilityAddress: String,
    storageStart: Date,
    storageEnd: Date,
    dailyRate: {
      type: Number,
      min: [0, 'Daily rate cannot be negative']
    },
    totalStorageCost: {
      type: Number,
      min: [0, 'Storage cost cannot be negative']
    }
  },
  
  // Quality assurance
  qualityChecks: [{
    checkType: {
      type: String,
      enum: ['pickup_verification', 'package_condition', 'delivery_verification']
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'warning']
    },
    notes: String,
    timestamp: { type: Date, default: Date.now },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'api', 'admin_panel'],
    default: 'mobile_app'
  },
  referenceNumber: String, // External reference
  tags: [String], // For categorization
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ transporter: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
orderSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });
orderSchema.index({ serviceType: 1, status: 1 });
orderSchema.index({ scheduledPickupTime: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.transactionId': 1 });

// Compound indexes for complex queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ transporter: 1, createdAt: -1 });
orderSchema.index({ status: 1, serviceType: 1, createdAt: -1 });

// Text index for search functionality
orderSchema.index({
  orderNumber: 'text',
  'packageDetails.description': 'text',
  'pickupLocation.address': 'text',
  'dropoffLocation.address': 'text'
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `IB-${timestamp}-${randomStr}`;
  }
  
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._updatedBy // This should be set by the controller
    });
  }
  next();
});

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (this.actualPickupTime && this.actualDeliveryTime) {
    return Math.round((this.actualDeliveryTime - this.actualPickupTime) / 1000 / 60); // in minutes
  }
  return null;
});

// Virtual for total distance
orderSchema.virtual('totalDistance').get(function() {
  return this.actualDistance || this.estimatedDistance;
});

// Instance methods
orderSchema.methods.canBeCancelledBy = function(userId) {
  // Can be cancelled by customer or transporter under certain conditions
  if (this.status === 'delivered' || this.status === 'cancelled') {
    return false;
  }
  
  // Customer can cancel before pickup
  if (this.customer.toString() === userId.toString() && 
      ['pending', 'accepted', 'pickup_scheduled'].includes(this.status)) {
    return true;
  }
  
  // Transporter can cancel before pickup
  if (this.transporter && this.transporter.toString() === userId.toString() && 
      ['accepted', 'pickup_scheduled'].includes(this.status)) {
    return true;
  }
  
  return false;
};

orderSchema.methods.calculateTotalAmount = function() {
  let total = this.pricing.baseFee + this.pricing.distanceFee + this.pricing.timeFee;
  
  // Add surcharges
  if (this.pricing.surcharges && this.pricing.surcharges.length > 0) {
    total += this.pricing.surcharges.reduce((sum, charge) => sum + charge.amount, 0);
  }
  
  // Subtract discounts
  if (this.pricing.discounts && this.pricing.discounts.length > 0) {
    total -= this.pricing.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  }
  
  // Add tax and tip
  total += (this.pricing.taxAmount || 0) + (this.pricing.tipAmount || 0);
  
  return Math.max(0, total); // Ensure total is not negative
};

orderSchema.methods.updateStatus = function(newStatus, updatedBy, note = null, location = null) {
  const previousStatus = this.status;
  this.status = newStatus;
  this._updatedBy = updatedBy;
  
  // Add to status history
  const historyEntry = {
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy
  };
  
  if (note) historyEntry.note = note;
  if (location) historyEntry.location = location;
  
  this.statusHistory.push(historyEntry);
  
  return this.save();
};

orderSchema.methods.addMessage = function(senderId, message, type = 'text', attachment = null) {
  const messageData = {
    sender: senderId,
    message: message,
    type: type,
    timestamp: new Date()
  };
  
  if (attachment) {
    messageData.attachment = attachment;
  }
  
  this.messages.push(messageData);
  return this.save();
};

orderSchema.methods.isInProgress = function() {
  return [
    'accepted', 'pickup_scheduled', 'en_route_pickup', 
    'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery'
  ].includes(this.status);
};

orderSchema.methods.isCompleted = function() {
  return ['delivered', 'cancelled', 'failed', 'returned'].includes(this.status);
};

// Static methods
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber: orderNumber.toUpperCase() });
};

orderSchema.statics.findActiveOrdersForTransporter = function(transporterId) {
  return this.find({
    transporter: transporterId,
    status: { $in: ['accepted', 'pickup_scheduled', 'en_route_pickup', 'picked_up', 'en_route_delivery'] }
  }).sort({ scheduledPickupTime: 1 });
};

orderSchema.statics.findPendingOrders = function(location = null, serviceType = null, maxDistance = 10000) {
  let query = { status: 'pending' };
  
  if (serviceType) {
    query.serviceType = serviceType;
  }
  
  if (location) {
    query['pickupLocation.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        $maxDistance: maxDistance
      }
    };
  }
  
  return this.find(query).sort({ createdAt: 1 });
};

orderSchema.statics.getOrderStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

export default mongoose.model('Order', orderSchema);