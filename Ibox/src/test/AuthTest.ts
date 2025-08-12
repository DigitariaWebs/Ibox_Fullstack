/**
 * Authentication Integration Test Script
 * 
 * This script helps test the new authentication flow with the backend API.
 * Run this in your React Native app's console to test various auth scenarios.
 */

import apiService from '../services/api';
import { debugAuth } from '../contexts/AuthContext';

// Test Configuration
const TEST_USER = {
  email: 'test@ibox.com',
  password: 'TestPassword123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  userType: 'customer' as const,
};

// Test Functions
export const authTests = {
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

  // Test 2: Test user registration
  async testRegistration() {
    console.log('🧪 Testing user registration...');
    try {
      const response = await apiService.register(TEST_USER);
      console.log('✅ Registration test SUCCESS:', response.user.email);
      return response;
    } catch (error: any) {
      console.log('❌ Registration test FAILED:', error.message);
      return null;
    }
  },

  // Test 3: Test user login
  async testLogin() {
    console.log('🧪 Testing user login...');
    try {
      const response = await apiService.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      console.log('✅ Login test SUCCESS:', response.user.email);
      return response;
    } catch (error: any) {
      console.log('❌ Login test FAILED:', error.message);
      return null;
    }
  },

  // Test 4: Test token refresh
  async testTokenRefresh() {
    console.log('🧪 Testing token refresh...');
    try {
      const refreshed = await apiService.refreshAccessToken();
      console.log(`✅ Token refresh test: ${refreshed ? 'SUCCESS' : 'FAILED'}`);
      return refreshed;
    } catch (error: any) {
      console.log('❌ Token refresh test FAILED:', error.message);
      return false;
    }
  },

  // Test 5: Test get current user
  async testGetCurrentUser() {
    console.log('🧪 Testing get current user...');
    try {
      const user = await apiService.getCurrentUser();
      console.log('✅ Get current user test SUCCESS:', user.email);
      return user;
    } catch (error: any) {
      console.log('❌ Get current user test FAILED:', error.message);
      return null;
    }
  },

  // Test 6: Test logout
  async testLogout() {
    console.log('🧪 Testing logout...');
    try {
      await apiService.logout();
      console.log('✅ Logout test SUCCESS');
      return true;
    } catch (error: any) {
      console.log('❌ Logout test FAILED:', error.message);
      return false;
    }
  },

  // Test 7: Test token validation
  async testTokenValidation() {
    console.log('🧪 Testing token validation...');
    try {
      const tokens = await debugAuth.getTokens();
      console.log('✅ Token validation test:', tokens);
      return tokens;
    } catch (error: any) {
      console.log('❌ Token validation test FAILED:', error.message);
      return null;
    }
  },

  // Comprehensive test suite
  async runAllTests() {
    console.log('🚀 Starting comprehensive authentication tests...\n');
    
    const results = {
      connection: false,
      registration: null,
      login: null,
      tokenRefresh: false,
      getCurrentUser: null,
      logout: false,
    };

    // 1. Test connection
    results.connection = await this.testConnection();
    if (!results.connection) {
      console.log('❌ Backend connection failed. Make sure your backend is running on http://localhost:5000');
      return results;
    }

    console.log(''); // Add spacing

    // 2. Clear any existing auth state
    await debugAuth.clearAllCache();
    console.log('🗑️ Cleared existing auth state');

    console.log(''); // Add spacing

    // 3. Test registration
    results.registration = await this.testRegistration();

    console.log(''); // Add spacing

    // 4. Test login
    results.login = await this.testLogin();

    console.log(''); // Add spacing

    // 5. Test get current user
    if (results.login) {
      results.getCurrentUser = await this.testGetCurrentUser();
    }

    console.log(''); // Add spacing

    // 6. Test token refresh
    if (results.login) {
      results.tokenRefresh = await this.testTokenRefresh();
    }

    console.log(''); // Add spacing

    // 7. Test logout
    if (results.login) {
      results.logout = await this.testLogout();
    }

    console.log(''); // Add spacing

    // Summary
    console.log('📊 TEST SUMMARY:');
    console.log('================');
    console.log(`Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`Registration: ${results.registration ? '✅' : '❌'}`);
    console.log(`Login: ${results.login ? '✅' : '❌'}`);
    console.log(`Get Current User: ${results.getCurrentUser ? '✅' : '❌'}`);
    console.log(`Token Refresh: ${results.tokenRefresh ? '✅' : '❌'}`);
    console.log(`Logout: ${results.logout ? '✅' : '❌'}`);

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Your authentication integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the error messages above for details.');
    }

    return results;
  },

  // Development helpers
  async clearAuthState() {
    console.log('🧹 Clearing all auth state...');
    await debugAuth.clearAllCache();
    console.log('✅ Auth state cleared');
  },

  async checkTokens() {
    console.log('🔑 Checking current tokens...');
    const tokens = await debugAuth.getTokens();
    console.log('Token status:', tokens);
    return tokens;
  },

  async checkConnection() {
    console.log('🌐 Checking backend connection...');
    const isConnected = await debugAuth.checkConnection();
    console.log(`Connection status: ${isConnected ? 'connected' : 'disconnected'}`);
    return isConnected;
  },
};

// Export for easy testing
export default authTests;

/**
 * HOW TO USE THIS TEST SCRIPT:
 * 
 * 1. Make sure your backend is running:
 *    cd backend && npm run dev
 * 
 * 2. In your React Native app, import and run tests:
 *    import authTests from './src/test/AuthTest';
 *    
 *    // Run individual tests
 *    authTests.testConnection();
 *    authTests.testLogin();
 *    
 *    // Run all tests
 *    authTests.runAllTests();
 *    
 *    // Development helpers
 *    authTests.clearAuthState();
 *    authTests.checkTokens();
 * 
 * 3. Check console output for test results
 */