import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  otp: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6,
    match: [/^\d{6}$/, 'OTP must be a 6-digit number']
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes in seconds (TTL index)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  // Additional metadata
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for performance
otpSchema.index({ email: 1 }); // Single field index for email lookups
otpSchema.index({ email: 1, createdAt: -1 }); // Most recent OTP for email
otpSchema.index({ email: 1, isUsed: 1, expiresAt: 1 }); // Finding valid OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup
otpSchema.index({ createdAt: 1 }); // For cleanup queries

// Static methods for database operations

/**
 * Clean up expired and used OTPs
 * @returns {Promise<Object>} - Cleanup result
 */
otpSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        isUsed: true,
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Used OTPs older than 24 hours
      }
    ]
  });
};

/**
 * Get OTP statistics
 * @returns {Promise<Object>} - Statistics object
 */
otpSchema.statics.getStats = async function() {
  const [total, active, expired, used] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }),
    this.countDocuments({
      expiresAt: { $lt: new Date() }
    }),
    this.countDocuments({
      isUsed: true
    })
  ]);

  return {
    total,
    active,
    expired,
    used,
    timestamp: new Date()
  };
};

/**
 * Get recent OTP count for rate limiting
 * @param {string} email - Email address
 * @param {number} hours - Hours to look back (default: 1)
 * @returns {Promise<number>} - Count of recent OTPs
 */
otpSchema.statics.getRecentCount = function(email, hours = 1) {
  const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gt: timeAgo }
  });
};

/**
 * Find the most recent valid OTP for email
 * @param {string} email - Email address
 * @returns {Promise<Object|null>} - OTP document or null
 */
otpSchema.statics.findValidOTP = function(email) {
  return this.findOne({
    email: email.toLowerCase(),
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  }).sort({ createdAt: -1 });
};

// Instance methods

/**
 * Check if OTP is valid and not expired
 * @returns {boolean} - True if valid
 */
otpSchema.methods.isValid = function() {
  return !this.isUsed &&
         this.attempts < 3 &&
         this.expiresAt > new Date();
};

/**
 * Mark OTP as used
 * @returns {Promise<Object>} - Updated document
 */
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

/**
 * Increment attempt count
 * @returns {Promise<Object>} - Updated document
 */
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

/**
 * Get remaining attempts
 * @returns {number} - Remaining attempts
 */
otpSchema.methods.getRemainingAttempts = function() {
  return Math.max(0, 3 - this.attempts);
};

/**
 * Check if OTP is expired
 * @returns {boolean} - True if expired
 */
otpSchema.methods.isExpired = function() {
  return this.expiresAt <= new Date();
};

/**
 * Get time until expiration in seconds
 * @returns {number} - Seconds until expiration (0 if expired)
 */
otpSchema.methods.getTimeToExpiry = function() {
  const now = new Date();
  const diff = Math.max(0, this.expiresAt - now);
  return Math.floor(diff / 1000);
};

// Pre-save middleware
otpSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  // Set expiration if not set
  if (!this.expiresAt) {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    this.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  }

  next();
});

// Create the model
const OTP = mongoose.model('OTP', otpSchema);

export default OTP;