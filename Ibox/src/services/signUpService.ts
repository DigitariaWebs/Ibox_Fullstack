import apiService, { AdvancedRegisterRequest } from './api';
import { SignUpData } from '../contexts/SignUpContext';

/**
 * SignUp Service
 * 
 * Handles the transformation of SignUpContext data to API-compatible format
 * and provides utilities for the signup flow integration.
 */

class SignUpService {
  /**
   * Transform SignUpContext data to API registration request format
   */
  transformSignUpDataToApiRequest(signUpData: SignUpData): AdvancedRegisterRequest {
    // Basic required fields
    const baseData: AdvancedRegisterRequest = {
      firstName: signUpData.firstName || '',
      lastName: signUpData.lastName || '',
      email: signUpData.email || '',
      phone: signUpData.phone || '',
      password: signUpData.password || '',
      userType: signUpData.accountType || 'customer',
      language: signUpData.language || 'en',
    };

    // Add addresses
    const addresses: Array<{ address: string; type: 'primary' | 'secondary'; coordinates?: { lat: number; lng: number } }> = [];
    
    if (signUpData.defaultAddress) {
      addresses.push({
        address: signUpData.defaultAddress,
        type: 'primary',
      });
    }
    
    if (signUpData.secondaryAddress) {
      addresses.push({
        address: signUpData.secondaryAddress,
        type: 'secondary',
      });
    }
    
    if (addresses.length > 0) {
      baseData.addresses = addresses;
    }

    // Customer-specific data
    if (signUpData.accountType === 'customer') {
      baseData.isBusiness = signUpData.isBusiness || false;
      
      if (signUpData.isBusiness) {
        baseData.businessDetails = {
          companyName: signUpData.companyName || '',
          taxId: signUpData.taxId || '',
        };
      }
    }

    // Transporter-specific data
    if (signUpData.accountType === 'transporter') {
      baseData.transporterDetails = {
        vehicleType: signUpData.vehicleType || '',
        licensePlate: signUpData.plate || '',
        payloadCapacity: signUpData.payloadKg || 0,
        licenseExpiry: signUpData.licenseExpiry,
      };

      // Add banking information if available
      if (signUpData.bankIban || signUpData.bankAccount) {
        baseData.bankingInfo = {
          bankName: 'N/A', // Not collected in current flow
          accountNumber: signUpData.bankAccount || signUpData.bankIban || '',
          routingNumber: signUpData.bankRouting || '',
          accountHolderName: signUpData.bankHolder || `${signUpData.firstName} ${signUpData.lastName}`,
        };
      }
    }

    return baseData;
  }

  /**
   * Validate signup data before submission
   */
  validateSignUpData(signUpData: SignUpData): { isValid: boolean; errors: string[]; missingSteps: number[] } {
    const errors: string[] = [];
    const missingSteps: number[] = [];

    // Step 1: Account type
    if (!signUpData.accountType) {
      errors.push('Please select your account type');
      missingSteps.push(1);
    }

    // Step 2: Personal information
    if (!signUpData.firstName?.trim()) {
      errors.push('First name is required');
      missingSteps.push(2);
    }
    if (!signUpData.lastName?.trim()) {
      errors.push('Last name is required');
      missingSteps.push(2);
    }
    if (!signUpData.email?.trim()) {
      errors.push('Email is required');
      missingSteps.push(2);
    }
    if (!signUpData.phone?.trim()) {
      errors.push('Phone number is required');
      missingSteps.push(2);
    }
    if (!signUpData.password?.trim()) {
      errors.push('Password is required');
      missingSteps.push(2);
    }
    if (!signUpData.legalAccepted) {
      errors.push('You must accept the terms and conditions');
      missingSteps.push(2);
    }

    // Step 3: Address information
    if (!signUpData.defaultAddress?.trim()) {
      errors.push('Primary address is required');
      missingSteps.push(3);
    }
    if (!signUpData.language) {
      errors.push('Language preference is required');
      missingSteps.push(3);
    }

    // Account-specific validation
    if (signUpData.accountType === 'customer') {
      // Customer business validation
      if (signUpData.isBusiness) {
        if (!signUpData.companyName?.trim()) {
          errors.push('Company name is required for business accounts');
          missingSteps.push(4);
        }
        if (!signUpData.taxId?.trim()) {
          errors.push('Tax ID is required for business accounts');
          missingSteps.push(4);
        }
      }
    } else if (signUpData.accountType === 'transporter') {
      // Transporter vehicle validation
      if (!signUpData.vehicleType) {
        errors.push('Vehicle type is required');
        missingSteps.push(4);
      }
      if (!signUpData.plate?.trim()) {
        errors.push('License plate is required');
        missingSteps.push(4);
      }
      if (!signUpData.payloadKg || signUpData.payloadKg <= 0) {
        errors.push('Valid payload capacity is required');
        missingSteps.push(4);
      }

      // License and compliance validation
      if (!signUpData.licenseImages || signUpData.licenseImages.length === 0) {
        errors.push('Driver\'s license photo is required');
        missingSteps.push(5);
      }
      if (!signUpData.insuranceDoc) {
        errors.push('Insurance document is required');
        missingSteps.push(5);
      }
      if (!signUpData.bgCheckConsent) {
        errors.push('Background check consent is required');
        missingSteps.push(5);
      }

      // Banking information validation
      if (!signUpData.bankIban && !signUpData.bankAccount) {
        errors.push('Banking information is required');
        missingSteps.push(6);
      }
      if (!signUpData.bankHolder?.trim()) {
        errors.push('Account holder name is required');
        missingSteps.push(6);
      }
    }

    // Remove duplicate missing steps
    const uniqueMissingSteps = [...new Set(missingSteps)].sort();

    return {
      isValid: errors.length === 0,
      errors,
      missingSteps: uniqueMissingSteps,
    };
  }

  /**
   * Register user with the backend API
   */
  async registerUser(signUpData: SignUpData): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Validate data first
      const validation = this.validateSignUpData(signUpData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Registration incomplete: ${validation.errors.join(', ')}`,
        };
      }

      // Transform data to API format
      const apiData = this.transformSignUpDataToApiRequest(signUpData);

      // Fix phone number format and validate length
      if (apiData.phone) {
        // Remove any spaces or special characters except +
        let cleanPhone = apiData.phone.replace(/[^\d+]/g, '');
        
        // Fix common issues with phone numbers
        if (cleanPhone.startsWith('+213')) {
          // Algeria: +213 followed by 9 digits (total 13 characters)
          const algeriaPart = cleanPhone.substring(4); // Get part after +213
          
          // Remove common prefixes that get duplicated (05, 06, 07)
          if (algeriaPart.startsWith('05') || algeriaPart.startsWith('06') || algeriaPart.startsWith('07')) {
            // Keep only 8 digits after the mobile prefix
            const mobilePrefix = algeriaPart.substring(0, 2);
            const mobileNumber = algeriaPart.substring(2, 10); // Take next 8 digits
            cleanPhone = `+213${mobilePrefix}${mobileNumber}`;
          } else if (algeriaPart.length > 9) {
            // If too long, take only first 9 digits
            cleanPhone = `+213${algeriaPart.substring(0, 9)}`;
          } else if (algeriaPart.length < 9) {
            // If too short, this might be an invalid number - let backend handle it
            cleanPhone = `+213${algeriaPart}`;
          }
        } else if (cleanPhone.startsWith('+1')) {
          // US/Canada: +1 followed by 10 digits
          const northAmericaPart = cleanPhone.substring(2);
          if (northAmericaPart.length > 10) {
            cleanPhone = `+1${northAmericaPart.substring(0, 10)}`;
          }
        } else if (cleanPhone.startsWith('+33')) {
          // France: +33 followed by 9 digits
          const francePart = cleanPhone.substring(3);
          if (francePart.length > 9) {
            cleanPhone = `+33${francePart.substring(0, 9)}`;
          }
        }
        
        apiData.phone = cleanPhone;
        console.log('📱 Cleaned phone number:', apiData.phone);
      }

      // Validate API data format
      const apiValidation = apiService.validateRegistrationData(apiData);
      if (!apiValidation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${apiValidation.errors.join(', ')}`,
        };
      }

      // Check email availability
      const emailAvailable = await apiService.checkEmailAvailability(apiData.email);
      if (!emailAvailable) {
        return {
          success: false,
          message: 'Email address is already registered. Please use a different email or try logging in.',
        };
      }

      // Handle file uploads for transporters BEFORE registration
      if (signUpData.accountType === 'transporter') {
        console.log('📤 Uploading transporter documents...');
        
        // Note: Currently, file uploads are handled after registration
        // The backend will store file paths as references
        // In a production app, you'd upload files first and store URLs
        console.log('📝 Transporter has documents to upload:', {
          vehiclePhotos: signUpData.vehiclePhotos?.length || 0,
          licenseImage: !!signUpData.licenseImage,
          insuranceDoc: !!signUpData.insuranceDoc,
          chequeImage: !!signUpData.chequeImage
        });
      }

      // Register with backend
      const authResponse = await apiService.registerAdvanced(apiData);

      return {
        success: true,
        message: 'Registration successful!',
        user: authResponse.user,
      };

    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle specific error types
      let errorMessage = 'Registration failed. Please try again.';

      if (error.message.includes('Email already exists')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('validation')) {
        errorMessage = `Validation error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Check if signup data is complete for a specific step
   */
  isStepComplete(signUpData: SignUpData, step: number): boolean {
    switch (step) {
      case 1: // Account type
        return !!signUpData.accountType;

      case 2: // Personal information
        return !!(
          signUpData.firstName?.trim() &&
          signUpData.lastName?.trim() &&
          signUpData.email?.trim() &&
          signUpData.phone?.trim() &&
          signUpData.password?.trim() &&
          signUpData.legalAccepted
        );

      case 3: // Address and locale
        return !!(
          signUpData.defaultAddress?.trim() &&
          signUpData.language
        );

      case 4: // Account-specific details
        if (signUpData.accountType === 'customer') {
          // Customer step is always complete (payment is optional)
          if (signUpData.isBusiness) {
            return !!(signUpData.companyName?.trim() && signUpData.taxId?.trim());
          }
          return true;
        } else if (signUpData.accountType === 'transporter') {
          // Transporter vehicle info
          return !!(
            signUpData.vehicleType &&
            signUpData.plate?.trim() &&
            signUpData.payloadKg && signUpData.payloadKg > 0
          );
        }
        return false;

      case 5: // Transporter compliance
        if (signUpData.accountType === 'transporter') {
          return !!(
            signUpData.licenseImages && signUpData.licenseImages.length > 0 &&
            signUpData.insuranceDoc &&
            signUpData.bgCheckConsent
          );
        }
        return true; // Not applicable for customers

      case 6: // Transporter banking
        if (signUpData.accountType === 'transporter') {
          return !!(
            (signUpData.bankIban || signUpData.bankAccount) &&
            signUpData.bankHolder?.trim()
          );
        }
        return true; // Not applicable for customers

      case 7: // Confirmation
        return !!signUpData.confirmAll;

      default:
        return false;
    }
  }

  /**
   * Get completion percentage for progress tracking
   */
  getCompletionPercentage(signUpData: SignUpData): number {
    const totalSteps = signUpData.accountType === 'customer' ? 4 : 7; // Customers have fewer steps
    const applicableSteps = signUpData.accountType === 'customer' 
      ? [1, 2, 3, 4] // Account type, personal info, address, customer extras
      : [1, 2, 3, 4, 5, 6, 7]; // All steps for transporters

    const completedSteps = applicableSteps.filter(step => this.isStepComplete(signUpData, step)).length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Get next incomplete step
   */
  getNextIncompleteStep(signUpData: SignUpData): number | null {
    const maxSteps = signUpData.accountType === 'customer' ? 4 : 7;
    
    for (let step = 1; step <= maxSteps; step++) {
      if (!this.isStepComplete(signUpData, step)) {
        return step;
      }
    }
    
    return null; // All steps complete
  }

  /**
   * Development helper: Create sample data for testing
   */
  createSampleSignUpData(accountType: 'customer' | 'transporter'): SignUpData {
    const baseData: SignUpData = {
      accountType,
      firstName: 'Test',
      lastName: 'User',
      email: `test.${accountType}@ibox.com`,
      phone: '+1234567890',
      password: 'TestPassword123',
      legalAccepted: true,
      defaultAddress: '123 Main Street, Toronto, ON M5V 3A8',
      language: 'en',
      currentStep: 0,
      isCompleted: false,
    };

    if (accountType === 'customer') {
      return {
        ...baseData,
        isBusiness: false,
        paymentData: null,
        confirmAll: true,
      };
    } else {
      return {
        ...baseData,
        vehicleType: 'van',
        plate: 'ABC123',
        payloadKg: 1000,
        vehiclePhotos: ['sample_photo.jpg'],
        licenseImages: ['license.jpg'],
        licenseExpiry: '2025-12-31',
        insuranceDoc: 'insurance.pdf',
        bgCheckConsent: true,
        bankIban: 'CA89370400440532013001',
        bankHolder: 'Test User',
        confirmAll: true,
      };
    }
  }
}

// Create singleton instance
const signUpService = new SignUpService();

export default signUpService;