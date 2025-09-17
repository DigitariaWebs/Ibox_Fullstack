/**
 * Custom API Error class that preserves structured error information
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly errors?: any;
  public readonly success: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    errors?: any,
    success: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.success = success;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if this is a specific error code
   */
  isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if this is a phone number error
   */
  isPhoneError(): boolean {
    return this.code === 'PHONE_EXISTS' || 
           this.message.toLowerCase().includes('phone');
  }

  /**
   * Check if this is an email error
   */
  isEmailError(): boolean {
    return this.code === 'EMAIL_EXISTS' || 
           this.message.toLowerCase().includes('email');
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' || 
           this.status === 422 ||
           this.status === 400 ||
           this.message.toLowerCase().includes('validation');
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return this.status === 0 || 
           this.status >= 500 ||
           this.message.toLowerCase().includes('network') ||
           this.message.toLowerCase().includes('connection');
  }

  /**
   * Get a user-friendly error message based on the error type
   */
  getUserFriendlyMessage(): string {
    if (this.isPhoneError()) {
      return 'This phone number is already registered. Please use a different number or sign in.';
    }
    
    if (this.isEmailError()) {
      return 'This email is already registered. Please use a different email or sign in.';
    }
    
    if (this.isNetworkError()) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (this.isValidationError()) {
      return 'Please check your information and try again.';
    }
    
    // Return original message as fallback
    return this.message || 'An error occurred. Please try again.';
  }

  /**
   * Get field-specific error message
   */
  getFieldError(field: 'phone' | 'email' | 'password' | 'firstName' | 'lastName'): string {
    switch (field) {
      case 'phone':
        if (this.isCode('PHONE_EXISTS')) {
          return 'A user already exists with this phone number';
        }
        if (this.isCode('INVALID_PHONE')) {
          return 'Please enter a valid phone number';
        }
        break;
        
      case 'email':
        if (this.isCode('EMAIL_EXISTS')) {
          return 'A user already exists with this email';
        }
        if (this.isCode('INVALID_EMAIL')) {
          return 'Please enter a valid email address';
        }
        break;
        
      default:
        break;
    }
    
    return '';
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      errors: this.errors,
      success: this.success,
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}
