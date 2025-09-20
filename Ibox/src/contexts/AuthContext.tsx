import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { User, LoginRequest, RegisterRequest, AuthResponse } from '../services/api';
import socketService from '../services/socketService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: User | null;
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  googleLogin: (googleUserData: any) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  IS_AUTHENTICATED: '@ibox:isAuthenticated',
  HAS_COMPLETED_ONBOARDING: '@ibox:hasCompletedOnboarding',
  USER_DATA: '@ibox:userData',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Load cached auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check connection to backend
      await checkConnection();
      
      // Check for active Supabase session first
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          console.log('🔐 Found active Supabase session, clearing it...');
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.log('⚠️ Supabase session check error:', error);
      }
      
      // Load cached auth state
      const [
        cachedHasCompletedOnboarding,
        cachedUserData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      // Check if we have tokens and they're valid
      const accessToken = await apiService.getAccessToken();
      const isTokenExpired = await apiService.isTokenExpired();

      if (accessToken && !isTokenExpired) {
        try {
          // Verify token by fetching current user
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Update cached user data
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
          
          // Initialize WebSocket connection
          if (accessToken) {
            await socketService.connect(currentUser._id, currentUser.userType, accessToken);
            console.log('🔌 WebSocket connected on app start');
          }
          
          console.log('🔐 User authenticated with valid token:', currentUser.email);
        } catch (error) {
          console.log('❌ Token validation failed, clearing auth state');
          await apiService.clearTokens();
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else if (accessToken && isTokenExpired) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await apiService.refreshAccessToken();
        if (refreshed) {
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
            
            // Initialize WebSocket connection after token refresh
            const newAccessToken = await apiService.getAccessToken();
            if (newAccessToken) {
              await socketService.connect(currentUser._id, currentUser.userType, newAccessToken);
              console.log('🔌 WebSocket reconnected after token refresh');
            }
            
            console.log('✅ Token refreshed and user authenticated:', currentUser.email);
          } catch (error) {
            console.log('❌ Failed to get user after token refresh');
            await apiService.clearTokens();
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          console.log('❌ Token refresh failed, user needs to login again');
          setIsAuthenticated(false);
          setUser(null);
          if (cachedUserData) {
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          }
        }
      } else {
        // No valid token, try to use cached user data for offline mode
        if (cachedUserData) {
          setUser(JSON.parse(cachedUserData));
          console.log('📱 Loaded cached user data for offline mode');
        }
        setIsAuthenticated(false);
      }

      // Load onboarding state
      if (cachedHasCompletedOnboarding === 'true') {
        setHasCompletedOnboarding(true);
      }

      console.log('🔐 Auth initialization complete:', {
        isAuthenticated: !!accessToken && !isTokenExpired,
        hasCompletedOnboarding: cachedHasCompletedOnboarding === 'true',
        hasUserData: !!cachedUserData,
        connectionStatus,
      });

    } catch (error) {
      console.error('❌ Error initializing auth state:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication methods
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      // Call API login
      const authResponse = await apiService.login(credentials);
      
      // Update state
      setUser(authResponse.user);
      setIsAuthenticated(true);
      
      // Cache user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authResponse.user));
      
      // Initialize WebSocket connection
      const accessToken = await apiService.getAccessToken();
      if (accessToken) {
        await socketService.connect(authResponse.user._id, authResponse.user.userType, accessToken);
        console.log('🔌 WebSocket connected for user:', authResponse.user.email);
      }
      
      console.log('✅ User logged in successfully:', authResponse.user.email, 'as', authResponse.user.userType);
      
      return authResponse;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (googleUserData: any): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Processing Google login for user:', googleUserData.email);
      
      // Create user data that matches your existing User model
      const userData = {
        _id: googleUserData.id,
        email: googleUserData.email,
        firstName: googleUserData.name?.split(' ')[0] || 'User',
        lastName: googleUserData.name?.split(' ').slice(1).join(' ') || '',
        authProvider: 'google',
        isEmailVerified: googleUserData.emailVerified,
        isPhoneVerified: false, // Google users need phone verification
        photoURL: googleUserData.image,
        userType: 'customer', // Default to customer, can be changed later
        createdAt: googleUserData.createdAt,
        updatedAt: googleUserData.updatedAt,
      };
      
      // For now, we'll create a mock auth response since Better Auth handles the backend
      // In a full integration, you'd call your API service to sync with your backend
      const authResponse: AuthResponse = {
        user: userData,
        accessToken: 'google_auth_token', // Better Auth handles this
        refreshToken: 'google_refresh_token',
        success: true,
        message: 'Google authentication successful',
      };
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Cache user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      // Initialize WebSocket connection with mock token
      // TODO: Get actual token from Better Auth session
      await socketService.connect(userData._id, userData.userType, authResponse.accessToken);
      console.log('🔌 WebSocket connected for Google user:', userData.email);
      
      console.log('✅ Google user logged in successfully:', userData.email, 'as', userData.userType);
      
      return authResponse;
    } catch (error) {
      console.error('❌ Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      
      // Call API register
      const authResponse = await apiService.register(userData);
      
      // Update state
      setUser(authResponse.user);
      setIsAuthenticated(true);
      
      // Cache user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authResponse.user));
      
      // Initialize WebSocket connection
      const accessToken = await apiService.getAccessToken();
      if (accessToken) {
        await socketService.connect(authResponse.user._id, authResponse.user.userType, accessToken);
        console.log('🔌 WebSocket connected for new user:', authResponse.user.email);
      }
      
      console.log('✅ User registered successfully:', authResponse.user.email, 'as', authResponse.user.userType);
      
      return authResponse;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call API logout (clears tokens on backend)
      await apiService.logout();
      
      // Clear Supabase session
      try {
        await supabase.auth.signOut();
        console.log('🔐 Supabase session cleared');
      } catch (error) {
        console.log('⚠️ Supabase signOut error (may not be logged in):', error);
      }
      
      // Update state
      setIsAuthenticated(false);
      setUser(null);
      // Note: We keep onboarding state so user doesn't see intro again

      // Clear cached user data
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

      // Disconnect WebSocket
      socketService.disconnect();
      console.log('🔌 WebSocket disconnected');

      console.log('🚪 User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API call fails, clear local state
      setIsAuthenticated(false);
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Still try to clear Supabase session
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.log('⚠️ Supabase signOut error:', supabaseError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      if (!isAuthenticated) {
        return null;
      }
      
      const currentUser = await apiService.getCurrentUser();
      
      // Update cached user data
      setUser(currentUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
      
      return currentUser;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await apiService.updateProfile(updates);
      
      // Update state and cache
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      console.log('✅ Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      setHasCompletedOnboarding(true);
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
      console.log('✅ Onboarding completed and cached');
    } catch (error) {
      console.error('❌ Error caching onboarding state:', error);
    }
  };

  const skipOnboarding = async () => {
    try {
      setHasCompletedOnboarding(true);
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
      console.log('⏭️ Onboarding skipped and cached');
    } catch (error) {
      console.error('❌ Error caching onboarding skip:', error);
    }
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      setConnectionStatus('checking');
      const isConnected = await apiService.checkConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      console.log('🌐 Connection status:', isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      console.error('❌ Connection check error:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Clear all cache (for debugging)
  const clearAllCache = async () => {
    try {
      // Clear Supabase session
      try {
        await supabase.auth.signOut();
        console.log('🔐 Supabase session cleared');
      } catch (error) {
        console.log('⚠️ Supabase signOut error:', error);
      }
      
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        apiService.clearTokens(), // Clear API tokens as well
      ]);
      
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      setUser(null);
      setConnectionStatus('checking');
      
      // Disconnect WebSocket
      socketService.disconnect();
      
      console.log('🗑️ All auth cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    hasCompletedOnboarding,
    user,
    isLoading,
    connectionStatus,
    login,
    googleLogin,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    completeOnboarding,
    skipOnboarding,
    checkConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for debugging purposes
export const debugAuth = {
  clearAllCache: async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      apiService.clearTokens(),
    ]);
    console.log('🗑️ Debug: All auth cache cleared');
  },
  getTokens: async () => {
    const accessToken = await apiService.getAccessToken();
    const refreshToken = await apiService.getRefreshToken();
    const isExpired = await apiService.isTokenExpired();
    console.log('🔑 Debug tokens:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken, 
      isExpired 
    });
    return { accessToken, refreshToken, isExpired };
  },
  checkConnection: async () => {
    const isConnected = await apiService.checkConnection();
    console.log('🌐 Debug connection:', isConnected);
    return isConnected;
  },
}; 