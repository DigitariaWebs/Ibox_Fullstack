import mongoose from 'mongoose';
import Service from '../src/models/Service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample services data - Updated to match frontend Express flow exactly
const sampleServices = [
  {
    name: "Express Delivery",
    slug: "express-delivery",
    description: "Fast and reliable same-day delivery service for urgent packages. Perfect for documents, small packages, and time-sensitive deliveries within the city.",
    shortDescription: "Same-day delivery for urgent packages",
    category: "express",
    subCategory: "same_day",
    serviceType: "express",
    icon: "flash",
    color: {
      primary: "#FF6B6B",
      secondary: "#FF8E53",
      gradient: ["#FF6B6B", "#FF8E53"]
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800",
        alt: "Express delivery courier",
        type: "hero"
      }
    ],
    pricing: {
      model: "distance_based",
      baseFee: 15.00,
      perKmRate: 2.50,
      perMinuteRate: 0.50,
      minWeight: 0,
      maxWeight: 10,
      weightUnit: "kg",
      surcharges: [
        {
          type: "peak_hours",
          name: "Peak Hours Surcharge",
          description: "Additional fee during rush hours (7-9 AM, 5-7 PM)",
          amount: 5.00,
          isPercentage: false
        },
        {
          type: "fragile",
          name: "Fragile Item",
          description: "Special care for fragile items",
          amount: 8.00,
          isPercentage: false
        },
        {
          type: "signature",
          name: "Signature Required",
          description: "Signature confirmation on delivery",
          amount: 3.00,
          isPercentage: false
        },
        {
          type: "photo",
          name: "Photo Confirmation",
          description: "Photo proof of delivery",
          amount: 2.00,
          isPercentage: false
        },
        {
          type: "doorstep",
          name: "Leave at Door",
          description: "Leave package at doorstep",
          amount: 0.00,
          isPercentage: false
        },
        {
          type: "insurance",
          name: "Insurance",
          description: "Package insurance coverage",
          amount: 5.00,
          isPercentage: false
        }
      ],
      currency: "USD",
      minimumCharge: 15.00,
      maximumCharge: 150.00
    },
    specifications: {
      maxWeight: 25,
      maxDimensions: {
        length: 100,
        width: 80,
        height: 60
      },
      maxDistance: 50,
      estimatedDuration: {
        min: 30,
        max: 180,
        unit: "minutes"
      },
      capabilities: ["fragile_handling", "document_handling"],
      vehicleRequirements: [
        { type: "motorcycle", required: false },
        { type: "car", required: false }
      ]
    },
    availability: {
      operatingHours: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "20:00", isAvailable: true },
        { dayOfWeek: 2, startTime: "08:00", endTime: "20:00", isAvailable: true },
        { dayOfWeek: 3, startTime: "08:00", endTime: "20:00", isAvailable: true },
        { dayOfWeek: 4, startTime: "08:00", endTime: "20:00", isAvailable: true },
        { dayOfWeek: 5, startTime: "08:00", endTime: "20:00", isAvailable: true },
        { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", isAvailable: true }
      ],
      serviceAreas: [
        {
          type: "radius",
          name: "City Center",
          coordinates: {
            center: { lat: 40.7128, lng: -74.0060 },
            radius: 50000
          },
          isActive: true
        }
      ],
      advanceBooking: {
        minimum: { value: 30, unit: "minutes" },
        maximum: { value: 7, unit: "days" }
      }
    },
    features: [
      { name: "Real-time tracking", description: "Track your package in real-time", icon: "map-pin", isHighlight: true },
      { name: "Same-day delivery", description: "Delivered within hours", icon: "clock", isHighlight: true },
      { name: "Secure handling", description: "Professional and secure delivery", icon: "shield", isHighlight: false },
      { name: "SMS notifications", description: "Get updates via SMS", icon: "message-circle", isHighlight: false }
    ],
    requirements: [
      {
        type: "package",
        name: "Package Size",
        description: "Package must fit within size and weight limits",
        isMandatory: true
      },
      {
        type: "location",
        name: "Service Area",
        description: "Pickup and delivery must be within service area",
        isMandatory: true
      }
    ],
    status: "active",
    metrics: {
      totalOrders: 1250,
      averageRating: 4.7,
      totalRatings: 892,
      popularityScore: 95
    },
    terms: {
      cancellationPolicy: "Free cancellation up to 30 minutes before pickup",
      refundPolicy: "Full refund for cancelled orders, partial refund for delivery failures",
      liabilityLimits: "Maximum liability of $500 per package"
    },
    integrations: {
      paymentMethods: ["card", "paypal", "wallet"],
      trackingEnabled: true,
      realTimeUpdates: true
    }
  },
  
  {
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
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        alt: "Standard delivery service",
        type: "hero"
      }
    ],
    pricing: {
      model: "distance_based",
      baseFee: 8.00,
      distanceRates: [
        { minDistance: 0, maxDistance: 10, ratePerKm: 0, flatRate: 8.00 },
        { minDistance: 10, maxDistance: 25, ratePerKm: 1.50 },
        { minDistance: 25, maxDistance: 100, ratePerKm: 1.20 }
      ],
      surcharges: [
        {
          type: "weekend",
          name: "Weekend Delivery",
          description: "Additional fee for weekend deliveries",
          percentage: 15,
          conditions: [
            { field: "day", operator: "eq", value: 0 },
            { field: "day", operator: "eq", value: 6 }
          ]
        }
      ],
      discounts: [
        {
          type: "bulk",
          name: "Bulk Discount",
          description: "Discount for multiple packages",
          percentage: 10,
          conditions: [
            { field: "quantity", operator: "gte", value: 3 }
          ]
        }
      ],
      currency: "USD",
      minimumCharge: 8.00,
      maximumCharge: 200.00
    },
    specifications: {
      maxWeight: 50,
      maxDimensions: {
        length: 150,
        width: 100,
        height: 80
      },
      maxDistance: 100,
      estimatedDuration: {
        min: 12,
        max: 48,
        unit: "hours"
      },
      capabilities: ["fragile_handling", "packing_service"],
      vehicleRequirements: [
        { type: "car", required: false },
        { type: "van", required: false }
      ]
    },
    availability: {
      operatingHours: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
        { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isAvailable: true },
        { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isAvailable: false }
      ],
      serviceAreas: [
        {
          type: "radius",
          name: "Metropolitan Area",
          coordinates: {
            center: { lat: 40.7128, lng: -74.0060 },
            radius: 100000
          },
          isActive: true
        }
      ],
      advanceBooking: {
        minimum: { value: 2, unit: "hours" },
        maximum: { value: 30, unit: "days" }
      }
    },
    features: [
      { name: "Next-day delivery", description: "Delivered by next business day", icon: "calendar", isHighlight: true },
      { name: "Package tracking", description: "Track your package online", icon: "search", isHighlight: true },
      { name: "Flexible scheduling", description: "Choose your delivery window", icon: "clock", isHighlight: false },
      { name: "Insurance included", description: "Basic insurance coverage", icon: "shield", isHighlight: false }
    ],
    requirements: [
      {
        type: "timing",
        name: "Advance Booking",
        description: "Must be booked at least 2 hours in advance",
        isMandatory: true
      }
    ],
    status: "active",
    metrics: {
      totalOrders: 3420,
      averageRating: 4.5,
      totalRatings: 2156,
      popularityScore: 88
    },
    terms: {
      cancellationPolicy: "Free cancellation up to 2 hours before pickup",
      refundPolicy: "Full refund for cancelled orders within policy",
      liabilityLimits: "Maximum liability of $300 per package"
    },
    integrations: {
      paymentMethods: ["card", "paypal", "bank_transfer", "wallet"],
      trackingEnabled: true,
      realTimeUpdates: false
    }
  },

  {
    name: "Moving Service",
    slug: "moving-service",
    description: "Professional moving service for furniture, appliances, and household items. Includes disassembly, packing, transport, and reassembly at destination.",
    shortDescription: "Professional moving for furniture and appliances",
    category: "moving",
    subCategory: "residential",
    serviceType: "moving",
    icon: "home",
    color: {
      primary: "#9C27B0",
      secondary: "#BA68C8",
      gradient: ["#9C27B0", "#BA68C8", "#CE93D8"]
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
        alt: "Professional movers",
        type: "hero"
      }
    ],
    pricing: {
      model: "time_based",
      baseFee: 120.00,
      timeRates: [
        { minDuration: 0, maxDuration: 240, ratePerHour: 80.00 },
        { minDuration: 240, maxDuration: 480, ratePerHour: 70.00 },
        { minDuration: 480, ratePerHour: 60.00 }
      ],
      surcharges: [
        {
          type: "oversized",
          name: "Heavy Items",
          description: "Additional fee for items over 100kg",
          amount: 50.00,
          conditions: [
            { field: "weight", operator: "gt", value: 100 }
          ]
        },
        {
          type: "weekend",
          name: "Weekend Service",
          description: "Weekend moving surcharge",
          percentage: 20,
          conditions: [
            { field: "day", operator: "eq", value: 0 },
            { field: "day", operator: "eq", value: 6 }
          ]
        }
      ],
      currency: "USD",
      minimumCharge: 200.00,
      maximumCharge: 2000.00
    },
    specifications: {
      maxWeight: 5000,
      maxDimensions: {
        length: 300,
        width: 200,
        height: 200
      },
      maxDistance: 200,
      estimatedDuration: {
        min: 2,
        max: 12,
        unit: "hours"
      },
      capabilities: [
        "furniture_moving", "appliance_moving", "disassembly_required",
        "assembly_required", "packing_service", "unpacking_service"
      ],
      vehicleRequirements: [
        { type: "truck", required: true, minCapacity: 20 }
      ]
    },
    availability: {
      operatingHours: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 2, startTime: "08:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 3, startTime: "08:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 4, startTime: "08:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 5, startTime: "08:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 6, startTime: "09:00", endTime: "15:00", isAvailable: true },
        { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isAvailable: false }
      ],
      serviceAreas: [
        {
          type: "radius",
          name: "Regional Area",
          coordinates: {
            center: { lat: 40.7128, lng: -74.0060 },
            radius: 200000
          },
          isActive: true
        }
      ],
      advanceBooking: {
        minimum: { value: 24, unit: "hours" },
        maximum: { value: 60, unit: "days" }
      }
    },
    features: [
      { name: "Professional movers", description: "Trained and insured team", icon: "users", isHighlight: true },
      { name: "Equipment included", description: "Dollies, straps, and tools", icon: "tool", isHighlight: true },
      { name: "Assembly service", description: "Disassemble and reassemble", icon: "settings", isHighlight: false },
      { name: "Insurance coverage", description: "Full value protection", icon: "shield", isHighlight: false }
    ],
    requirements: [
      {
        type: "timing",
        name: "Advance Booking",
        description: "Must be booked at least 24 hours in advance",
        isMandatory: true
      },
      {
        type: "location",
        name: "Access Requirements",
        description: "Ensure clear access path for movers",
        isMandatory: true
      }
    ],
    status: "active",
    metrics: {
      totalOrders: 567,
      averageRating: 4.8,
      totalRatings: 423,
      popularityScore: 92
    },
    terms: {
      cancellationPolicy: "Free cancellation up to 24 hours before service",
      refundPolicy: "Prorated refund based on work completed",
      liabilityLimits: "Full replacement value up to $10,000"
    },
    integrations: {
      paymentMethods: ["card", "bank_transfer"],
      trackingEnabled: true,
      realTimeUpdates: true
    }
  },

  {
    name: "White Glove Service",
    slug: "white-glove-service",
    description: "Premium delivery service with inside delivery, unpacking, assembly, and debris removal. Perfect for high-value items requiring special care.",
    shortDescription: "Premium service with assembly and setup",
    category: "specialized",
    subCategory: "premium",
    serviceType: "on_demand",
    icon: "award",
    color: {
      primary: "#673AB7",
      secondary: "#9575CD",
      gradient: ["#673AB7", "#9575CD", "#B39DDB"]
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800",
        alt: "White glove delivery service",
        type: "hero"
      }
    ],
    pricing: {
      model: "fixed",
      baseFee: 200.00,
      surcharges: [
        {
          type: "express",
          name: "Same-day Service",
          description: "Same-day white glove delivery",
          percentage: 50,
          conditions: []
        }
      ],
      currency: "USD",
      minimumCharge: 200.00,
      maximumCharge: 1000.00
    },
    specifications: {
      maxWeight: 200,
      maxDimensions: {
        length: 250,
        width: 150,
        height: 150
      },
      maxDistance: 100,
      estimatedDuration: {
        min: 2,
        max: 6,
        unit: "hours"
      },
      capabilities: [
        "white_glove", "assembly_required", "unpacking_service",
        "fragile_handling", "art_handling"
      ],
      vehicleRequirements: [
        { type: "van", required: true, minCapacity: 10 }
      ]
    },
    availability: {
      operatingHours: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isAvailable: true },
        { dayOfWeek: 6, startTime: "00:00", endTime: "00:00", isAvailable: false },
        { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isAvailable: false }
      ],
      serviceAreas: [
        {
          type: "radius",
          name: "Premium Service Area",
          coordinates: {
            center: { lat: 40.7128, lng: -74.0060 },
            radius: 50000
          },
          isActive: true
        }
      ],
      advanceBooking: {
        minimum: { value: 48, unit: "hours" },
        maximum: { value: 30, unit: "days" }
      }
    },
    features: [
      { name: "Inside delivery", description: "Delivered to room of choice", icon: "home", isHighlight: true },
      { name: "Assembly included", description: "Full setup and assembly", icon: "tool", isHighlight: true },
      { name: "Debris removal", description: "Packaging cleanup included", icon: "trash-2", isHighlight: false },
      { name: "Appointment scheduling", description: "Flexible time slots", icon: "calendar", isHighlight: false }
    ],
    requirements: [
      {
        type: "timing",
        name: "Advance Scheduling",
        description: "Must be scheduled at least 48 hours in advance",
        isMandatory: true
      },
      {
        type: "customer",
        name: "Customer Presence",
        description: "Customer must be present during delivery",
        isMandatory: true
      }
    ],
    status: "active",
    metrics: {
      totalOrders: 89,
      averageRating: 4.9,
      totalRatings: 76,
      popularityScore: 85
    },
    terms: {
      cancellationPolicy: "Free cancellation up to 48 hours before service",
      refundPolicy: "Full refund for service failures",
      liabilityLimits: "Full replacement value up to $25,000"
    },
    integrations: {
      paymentMethods: ["card"],
      trackingEnabled: true,
      realTimeUpdates: true
    }
  }
];

// Connect to MongoDB
const connectDB = async () => {
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
};

// Seed services
const seedServices = async () => {
  try {
    console.log('🌱 Starting service seeding...');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');
    
    // Insert sample services
    const insertedServices = await Service.insertMany(sampleServices);
    console.log(`✅ Inserted ${insertedServices.length} services`);
    
    // Display inserted services
    insertedServices.forEach(service => {
      console.log(`   - ${service.name} (${service.category})`);
    });
    
    console.log('🎉 Service seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await seedServices();
    
    console.log('\n📊 Service Statistics:');
    const stats = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$metrics.averageRating' },
          totalOrders: { $sum: '$metrics.totalOrders' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} services, avg rating: ${stat.avgRating?.toFixed(1)}, total orders: ${stat.totalOrders}`);
    });
    
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { sampleServices, seedServices };
