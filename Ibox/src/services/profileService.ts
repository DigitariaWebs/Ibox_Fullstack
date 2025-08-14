/**
 * Profile Service Layer
 * 
 * Handles all profile-related API communication including:
 * - User profile data management
 * - Profile picture uploads
 * - User statistics and analytics
 * - Address management
 * - Notification preferences
 */

import apiService from './api';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type Definitions
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  userType: 'customer' | 'transporter' | 'driver';
  dateOfBirth?: string;
  membershipLevel?: 'basic' | 'premium' | 'vip';
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserStatistics {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  totalSaved: number;
  loyaltyPoints: number;
  averageRating: number;
  monthlyOrders: number;
  preferredServices: string[];
  lastOrderDate?: string;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  locationServices: boolean;
  orderUpdates: boolean;
  promotionalOffers: boolean;
  driverMessages: boolean;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  addresses?: UserAddress[];
}

export interface ProfilePictureUpload {
  uri: string;
  type: string;
  name: string;
}

// Profile Service Implementation
class ProfileService {
  private baseUrl = '/users';

  /**
   * Get current user's complete profile data
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiService.makeRequest<UserProfile>(`${this.baseUrl}/profile`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch user profile');
    } catch (error: any) {
      console.error('ProfileService: Get user profile failed', error);
      throw new Error(error.message || 'Unable to load profile data');
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await apiService.makeRequest<UserProfile>(`${this.baseUrl}/profile`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update profile');
    } catch (error: any) {
      console.error('ProfileService: Update profile failed', error);
      throw new Error(error.message || 'Unable to update profile');
    }
  }

  /**
   * Upload and update user's profile picture
   */
  async uploadProfilePicture(imageData: ProfilePictureUpload): Promise<{ profilePicture: string }> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageData.uri,
        type: imageData.type,
        name: imageData.name,
      } as any);

      const response = await apiService.makeRequest<{ profilePicture: string }>(
        '/upload/profile-picture',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.success && response.data) {
        return { profilePicture: response.data.profilePicture };
      }
      throw new Error(response.message || 'Failed to upload profile picture');
    } catch (error: any) {
      console.error('ProfileService: Upload profile picture failed', error);
      throw new Error(error.message || 'Unable to upload profile picture');
    }
  }

  /**
   * Get user statistics and analytics
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await apiService.makeRequest<UserStatistics>(`${this.baseUrl}/statistics`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch user statistics');
    } catch (error: any) {
      console.error('ProfileService: Get user statistics failed', error);
      
      // Return mock data if API fails (fallback for development)
      return {
        totalOrders: 47,
        completedOrders: 44,
        totalSpent: 1250.50,
        totalSaved: 285.75,
        loyaltyPoints: 1250,
        averageRating: 4.8,
        monthlyOrders: 8,
        preferredServices: ['express', 'standard'],
        lastOrderDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Get user's saved addresses
   */
  async getUserAddresses(): Promise<UserAddress[]> {
    try {
      const response = await apiService.makeRequest<UserAddress[]>(`${this.baseUrl}/addresses`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch addresses');
    } catch (error: any) {
      console.error('ProfileService: Get addresses failed', error);
      throw new Error(error.message || 'Unable to load addresses');
    }
  }

  /**
   * Add new address for user
   */
  async addUserAddress(address: Omit<UserAddress, 'id'>): Promise<UserAddress> {
    try {
      const response = await apiService.makeRequest<UserAddress>(`${this.baseUrl}/addresses`, {
        method: 'POST',
        body: JSON.stringify(address),
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to add address');
    } catch (error: any) {
      console.error('ProfileService: Add address failed', error);
      throw new Error(error.message || 'Unable to add address');
    }
  }

  /**
   * Update existing address
   */
  async updateUserAddress(addressId: string, address: Partial<UserAddress>): Promise<UserAddress> {
    try {
      const response = await apiService.makeRequest<UserAddress>(
        `${this.baseUrl}/addresses/${addressId}`,
        {
          method: 'PUT',
          body: JSON.stringify(address),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update address');
    } catch (error: any) {
      console.error('ProfileService: Update address failed', error);
      throw new Error(error.message || 'Unable to update address');
    }
  }

  /**
   * Delete user address
   */
  async deleteUserAddress(addressId: string): Promise<boolean> {
    try {
      const response = await apiService.makeRequest<{}>(`${this.baseUrl}/addresses/${addressId}`, {
        method: 'DELETE',
      });

      return response.success;
    } catch (error: any) {
      console.error('ProfileService: Delete address failed', error);
      throw new Error(error.message || 'Unable to delete address');
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiService.makeRequest<NotificationPreferences>(
        `${this.baseUrl}/preferences/notifications`,
        {
          method: 'GET',
        }
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch notification preferences');
    } catch (error: any) {
      console.error('ProfileService: Get notification preferences failed', error);
      
      // Return default preferences if API fails
      return {
        pushNotifications: true,
        smsNotifications: false,
        emailNotifications: true,
        locationServices: true,
        orderUpdates: true,
        promotionalOffers: false,
        driverMessages: true,
      };
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await apiService.makeRequest<NotificationPreferences>(
        `${this.baseUrl}/preferences/notifications`,
        {
          method: 'PUT',
          body: JSON.stringify(preferences),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update notification preferences');
    } catch (error: any) {
      console.error('ProfileService: Update notification preferences failed', error);
      throw new Error(error.message || 'Unable to update notification preferences');
    }
  }

  /**
   * Get user's order history with pagination
   */
  async getOrderHistory(page = 1, limit = 20): Promise<{
    orders: any[];
    totalOrders: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const response = await apiService.makeRequest<{
        orders: any[];
        totalOrders: number;
        currentPage: number;
        totalPages: number;
      }>(`${this.baseUrl}/orders?page=${page}&limit=${limit}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch order history');
    } catch (error: any) {
      console.error('ProfileService: Get order history failed', error);
      throw new Error(error.message || 'Unable to load order history');
    }
  }

  /**
   * Check if user has completed profile setup
   */
  async isProfileComplete(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      
      // Basic completeness check
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const isComplete = requiredFields.every(field => 
        profile[field as keyof UserProfile] && 
        String(profile[field as keyof UserProfile]).trim() !== ''
      );

      return isComplete;
    } catch (error) {
      console.error('ProfileService: Profile completeness check failed', error);
      return false;
    }
  }

  /**
   * Format user's display name
   */
  formatDisplayName(profile: UserProfile): string {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return profile.email || 'User';
    }
  }

  /**
   * Get membership badge info
   */
  getMembershipInfo(profile: UserProfile): {
    level: string;
    displayName: string;
    color: string;
    icon: string;
  } {
    const level = profile.membershipLevel || 'basic';
    
    const membershipMap = {
      basic: {
        level: 'basic',
        displayName: 'Standard Member',
        color: '#6B7280',
        icon: 'user',
      },
      premium: {
        level: 'premium',
        displayName: 'Premium Client',
        color: '#0AA5A8',
        icon: 'award',
      },
      vip: {
        level: 'vip',
        displayName: 'VIP Member',
        color: '#F59E0B',
        icon: 'crown',
      },
    };

    return membershipMap[level];
  }

  /**
   * Cache profile data locally for offline access
   */
  async cacheProfileData(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to cache profile data:', error);
    }
  }

  /**
   * Get cached profile data
   */
  async getCachedProfileData(): Promise<UserProfile | null> {
    try {
      const cached = await AsyncStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached profile data:', error);
      return null;
    }
  }

  /**
   * Clear cached profile data
   */
  async clearCachedProfileData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cached_profile');
    } catch (error) {
      console.error('Failed to clear cached profile data:', error);
    }
  }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;