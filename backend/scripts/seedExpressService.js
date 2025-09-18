import mongoose from 'mongoose';
import Service from '../src/models/Service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox';
    console.log('🔌 Connecting to MongoDB:', mongoURI);
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };

    await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Express service data that matches frontend exactly
const expressService = {
  name: "Express Delivery",
  slug: "express-delivery",
  description: "Fast and reliable same-day delivery service for urgent packages. Perfect for documents, small packages, and time-sensitive deliveries within the city.",
  shortDescription: "Same-day delivery for urgent packages",
  category: "express",
  subCategory: "same_day",
  serviceType: "express",
  icon: "flash",
  color: {
    primary: "#FF6B6B"
  },
  images: [
    {
      url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088.jpg",
      alt: "Express delivery courier",
      type: "hero"
    }
  ],
  pricing: {
    model: "distance_based",
    baseFee: 15.00,
    perKmRate: 2.50,
    perMinuteRate: 0.50,
    perKgRate: 0.50,
    minWeight: 0,
    maxWeight: 10,
    weightUnit: "kg",
    surcharges: [
      {
        type: "peak_hours",
        name: "Peak Hours Surcharge",
        amount: 5.00,
        isPercentage: false
      },
      {
        type: "fragile",
        name: "Fragile Item",
        amount: 8.00,
        isPercentage: false
      },
      {
        type: "signature",
        name: "Signature Required",
        amount: 3.00,
        isPercentage: false
      },
      {
        type: "photo",
        name: "Photo Confirmation",
        amount: 2.00,
        isPercentage: false
      },
      {
        type: "doorstep",
        name: "Leave at Door",
        amount: 0.00,
        isPercentage: false
      },
      {
        type: "insurance",
        name: "Insurance",
        amount: 5.00,
        isPercentage: false
      }
    ],
    discounts: [
      {
        type: "loyalty",
        name: "Loyalty Discount",
        amount: 10,
        isPercentage: true
      }
    ],
    taxRate: 0.08,
    currency: "USD"
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
    minAdvanceNoticeHours: 0,
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
  specifications: {
    maxWeight: 10,
    maxDimensions: {
      length: 60,
      width: 40,
      height: 30
    },
    maxDistance: 50,
    estimatedDuration: {
      min: 0.5,
      max: 4,
      unit: "hours"
    },
    capabilities: ["document_handling", "fragile_handling"],
    vehicleRequirements: [
      {
        type: "motorcycle",
        minCapacity: 0.1,
        required: true
      },
      {
        type: "car",
        minCapacity: 0.5,
        required: false
      },
      {
        type: "van",
        minCapacity: 2.0,
        required: false
      }
    ]
  },
  status: "active",
  metrics: {
    totalOrders: 0,
    averageRating: 4.8,
    totalRatings: 0,
    popularityScore: 100
  },
  terms: {
    cancellationPolicy: "Free cancellation within 30 minutes of booking",
    refundPolicy: "Full refund for cancelled orders",
    liabilityLimits: "Maximum liability of $500 per package"
  },
  integrations: {
    paymentMethods: ["card", "cash", "wallet"],
    trackingEnabled: true,
    realTimeUpdates: true
  }
};

// Seed Express service
const seedExpressService = async () => {
  try {
    console.log('🌱 Starting Express service seeding...');
    
    // Remove existing Express service
    await Service.deleteOne({ slug: 'express-delivery' });
    console.log('🗑️  Cleared existing Express service');
    
    // Insert Express service
    console.log('📝 Creating service with data:', JSON.stringify(expressService, null, 2));
    const service = new Service(expressService);
    console.log('💾 Saving service to database...');
    await service.save();
    
    console.log('✅ Express service created successfully!');
    console.log('📦 Service Name:', service.name);
    console.log('🆔 Service ID:', service._id);
    console.log('🔗 Service Slug:', service.slug);
    console.log('💰 Base Fee:', service.pricing.baseFee, service.pricing.currency);
    console.log('🎯 Surcharges:', service.pricing.surcharges.length, 'options');
    
    // Test the service
    console.log('\n🧪 Testing service retrieval...');
    const testService = await Service.findOne({ slug: 'express-delivery' });
    if (testService) {
      console.log('✅ Service can be retrieved successfully');
    } else {
      console.log('❌ Service retrieval failed');
    }
    
  } catch (error) {
    console.error('❌ Error seeding Express service:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting main execution...');
    await connectDB();
    await seedExpressService();
    
    console.log('\n🎉 Express service seeding completed successfully!');
    console.log('📋 You can now test the Express delivery flow in your app');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
main().catch(console.error);

export default main;
