import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  // Basic service information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
    index: true
  },
  
  slug: {
    type: String,
    required: [true, 'Service slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Service categorization
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: {
      values: ['delivery', 'moving', 'storage', 'logistics', 'express', 'specialized'],
      message: 'Invalid service category'
    },
    index: true
  },
  
  subCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Sub-category cannot exceed 50 characters']
  },
  
  // Service type and characteristics
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: ['express', 'standard', 'moving', 'storage', 'same_day', 'next_day', 'scheduled', 'on_demand'],
      message: 'Invalid service type'
    },
    index: true
  },
  
  // Visual representation
  icon: {
    type: String,
    required: [true, 'Service icon is required'],
    trim: true
  },
  
  color: {
    primary: {
      type: String,
      required: [true, 'Primary color is required'],
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format']
    },
    secondary: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format']
    },
    gradient: [{
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format']
    }]
  },
  
  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(url) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
        },
        message: 'Invalid image URL format'
      }
    },
    alt: String,
    type: {
      type: String,
      enum: ['hero', 'gallery', 'icon', 'thumbnail'],
      default: 'gallery'
    }
  }],
  
  // Pricing structure
  pricing: {
    model: {
      type: String,
      required: [true, 'Pricing model is required'],
      enum: {
        values: ['fixed', 'distance_based', 'time_based', 'weight_based', 'custom', 'tiered'],
        message: 'Invalid pricing model'
      }
    },
    
    baseFee: {
      type: Number,
      required: [true, 'Base fee is required'],
      min: [0, 'Base fee cannot be negative']
    },
    
    // Simple rate fields for fallback pricing
    perKmRate: {
      type: Number,
      min: [0, 'Rate per km cannot be negative']
    },
    perMinuteRate: {
      type: Number,
      min: [0, 'Rate per minute cannot be negative']
    },
    perKgRate: {
      type: Number,
      min: [0, 'Rate per kg cannot be negative']
    },
    
    // Distance-based pricing
    distanceRates: [{
      minDistance: {
        type: Number,
        min: [0, 'Minimum distance cannot be negative']
      },
      maxDistance: {
        type: Number,
        min: [0, 'Maximum distance cannot be negative']
      },
      ratePerKm: {
        type: Number,
        min: [0, 'Rate per km cannot be negative']
      },
      flatRate: {
        type: Number,
        min: [0, 'Flat rate cannot be negative']
      }
    }],
    
    // Time-based pricing
    timeRates: [{
      minDuration: Number, // in minutes
      maxDuration: Number, // in minutes
      ratePerHour: {
        type: Number,
        min: [0, 'Rate per hour cannot be negative']
      }
    }],
    
    // Weight-based pricing
    weightRates: [{
      minWeight: {
        type: Number,
        min: [0, 'Minimum weight cannot be negative']
      },
      maxWeight: {
        type: Number,
        min: [0, 'Maximum weight cannot be negative']
      },
      ratePerKg: {
        type: Number,
        min: [0, 'Rate per kg cannot be negative']
      }
    }],
    
    // Surcharges
    surcharges: [{
      type: {
        type: String,
        enum: ['peak_hours', 'weekend', 'holiday', 'fragile', 'oversized', 'stairs', 'assembly', 'packing', 'insurance', 'signature', 'photo', 'doorstep'],
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      amount: {
        type: Number,
        min: [0, 'Surcharge amount cannot be negative']
      },
      percentage: {
        type: Number,
        min: [0, 'Surcharge percentage cannot be negative'],
        max: [100, 'Surcharge percentage cannot exceed 100%']
      },
      conditions: [{
        field: String, // e.g., 'time', 'weight', 'distance'
        operator: {
          type: String,
          enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'between']
        },
        value: mongoose.Schema.Types.Mixed
      }]
    }],
    
    // Discounts
    discounts: [{
      type: {
        type: String,
        enum: ['bulk', 'loyalty', 'promo', 'first_time', 'referral'],
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      amount: {
        type: Number,
        min: [0, 'Discount amount cannot be negative']
      },
      percentage: {
        type: Number,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100%']
      },
      conditions: [{
        field: String,
        operator: {
          type: String,
          enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'between']
        },
        value: mongoose.Schema.Types.Mixed
      }]
    }],
    
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    
    // Minimum and maximum pricing
    minimumCharge: {
      type: Number,
      min: [0, 'Minimum charge cannot be negative']
    },
    
    maximumCharge: {
      type: Number,
      min: [0, 'Maximum charge cannot be negative']
    }
  },
  
  // Service specifications and limits
  specifications: {
    // Package size limits
    maxWeight: {
      type: Number,
      min: [0, 'Maximum weight cannot be negative']
    },
    
    maxDimensions: {
      length: {
        type: Number,
        min: [0, 'Maximum length cannot be negative']
      },
      width: {
        type: Number,
        min: [0, 'Maximum width cannot be negative']
      },
      height: {
        type: Number,
        min: [0, 'Maximum height cannot be negative']
      }
    },
    
    // Distance and time limits
    maxDistance: {
      type: Number,
      min: [0, 'Maximum distance cannot be negative']
    },
    
    estimatedDuration: {
      min: {
        type: Number,
        min: [0, 'Minimum duration cannot be negative']
      },
      max: {
        type: Number,
        min: [0, 'Maximum duration cannot be negative']
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours'
      }
    },
    
    // Special handling capabilities
    capabilities: [{
      type: String,
      enum: [
        'fragile_handling', 'temperature_controlled', 'hazardous_materials',
        'oversized_items', 'white_glove', 'assembly_required', 'disassembly_required',
        'packing_service', 'unpacking_service', 'furniture_moving', 'appliance_moving',
        'piano_moving', 'art_handling', 'document_handling', 'medical_supplies',
        'food_delivery', 'alcohol_delivery', 'prescription_delivery'
      ]
    }],
    
    // Vehicle requirements
    vehicleRequirements: [{
      type: {
        type: String,
        enum: ['car', 'van', 'truck', 'motorcycle', 'bicycle', 'cargo_bike', 'trailer'],
        required: true
      },
      minCapacity: Number, // in cubic meters
      required: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Availability and scheduling
  availability: {
    // Operating hours
    operatingHours: [{
      dayOfWeek: {
        type: Number,
        min: [0, 'Day of week must be 0-6'],
        max: [6, 'Day of week must be 0-6'],
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    
    // Service areas
    serviceAreas: [{
      type: {
        type: String,
        enum: ['city', 'region', 'postal_code', 'radius', 'polygon'],
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      coordinates: {
        // For radius type
        center: {
          lat: Number,
          lng: Number
        },
        radius: Number, // in meters
        
        // For polygon type
        polygon: [[Number]] // Array of [lng, lat] coordinates
      },
      postalCodes: [String], // For postal_code type
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    
    // Advance booking requirements
    advanceBooking: {
      minimum: {
        value: {
          type: Number,
          min: [0, 'Minimum advance booking cannot be negative']
        },
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days'],
          default: 'hours'
        }
      },
      maximum: {
        value: {
          type: Number,
          min: [0, 'Maximum advance booking cannot be negative']
        },
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months'],
          default: 'days'
        }
      }
    },
    
    // Blackout dates
    blackoutDates: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        trim: true
      },
      isRecurring: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Service features and benefits
  features: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    icon: String,
    isHighlight: {
      type: Boolean,
      default: false
    }
  }],
  
  // Requirements and restrictions
  requirements: [{
    type: {
      type: String,
      enum: ['customer', 'package', 'location', 'timing'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    isMandatory: {
      type: Boolean,
      default: true
    }
  }],
  
  // Service status and management
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'coming_soon', 'deprecated', 'maintenance'],
      message: 'Invalid service status'
    },
    default: 'active',
    index: true
  },
  
  // Popularity and performance metrics
  metrics: {
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative']
    },
    averageRating: {
      type: Number,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5']
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: [0, 'Total ratings cannot be negative']
    },
    popularityScore: {
      type: Number,
      default: 0,
      min: [0, 'Popularity score cannot be negative']
    },
    lastOrderDate: Date
  },
  
  // SEO and marketing
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  
  // Terms and conditions
  terms: {
    cancellationPolicy: {
      type: String,
      trim: true
    },
    refundPolicy: {
      type: String,
      trim: true
    },
    liabilityLimits: {
      type: String,
      trim: true
    },
    specialTerms: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      content: {
        type: String,
        required: true,
        trim: true
      }
    }]
  },
  
  // Integration settings
  integrations: {
    paymentMethods: [{
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'cash', 'wallet', 'crypto']
    }],
    
    trackingEnabled: {
      type: Boolean,
      default: true
    },
    
    realTimeUpdates: {
      type: Boolean,
      default: true
    },
    
    apiEndpoints: [{
      name: String,
      url: String,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      }
    }]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
serviceSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
serviceSchema.index({ category: 1, serviceType: 1 });
serviceSchema.index({ status: 1, category: 1 });
serviceSchema.index({ 'metrics.popularityScore': -1 });
serviceSchema.index({ 'metrics.averageRating': -1 });
serviceSchema.index({ slug: 1 });
serviceSchema.index({ 'availability.serviceAreas.coordinates.center': '2dsphere' });

// Compound indexes
serviceSchema.index({ category: 1, status: 1, 'metrics.popularityScore': -1 });
serviceSchema.index({ serviceType: 1, status: 1, createdAt: -1 });

// Pre-save middleware
serviceSchema.pre('save', function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Validate operating hours
  if (this.availability && this.availability.operatingHours) {
    for (let hours of this.availability.operatingHours) {
      if (hours.startTime >= hours.endTime) {
        return next(new Error('Start time must be before end time'));
      }
    }
  }
  
  // Validate pricing model consistency
  if (this.pricing) {
    if (this.pricing.minimumCharge && this.pricing.maximumCharge) {
      if (this.pricing.minimumCharge > this.pricing.maximumCharge) {
        return next(new Error('Minimum charge cannot be greater than maximum charge'));
      }
    }
  }
  
  next();
});

// Virtual for formatted price range
serviceSchema.virtual('priceRange').get(function() {
  if (!this.pricing) return null;
  
  const min = this.pricing.minimumCharge || this.pricing.baseFee;
  const max = this.pricing.maximumCharge;
  
  if (max && max !== min) {
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  } else {
    return `From $${min.toFixed(2)}`;
  }
});

// Virtual for availability status
serviceSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  if (this.availability && this.availability.operatingHours) {
    const todayHours = this.availability.operatingHours.find(h => h.dayOfWeek === currentDay);
    if (todayHours && todayHours.isAvailable) {
      return currentTime >= todayHours.startTime && currentTime <= todayHours.endTime;
    }
  }
  
  return true; // Default to available if no operating hours specified
});

// Instance methods
serviceSchema.methods.calculatePrice = function(orderDetails) {
  const { distance, weight, duration, packageDetails, scheduledTime } = orderDetails;
  let totalPrice = this.pricing.baseFee;
  
  // Distance-based pricing
  if (this.pricing.model === 'distance_based' && distance) {
    if (this.pricing.distanceRates.length > 0) {
      const applicableRate = this.pricing.distanceRates.find(rate => 
        distance >= (rate.minDistance || 0) && 
        (!rate.maxDistance || distance <= rate.maxDistance)
      );
      
      if (applicableRate) {
        if (applicableRate.flatRate) {
          totalPrice += applicableRate.flatRate;
        } else if (applicableRate.ratePerKm) {
          totalPrice += distance * applicableRate.ratePerKm;
        }
      }
    } else if (this.pricing.perKmRate) {
      // Fallback to perKmRate if distanceRates is empty
      totalPrice += distance * this.pricing.perKmRate;
    }
  }
  
  // Weight-based pricing
  if (weight) {
    if (this.pricing.weightRates.length > 0) {
      const applicableRate = this.pricing.weightRates.find(rate =>
        weight >= (rate.minWeight || 0) &&
        (!rate.maxWeight || weight <= rate.maxWeight)
      );
      
      if (applicableRate && applicableRate.ratePerKg) {
        totalPrice += weight * applicableRate.ratePerKg;
      }
    } else if (this.pricing.perKgRate) {
      // Fallback to perKgRate if weightRates is empty
      totalPrice += weight * this.pricing.perKgRate;
    }
  }
  
  // Time-based pricing
  if (duration) {
    if (this.pricing.timeRates.length > 0) {
      const applicableRate = this.pricing.timeRates.find(rate =>
        duration >= (rate.minDuration || 0) &&
        (!rate.maxDuration || duration <= rate.maxDuration)
      );
      
      if (applicableRate && applicableRate.ratePerHour) {
        totalPrice += (duration / 60) * applicableRate.ratePerHour;
      }
    } else if (this.pricing.perMinuteRate) {
      // Fallback to perMinuteRate if timeRates is empty
      totalPrice += duration * this.pricing.perMinuteRate;
    }
  }
  
  // Apply surcharges
  if (this.pricing.surcharges && this.pricing.surcharges.length > 0) {
    for (let surcharge of this.pricing.surcharges) {
      let shouldApply = true;
      
      // Check conditions
      if (surcharge.conditions && surcharge.conditions.length > 0) {
        shouldApply = this.evaluateConditions(surcharge.conditions, orderDetails);
      }
      
      if (shouldApply) {
        if (surcharge.amount) {
          totalPrice += surcharge.amount;
        } else if (surcharge.percentage) {
          totalPrice += totalPrice * (surcharge.percentage / 100);
        }
      }
    }
  }
  
  // Apply discounts
  if (this.pricing.discounts && this.pricing.discounts.length > 0) {
    for (let discount of this.pricing.discounts) {
      let shouldApply = true;
      
      // Check conditions
      if (discount.conditions && discount.conditions.length > 0) {
        shouldApply = this.evaluateConditions(discount.conditions, orderDetails);
      }
      
      if (shouldApply) {
        if (discount.amount) {
          totalPrice -= discount.amount;
        } else if (discount.percentage) {
          totalPrice -= totalPrice * (discount.percentage / 100);
        }
      }
    }
  }
  
  // Apply minimum and maximum limits
  if (this.pricing.minimumCharge) {
    totalPrice = Math.max(totalPrice, this.pricing.minimumCharge);
  }
  
  if (this.pricing.maximumCharge) {
    totalPrice = Math.min(totalPrice, this.pricing.maximumCharge);
  }
  
  return Math.max(0, parseFloat(totalPrice.toFixed(2)));
};

serviceSchema.methods.evaluateConditions = function(conditions, orderDetails) {
  return conditions.every(condition => {
    const fieldValue = this.getFieldValue(condition.field, orderDetails);
    const conditionValue = condition.value;
    
    switch (condition.operator) {
      case 'gt': return fieldValue > conditionValue;
      case 'lt': return fieldValue < conditionValue;
      case 'gte': return fieldValue >= conditionValue;
      case 'lte': return fieldValue <= conditionValue;
      case 'eq': return fieldValue === conditionValue;
      case 'between': 
        return Array.isArray(conditionValue) && 
               fieldValue >= conditionValue[0] && 
               fieldValue <= conditionValue[1];
      default: return true;
    }
  });
};

serviceSchema.methods.getFieldValue = function(field, orderDetails) {
  const fieldMap = {
    'distance': orderDetails.distance,
    'weight': orderDetails.weight,
    'duration': orderDetails.duration,
    'time': new Date().getHours(),
    'day': new Date().getDay(),
    'fragile': orderDetails.packageDetails?.fragile,
    'perishable': orderDetails.packageDetails?.perishable
  };
  
  return fieldMap[field];
};

serviceSchema.methods.isAvailableInArea = function(coordinates) {
  if (!this.availability || !this.availability.serviceAreas) return true;
  
  return this.availability.serviceAreas.some(area => {
    if (!area.isActive) return false;
    
    switch (area.type) {
      case 'radius':
        if (area.coordinates && area.coordinates.center && area.coordinates.radius) {
          const distance = this.calculateDistance(
            coordinates,
            area.coordinates.center
          );
          return distance <= area.coordinates.radius;
        }
        return false;
        
      case 'polygon':
        // Implement point-in-polygon algorithm
        return this.isPointInPolygon(coordinates, area.coordinates.polygon);
        
      default:
        return true;
    }
  });
};

serviceSchema.methods.calculateDistance = function(coord1, coord2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

serviceSchema.methods.isPointInPolygon = function(point, polygon) {
  // Ray casting algorithm for point-in-polygon test
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i][1] > point.lat) !== (polygon[j][1] > point.lat)) &&
        (point.lng < (polygon[j][0] - polygon[i][0]) * (point.lat - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
      inside = !inside;
    }
  }
  return inside;
};

// Static methods
serviceSchema.statics.findAvailableServices = function(location, category = null, serviceType = null) {
  let query = { status: 'active' };
  
  if (category) {
    query.category = category;
  }
  
  if (serviceType) {
    query.serviceType = serviceType;
  }
  
  return this.find(query)
    .sort({ 'metrics.popularityScore': -1, 'metrics.averageRating': -1 })
    .lean();
};

serviceSchema.statics.searchServices = function(searchTerm, filters = {}) {
  let query = { status: 'active' };
  
  // Text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.serviceType) query.serviceType = filters.serviceType;
  if (filters.minRating) query['metrics.averageRating'] = { $gte: filters.minRating };
  if (filters.maxPrice) query['pricing.baseFee'] = { $lte: filters.maxPrice };
  
  let sortOptions = {};
  if (searchTerm) {
    sortOptions.score = { $meta: 'textScore' };
  } else {
    sortOptions = { 'metrics.popularityScore': -1, 'metrics.averageRating': -1 };
  }
  
  return this.find(query).sort(sortOptions);
};

serviceSchema.statics.getPopularServices = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'metrics.popularityScore': -1, 'metrics.totalOrders': -1 })
    .limit(limit)
    .lean();
};

serviceSchema.statics.getServicesByCategory = function(category) {
  return this.find({ status: 'active', category: category })
    .sort({ 'metrics.popularityScore': -1 })
    .lean();
};

export default mongoose.model('Service', serviceSchema);
