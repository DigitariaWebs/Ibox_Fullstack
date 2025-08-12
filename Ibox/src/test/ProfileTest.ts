/**
 * Profile Management Integration Test Script
 * 
 * This script helps test the new profile management features with the backend API.
 * Run this in your React Native app's console to test various profile scenarios.
 */

import profileService, { UserProfile, ProfileUpdateData, UserStatistics, NotificationPreferences } from '../services/profileService';
import imageUploadService from '../services/imageUploadService';
import apiService from '../services/api';

// Test Configuration
const TEST_PROFILE_UPDATE: ProfileUpdateData = {
  firstName: 'John',
  lastName: 'Updated',
  phone: '+1-234-567-8901',
  dateOfBirth: '1995-06-15',
};

const TEST_NOTIFICATION_PREFS: Partial<NotificationPreferences> = {
  pushNotifications: true,
  smsNotifications: true,
  emailNotifications: false,
  locationServices: true,
};

// Test Functions
export const profileTests = {
  // Test 1: Check backend connection
  async testConnection() {
    console.log('🧪 Testing backend connection...');
    try {
      const isConnected = await apiService.checkConnection();
      console.log(`✅ Connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      console.log('❌ Connection test FAILED:', error);
      return false;
    }
  },

  // Test 2: Test getting user profile
  async testGetUserProfile() {
    console.log('🧪 Testing get user profile...');
    try {
      const profile = await profileService.getUserProfile();
      console.log('✅ User profile loaded:', {
        id: profile.id,
        name: profileService.formatDisplayName(profile),
        email: profile.email,
        phone: profile.phone,
        userType: profile.userType,
        membership: profileService.getMembershipInfo(profile).displayName,
      });
      return profile;
    } catch (error: any) {
      console.log('❌ Get user profile FAILED:', error.message);
      return null;
    }
  },

  // Test 3: Test updating user profile
  async testUpdateUserProfile() {
    console.log('🧪 Testing update user profile...');
    try {
      const updatedProfile = await profileService.updateUserProfile(TEST_PROFILE_UPDATE);
      console.log('✅ Profile updated successfully:', {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone,
        dateOfBirth: updatedProfile.dateOfBirth,
      });
      return updatedProfile;
    } catch (error: any) {
      console.log('❌ Update user profile FAILED:', error.message);
      return null;
    }
  },

  // Test 4: Test getting user statistics
  async testGetUserStatistics() {
    console.log('🧪 Testing get user statistics...');
    try {
      const stats = await profileService.getUserStatistics();
      console.log('✅ User statistics loaded:', {
        totalOrders: stats.totalOrders,
        completedOrders: stats.completedOrders,
        totalSpent: `$${stats.totalSpent.toFixed(2)}`,
        totalSaved: `$${stats.totalSaved.toFixed(2)}`,
        loyaltyPoints: stats.loyaltyPoints,
        averageRating: stats.averageRating,
      });
      return stats;
    } catch (error: any) {
      console.log('❌ Get user statistics FAILED:', error.message);
      return null;
    }
  },

  // Test 5: Test notification preferences
  async testNotificationPreferences() {
    console.log('🧪 Testing notification preferences...');
    try {
      // Get current preferences
      const currentPrefs = await profileService.getNotificationPreferences();
      console.log('✅ Current notification preferences:', currentPrefs);

      // Update preferences
      const updatedPrefs = await profileService.updateNotificationPreferences(TEST_NOTIFICATION_PREFS);
      console.log('✅ Updated notification preferences:', updatedPrefs);

      return { current: currentPrefs, updated: updatedPrefs };
    } catch (error: any) {
      console.log('❌ Notification preferences test FAILED:', error.message);
      return null;
    }
  },

  // Test 6: Test user addresses
  async testUserAddresses() {
    console.log('🧪 Testing user addresses...');
    try {
      const addresses = await profileService.getUserAddresses();
      console.log('✅ User addresses loaded:', addresses.map(addr => ({
        id: addr.id,
        type: addr.type,
        address: addr.address,
        city: addr.city,
        isDefault: addr.isDefault,
      })));
      return addresses;
    } catch (error: any) {
      console.log('❌ Get user addresses FAILED:', error.message);
      return null;
    }
  },

  // Test 7: Test order history
  async testOrderHistory() {
    console.log('🧪 Testing order history...');
    try {
      const orderHistory = await profileService.getOrderHistory(1, 5);
      console.log('✅ Order history loaded:', {
        totalOrders: orderHistory.totalOrders,
        currentPage: orderHistory.currentPage,
        totalPages: orderHistory.totalPages,
        ordersCount: orderHistory.orders.length,
      });
      return orderHistory;
    } catch (error: any) {
      console.log('❌ Get order history FAILED:', error.message);
      return null;
    }
  },

  // Test 8: Test profile completeness
  async testProfileCompleteness() {
    console.log('🧪 Testing profile completeness...');
    try {
      const isComplete = await profileService.isProfileComplete();
      console.log(`✅ Profile completeness check: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
      return isComplete;
    } catch (error: any) {
      console.log('❌ Profile completeness test FAILED:', error.message);
      return null;
    }
  },

  // Test 9: Test profile data caching
  async testProfileCaching() {
    console.log('🧪 Testing profile data caching...');
    try {
      // Get profile and cache it
      const profile = await profileService.getUserProfile();
      await profileService.cacheProfileData(profile);
      console.log('✅ Profile data cached successfully');

      // Retrieve cached data
      const cachedProfile = await profileService.getCachedProfileData();
      if (cachedProfile && cachedProfile.id === profile.id) {
        console.log('✅ Cached profile data retrieved successfully');
      } else {
        console.log('❌ Cached profile data mismatch');
        return false;
      }

      // Clear cached data
      await profileService.clearCachedProfileData();
      const clearedCache = await profileService.getCachedProfileData();
      if (!clearedCache) {
        console.log('✅ Cached profile data cleared successfully');
      } else {
        console.log('❌ Failed to clear cached profile data');
        return false;
      }

      return true;
    } catch (error: any) {
      console.log('❌ Profile caching test FAILED:', error.message);
      return null;
    }
  },

  // Test 10: Test image upload permissions
  async testImageUploadPermissions() {
    console.log('🧪 Testing image upload permissions...');
    try {
      const hasPermissions = await imageUploadService.requestPermissions();
      console.log(`✅ Image upload permissions: ${hasPermissions ? 'GRANTED' : 'DENIED'}`);
      return hasPermissions;
    } catch (error: any) {
      console.log('❌ Image upload permissions test FAILED:', error.message);
      return false;
    }
  },

  // Test 11: Test image validation
  async testImageValidation() {
    console.log('🧪 Testing image validation...');
    try {
      const testImages = [
        'https://i.pravatar.cc/300?img=1',
        'file:///path/to/image.jpg',
        'data:image/jpeg;base64,/9j/4AAQ...',
        'invalid-image-uri',
        '',
      ];

      const results = testImages.map(uri => ({
        uri,
        isValid: imageUploadService.validateImage(uri),
      }));

      console.log('✅ Image validation results:', results);
      return results;
    } catch (error: any) {
      console.log('❌ Image validation test FAILED:', error.message);
      return null;
    }
  },

  // Comprehensive test suite
  async runAllTests() {
    console.log('🚀 Starting comprehensive profile management tests...\n');
    
    const results = {
      connection: false,
      getUserProfile: null,
      updateUserProfile: null,
      getUserStatistics: null,
      notificationPreferences: null,
      userAddresses: null,
      orderHistory: null,
      profileCompleteness: null,
      profileCaching: null,
      imageUploadPermissions: false,
      imageValidation: null,
    };

    // 1. Test connection
    results.connection = await this.testConnection();
    if (!results.connection) {
      console.log('❌ Backend connection failed. Make sure your backend is running on the configured URL');
      return results;
    }

    console.log(''); // Add spacing

    // 2. Test getting user profile
    results.getUserProfile = await this.testGetUserProfile();

    console.log(''); // Add spacing

    // 3. Test updating user profile
    results.updateUserProfile = await this.testUpdateUserProfile();

    console.log(''); // Add spacing

    // 4. Test getting user statistics
    results.getUserStatistics = await this.testGetUserStatistics();

    console.log(''); // Add spacing

    // 5. Test notification preferences
    results.notificationPreferences = await this.testNotificationPreferences();

    console.log(''); // Add spacing

    // 6. Test user addresses
    results.userAddresses = await this.testUserAddresses();

    console.log(''); // Add spacing

    // 7. Test order history
    results.orderHistory = await this.testOrderHistory();

    console.log(''); // Add spacing

    // 8. Test profile completeness
    results.profileCompleteness = await this.testProfileCompleteness();

    console.log(''); // Add spacing

    // 9. Test profile caching
    results.profileCaching = await this.testProfileCaching();

    console.log(''); // Add spacing

    // 10. Test image upload permissions
    results.imageUploadPermissions = await this.testImageUploadPermissions();

    console.log(''); // Add spacing

    // 11. Test image validation
    results.imageValidation = await this.testImageValidation();

    console.log(''); // Add spacing

    // Summary
    console.log('📊 PROFILE MANAGEMENT TEST SUMMARY:');
    console.log('=========================================');
    console.log(`Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`Get User Profile: ${results.getUserProfile ? '✅' : '❌'}`);
    console.log(`Update User Profile: ${results.updateUserProfile ? '✅' : '❌'}`);
    console.log(`Get User Statistics: ${results.getUserStatistics ? '✅' : '❌'}`);
    console.log(`Notification Preferences: ${results.notificationPreferences ? '✅' : '❌'}`);
    console.log(`User Addresses: ${results.userAddresses ? '✅' : '❌'}`);
    console.log(`Order History: ${results.orderHistory ? '✅' : '❌'}`);
    console.log(`Profile Completeness: ${results.profileCompleteness !== null ? '✅' : '❌'}`);
    console.log(`Profile Caching: ${results.profileCaching ? '✅' : '❌'}`);
    console.log(`Image Upload Permissions: ${results.imageUploadPermissions ? '✅' : '❌'}`);
    console.log(`Image Validation: ${results.imageValidation ? '✅' : '❌'}`);

    const passedTests = [
      results.connection,
      results.getUserProfile,
      results.updateUserProfile,
      results.getUserStatistics,
      results.notificationPreferences,
      results.userAddresses,
      results.orderHistory,
      results.profileCompleteness !== null,
      results.profileCaching,
      results.imageUploadPermissions,
      results.imageValidation,
    ].filter(Boolean).length;

    const totalTests = 11;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Your profile management integration is working correctly.');
    } else if (passedTests >= 8) {
      console.log('✅ Most tests passed. Your profile management integration is mostly working correctly.');
    } else {
      console.log('⚠️ Several tests failed. Check the error messages above for details.');
    }

    return results;
  },

  // Development helpers
  async createMockProfile() {
    console.log('📝 Creating mock profile data...');
    const mockProfile: UserProfile = {
      id: 'test-user-' + Date.now(),
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@ibox.com',
      phone: '+1-234-567-8900',
      userType: 'customer',
      membershipLevel: 'premium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('Mock profile:', mockProfile);
    return mockProfile;
  },

  async validateProfileData(profile: UserProfile) {
    console.log('🔍 Validating profile data...');
    const issues = [];

    if (!profile.firstName?.trim()) issues.push('Missing first name');
    if (!profile.lastName?.trim()) issues.push('Missing last name');
    if (!profile.email?.trim()) issues.push('Missing email');
    if (!profile.userType) issues.push('Missing user type');

    if (issues.length > 0) {
      console.log('❌ Profile validation issues:', issues);
      return false;
    } else {
      console.log('✅ Profile data is valid');
      return true;
    }
  },

  async testSpecificFeature(feature: string) {
    console.log(`🧪 Testing specific feature: ${feature}...`);
    
    switch (feature) {
      case 'profile':
        return await this.testGetUserProfile();
      case 'update':
        return await this.testUpdateUserProfile();
      case 'stats':
        return await this.testGetUserStatistics();
      case 'notifications':
        return await this.testNotificationPreferences();
      case 'addresses':
        return await this.testUserAddresses();
      case 'orders':
        return await this.testOrderHistory();
      case 'cache':
        return await this.testProfileCaching();
      case 'upload':
        return await this.testImageUploadPermissions();
      default:
        console.log('❌ Unknown feature:', feature);
        return null;
    }
  },
};

// Export for easy testing
export default profileTests;

/**
 * HOW TO USE THIS TEST SCRIPT:
 * 
 * 1. Make sure your backend is running:
 *    cd backend && npm run dev
 * 
 * 2. In your React Native app, import and run tests:
 *    import profileTests from './src/test/ProfileTest';
 *    
 *    // Run individual tests
 *    profileTests.testConnection();
 *    profileTests.testGetUserProfile();
 *    
 *    // Run all tests
 *    profileTests.runAllTests();
 *    
 *    // Development helpers
 *    profileTests.createMockProfile();
 *    profileTests.testSpecificFeature('profile');
 * 
 * 3. Check console output for test results
 */