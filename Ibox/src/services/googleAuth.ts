import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';
import { GOOGLE_CLIENT_IDS } from '../config/googleAuth';

// Complete the web browser session for OAuth
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResponse {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

class GoogleAuthService {
  private useProxy: boolean;

  constructor() {
    // Use proxy for Expo Go, false for standalone apps
    this.useProxy = __DEV__;
  }

  /**
   * Get the appropriate redirect URI based on the platform
   */
  private getRedirectUri() {
    return makeRedirectUri({
      scheme: 'ibox', // Your app's custom scheme
      useProxy: this.useProxy,
    });
  }

  /**
   * Initialize Google authentication request
   */
  async initializeGoogleAuth() {
    try {
      const redirectUri = this.getRedirectUri();
      console.log('🔗 Redirect URI:', redirectUri);

      const request = Google.useAuthRequest({
        expoClientId: GOOGLE_CLIENT_IDS.expoClient,
        iosClientId: GOOGLE_CLIENT_IDS.iosClient,
        androidClientId: GOOGLE_CLIENT_IDS.androidClient,
        webClientId: GOOGLE_CLIENT_IDS.webClient,
        scopes: ['profile', 'email'],
        redirectUri,
      });

      return request;
    } catch (error) {
      console.error('❌ Google auth initialization error:', error);
      throw error;
    }
  }

  /**
   * Handle Google sign-in with backend integration
   */
  async signInWithGoogle(
    idToken: string, 
    userType: 'customer' | 'transporter' = 'customer',
    additionalData?: { phone?: string; language?: string }
  ): Promise<GoogleAuthResponse> {
    try {
      console.log('🔑 Signing in with Google...');

      // Send the ID token to your backend
      const response = await fetch(`${apiService.getConfig().baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userType,
          ...additionalData,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Store tokens
        const { tokens, user } = data.data;
        await apiService.storeTokens(tokens.accessToken, tokens.refreshToken);
        
        console.log('✅ Google sign-in successful:', user.email);
        
        return {
          success: true,
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      } else {
        throw new Error(data.message || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed',
      };
    }
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const accessToken = await apiService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${apiService.getConfig().baseUrl}/auth/google/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Firebase-Token': idToken,
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Google account linked successfully');
        return {
          success: true,
          user: data.data.user,
        };
      } else {
        throw new Error(data.message || 'Failed to link Google account');
      }
    } catch (error) {
      console.error('❌ Google account linking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link Google account',
      };
    }
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(): Promise<GoogleAuthResponse> {
    try {
      const accessToken = await apiService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${apiService.getConfig().baseUrl}/auth/google/unlink`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Google account unlinked successfully');
        return { success: true };
      } else {
        throw new Error(data.message || 'Failed to unlink Google account');
      }
    } catch (error) {
      console.error('❌ Google account unlinking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink Google account',
      };
    }
  }

  /**
   * Complete Google profile for users who need additional info
   */
  async completeGoogleProfile(profileData: {
    phone?: string;
    userType?: 'customer' | 'transporter';
    addresses?: any[];
    businessDetails?: any;
    transporterDetails?: any;
  }): Promise<GoogleAuthResponse> {
    try {
      const accessToken = await apiService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${apiService.getConfig().baseUrl}/auth/google/complete-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Profile completed successfully');
        return {
          success: true,
          user: data.data.user,
        };
      } else {
        throw new Error(data.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('❌ Profile completion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete profile',
      };
    }
  }

  /**
   * Check if user has Google account linked
   */
  async hasGoogleLinked(): Promise<boolean> {
    try {
      const user = await apiService.getCurrentUser();
      return !!(user && (user.googleId || user.firebaseUid));
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

export default googleAuthService;

// Export types
export type { GoogleAuthResponse };