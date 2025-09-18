import mongoose from 'mongoose';
import Service from '../src/models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const movingService = {
  name: "Moving Service",
  slug: "moving-service",
  description: "Professional moving and relocation services for apartments and houses. Complete moving solutions with packing, unpacking, and assembly services.",
  shortDescription: "Professional moving and relocation services",
  category: "moving",
  subCategory: "residential",
  serviceType: "moving",
  icon: "local-shipping",
  color: {
    primary: "#667eea",
    secondary: "#764ba2",
    gradient: ["#667eea", "#764ba2", "#f093fb"]
  },
  images: [
    {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center.jpg",
      alt: "Moving service",
      type: "hero"
    }
  ],
  pricing: {
    model: "distance_based",
    baseFee: 149.00,
    perKmRate: 3.00,
    perMinuteRate: 1.00,
    perKgRate: 2.00,
    minWeight: 0,
    maxWeight: 1000,
    weightUnit: "kg",
    currency: "USD",
    distanceRates: [
      { minDistance: 0, maxDistance: 10, rate: 3.00 },
      { minDistance: 10, maxDistance: 25, rate: 2.50 },
      { minDistance: 25, maxDistance: 50, rate: 2.00 },
      { minDistance: 50, maxDistance: 100, rate: 1.50 }
    ],
    timeRates: [
      { minTime: 0, maxTime: 60, rate: 1.00 },
      { minTime: 60, maxTime: 120, rate: 0.80 },
      { minTime: 120, maxTime: 240, rate: 0.60 }
    ],
    weightRates: [
      { minWeight: 0, maxWeight: 100, rate: 2.00 },
      { minWeight: 100, maxWeight: 500, rate: 1.50 },
      { minWeight: 500, maxWeight: 1000, rate: 1.00 }
    ],
    surcharges: [
      {
        type: "stairs",
        name: "Stairs Access",
        description: "Additional charge for stairs-only access",
        amount: 50.00
      },
      {
        type: "packing",
        name: "Packing Service",
        description: "Professional packing service",
        amount: 50.00
      },
      {
        type: "assembly",
        name: "Assembly Service",
        description: "Furniture assembly and disassembly",
        amount: 60.00
      },
      {
        type: "insurance",
        name: "Moving Insurance",
        description: "Comprehensive moving insurance",
        amount: 30.00
      },
      {
        type: "fragile",
        name: "Fragile Items",
        description: "Special handling for fragile items",
        amount: 25.00
      },
      {
        type: "oversized",
        name: "Oversized Items",
        description: "Handling for oversized furniture",
        amount: 40.00
      }
    ],
    discounts: [
      {
        type: "bulk",
        name: "Bulk Discount",
        description: "Discount for large moves",
        amount: 15.00,
        isPercentage: true,
        conditions: {
          minWeight: 500
        }
      },
      {
        type: "loyalty",
        name: "Loyalty Discount",
        description: "Discount for returning customers",
        amount: 10.00,
        isPercentage: true,
        conditions: {
          minOrders: 3
        }
      }
    ]
  },
  specifications: {
    maxWeight: 1000,
    maxDimensions: {
      length: 300,
      width: 200,
      height: 250
    },
    maxDistance: 200,
    estimatedDuration: {
      min: 3,
      max: 12,
      unit: "hours"
    },
    capabilities: ["furniture_moving", "appliance_moving", "packing_service", "unpacking_service", "assembly_required", "disassembly_required"],
    vehicleRequirements: [
      {
        type: "truck",
        minCapacity: 5.0,
        required: true
      },
      {
        type: "van",
        minCapacity: 2.0,
        required: false
      }
    ]
  },
  availability: {
    isAvailable: true,
    operatingHours: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }, // Monday
      { dayOfWeek: 2, startTime: "08:00", endTime: "18:00" }, // Tuesday
      { dayOfWeek: 3, startTime: "08:00", endTime: "18:00" }, // Wednesday
      { dayOfWeek: 4, startTime: "08:00", endTime: "18:00" }, // Thursday
      { dayOfWeek: 5, startTime: "08:00", endTime: "18:00" }, // Friday
      { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" }, // Saturday
      { dayOfWeek: 0, startTime: "10:00", endTime: "16:00" }  // Sunday
    ],
    blackoutDates: [],
    minAdvanceNoticeHours: 24,
    maxAdvanceBookingDays: 30,
    serviceAreas: [{
      type: "radius",
      name: "Algeria - Annaba Region",
      isActive: true,
      coordinates: {
        center: {
          lat: 36.886767888668615,
          lng: 7.706645955273
        },
        radius: 200000 // 200km in meters
      }
    }]
  },
  status: "active",
  metrics: {
    totalOrders: 850,
    averageRating: 4.8,
    totalRatings: 650,
    popularityScore: 92,
    lastOrderDate: new Date()
  },
  terms: {
    cancellationPolicy: "Free cancellation up to 48 hours before scheduled move",
    refundPolicy: "Full refund for cancelled moves, partial refund for delays",
    liabilityLimits: "Maximum liability of $5000 per move"
  },
  integrations: {
    paymentMethods: ["card", "paypal", "wallet"],
    trackingEnabled: true,
    realTimeUpdates: true
  }
};

const main = async () => {
  try {
    console.log('🚚 Starting Moving service seeding...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if service already exists
    const existingService = await Service.findOne({ slug: 'moving-service' });
    if (existingService) {
      console.log('⚠️ Moving service already exists, updating...');
      await Service.findOneAndUpdate({ slug: 'moving-service' }, movingService, { new: true });
      console.log('✅ Moving service updated successfully');
    } else {
      console.log('🆕 Creating new Moving service...');
      const service = new Service(movingService);
      await service.save();
      console.log('✅ Moving service created successfully');
    }

    // Verify the service
    const savedService = await Service.findOne({ slug: 'moving-service' });
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

    console.log('🎉 Moving service seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding Moving service:', error);
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
