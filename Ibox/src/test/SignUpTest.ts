/**
 * SignUp Integration Test Script
 * 
 * This script helps test the new signup flow with the backend API.
 * Run this in your React Native app's console to test various signup scenarios.
 */

import signUpService from '../services/signUpService';
import apiService from '../services/api';
import { SignUpData } from '../contexts/SignUpContext';

// Test Configuration
const TEST_CUSTOMER = {
  accountType: 'customer' as const,
  firstName: 'Test',
  lastName: 'Customer',
  email: 'test.customer@ibox.com',
  phone: '+1234567890',
  password: 'TestPassword123',
  legalAccepted: true,
  defaultAddress: '123 Main Street, Toronto, ON M5V 3A8',
  language: 'en' as const,
  isBusiness: false,
  currentStep: 0,
  isCompleted: false,
  confirmAll: true,
};

const TEST_TRANSPORTER = {
  accountType: 'transporter' as const,
  firstName: 'Test',
  lastName: 'Transporter',
  email: 'test.transporter@ibox.com',
  phone: '+1234567891',
  password: 'TestPassword123',
  legalAccepted: true,
  defaultAddress: '456 Oak Avenue, Toronto, ON M5V 3B9',
  language: 'en' as const,
  vehicleType: 'van',
  plate: 'TEST123',
  payloadKg: 1000,
  vehiclePhotos: ['sample_photo.jpg'],
  licenseImages: ['license.jpg'],
  licenseExpiry: '2025-12-31',
  insuranceDoc: 'insurance.pdf',
  bgCheckConsent: true,
  bankIban: 'CA89370400440532013001',
  bankHolder: 'Test Transporter',
  currentStep: 0,
  isCompleted: false,
  confirmAll: true,
};

// Test Functions
export const signUpTests = {
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

  // Test 2: Test data transformation
  async testDataTransformation() {
    console.log('🧪 Testing data transformation...');
    try {
      const customerData = signUpService.transformSignUpDataToApiRequest(TEST_CUSTOMER);
      const transporterData = signUpService.transformSignUpDataToApiRequest(TEST_TRANSPORTER);
      
      console.log('✅ Customer data transformation:', customerData);
      console.log('✅ Transporter data transformation:', transporterData);
      
      return { customerData, transporterData };
    } catch (error) {
      console.log('❌ Data transformation FAILED:', error);
      return null;
    }
  },

  // Test 3: Test validation
  async testValidation() {
    console.log('🧪 Testing validation...');
    try {
      const customerValidation = signUpService.validateSignUpData(TEST_CUSTOMER);
      const transporterValidation = signUpService.validateSignUpData(TEST_TRANSPORTER);
      
      console.log('✅ Customer validation:', customerValidation);
      console.log('✅ Transporter validation:', transporterValidation);
      
      return {
        customer: customerValidation,
        transporter: transporterValidation
      };
    } catch (error) {
      console.log('❌ Validation test FAILED:', error);
      return null;
    }
  },

  // Test 4: Test email availability
  async testEmailAvailability() {
    console.log('🧪 Testing email availability...');
    try {
      const customerEmailAvailable = await apiService.checkEmailAvailability(TEST_CUSTOMER.email);
      const transporterEmailAvailable = await apiService.checkEmailAvailability(TEST_TRANSPORTER.email);
      
      console.log(`✅ Customer email (${TEST_CUSTOMER.email}) available:`, customerEmailAvailable);
      console.log(`✅ Transporter email (${TEST_TRANSPORTER.email}) available:`, transporterEmailAvailable);
      
      return {
        customer: customerEmailAvailable,
        transporter: transporterEmailAvailable
      };
    } catch (error) {
      console.log('❌ Email availability test FAILED:', error);
      return null;
    }
  },

  // Test 5: Test customer registration
  async testCustomerRegistration() {
    console.log('🧪 Testing customer registration...');
    try {
      const result = await signUpService.registerUser(TEST_CUSTOMER);
      
      if (result.success) {
        console.log('✅ Customer registration SUCCESS:', result.user?.email);
      } else {
        console.log('❌ Customer registration FAILED:', result.message);
      }
      
      return result;
    } catch (error: any) {
      console.log('❌ Customer registration ERROR:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Test 6: Test transporter registration
  async testTransporterRegistration() {
    console.log('🧪 Testing transporter registration...');
    try {
      const result = await signUpService.registerUser(TEST_TRANSPORTER);
      
      if (result.success) {
        console.log('✅ Transporter registration SUCCESS:', result.user?.email);
      } else {
        console.log('❌ Transporter registration FAILED:', result.message);
      }
      
      return result;
    } catch (error: any) {
      console.log('❌ Transporter registration ERROR:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Test 7: Test step completion tracking
  async testStepCompletion() {
    console.log('🧪 Testing step completion tracking...');
    try {
      const customerSteps = [1, 2, 3, 4].map(step => ({
        step,
        complete: signUpService.isStepComplete(TEST_CUSTOMER, step)
      }));
      
      const transporterSteps = [1, 2, 3, 4, 5, 6, 7].map(step => ({
        step,
        complete: signUpService.isStepComplete(TEST_TRANSPORTER, step)
      }));

      const customerProgress = signUpService.getCompletionPercentage(TEST_CUSTOMER);
      const transporterProgress = signUpService.getCompletionPercentage(TEST_TRANSPORTER);
      
      console.log('✅ Customer step completion:', customerSteps, 'Progress:', customerProgress + '%');
      console.log('✅ Transporter step completion:', transporterSteps, 'Progress:', transporterProgress + '%');
      
      return {
        customer: { steps: customerSteps, progress: customerProgress },
        transporter: { steps: transporterSteps, progress: transporterProgress }
      };
    } catch (error) {
      console.log('❌ Step completion test FAILED:', error);
      return null;
    }
  },

  // Test 8: Test incomplete data validation
  async testIncompleteValidation() {
    console.log('🧪 Testing incomplete data validation...');
    try {
      const incompleteCustomer: SignUpData = {
        accountType: 'customer',
        firstName: 'Test',
        // Missing required fields intentionally
        currentStep: 0,
        isCompleted: false,
      };

      const validation = signUpService.validateSignUpData(incompleteCustomer);
      console.log('✅ Incomplete data validation (should fail):', validation);
      
      if (!validation.isValid) {
        console.log('✅ Validation correctly identified missing fields');
      } else {
        console.log('❌ Validation should have failed for incomplete data');
      }
      
      return validation;
    } catch (error) {
      console.log('❌ Incomplete validation test ERROR:', error);
      return null;
    }
  },

  // Comprehensive test suite
  async runAllTests() {
    console.log('🚀 Starting comprehensive signup integration tests...\n');
    
    const results = {
      connection: false,
      dataTransformation: null,
      validation: null,
      emailAvailability: null,
      customerRegistration: null,
      transporterRegistration: null,
      stepCompletion: null,
      incompleteValidation: null,
    };

    // 1. Test connection
    results.connection = await this.testConnection();
    if (!results.connection) {
      console.log('❌ Backend connection failed. Make sure your backend is running on http://localhost:5000');
      return results;
    }

    console.log(''); // Add spacing

    // 2. Test data transformation
    results.dataTransformation = await this.testDataTransformation();

    console.log(''); // Add spacing

    // 3. Test validation
    results.validation = await this.testValidation();

    console.log(''); // Add spacing

    // 4. Test email availability
    results.emailAvailability = await this.testEmailAvailability();

    console.log(''); // Add spacing

    // 5. Test step completion
    results.stepCompletion = await this.testStepCompletion();

    console.log(''); // Add spacing

    // 6. Test incomplete validation
    results.incompleteValidation = await this.testIncompleteValidation();

    console.log(''); // Add spacing

    // 7. Test customer registration (only if email is available)
    if (results.emailAvailability?.customer) {
      results.customerRegistration = await this.testCustomerRegistration();
    } else {
      console.log('⏭️ Skipping customer registration (email already exists)');
    }

    console.log(''); // Add spacing

    // 8. Test transporter registration (only if email is available)
    if (results.emailAvailability?.transporter) {
      results.transporterRegistration = await this.testTransporterRegistration();
    } else {
      console.log('⏭️ Skipping transporter registration (email already exists)');
    }

    console.log(''); // Add spacing

    // Summary
    console.log('📊 SIGNUP INTEGRATION TEST SUMMARY:');
    console.log('=====================================');
    console.log(`Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`Data Transformation: ${results.dataTransformation ? '✅' : '❌'}`);
    console.log(`Validation: ${results.validation?.customer.isValid && results.validation?.transporter.isValid ? '✅' : '❌'}`);
    console.log(`Email Availability Check: ${results.emailAvailability ? '✅' : '❌'}`);
    console.log(`Step Completion Tracking: ${results.stepCompletion ? '✅' : '❌'}`);
    console.log(`Incomplete Data Validation: ${results.incompleteValidation && !results.incompleteValidation.isValid ? '✅' : '❌'}`);
    console.log(`Customer Registration: ${results.customerRegistration?.success ? '✅' : results.customerRegistration ? '❌' : '⏭️'}`);
    console.log(`Transporter Registration: ${results.transporterRegistration?.success ? '✅' : results.transporterRegistration ? '❌' : '⏭️'}`);

    const passedTests = [
      results.connection,
      results.dataTransformation,
      results.validation?.customer.isValid && results.validation?.transporter.isValid,
      results.emailAvailability,
      results.stepCompletion,
      results.incompleteValidation && !results.incompleteValidation.isValid,
      results.customerRegistration?.success !== false, // null or true
      results.transporterRegistration?.success !== false, // null or true
    ].filter(Boolean).length;

    const totalTests = 8;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Your signup integration is working correctly.');
    } else if (passedTests >= 6) {
      console.log('✅ Most tests passed. Your signup integration is mostly working correctly.');
    } else {
      console.log('⚠️ Several tests failed. Check the error messages above for details.');
    }

    return results;
  },

  // Development helpers
  async createSampleData(accountType: 'customer' | 'transporter') {
    console.log(`📝 Creating sample ${accountType} data...`);
    const sampleData = signUpService.createSampleSignUpData(accountType);
    console.log('Sample data:', sampleData);
    return sampleData;
  },

  async validateSpecificStep(data: SignUpData, step: number) {
    console.log(`🔍 Validating step ${step} for ${data.accountType}...`);
    const isComplete = signUpService.isStepComplete(data, step);
    console.log(`Step ${step} complete:`, isComplete);
    return isComplete;
  },

  async testApiValidation(data: SignUpData) {
    console.log('🧪 Testing API validation...');
    const apiData = signUpService.transformSignUpDataToApiRequest(data);
    const validation = apiService.validateRegistrationData(apiData);
    console.log('API validation result:', validation);
    return validation;
  },
};

// Export for easy testing
export default signUpTests;

/**
 * HOW TO USE THIS TEST SCRIPT:
 * 
 * 1. Make sure your backend is running:
 *    cd backend && npm run dev
 * 
 * 2. In your React Native app, import and run tests:
 *    import signUpTests from './src/test/SignUpTest';
 *    
 *    // Run individual tests
 *    signUpTests.testConnection();
 *    signUpTests.testCustomerRegistration();
 *    
 *    // Run all tests
 *    signUpTests.runAllTests();
 *    
 *    // Development helpers
 *    signUpTests.createSampleData('customer');
 *    signUpTests.validateSpecificStep(signUpData, 2);
 * 
 * 3. Check console output for test results
 */