import mongoose from 'mongoose';
import Service from '../src/models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const standardService = {
  name: "Standard Delivery",
  slug: "standard-delivery",
  description: "Reliable next-day delivery service for everyday packages. Cost-effective solution for non-urgent deliveries with flexible scheduling options.",
  shortDescription: "Next-day delivery for everyday packages",
  category: "delivery",
  subCategory: "next_day",
  serviceType: "standard",
  icon: "package",
  color: {
    primary: "#4CAF50",
    secondary: "#66BB6A",
    gradient: ["#4CAF50", "#66BB6A", "#81C784"]
  },
  images: [
    {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center.jpg",
      alt: "Standard delivery service",
      type: "hero"
    }
  ],
  pricing: {
    model: "distance_based",
    baseFee: 8.00,
    perKmRate: 1.50,
    perMinuteRate: 0.25,
    perKgRate: 0.30,
    minWeight: 0,
    maxWeight: 25,
    weightUnit: "kg",
    currency: "USD",
    distanceRates: [
      { minDistance: 0, maxDistance: 5, rate: 1.50 },
      { minDistance: 5, maxDistance: 10, rate: 1.25 },
      { minDistance: 10, maxDistance: 20, rate: 1.00 },
      { minDistance: 20, maxDistance: 50, rate: 0.75 }
    ],
    timeRates: [
      { minTime: 0, maxTime: 30, rate: 0.25 },
      { minTime: 30, maxTime: 60, rate: 0.20 },
      { minTime: 60, maxTime: 120, rate: 0.15 }
    ],
    weightRates: [
      { minWeight: 0, maxWeight: 5, rate: 0.30 },
      { minWeight: 5, maxWeight: 10, rate: 0.25 },
      { minWeight: 10, maxWeight: 25, rate: 0.20 }
    ],
    surcharges: [
      {
        type: "peak_hours",
        name: "Morning Delivery",
        description: "Same day morning delivery (8:00 - 12:00)",
        amount: 12.00,
        conditions: {
          timeWindow: "morning",
          minAdvanceNotice: 2
        }
      },
      {
        type: "peak_hours",
        name: "Afternoon Delivery",
        description: "Same day afternoon delivery (12:00 - 18:00)",
        amount: 15.00,
        conditions: {
          timeWindow: "afternoon",
          minAdvanceNotice: 2
        }
      },
      {
        type: "peak_hours",
        name: "Evening Delivery",
        description: "Same day evening delivery (18:00 - 21:00)",
        amount: 18.00,
        conditions: {
          timeWindow: "evening",
          minAdvanceNotice: 2
        }
      },
      {
        type: "fragile",
        name: "Fragile Handling",
        description: "Special handling for fragile items",
        amount: 5.00
      },
      {
        type: "signature",
        name: "Signature Required",
        description: "Signature confirmation upon delivery",
        amount: 3.00
      },
      {
        type: "doorstep",
        name: "Doorbell Ring",
        description: "Ring doorbell upon arrival",
        amount: 0.00
      },
      {
        type: "photo",
        name: "Photo Confirmation",
        description: "Photo proof of delivery",
        amount: 2.00
      },
      {
        type: "insurance",
        name: "Insurance",
        description: "Package insurance coverage",
        amount: 5.00
      }
    ],
    discounts: [
      {
        type: "bulk",
        name: "Bulk Discount",
        description: "Discount for multiple packages",
        amount: 10.00,
        isPercentage: true,
        conditions: {
          minQuantity: 3
        }
      },
      {
        type: "loyalty",
        name: "Loyalty Discount",
        description: "Discount for returning customers",
        amount: 5.00,
        isPercentage: true,
        conditions: {
          minOrders: 5
        }
      }
    ]
  },
  specifications: {
    maxWeight: 25,
    maxDimensions: {
      length: 100,
      width: 80,
      height: 60
    },
    maxDistance: 100,
    estimatedDuration: {
      min: 2,
      max: 8,
      unit: "hours"
    },
    capabilities: ["document_handling", "fragile_handling"],
    vehicleRequirements: [
      {
        type: "car",
        minCapacity: 0.5,
        required: true
      },
      {
        type: "van",
        minCapacity: 2.0,
        required: false
      },
      {
        type: "truck",
        minCapacity: 5.0,
        required: false
      }
    ]
  },
  availability: {
    isAvailable: true,
    operatingHours: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "20:00" }, // Monday
      { dayOfWeek: 2, startTime: "08:00", endTime: "20:00" }, // Tuesday
      { dayOfWeek: 3, startTime: "08:00", endTime: "20:00" }, // Wednesday
      { dayOfWeek: 4, startTime: "08:00", endTime: "20:00" }, // Thursday
      { dayOfWeek: 5, startTime: "08:00", endTime: "20:00" }, // Friday
      { dayOfWeek: 6, startTime: "09:00", endTime: "18:00" }, // Saturday
      { dayOfWeek: 0, startTime: "10:00", endTime: "16:00" }  // Sunday
    ],
    blackoutDates: [],
    minAdvanceNoticeHours: 2,
    maxAdvanceBookingDays: 7,
    serviceAreas: [{
      type: "radius",
      name: "Algeria - Annaba Region",
      isActive: true,
      coordinates: {
        center: {
          lat: 36.886767888668615,
          lng: 7.706645955273
        },
        radius: 100000 // 100km in meters
      }
    }]
  },
  status: "active",
  metrics: {
    totalOrders: 2150,
    averageRating: 4.5,
    totalRatings: 1650,
    popularityScore: 88,
    lastOrderDate: new Date()
  },
  terms: {
    cancellationPolicy: "Free cancellation up to 2 hours before scheduled pickup",
    refundPolicy: "Full refund for cancelled orders, partial refund for delivery failures",
    liabilityLimits: "Maximum liability of $1000 per package"
  },
  integrations: {
    paymentMethods: ["card", "paypal", "wallet"],
    trackingEnabled: true,
    realTimeUpdates: true
  }
};

const main = async () => {
  try {
    console.log('🌱 Starting Standard service seeding...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if service already exists
    const existingService = await Service.findOne({ slug: 'standard-delivery' });
    if (existingService) {
      console.log('⚠️ Standard service already exists, updating...');
      await Service.findOneAndUpdate({ slug: 'standard-delivery' }, standardService, { new: true });
      console.log('✅ Standard service updated successfully');
    } else {
      console.log('🆕 Creating new Standard service...');
      const service = new Service(standardService);
      await service.save();
      console.log('✅ Standard service created successfully');
    }

    // Verify the service
    const savedService = await Service.findOne({ slug: 'standard-delivery' });
    if (savedService) {
      console.log('📋 Service Details:');
      console.log('   Name:', savedService.name);
      console.log('   Slug:', savedService.slug);
      console.log('   Service Type:', savedService.serviceType);
      console.log('   Base Fee:', savedService.pricing.baseFee);
      console.log('   Per Km Rate:', savedService.pricing.perKmRate);
      console.log('   Surcharges:', savedService.pricing.surcharges.length);
      console.log('   Service Areas:', savedService.availability.serviceAreas.length);
      console.log('   Status:', savedService.status);
    }

    console.log('🎉 Standard service seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding Standard service:', error);
    if (error.errors) {
      console.log('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`  ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
main().catch(console.error);
