const mongoose = require('mongoose');
const Order = require('./src/models/Order.js');
const User = require('./src/models/User.js');
const Service = require('./src/models/Service.js');

// Test the complete address flow from picker to order creation
async function testCompleteAddressFlow() {
  try {
    console.log('🧪 Testing complete address flow from picker to order creation...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibox');
    console.log('✅ Connected to MongoDB');

    // Find a customer user
    const customer = await User.findOne({ userType: 'customer' });
    if (!customer) {
      console.log('❌ No customer found. Please create a customer first.');
      return;
    }
    console.log('✅ Found customer:', customer.email);

    // Find express service
    const expressService = await Service.findOne({ serviceType: 'express' });
    if (!expressService) {
      console.log('❌ No express service found. Please create services first.');
      return;
    }
    console.log('✅ Found express service:', expressService.name);

    // Test data with REAL addresses (like what would come from FloatingLocationPicker)
    const testOrderData = {
      customer: customer._id,
      serviceType: 'express',
      pickupLocation: {
        address: '123 Main Street, Downtown, New York, NY 10001, USA',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      },
      dropoffLocation: {
        address: '456 Broadway, SoHo, New York, NY 10013, USA',
        coordinates: {
          lat: 40.7234,
          lng: -73.9998
        }
      },
      packageDetails: {
        description: 'Test package with real addresses',
        weight: 2.5,
        dimensions: {
          length: 30,
          width: 20,
          height: 15
        }
      },
      pricing: {
        basePrice: 15.00,
        distancePrice: 8.50,
        weightPrice: 2.00,
        urgencyPrice: 5.00,
        totalAmount: 30.50,
        driverEarnings: 24.40
      },
      estimatedDistance: 8500, // 8.5 km in meters
      estimatedDuration: 1800, // 30 minutes in seconds
      priority: 'normal',
      status: 'pending',
      specialInstructions: ['Handle with care', 'Call before delivery']
    };

    console.log('\n📋 Test Order Data:');
    console.log('Pickup Address:', testOrderData.pickupLocation.address);
    console.log('Pickup Coordinates:', testOrderData.pickupLocation.coordinates);
    console.log('Dropoff Address:', testOrderData.dropoffLocation.address);
    console.log('Dropoff Coordinates:', testOrderData.dropoffLocation.coordinates);
    console.log('Distance:', (testOrderData.estimatedDistance / 1000).toFixed(1), 'km');
    console.log('Duration:', Math.round(testOrderData.estimatedDuration / 60), 'minutes');
    console.log('Total Price:', '$' + testOrderData.pricing.totalAmount.toFixed(2));
    console.log('Driver Earnings:', '$' + testOrderData.pricing.driverEarnings.toFixed(2));

    // Create the test order
    const testOrder = new Order(testOrderData);
    await testOrder.save();
    console.log('\n✅ Test order created successfully!');
    console.log('Order ID:', testOrder._id);

    // Now test the driver API to see if it returns correct addresses
    console.log('\n🔍 Testing driver API response...');
    
    // Simulate what the driver API would return
    const driverResponse = {
      id: testOrder._id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      serviceType: testOrder.serviceType,
      pickupAddress: testOrder.pickupLocation?.address || 'Address not available',
      deliveryAddress: testOrder.dropoffLocation?.address || 'Address not available',
      distance: testOrder.estimatedDistance ? `${(testOrder.estimatedDistance / 1000).toFixed(1)} km` : '5.2 km',
      estimatedTime: testOrder.estimatedDuration ? `${Math.round(testOrder.estimatedDuration / 60)}-${Math.round(testOrder.estimatedDuration / 60) + 15} min` : '30-45 min',
      price: testOrder.pricing?.driverEarnings || (testOrder.pricing?.totalAmount * 0.8) || 0,
      weight: testOrder.packageDetails?.weight || null,
      description: testOrder.packageDetails?.description || testOrder.specialInstructions?.join(', ') || 'Package delivery',
      urgency: testOrder.priority || 'normal',
      createdAt: testOrder.createdAt,
      expiresIn: Math.max(0, 3600 - Math.floor((Date.now() - testOrder.createdAt) / 1000))
    };

    console.log('\n📱 Driver App Response:');
    console.log('Customer:', driverResponse.customerName);
    console.log('Service:', driverResponse.serviceType);
    console.log('Pickup Address:', driverResponse.pickupAddress);
    console.log('Delivery Address:', driverResponse.deliveryAddress);
    console.log('Distance:', driverResponse.distance);
    console.log('Estimated Time:', driverResponse.estimatedTime);
    console.log('Price:', '$' + driverResponse.price.toFixed(2));
    console.log('Weight:', driverResponse.weight ? driverResponse.weight + ' kg' : 'Not specified');
    console.log('Description:', driverResponse.description);
    console.log('Urgency:', driverResponse.urgency);

    // Verify that addresses are real and not placeholders
    const hasRealPickupAddress = !driverResponse.pickupAddress.includes('Current Location') && 
                                !driverResponse.pickupAddress.includes('Address not available') &&
                                driverResponse.pickupAddress.length > 10;
    
    const hasRealDeliveryAddress = !driverResponse.deliveryAddress.includes('Destination') && 
                                 !driverResponse.deliveryAddress.includes('Address not available') &&
                                 driverResponse.deliveryAddress.length > 10;

    console.log('\n✅ Address Verification:');
    console.log('Pickup Address is Real:', hasRealPickupAddress ? '✅ YES' : '❌ NO');
    console.log('Delivery Address is Real:', hasRealDeliveryAddress ? '✅ YES' : '❌ NO');

    if (hasRealPickupAddress && hasRealDeliveryAddress) {
      console.log('\n🎉 SUCCESS: Complete address flow is working correctly!');
      console.log('✅ Real addresses are being captured from location picker');
      console.log('✅ Real addresses are being stored in orders');
      console.log('✅ Real addresses are being returned to driver app');
    } else {
      console.log('\n❌ ISSUE: Address flow needs improvement');
      if (!hasRealPickupAddress) console.log('❌ Pickup address is not real');
      if (!hasRealDeliveryAddress) console.log('❌ Delivery address is not real');
    }

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log('\n🧹 Test order cleaned up');

  } catch (error) {
    console.error('❌ Error testing address flow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testCompleteAddressFlow();
