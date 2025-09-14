import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { discoverBackendUrl, getCachedServerUrl, clearServerCache } from '../config/network';

// API Configuration with Automatic Discovery
let API_CONFIG = {
  BASE_URL: '',  // Will be set dynamically
  TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 3,
};

// Initialize the base URL
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the API configuration with automatic discovery
 */
async function initializeApiConfig() {
  if (isInitialized && API_CONFIG.BASE_URL) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const url = await discoverBackendUrl();
      API_CONFIG.BASE_URL = url;
      isInitialized = true;
      console.log('🚀 API initialized with URL:', url);
    } catch (error) {
      console.error('Failed to initialize API:', error);
      // Fallback URL
      API_CONFIG.BASE_URL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:5000/api/v1'
        : 'http://192.168.1.12:5000/api/v1';
    }
  })();

  return initializationPromise;
}

// Storage keys for tokens
const TOKEN_KEYS = {
  ACCESS_TOKEN: '@ibox:accessToken',
  REFRESH_TOKEN: '@ibox:refreshToken',
  TOKEN_EXPIRES_AT: '@ibox:tokenExpiresAt',
};

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: 'customer' | 'transporter';
  language?: string;
}

interface AdvancedRegisterRequest extends RegisterRequest {
  // Address information
  addresses?: Array<{
    address: string;
    type: 'primary' | 'secondary';
    coordinates?: { lat: number; lng: number };
  }>;
  
  // Customer-specific data
  isBusiness?: boolean;
  businessDetails?: {
    companyName: string;
    taxId: string;
  };
  
  // Transporter-specific data
  transporterDetails?: {
    vehicleType: string;
    licensePlate: string;
    payloadCapacity: number;
    licenseNumber?: string;
    licenseExpiry?: string;
    insuranceNumber?: string;
    vehiclePhotos?: string[];  // URLs of uploaded vehicle photos
    licenseDocument?: string;  // URL of uploaded license document
    insuranceDocument?: string; // URL of uploaded insurance document
  };
  
  // Banking information (for transporters)
  bankingInfo?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    chequeImage?: string;  // URL of uploaded cheque image
  };
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    userType: 'customer' | 'transporter';
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    language: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'customer' | 'transporter';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryCount: number;

  constructor() {
    // Will be initialized dynamically
    this.baseUrl = '';
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryCount = API_CONFIG.RETRY_COUNT;
    
    // Initialize on first use
    this.ensureInitialized();
  }

  private async ensureInitialized() {
    await initializeApiConfig();
    this.baseUrl = API_CONFIG.BASE_URL;
    console.log('🌐 API Service initialized with URL:', this.baseUrl);
    console.log('📱 Platform:', Platform.OS);
  }

  /**
   * Get current configuration for external use
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl || API_CONFIG.BASE_URL,
      timeout: this.timeout,
      retryCount: this.retryCount,
    };
  }

  /**
   * Force re-discovery of backend URL (useful after network changes)
   */
  async rediscoverBackend() {
    clearServerCache();
    isInitialized = false;
    initializationPromise = null;
    await this.ensureInitialized();
    return this.baseUrl;
  }

  // Token Management
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Calculate token expiration (24 hours from now)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString()),
      ]);

      console.log('✅ Tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRES_AT),
      ]);

      console.log('🗑️ Tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await AsyncStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRES_AT);
      if (!expiresAt) return true;

      const expirationTime = parseInt(expiresAt);
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return now >= (expirationTime - bufferTime);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // HTTP Request Helper
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    withAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    // Ensure API is initialized before making request
    await this.ensureInitialized();
    
    let attempt = 0;
    
    while (attempt < this.retryCount) {
      try {
        // Prepare headers
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        };

        // Add authentication header if required
        if (withAuth) {
          const accessToken = await this.getAccessToken();
          if (accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
          }
        }

        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: ApiResponse<T>;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          data = {
            success: response.ok,
            message: response.ok ? 'Request successful' : text || 'Request failed',
            data: response.ok ? (text as unknown as T) : undefined,
          };
        }

        // Handle token refresh if needed
        if (response.status === 401 && withAuth && attempt === 0) {
          console.log('🔄 Access token expired, attempting refresh...');
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            attempt++;
            continue; // Retry with new token
          }
        }

        // Log response for debugging in development
        if (__DEV__) {
          console.log(`📡 API ${options.method || 'GET'} ${endpoint}:`, {
            status: response.status,
            success: data.success,
            message: data.message,
            errors: data.errors || undefined,
          });
        }

        return data;
      } catch (error) {
        attempt++;
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('❌ Request timeout:', endpoint);
        } else if (error instanceof TypeError && error.message === 'Network request failed') {
          console.error('❌ Network error:', endpoint);
        } else {
          console.error('❌ Request error:', endpoint, error);
        }

        // If this is the last attempt or a non-retryable error, throw
        if (attempt >= this.retryCount || (error instanceof Error && error.name === 'AbortError')) {
          throw new Error(
            error instanceof Error 
              ? error.message 
              : 'Network request failed. Please check your connection.'
          );
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retry attempts reached');
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🔑 Login request with:', { email: credentials.email, password: '***' });
    
    const response = await this.makeRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);

    console.log('🔑 Login response structure:', {
      success: response.success,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      message: response.message
    });

    if (response.success && response.data) {
      // Check if the response has the expected structure
      if (response.data.tokens) {
        // New structure with nested tokens
        const { user, tokens } = response.data;
        await this.storeTokens(tokens.accessToken, tokens.refreshToken);
        return {
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        };
      } else if (response.data.accessToken) {
        // Old structure with direct tokens
        await this.storeTokens(response.data.accessToken, response.data.refreshToken);
        return response.data;
      } else {
        console.error('🔑 Unexpected login response structure:', response.data);
        throw new Error('Invalid response structure from login API');
      }
    }

    throw new Error(response.message || 'Login failed');
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Debug logging
    console.log('🔍 Registration data being sent:', JSON.stringify(userData, null, 2));
    
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);

    if (response.success && response.data) {
      // Support both nested and flat token structures
      const data: any = response.data as any;
      const accessToken = data.tokens?.accessToken || data.accessToken;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const user = data.user || data.userData || null;

      if (accessToken && refreshToken) {
        await this.storeTokens(accessToken, refreshToken);
        return { user, accessToken, refreshToken } as AuthResponse;
      }
    }

    // Log detailed error information
    console.error('🚨 Registration failed with response:', JSON.stringify(response, null, 2));
    throw new Error(response.message || 'Registration failed');
  }

  // Advanced registration with additional profile data
  async registerAdvanced(userData: AdvancedRegisterRequest): Promise<AuthResponse> {
    // Debug logging
    console.log('🔍 Advanced registration data being sent:', JSON.stringify(userData, null, 2));
    
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);

    if (response.success && response.data) {
      const data: any = response.data as any;
      const accessToken = data.tokens?.accessToken || data.accessToken;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const user = data.user || data.userData || null;

      if (accessToken && refreshToken) {
        await this.storeTokens(accessToken, refreshToken);
        return { user, accessToken, refreshToken } as AuthResponse;
      }
    }

    // Log detailed error information
    console.error('🚨 Advanced registration failed with response:', JSON.stringify(response, null, 2));
    throw new Error(response.message || 'Registration failed');
  }

  // Check if email is available
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ available: boolean }>('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false);

      return response.success && response.data?.available === true;
    } catch (error) {
      console.error('Email availability check error:', error);
      return false;
    }
  }

  // Validate registration data before submitting
  validateRegistrationData(userData: AdvancedRegisterRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!userData.firstName?.trim()) errors.push('First name is required');
    if (!userData.lastName?.trim()) errors.push('Last name is required');
    if (!userData.email?.trim()) errors.push('Email is required');
    if (!userData.phone?.trim()) errors.push('Phone number is required');
    if (!userData.password?.trim()) errors.push('Password is required');
    if (!userData.userType) errors.push('Account type is required');

    // Email validation
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (userData.password && userData.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    // Phone validation (basic)
    if (userData.phone && userData.phone.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }

    // Transporter-specific validation
    if (userData.userType === 'transporter') {
      if (!userData.transporterDetails?.vehicleType) {
        errors.push('Vehicle type is required for transporters');
      }
      if (!userData.transporterDetails?.licensePlate) {
        errors.push('License plate is required for transporters');
      }
      if (!userData.transporterDetails?.payloadCapacity || userData.transporterDetails.payloadCapacity <= 0) {
        errors.push('Valid payload capacity is required for transporters');
      }
    }

    // Business validation for customers
    if (userData.userType === 'customer' && userData.isBusiness) {
      if (!userData.businessDetails?.companyName) {
        errors.push('Company name is required for business accounts');
      }
      if (!userData.businessDetails?.taxId) {
        errors.push('Tax ID is required for business accounts');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local tokens
      await this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      const response = await this.makeRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }, false);

      if (response.success && response.data) {
        await this.storeTokens(response.data.accessToken, response.data.refreshToken);
        console.log('✅ Token refreshed successfully');
        return true;
      }

      console.log('❌ Token refresh failed:', response.message);
      await this.clearTokens(); // Clear invalid tokens
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await this.clearTokens(); // Clear invalid tokens
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest<any>('/auth/me', {
      method: 'GET',
    });

    if (response.success && response.data) {
      // The backend returns data.user, not just data
      return response.data.user || response.data;
    }

    throw new Error(response.message || 'Failed to get current user');
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.makeRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update profile');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await this.makeRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }

  // Orders API
  async getOrders(options?: {
    page?: number;
    limit?: number;
    status?: string;
    serviceType?: string;
  }): Promise<{
    orders: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (options?.page) queryParams.append('page', options.page.toString());
    if (options?.limit) queryParams.append('limit', options.limit.toString());
    if (options?.status) queryParams.append('status', options.status);
    if (options?.serviceType) queryParams.append('serviceType', options.serviceType);

    const url = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest<any>(url, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        orders: response.data.orders || [],
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        }
      };
    }

    throw new Error(response.message || 'Failed to fetch orders');
  }

  async getOrderById(orderId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/orders/${orderId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.order;
    }

    throw new Error(response.message || 'Failed to fetch order details');
  }

  async getOrderTracking(orderId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/orders/${orderId}/tracking`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.tracking;
    }

    throw new Error(response.message || 'Failed to fetch tracking information');
  }

  // Profile API methods
  async getUserProfile(): Promise<any> {
    const response = await this.makeRequest<any>('/users/profile', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to fetch user profile');
  }

  async getUserStats(): Promise<any> {
    const response = await this.makeRequest<any>('/users/stats', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.stats;
    }

    throw new Error(response.message || 'Failed to fetch user statistics');
  }

  async updateUserProfile(updates: any): Promise<any> {
    const response = await this.makeRequest<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      return response.data.user;
    }

    // Include validation errors in the error message
    let errorMessage = response.message || 'Failed to update profile';
    if (response.errors && response.errors.length > 0) {
      const validationErrors = response.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      errorMessage += ` - ${validationErrors}`;
    }

    throw new Error(errorMessage);
  }

  async updateTransporterDetails(updates: any): Promise<any> {
    const response = await this.makeRequest<any>('/users/transporter-details', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      return response.data.transporterDetails;
    }

    // Include validation errors in the error message
    let errorMessage = response.message || 'Failed to update transporter details';
    if (response.errors && response.errors.length > 0) {
      const validationErrors = response.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      errorMessage += ` - ${validationErrors}`;
    }

    throw new Error(errorMessage);
  }

  // Address Management Methods
  async getUserAddresses(): Promise<any[]> {
    const response = await this.makeRequest<any>('/users/addresses', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.addresses || [];
    }

    throw new Error(response.message || 'Failed to fetch addresses');
  }

  async addUserAddress(address: {
    type: 'primary' | 'secondary' | 'work' | 'other';
    address: string;
    coordinates?: { lat: number; lng: number };
    contactPerson?: string;
    contactPhone?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const response = await this.makeRequest<any>('/users/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });

    if (response.success && response.data) {
      return response.data.address;
    }

    // Include validation errors in the error message
    let errorMessage = response.message || 'Failed to add address';
    if (response.errors && response.errors.length > 0) {
      const validationErrors = response.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      errorMessage += ` - ${validationErrors}`;
    }

    throw new Error(errorMessage);
  }

  async updateUserAddress(addressId: string, address: {
    type?: 'primary' | 'secondary' | 'work' | 'other';
    address?: string;
    coordinates?: { lat: number; lng: number };
    contactPerson?: string;
    contactPhone?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const response = await this.makeRequest<any>(`/users/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });

    if (response.success && response.data) {
      return response.data.address;
    }

    // Include validation errors in the error message
    let errorMessage = response.message || 'Failed to update address';
    if (response.errors && response.errors.length > 0) {
      const validationErrors = response.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      errorMessage += ` - ${validationErrors}`;
    }

    throw new Error(errorMessage);
  }

  async deleteUserAddress(addressId: string): Promise<boolean> {
    const response = await this.makeRequest<any>(`/users/addresses/${addressId}`, {
      method: 'DELETE',
    });

    return response.success;
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);

    if (!response.success) {
      throw new Error(response.message || 'Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }, false);

    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  // Notification API methods
  async getNotifications(options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    unreadCount: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (options?.page) queryParams.append('page', options.page.toString());
    if (options?.limit) queryParams.append('limit', options.limit.toString());
    if (options?.unreadOnly) queryParams.append('unreadOnly', 'true');

    const url = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest<any>(url, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        notifications: response.data.notifications || [],
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        },
        unreadCount: response.data.unreadCount || 0,
      };
    }

    throw new Error(response.message || 'Failed to fetch notifications');
  }

  async getUnreadNotificationCount(): Promise<number> {
    const response = await this.makeRequest<any>('/notifications/unread-count', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data.unreadCount || 0;
    }

    return 0;
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const response = await this.makeRequest<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });

    return response.success;
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    const response = await this.makeRequest<any>('/notifications/mark-all-read', {
      method: 'PATCH',
    });

    return response.success;
  }

  async sendTestNotification(type: 'order' | 'delivery' | 'promotion' | 'system', message: string): Promise<boolean> {
    const response = await this.makeRequest<any>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type, message }),
    });

    return response.success;
  }

  // File Upload Methods
  async uploadFile(fileUri: string, category: 'profile' | 'documents' | 'vehicle' | 'cheque'): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      // Ensure API is initialized
      await this.ensureInitialized();
      
      console.log(`📤 Uploading file from ${fileUri} to category: ${category}`);
      
      // Create form data
      const formData = new FormData();
      
      // Get file info from URI
      const filename = fileUri.split('/').pop() || 'file.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Append file to form data
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type,
      } as any);
      
      formData.append('category', category);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Make upload request
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/api/v1/upload/${category === 'profile' ? 'profile-picture' : category === 'documents' ? 'documents' : 'order-photos'}`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          // Don't set Content-Type - let fetch set it with boundary for multipart
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ File uploaded successfully: ${data.data?.url || data.data?.filename}`);
        return {
          success: true,
          url: data.data?.url || data.data?.filename,
        };
      } else {
        console.error(`❌ Upload failed: ${data.message}`);
        return {
          success: false,
          message: data.message || 'Upload failed',
        };
      }
    } catch (error) {
      console.error('❌ File upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async uploadMultipleFiles(fileUris: string[], category: 'profile' | 'documents' | 'vehicle' | 'cheque'): Promise<{
    success: boolean;
    urls?: string[];
    message?: string;
  }> {
    try {
      const uploadPromises = fileUris.map(uri => this.uploadFile(uri, category));
      const results = await Promise.all(uploadPromises);
      
      const allSuccessful = results.every(r => r.success);
      const urls = results.filter(r => r.url).map(r => r.url!);
      
      if (allSuccessful) {
        return {
          success: true,
          urls,
        };
      } else {
        const failedCount = results.filter(r => !r.success).length;
        return {
          success: false,
          urls, // Return successfully uploaded URLs even if some failed
          message: `${failedCount} file(s) failed to upload`,
        };
      }
    } catch (error) {
      console.error('❌ Multiple file upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Google Authentication (TODO: Implement with Firebase)
  async googleLogin(idToken: string): Promise<AuthResponse> {
    // TODO: Implement Google login with Firebase ID token
    throw new Error('Google login not implemented yet');
  }

  // Public method for external services that need to make requests
  async publicRequest<T>(
    endpoint: string,
    options: RequestInit & { headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // This is a public wrapper around the private makeRequest
    return this.makeRequest<T>(endpoint, options, true);
  }

  // OTP endpoints (no direct Postmark on frontend; call backend)
  async sendOTP(email: string, firstName?: string) {
    return this.makeRequest<any>(`/auth/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, firstName })
    }, false);
  }

  async verifyOTP(email: string, otp: string) {
    return this.makeRequest<any>(`/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    }, false);
  }

  async completeRegistration(payload: any & { email: string; otp: string }) {
    return this.makeRequest<any>(`/auth/complete-registration`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, false);
  }

  // Utility Methods
  async checkConnection(): Promise<boolean> {
    try {
      // Ensure API is initialized
      await this.ensureInitialized();
      
      // Create timeout promise for React Native compatibility
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      const fetchPromise = fetch(`${this.baseUrl.replace('/api/v1', '')}/health`, {
        method: 'GET',
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      return response.ok;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Update API base URL (useful for switching between development/production)
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log('🔄 API base URL updated to:', url);
  }

  // Get current configuration
  // (method defined earlier in the class to avoid duplication)
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export types for use in components
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AdvancedRegisterRequest,
  AuthResponse,
  User,
};