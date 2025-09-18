import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: { 
    type: String, 
    required: [true, 'First name is required'], 
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'], 
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: { 
    type: String, 
    required: function() {
      // Password is required only if not using OAuth
      return !this.authProvider || this.authProvider === 'local';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // OAuth Authentication
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'apple'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true
  },
  photoURL: {
    type: String
  },
  
  // Account Details
  userType: { 
    type: String, 
    enum: {
      values: ['customer', 'transporter'],
      message: 'User type must be either customer or transporter'
    },
    required: [true, 'User type is required']
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  isPhoneVerified: { 
    type: Boolean, 
    default: false 
  },
  
  // Profile Information
  profilePicture: { 
    type: String,
    default: null
  },
  language: { 
    type: String, 
    enum: {
      values: ['en', 'fr'],
      message: 'Language must be either en or fr'
    },
    default: 'en' 
  },
  
  // Address Information
  addresses: [{
    type: { 
      type: String, 
      enum: ['primary', 'secondary'],
      required: true
    },
    address: { 
      type: String, 
      required: [true, 'Address is required'],
      trim: true
    },
    coordinates: {
      lat: { 
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: { 
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    }
  }],
  
  // Customer-specific fields
  paymentMethods: [{
    type: { 
      type: String, 
      enum: ['card', 'paypal', 'bank'],
      required: true
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    cardLast4: {
      type: String,
      maxlength: [4, 'Card last 4 digits cannot exceed 4 characters']
    },
    expiryDate: String,
    cardBrand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover']
    },
    // Encrypted payment data (never store raw payment info)
    encryptedData: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Business account fields
  isBusiness: { 
    type: Boolean, 
    default: false 
  },
  businessDetails: {
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters']
    },
    businessType: {
      type: String,
      enum: ['individual', 'corporation', 'llc', 'partnership', 'other'],
      default: 'individual'
    },
    businessAddress: {
      type: String,
      trim: true
    }
  },
  
  // Transporter-specific fields
  transporterDetails: {
    vehicleType: { 
      type: String, 
      enum: {
        values: ['bike', 'car', 'van', 'truck'],
        message: 'Vehicle type must be bike, car, van, or truck'
      }
    },
    licensePlate: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'License plate cannot exceed 20 characters']
    },
    payloadCapacity: {
      type: Number, // in kg
      min: [0, 'Payload capacity cannot be negative'],
      max: [50000, 'Payload capacity cannot exceed 50000 kg']
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'License number cannot exceed 50 characters']
    },
    licenseExpiry: {
      type: Date,
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'License expiry date must be in the future'
      }
    },
    vehiclePhotos: [{
      type: String, // URLs to vehicle images
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Invalid image URL format'
      }
    }],
    insuranceDocument: {
      type: String, // URL to insurance doc
      validate: {
        validator: function(url) {
          return !url || /^https?:\/\/.+\.(pdf|jpg|jpeg|png)$/i.test(url);
        },
        message: 'Invalid document URL format'
      }
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'under_review'],
        message: 'Invalid verification status'
      },
      default: 'pending'
    },
    verificationDate: Date,
    rejectionReason: String,
    
    // Banking details for payments
    bankingDetails: {
      accountHolder: {
        type: String,
        trim: true,
        maxlength: [100, 'Account holder name cannot exceed 100 characters']
      },
      iban: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
          validator: function(iban) {
            // Basic IBAN validation (simplified)
            return !iban || /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban);
          },
          message: 'Invalid IBAN format'
        }
      },
      routingNumber: {
        type: String,
        trim: true,
        maxlength: [20, 'Routing number cannot exceed 20 characters']
      },
      accountNumber: {
        type: String,
        trim: true,
        maxlength: [30, 'Account number cannot exceed 30 characters']
      },
      bankName: {
        type: String,
        trim: true,
        maxlength: [100, 'Bank name cannot exceed 100 characters']
      }
    },
    
    // Performance metrics
    rating: { 
      type: Number, 
      default: 0, 
      min: [0, 'Rating cannot be negative'], 
      max: [5, 'Rating cannot exceed 5'] 
    },
    totalDeliveries: { 
      type: Number, 
      default: 0,
      min: [0, 'Total deliveries cannot be negative']
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: [0, 'Completed deliveries cannot be negative']
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled deliveries cannot be negative']
    },
    
    // Availability
    isAvailable: {
      type: Boolean,
      default: false
    },
    workingHours: {
      monday: { start: String, end: String, available: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
      thursday: { start: String, end: String, available: { type: Boolean, default: true } },
      friday: { start: String, end: String, available: { type: Boolean, default: true } },
      saturday: { start: String, end: String, available: { type: Boolean, default: false } },
      sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    }
  },
  
  // Security & Status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  blockedAt: Date,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Login tracking
  lastLoginAt: Date,
  lastLoginIP: String,
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    blockedUntil: Date
  },
  
  // Verification tokens
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      shareLocation: { type: Boolean, default: true }
    }
  },
  
  // Metadata
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    lastUsed: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.phoneVerificationCode;
      delete ret.passwordResetToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'addresses.coordinates': '2dsphere' });
userSchema.index({ 'transporterDetails.isAvailable': 1 });
userSchema.index({ 'transporterDetails.vehicleType': 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes
userSchema.index({ userType: 1, isActive: 1 });
userSchema.index({ 'transporterDetails.isVerified': 1, 'transporterDetails.isAvailable': 1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for updated timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware for address validation
userSchema.pre('save', function(next) {
  // Ensure only one default address per type
  const primaryAddresses = this.addresses.filter(addr => addr.type === 'primary' && addr.isDefault);
  const secondaryAddresses = this.addresses.filter(addr => addr.type === 'secondary' && addr.isDefault);
  
  if (primaryAddresses.length > 1) {
    return next(new Error('Only one primary address can be set as default'));
  }
  if (secondaryAddresses.length > 1) {
    return next(new Error('Only one secondary address can be set as default'));
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('Password not set for this user');
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.getDefaultAddress = function(type = 'primary') {
  return this.addresses.find(addr => addr.type === type && addr.isDefault);
};

userSchema.methods.canReceiveNotification = function(type) {
  return this.preferences.notifications[type] !== false;
};

userSchema.methods.isAccountLocked = function() {
  return this.loginAttempts.blockedUntil && this.loginAttempts.blockedUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous failed attempt and it's not expired, increment
  if (this.loginAttempts.count && this.loginAttempts.lastAttempt &&
      (Date.now() - this.loginAttempts.lastAttempt) < 2 * 60 * 60 * 1000) { // 2 hours
    this.loginAttempts.count += 1;
  } else {
    // Reset attempts if last attempt was more than 2 hours ago
    this.loginAttempts.count = 1;
  }
  
  this.loginAttempts.lastAttempt = new Date();
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts.count >= 5) {
    this.loginAttempts.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = {
    count: 0,
    lastAttempt: undefined,
    blockedUntil: undefined
  };
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveTransporters = function(filters = {}) {
  return this.find({
    userType: 'transporter',
    isActive: true,
    'transporterDetails.isVerified': true,
    'transporterDetails.isAvailable': true,
    ...filters
  });
};

userSchema.statics.findNearbyTransporters = function(coordinates, maxDistance = 10000) {
  return this.find({
    userType: 'transporter',
    isActive: true,
    'transporterDetails.isVerified': true,
    'transporterDetails.isAvailable': true,
    'addresses.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Virtual for user's age (if birthdate is added later)
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

export default mongoose.model('User', userSchema);