import Service from '../models/Service.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

class ServiceController {
  // Get all available services with filtering and search
  async getServices(req, res) {
    try {
      const {
        category,
        serviceType,
        search,
        lat,
        lng,
        radius = 50000, // 50km default radius
        minRating,
        maxPrice,
        sortBy = 'popularity',
        page = 1,
        limit = 20
      } = req.query;

      // Build query
      let query = { status: 'active' };
      
      // Category filter
      if (category) {
        query.category = category;
      }
      
      // Service type filter
      if (serviceType) {
        query.serviceType = serviceType;
      }
      
      // Rating filter
      if (minRating) {
        query['metrics.averageRating'] = { $gte: parseFloat(minRating) };
      }
      
      // Price filter
      if (maxPrice) {
        query['pricing.baseFee'] = { $lte: parseFloat(maxPrice) };
      }
      
      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Location-based filtering
      if (lat && lng) {
        query['availability.serviceAreas.coordinates.center'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(radius)
          }
        };
      }

      // Sorting
      let sortOptions = {};
      switch (sortBy) {
        case 'popularity':
          sortOptions = { 'metrics.popularityScore': -1, 'metrics.totalOrders': -1 };
          break;
        case 'rating':
          sortOptions = { 'metrics.averageRating': -1, 'metrics.totalRatings': -1 };
          break;
        case 'price_low':
          sortOptions = { 'pricing.baseFee': 1 };
          break;
        case 'price_high':
          sortOptions = { 'pricing.baseFee': -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        case 'name':
          sortOptions = { name: 1 };
          break;
        default:
          if (search) {
            sortOptions.score = { $meta: 'textScore' };
          } else {
            sortOptions = { 'metrics.popularityScore': -1 };
          }
      }

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Execute query
      const [services, totalCount] = await Promise.all([
        Service.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Service.countDocuments(query)
      ]);

      // Filter by location availability if coordinates provided
      let filteredServices = services;
      if (lat && lng) {
        const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        filteredServices = services.filter(service => {
          // Create a temporary service instance to use the method
          const serviceInstance = new Service(service);
          return serviceInstance.isAvailableInArea(userLocation);
        });
      }

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        message: 'Services retrieved successfully',
        data: {
          services: filteredServices,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            limit: limitNum
          },
          filters: {
            category,
            serviceType,
            search,
            location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
            radius: parseInt(radius),
            sortBy
          }
        }
      });
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving services',
        code: 'SERVICES_RETRIEVAL_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get service details by ID or slug
  async getServiceDetails(req, res) {
    try {
      const { serviceId } = req.params;
      const { lat, lng } = req.query;

      // Find service by ID or slug
      let service;
      if (mongoose.Types.ObjectId.isValid(serviceId)) {
        service = await Service.findById(serviceId);
      } else {
        service = await Service.findOne({ slug: serviceId });
      }

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }

      // Check availability in user's location if provided
      let isAvailableInArea = true;
      if (lat && lng) {
        const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        isAvailableInArea = service.isAvailableInArea(userLocation);
      }

      // Get related services (same category, different service)
      const relatedServices = await Service.find({
        _id: { $ne: service._id },
        category: service.category,
        status: 'active'
      })
      .sort({ 'metrics.popularityScore': -1 })
      .limit(4)
      .lean();

      res.json({
        success: true,
        message: 'Service details retrieved successfully',
        data: {
          service: {
            ...service.toJSON(),
            isAvailableInArea,
            currentAvailability: service.isAvailable
          },
          relatedServices
        }
      });
    } catch (error) {
      console.error('Get service details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving service details',
        code: 'SERVICE_DETAILS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get service categories
  async getServiceCategories(req, res) {
    try {
      const categories = await Service.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            services: {
              $push: {
                _id: '$_id',
                name: '$name',
                slug: '$slug',
                icon: '$icon',
                shortDescription: '$shortDescription',
                color: '$color',
                popularityScore: '$metrics.popularityScore'
              }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            services: {
              $slice: [
                {
                  $sortArray: {
                    input: '$services',
                    sortBy: { popularityScore: -1 }
                  }
                },
                5 // Top 5 services per category
              ]
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        message: 'Service categories retrieved successfully',
        data: {
          categories
        }
      });
    } catch (error) {
      console.error('Get service categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving service categories',
        code: 'CATEGORIES_ERROR'
      });
    }
  }

  // Calculate service pricing
  async calculatePricing(req, res) {
    try {
      console.log('🔍 Pricing request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Package details for pricing:', req.body.packageDetails);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Pricing validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { serviceId } = req.params;
      const {
        pickupLocation,
        dropoffLocation,
        packageDetails,
        scheduledTime,
        additionalServices
      } = req.body;

      // Find service by slug
      const service = await Service.findOne({ slug: serviceId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }

      if (service.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Service is not currently available',
          code: 'SERVICE_UNAVAILABLE'
        });
      }

      // Calculate distance
      console.log('📏 Calculating distance for pricing...');
      let distance;
      if (!this || typeof this.calculateDistance !== 'function') {
        // Fallback: Define calculateDistance inline
        const calculateDistance = (coord1, coord2) => {
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
        distance = calculateDistance(pickupLocation.coordinates, dropoffLocation.coordinates);
      } else {
        distance = this.calculateDistance(pickupLocation.coordinates, dropoffLocation.coordinates);
      }
      console.log('✅ Distance for pricing:', distance, 'meters');

      // Prepare order details for pricing calculation
      console.log('⏱️ Calculating duration...');
      let duration;
      if (!this || typeof this.estimateDuration !== 'function') {
        // Fallback: Define estimateDuration inline
        const estimateDuration = (distanceInMeters, serviceType) => {
          const avgSpeed = {
            'express': 40, // km/h
            'standard': 30,
            'moving': 25,
            'storage': 35
          };
          const speed = avgSpeed[serviceType] || 30;
          const distanceKm = distanceInMeters / 1000;
          return Math.max(15, Math.round((distanceKm / speed) * 60)); // Minimum 15 minutes
        };
        duration = estimateDuration(distance, service.serviceType);
      } else {
        duration = this.estimateDuration(distance, service.serviceType);
      }
      console.log('✅ Duration calculated:', duration, 'minutes');

      const orderDetails = {
        distance: distance / 1000, // Convert to kilometers
        weight: packageDetails.weight,
        duration: duration,
        packageDetails,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
        additionalServices
      };

      // Calculate base price
      const basePrice = service.calculatePrice(orderDetails);

      // Calculate additional service costs
      let additionalCosts = 0;
      const appliedServices = [];
      
      if (additionalServices && additionalServices.length > 0) {
        for (let additionalService of additionalServices) {
          // Handle both string format and object format
          const serviceType = typeof additionalService === 'string' ? additionalService : additionalService.type;
          
          // Check if service has a surcharge for this service type
          const surcharge = service.pricing.surcharges.find(s => s.type === serviceType);
          
          if (surcharge) {
            // Apply additional cost
            const cost = this.getAdditionalServiceCost(serviceType, orderDetails);
            additionalCosts += cost;
            appliedServices.push({
              type: serviceType,
              name: this.getAdditionalServiceName(serviceType),
              cost
            });
          }
        }
      }

      // Calculate tax (8% default)
      const subtotal = basePrice + additionalCosts;
      const taxRate = 0.08;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Estimate delivery time
      const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
        scheduledTime ? new Date(scheduledTime) : new Date(),
        service,
        distance
      );

      res.json({
        success: true,
        message: 'Pricing calculated successfully',
        data: {
          pricing: {
            basePrice: parseFloat(basePrice.toFixed(2)),
            additionalServices: appliedServices,
            additionalCosts: parseFloat(additionalCosts.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            currency: service.pricing.currency || 'USD'
          },
          serviceDetails: {
            name: service.name,
            serviceType: service.serviceType,
            estimatedDistance: Math.round(distance),
            estimatedDuration: orderDetails.duration,
            estimatedDeliveryTime
          },
          breakdown: {
            baseFee: service.pricing.baseFee,
            distanceFee: basePrice - service.pricing.baseFee,
            surcharges: [], // TODO: Extract applied surcharges
            discounts: []   // TODO: Extract applied discounts
          }
        }
      });
    } catch (error) {
      console.error('Calculate pricing error:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating pricing',
        code: 'PRICING_CALCULATION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Book a service (create order)
  async bookService(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('\n🚀 ===== BOOKING SERVICE REQUEST =====');
      console.log('📅 Timestamp:', new Date().toISOString());
      console.log('🔐 User ID:', req.userId);
      console.log('🎯 Service ID:', req.params.serviceId);
      console.log('📍 IP Address:', req.ip || req.connection.remoteAddress);
      console.log('\n📦 REQUEST BODY:');
      console.log(JSON.stringify(req.body, null, 2));
      console.log('\n🏷️ PACKAGE DETAILS:');
      console.log(JSON.stringify(req.body.packageDetails, null, 2));
      console.log('=====================================\n');
      
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { serviceId } = req.params;
      const {
        pickupLocation,
        dropoffLocation,
        packageDetails,
        scheduledPickupTime,
        priority,
        additionalServices,
        paymentMethod,
        specialInstructions
      } = req.body;

      // Verify user exists and is a customer
      console.log('👤 Looking for user with ID:', req.userId);
      const user = await User.findById(req.userId).session(session);
      if (!user) {
        console.log('❌ USER NOT FOUND:', req.userId);
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      console.log('✅ User found:', user.email, '(Type:', user.userType, ')');

      if (user.userType !== 'customer') {
        console.log('❌ INVALID USER TYPE:', user.userType, '(Expected: customer)');
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: 'Only customers can book services',
          code: 'INVALID_USER_TYPE'
        });
      }

      // Find and validate service by slug
      console.log('🔍 Looking for service with slug:', serviceId);
      const service = await Service.findOne({ slug: serviceId }).session(session);
      if (!service) {
        console.log('❌ SERVICE NOT FOUND:', serviceId);
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }
      console.log('✅ Service found:', service.name, '(ID:', service._id, ')');

      if (service.status !== 'active') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Service is not currently available',
          code: 'SERVICE_UNAVAILABLE'
        });
      }

      // Validate service availability in pickup location
      if (!service.isAvailableInArea(pickupLocation.coordinates)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Service is not available in the pickup location',
          code: 'SERVICE_AREA_UNAVAILABLE'
        });
      }

      // Calculate distance and validate against service limits
      console.log('📏 Calculating distance between coordinates...');
      console.log('   Pickup:', pickupLocation.coordinates);
      console.log('   Dropoff:', dropoffLocation.coordinates);
      console.log('   Context (this):', typeof this, this?.constructor?.name);
      
      // Check if calculateDistance method exists and calculate distance
      let distance;
      if (!this || typeof this.calculateDistance !== 'function') {
        console.log('❌ calculateDistance method not found on this context');
        console.log('   Available methods:', this ? Object.getOwnPropertyNames(this) : 'this is undefined');
        
        // Fallback: Define calculateDistance inline
        const calculateDistance = (coord1, coord2) => {
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
        
        distance = calculateDistance(
          pickupLocation.coordinates,
          dropoffLocation.coordinates
        );
        console.log('✅ Distance calculated using fallback:', distance, 'meters');
      } else {
        distance = this.calculateDistance(
          pickupLocation.coordinates,
          dropoffLocation.coordinates
        );
        console.log('✅ Distance calculated using this.calculateDistance:', distance, 'meters');
      }

      if (service.specifications.maxDistance && distance > service.specifications.maxDistance * 1000) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Distance exceeds service limit of ${service.specifications.maxDistance}km`,
          code: 'DISTANCE_LIMIT_EXCEEDED'
        });
      }

      // Validate package specifications
      if (service.specifications.maxWeight && packageDetails.weight > service.specifications.maxWeight) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Package weight exceeds service limit of ${service.specifications.maxWeight}kg`,
          code: 'WEIGHT_LIMIT_EXCEEDED'
        });
      }

      // Calculate pricing
      console.log('⏱️ Calculating duration for booking...');
      let duration;
      if (!this || typeof this.estimateDuration !== 'function') {
        // Fallback: Define estimateDuration inline
        const estimateDuration = (distanceInMeters, serviceType) => {
          const avgSpeed = {
            'express': 40, // km/h
            'standard': 30,
            'moving': 25,
            'storage': 35
          };
          const speed = avgSpeed[serviceType] || 30;
          const distanceKm = distanceInMeters / 1000;
          return Math.max(15, Math.round((distanceKm / speed) * 60)); // Minimum 15 minutes
        };
        duration = estimateDuration(distance, service.serviceType);
      } else {
        duration = this.estimateDuration(distance, service.serviceType);
      }
      console.log('✅ Duration for booking:', duration, 'minutes');

      const orderDetails = {
        distance: distance / 1000,
        weight: packageDetails.weight,
        duration: duration,
        packageDetails,
        scheduledTime: scheduledPickupTime ? new Date(scheduledPickupTime) : new Date(),
        additionalServices
      };

      const totalAmount = service.calculatePrice(orderDetails);

      // Create order
      const orderData = {
        customer: req.userId,
        serviceType: service.serviceType,
        pickupLocation: {
          ...pickupLocation,
          coordinates: {
            lat: pickupLocation.coordinates.lat,
            lng: pickupLocation.coordinates.lng
          }
        },
        dropoffLocation: {
          ...dropoffLocation,
          coordinates: {
            lat: dropoffLocation.coordinates.lat,
            lng: dropoffLocation.coordinates.lng
          }
        },
        packageDetails: {
          ...packageDetails,
          specialInstructions: specialInstructions || packageDetails.specialInstructions
        },
        scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        priority: priority || 'normal',
        estimatedDistance: distance,
        estimatedDuration: orderDetails.duration * 60, // Convert to seconds
        pricing: {
          baseFee: service.pricing.baseFee,
          distanceFee: totalAmount - service.pricing.baseFee,
          totalAmount,
          currency: service.pricing.currency || 'USD'
        },
        payment: {
          status: 'pending',
          method: paymentMethod
        },
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          updatedBy: req.userId,
          note: `Order created for ${service.name} service`
        }],
        source: 'mobile_app',
        // Store service reference for future use
        serviceId: service._id,
        serviceName: service.name
      };

      console.log('\n💾 CREATING ORDER:');
      console.log('📋 Order Data:', JSON.stringify(orderData, null, 2));
      
      const order = new Order(orderData);
      console.log('🔄 Saving order to database...');
      await order.save({ session });
      console.log('✅ Order saved successfully! ID:', order._id);

      // Update service metrics
      service.metrics.totalOrders += 1;
      service.metrics.lastOrderDate = new Date();
      await service.save({ session });

      await session.commitTransaction();
      console.log('✅ Transaction committed successfully!');

      // Populate customer details for response
      await order.populate('customer', 'firstName lastName email phone');

      const responseData = {
        success: true,
        message: 'Service booked successfully',
        data: {
          order: order.toJSON(),
          service: {
            _id: service._id,
            name: service.name,
            category: service.category,
            serviceType: service.serviceType
          }
        }
      };

      console.log('\n🎉 SUCCESS RESPONSE:');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('=====================================\n');

      res.status(201).json(responseData);

    } catch (error) {
      await session.abortTransaction();
      console.log('\n💥 ===== BOOKING ERROR =====');
      console.log('❌ Error Type:', error.constructor.name);
      console.log('❌ Error Message:', error.message);
      console.log('❌ Stack Trace:');
      console.log(error.stack);
      
      if (error.errors) {
        console.log('❌ Validation Errors:');
        Object.keys(error.errors).forEach(key => {
          console.log(`   ${key}: ${error.errors[key].message}`);
        });
      }
      
      console.log('============================\n');
      
      res.status(500).json({
        success: false,
        message: 'Error booking service',
        code: 'SERVICE_BOOKING_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      });
    } finally {
      session.endSession();
    }
  }

  // Get popular services
  async getPopularServices(req, res) {
    try {
      const { limit = 10, category } = req.query;
      
      let query = { status: 'active' };
      if (category) {
        query.category = category;
      }

      const services = await Service.find(query)
        .sort({ 'metrics.popularityScore': -1, 'metrics.totalOrders': -1 })
        .limit(Math.min(50, parseInt(limit)))
        .select('name slug shortDescription icon color category serviceType pricing.baseFee metrics')
        .lean();

      res.json({
        success: true,
        message: 'Popular services retrieved successfully',
        data: {
          services
        }
      });
    } catch (error) {
      console.error('Get popular services error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving popular services',
        code: 'POPULAR_SERVICES_ERROR'
      });
    }
  }

  // Search services
  async searchServices(req, res) {
    try {
      const { q, category, serviceType, lat, lng, limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long',
          code: 'INVALID_SEARCH_QUERY'
        });
      }

      let query = {
        status: 'active',
        $text: { $search: q.trim() }
      };

      if (category) query.category = category;
      if (serviceType) query.serviceType = serviceType;

      // Location-based search
      if (lat && lng) {
        query['availability.serviceAreas.coordinates.center'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: 50000 // 50km radius
          }
        };
      }

      const services = await Service.find(query)
        .select('name slug shortDescription icon color category serviceType pricing.baseFee metrics')
        .sort({ score: { $meta: 'textScore' }, 'metrics.popularityScore': -1 })
        .limit(Math.min(50, parseInt(limit)))
        .lean();

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
          services,
          query: q,
          resultsCount: services.length
        }
      });
    } catch (error) {
      console.error('Search services error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching services',
        code: 'SEARCH_ERROR'
      });
    }
  }

  // Get service availability
  async getServiceAvailability(req, res) {
    try {
      const { serviceId } = req.params;
      const { lat, lng, date } = req.query;

      const service = await Service.findOne({ slug: serviceId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }

      const checkDate = date ? new Date(date) : new Date();
      const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

      // Check general availability
      const isActive = service.status === 'active';
      const isAvailableInArea = userLocation ? service.isAvailableInArea(userLocation) : true;
      const isCurrentlyOpen = service.isAvailable;

      // Check operating hours for the specific date
      const dayOfWeek = checkDate.getDay();
      const operatingHours = service.availability?.operatingHours?.find(h => h.dayOfWeek === dayOfWeek);

      // Check blackout dates
      const isBlackedOut = service.availability?.blackoutDates?.some(blackout => {
        const start = new Date(blackout.startDate);
        const end = new Date(blackout.endDate);
        return checkDate >= start && checkDate <= end;
      });

      res.json({
        success: true,
        message: 'Service availability retrieved successfully',
        data: {
          serviceId: service._id,
          serviceName: service.name,
          isAvailable: isActive && isAvailableInArea && !isBlackedOut,
          details: {
            isActive,
            isAvailableInArea,
            isCurrentlyOpen,
            isBlackedOut,
            operatingHours: operatingHours || null,
            advanceBooking: service.availability?.advanceBooking || null
          }
        }
      });
    } catch (error) {
      console.error('Get service availability error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking service availability',
        code: 'AVAILABILITY_ERROR'
      });
    }
  }

  // Helper methods
  calculateDistance(coord1, coord2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  estimateDuration(distanceInMeters, serviceType) {
    // Estimate duration based on distance and service type (in minutes)
    const avgSpeed = {
      'express': 40, // km/h
      'standard': 30,
      'moving': 25,
      'storage': 30,
      'same_day': 35,
      'next_day': 30,
      'scheduled': 30,
      'on_demand': 35
    };

    const speed = avgSpeed[serviceType] || 30;
    const distanceInKm = distanceInMeters / 1000;
    return Math.max(15, Math.round((distanceInKm / speed) * 60)); // Minimum 15 minutes
  }

  calculateEstimatedDeliveryTime(scheduledTime, service, distance) {
    const duration = this.estimateDuration(distance, service.serviceType);
    const deliveryTime = new Date(scheduledTime);
    deliveryTime.setMinutes(deliveryTime.getMinutes() + duration);
    return deliveryTime;
  }

  getAdditionalServiceCost(serviceType, orderDetails) {
    // Simplified additional service pricing
    const costs = {
      'fragile_handling': 10.00,
      'white_glove': 25.00,
      'assembly_required': 15.00,
      'disassembly_required': 15.00,
      'packing_service': 20.00,
      'unpacking_service': 20.00,
      'furniture_moving': 30.00,
      'appliance_moving': 35.00,
      'piano_moving': 100.00,
      'temperature_controlled': 15.00,
      'photo': 2.00,
      'insured': 5.00,
      'signature': 3.00,
      'doorstep': 0.00,
      'fragile': 8.00,
      'insurance': 5.00
    };

    return costs[serviceType] || 0;
  }

  getAdditionalServiceName(serviceType) {
    const names = {
      'fragile_handling': 'Fragile Item Handling',
      'white_glove': 'White Glove Service',
      'assembly_required': 'Assembly Service',
      'disassembly_required': 'Disassembly Service',
      'packing_service': 'Packing Service',
      'unpacking_service': 'Unpacking Service',
      'furniture_moving': 'Furniture Moving',
      'appliance_moving': 'Appliance Moving',
      'piano_moving': 'Piano Moving',
      'temperature_controlled': 'Temperature Controlled',
      'photo': 'Photo Confirmation',
      'insured': 'Insurance',
      'signature': 'Signature Required',
      'doorstep': 'Leave at Door',
      'fragile': 'Fragile Item',
      'insurance': 'Insurance'
    };

    return names[serviceType] || serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export default new ServiceController();
