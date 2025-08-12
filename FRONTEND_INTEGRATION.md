# Frontend-Backend Integration Guide

<div align="center">
  <h2>🔗 Connecting React Native Frontend to Express.js Backend</h2>
  <p>Complete guide to integrate the iBox mobile app with the backend API</p>
</div>

## 📊 Current Status

### ✅ Backend Status: **FULLY READY**
- Complete Express.js API with authentication endpoints
- MongoDB database with user and order models  
- Redis for session management and caching
- Docker environment with all services running
- Sample data loaded and ready for testing

### ❌ Frontend Status: **NOT CONNECTED**
- Still using mock authentication in `AuthContext.tsx`
- No API calls to backend endpoints
- Local AsyncStorage only (no real database operations)
- Mock data throughout the application

## 🎯 Integration Checklist

### Phase 1: API Configuration
- [ ] Update base URLs for development/production
- [ ] Configure network settings for React Native
- [ ] Add HTTP client setup (fetch/axios)
- [ ] Implement error handling for API calls
- [ ] Add loading states and UI feedback

### Phase 2: Authentication System
- [ ] Replace mock `login()` function with real API calls
- [ ] Implement JWT token storage and management
- [ ] Add token refresh logic
- [ ] Update user registration flow
- [ ] Handle authentication errors properly

### Phase 3: Data Integration
- [ ] Replace AsyncStorage-only data with API calls
- [ ] Update user profile management
- [ ] Implement order creation and management
- [ ] Add real-time features with WebSocket
- [ ] Remove all mock data files

### Phase 4: Testing & Polish
- [ ] Test on physical devices and emulators
- [ ] Handle network errors and offline states
- [ ] Add proper loading and error UI components
- [ ] Implement retry mechanisms
- [ ] Update user interface feedback

## 🚀 Step-by-Step Integration

### Step 1: Configure API Base URL

Create an API configuration file:

**Create: `Ibox/src/config/api.ts`**
```typescript
const API_CONFIG = {
  // For React Native development, use your computer's local IP
  // Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
  development: {
    baseUrl: 'http://192.168.1.100:5000/api/v1', // Replace with your IP
    timeout: 30000,
  },
  production: {
    baseUrl: 'https://your-production-api.com/api/v1',
    timeout: 30000,
  }
};

export const API_BASE_URL = __DEV__ 
  ? API_CONFIG.development.baseUrl 
  : API_CONFIG.production.baseUrl;

export const API_TIMEOUT = __DEV__
  ? API_CONFIG.development.timeout
  : API_CONFIG.production.timeout;
```

### Step 2: Create API Service

**Create: `Ibox/src/services/authService.ts`**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

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
}

interface AuthResponse {
  success: boolean;
  data: {
    user: any;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message: string;
}

const TOKEN_KEYS = {
  ACCESS_TOKEN: '@ibox:accessToken',
  REFRESH_TOKEN: '@ibox:refreshToken',
};

class AuthService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    if (response.success && response.data.tokens) {
      await AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, response.data.tokens.accessToken);
      await AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, response.data.tokens.refreshToken);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store tokens
    if (response.success && response.data.tokens) {
      await AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, response.data.tokens.accessToken);
      await AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, response.data.tokens.refreshToken);
    }

    return response;
  }

  async getCurrentUser(): Promise<any> {
    const token = await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.makeRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await this.makeRequest('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Store new tokens
    if (response.success && response.data.tokens) {
      await AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, response.data.tokens.accessToken);
      await AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, response.data.tokens.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    
    try {
      if (refreshToken) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.log('Logout API call failed, but continuing with local cleanup');
    } finally {
      // Always clear local tokens
      await AsyncStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    }
  }

  async getStoredTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN),
      AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN),
    ]);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
```

### Step 3: Update AuthContext

**Update: `Ibox/src/contexts/AuthContext.tsx`**
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// ... existing interfaces ...

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached auth state on app start
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have tokens
      const { accessToken } = await authService.getStoredTokens();
      
      if (accessToken) {
        try {
          // Verify token is valid by getting current user
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.data.user);
            console.log('✅ User authenticated from stored token');
          }
        } catch (error) {
          console.log('🔄 Token expired, attempting refresh...');
          
          try {
            await authService.refreshToken();
            const response = await authService.getCurrentUser();
            
            if (response.success) {
              setIsAuthenticated(true);
              setUser(response.data.user);
              console.log('✅ User authenticated with refreshed token');
            }
          } catch (refreshError) {
            console.log('❌ Token refresh failed, user needs to login again');
            await authService.logout(); // Clear invalid tokens
          }
        }
      }

      // Load onboarding state
      const cachedOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
      if (cachedOnboarding === 'true') {
        setHasCompletedOnboarding(true);
      }

    } catch (error) {
      console.error('❌ Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        console.log('✅ User logged in:', response.data.user.email);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error; // Re-throw so UI can handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    userType: 'customer' | 'transporter';
  }) => {
    try {
      setIsLoading(true);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        console.log('✅ User registered:', response.data.user.email);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      console.log('🚪 User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // ... existing onboarding functions remain the same ...

  const value: AuthContextType = {
    isAuthenticated,
    hasCompletedOnboarding,
    user,
    isLoading,
    login,
    register, // Add register function
    logout,
    completeOnboarding,
    skipOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 4: Update Login Components

**Update: `Ibox/src/components/LoginModal.tsx`**
```typescript
// Add error handling and loading states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleLogin = async () => {
  if (!email || !password) {
    setError('Please enter both email and password');
    return;
  }

  try {
    setIsLoading(true);
    setError(null);
    
    await login({ email, password });
    
    // Login successful, modal will close automatically
    setEmail('');
    setPassword('');
  } catch (error) {
    setError(error.message || 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Add error display in your JSX
{error && (
  <Text style={{ color: 'red', marginBottom: 10 }}>
    {error}
  </Text>
)}

// Update login button
<Button 
  onPress={handleLogin}
  disabled={isLoading}
  title={isLoading ? 'Logging in...' : 'Login'}
/>
```

### Step 5: Network Configuration

**Important for React Native Development:**

React Native cannot access `localhost` directly. You need to use your computer's IP address:

1. **Find Your IP Address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   
   # Look for your local IP (usually 192.168.x.x or 10.0.x.x)
   ```

2. **Update API Configuration:**
   ```typescript
   // Use your actual IP address
   const API_BASE_URL = 'http://192.168.1.100:5000/api/v1';
   ```

3. **Make Sure Backend is Running:**
   ```bash
   cd backend
   ./docker-setup.sh  # This starts backend on all interfaces (0.0.0.0:5000)
   ```

## 🧪 Testing the Integration

### Step 1: Test Backend is Running
```bash
# From your computer's browser or another terminal:
curl http://192.168.1.100:5000/health

# Should return:
{"success": true, "message": "API is healthy", ...}
```

### Step 2: Test from React Native
```typescript
// Add this test function to your app temporarily
const testBackendConnection = async () => {
  try {
    const response = await fetch('http://192.168.1.100:5000/health');
    const data = await response.json();
    console.log('✅ Backend connection test:', data);
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
  }
};
```

### Step 3: Test Authentication
```typescript
// Test with sample data from backend
const testLogin = {
  email: 'customer@example.com',
  password: 'Password123'
};

// This user exists in the backend sample data
```

## 🔧 Common Issues & Solutions

### Issue: "Network request failed"
**Solution:** Check IP address and ensure backend is accessible
```bash
# Test from terminal first
curl http://YOUR_IP:5000/health

# Make sure backend is running
./docker-scripts.sh status
```

### Issue: "Unable to connect to backend"
**Solutions:**
1. Use computer's local IP instead of localhost
2. Ensure backend Docker is running on `0.0.0.0:5000` (not just `127.0.0.1`)
3. Check firewall settings

### Issue: CORS errors
**Solution:** The backend is already configured for React Native, but verify CORS settings include your development URLs.

### Issue: Token management
**Solution:** The AuthService handles token storage/refresh automatically, but ensure AsyncStorage is working properly.

## 📱 Platform-Specific Notes

### iOS Simulator
```typescript
const API_BASE_URL = 'http://localhost:5000/api/v1'; // localhost works in iOS simulator
```

### Android Emulator  
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000/api/v1'; // Special Android emulator IP
```

### Physical Devices
```typescript
const API_BASE_URL = 'http://192.168.1.100:5000/api/v1'; // Your computer's local IP
```

## 🚀 Next Steps After Basic Integration

1. **Add Real-time Features**: Implement Socket.io for order tracking
2. **Handle Offline Mode**: Add proper offline/online state handling  
3. **Improve Error Handling**: Add retry logic and better user feedback
4. **Add Loading States**: Comprehensive loading UI throughout the app
5. **Implement Push Notifications**: Real-time order updates
6. **Add Image Upload**: Profile pictures and order documentation
7. **Google Auth Integration**: OAuth flow with backend

## 📋 Final Verification Checklist

- [ ] Backend health endpoint returns success
- [ ] Can register new users through mobile app  
- [ ] Can login with registered users
- [ ] JWT tokens are stored and managed properly
- [ ] User profile loads from backend
- [ ] Logout clears tokens and state
- [ ] Error handling works for network issues
- [ ] Loading states show during API calls

---

<div align="center">
  <h3>🎉 Once completed, your React Native app will be fully connected to the Express.js backend!</h3>
  <p>No more mock data - real authentication, real users, real database operations.</p>
</div>