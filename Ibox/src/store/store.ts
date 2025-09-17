import { configureStore, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist/es/constants';
import api from '../services/api';

// Language slice for managing app language
const languageSlice = createSlice({
  name: 'language',
  initialState: {
    value: 'en',
  },
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'fr'>) => {
      state.value = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;

// Sample counter slice for testing
const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// Driver slice for managing driver-specific state
interface DeliveryRequest {
  id: string;
  customerName: string;
  serviceType: 'Express' | 'Standard' | 'Moving' | 'Food';
  pickupAddress: string;
  deliveryAddress: string;
  distance: string;
  estimatedTime: string;
  price: number;
  weight?: string;
  description: string;
  urgency: 'high' | 'normal' | 'low';
  createdAt: string;
  expiresIn: number;
}

interface DriverVerificationStatus {
  isVerified: boolean;
  verificationStep: number;
  completedSteps: {
    profilePhoto: boolean;
    driverLicense: boolean;
    vehiclePhotos: boolean;
    vehiclePlate: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  };
  pendingReview: boolean;
}

interface DriverStats {
  deliveries: number;
  earnings: number;
  hoursOnline: number;
  rating: number;
}

interface DriverNotification {
  id: string;
  title: string;
  message: string;
  type: 'delivery' | 'earning' | 'alert' | 'promotion' | 'system';
  read: boolean;
  createdAt: string;
  data?: any;
}

interface DriverState {
  isOnline: boolean;
  verificationStatus: DriverVerificationStatus | null;
  todayStats: DriverStats;
  deliveryRequests: DeliveryRequest[];
  notifications: DriverNotification[];
  notificationCount: number;
  loading: {
    verification: boolean;
    stats: boolean;
    deliveries: boolean;
    notifications: boolean;
  };
  lastUpdated: {
    verification: number | null;
    stats: number | null;
    deliveries: number | null;
    notifications: number | null;
  };
}

const initialDriverState: DriverState = {
  isOnline: false,
  verificationStatus: null,
  todayStats: {
    deliveries: 0,
    earnings: 0,
    hoursOnline: 0,
    rating: 0,
  },
  deliveryRequests: [],
  notifications: [],
  notificationCount: 0,
  loading: {
    verification: false,
    stats: false,
    deliveries: false,
    notifications: false,
  },
  lastUpdated: {
    verification: null,
    stats: null,
    deliveries: null,
    notifications: null,
  },
};

// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Helper to check if data is fresh
const isDataFresh = (lastUpdated: number | null): boolean => {
  return lastUpdated !== null && (Date.now() - lastUpdated) < CACHE_TIMEOUT;
};

// Data transformation helpers
const transformDeliveryData = (backendDelivery: any): DeliveryRequest => ({
  id: backendDelivery.id,
  customerName: backendDelivery.customerName,
  serviceType: backendDelivery.serviceType,
  pickupAddress: backendDelivery.pickupAddress,
  deliveryAddress: backendDelivery.deliveryAddress,
  distance: backendDelivery.distance || 'N/A',
  estimatedTime: backendDelivery.estimatedTime || 'N/A',
  price: backendDelivery.price || 0,
  weight: backendDelivery.weight,
  description: backendDelivery.description || 'No description',
  urgency: backendDelivery.urgency || 'normal',
  createdAt: backendDelivery.createdAt,
  expiresIn: backendDelivery.expiresIn || 0,
});

const transformNotificationData = (backendNotification: any): DriverNotification => ({
  id: backendNotification._id || backendNotification.id,
  title: backendNotification.title,
  message: backendNotification.message,
  type: backendNotification.type,
  read: backendNotification.read,
  createdAt: backendNotification.createdAt,
});

// Async thunks for driver operations
export const fetchDriverVerificationStatus = createAsyncThunk(
  'driver/fetchVerificationStatus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      
      // Check if data is fresh
      if (state.driver.verificationStatus && isDataFresh(state.driver.lastUpdated.verification)) {
        return state.driver.verificationStatus;
      }

      console.log('🔍 Fetching driver verification status from backend...');
      const response = await api.get('/driver/verification/status');
      
      if (response?.success && response?.data) {
        console.log('✅ Verification status loaded from backend:', response.data);
        return response.data as DriverVerificationStatus;
      } else {
        console.error('❌ Backend returned unsuccessful response:', response);
        return rejectWithValue(response?.message || 'Failed to fetch verification status');
      }
    } catch (error: any) {
      console.error('❌ Error fetching verification status:', error);
      return rejectWithValue(error?.message || 'Network error while fetching verification status');
    }
  }
);

export const fetchDriverStats = createAsyncThunk(
  'driver/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      
      // Check if data is fresh
      if (state.driver.todayStats && isDataFresh(state.driver.lastUpdated.stats)) {
        return state.driver.todayStats;
      }

      console.log('📊 Fetching driver stats from backend...');
      const response = await api.get('/driver/stats/today');
      
      if (response?.success && response?.data) {
        console.log('✅ Driver stats loaded from backend:', response.data);
        return response.data as DriverStats;
      } else {
        console.error('❌ Backend returned unsuccessful response:', response);
        return rejectWithValue(response?.message || 'Failed to fetch driver stats');
      }
    } catch (error: any) {
      console.error('❌ Error fetching driver stats:', error);
      return rejectWithValue(error?.message || 'Network error while fetching driver stats');
    }
  }
);

export const fetchDeliveryRequests = createAsyncThunk(
  'driver/fetchDeliveryRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      
      // Check if data is fresh
      if (state.driver.deliveryRequests && isDataFresh(state.driver.lastUpdated.deliveries)) {
        return state.driver.deliveryRequests;
      }

      console.log('🚚 Fetching available deliveries from backend...');
      const response = await api.get('/driver/deliveries/available');
      
      if (response?.success && response?.data?.deliveries) {
        const deliveries = response.data.deliveries.map(transformDeliveryData);
        console.log('✅ Available deliveries loaded from backend:', deliveries.length, 'requests');
        return deliveries;
      } else {
        console.error('❌ Backend returned unsuccessful response:', response);
        return rejectWithValue(response?.message || 'Failed to fetch delivery requests');
      }
    } catch (error: any) {
      console.error('❌ Error fetching delivery requests:', error);
      return rejectWithValue(error?.message || 'Network error while fetching delivery requests');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'driver/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      
      // Check if data is fresh
      if (state.driver.notifications && isDataFresh(state.driver.lastUpdated.notifications)) {
        return state.driver.notifications;
      }

      console.log('🔔 Fetching notifications from backend...');
      const response = await api.get('/driver/notifications');
      
      if (response?.success && response?.data?.notifications) {
        const notifications = response.data.notifications.map(transformNotificationData);
        console.log('✅ Notifications loaded from backend:', notifications.length, 'notifications');
        return notifications;
      } else {
        console.error('❌ Backend returned unsuccessful response:', response);
        return rejectWithValue(response?.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error);
      return rejectWithValue(error?.message || 'Network error while fetching notifications');
    }
  }
);

export const toggleDriverOnlineStatus = createAsyncThunk(
  'driver/toggleOnlineStatus',
  async (newStatus: boolean, { rejectWithValue }) => {
    try {
      console.log(`🔄 ${newStatus ? 'Going online' : 'Going offline'}...`);
      const response = await api.put('/driver/status', { online: newStatus });
      
      if (response?.success) {
        console.log(`✅ Driver is now ${newStatus ? 'online' : 'offline'}`);
        return newStatus;
      } else {
        console.error('❌ Failed to update online status:', response);
        return rejectWithValue(response?.message || 'Failed to update online status');
      }
    } catch (error: any) {
      console.error('❌ Error updating online status:', error);
      return rejectWithValue(error?.message || 'Network error while updating online status');
    }
  }
);

export const acceptDeliveryRequest = createAsyncThunk(
  'driver/acceptDelivery',
  async (deliveryId: string, { rejectWithValue }) => {
    try {
      console.log('🤝 Accepting delivery request:', deliveryId);
      const response = await api.post(`/driver/deliveries/${deliveryId}/accept`);
      
      if (response?.success) {
        console.log('✅ Delivery request accepted successfully:', response.data);
        return deliveryId;
      } else {
        console.error('❌ Failed to accept delivery:', response);
        return rejectWithValue(response?.message || 'Failed to accept delivery request');
      }
    } catch (error: any) {
      console.error('❌ Error accepting delivery:', error);
      return rejectWithValue(error?.message || 'Network error while accepting delivery');
    }
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState: initialDriverState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.notificationCount = Math.max(0, state.notificationCount - 1);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.notificationCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationIndex = state.notifications.findIndex(n => n.id === action.payload);
      if (notificationIndex !== -1) {
        const wasUnread = !state.notifications[notificationIndex].read;
        state.notifications.splice(notificationIndex, 1);
        if (wasUnread) {
          state.notificationCount = Math.max(0, state.notificationCount - 1);
        }
      }
    },
    resetDriverState: () => initialDriverState,
  },
  extraReducers: (builder) => {
    // Verification Status
    builder
      .addCase(fetchDriverVerificationStatus.pending, (state) => {
        state.loading.verification = true;
      })
      .addCase(fetchDriverVerificationStatus.fulfilled, (state, action) => {
        state.verificationStatus = action.payload;
        state.loading.verification = false;
        state.lastUpdated.verification = Date.now();
      })
      .addCase(fetchDriverVerificationStatus.rejected, (state) => {
        state.loading.verification = false;
        // Keep existing data if fetch fails
      });

    // Driver Stats
    builder
      .addCase(fetchDriverStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchDriverStats.fulfilled, (state, action) => {
        state.todayStats = action.payload;
        state.loading.stats = false;
        state.lastUpdated.stats = Date.now();
      })
      .addCase(fetchDriverStats.rejected, (state) => {
        state.loading.stats = false;
        // Keep existing data if fetch fails
      });

    // Delivery Requests
    builder
      .addCase(fetchDeliveryRequests.pending, (state) => {
        state.loading.deliveries = true;
      })
      .addCase(fetchDeliveryRequests.fulfilled, (state, action) => {
        state.deliveryRequests = action.payload;
        state.loading.deliveries = false;
        state.lastUpdated.deliveries = Date.now();
      })
      .addCase(fetchDeliveryRequests.rejected, (state) => {
        state.loading.deliveries = false;
        // Keep existing data if fetch fails
      });

    // Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.notifications = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.notificationCount = action.payload.filter(n => !n.read).length;
        state.loading.notifications = false;
        state.lastUpdated.notifications = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading.notifications = false;
        // Keep existing data if fetch fails
      });

    // Toggle Online Status
    builder
      .addCase(toggleDriverOnlineStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload;
      });

    // Accept Delivery
    builder
      .addCase(acceptDeliveryRequest.fulfilled, (state, action) => {
        state.deliveryRequests = state.deliveryRequests.filter(req => req.id !== action.payload);
      });
  },
});

export const {
  setOnlineStatus,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  resetDriverState,
} = driverSlice.actions;

// User slice for managing user account data
const userSlice = createSlice({
  name: 'user',
  initialState: {
    isLoggedIn: false,
    accountType: 'personal' as 'personal' | 'business',
    userData: {
      firstName: '',
      lastName: '',
      email: '',
      loginMethod: '' as 'facebook' | 'apple' | 'email',
    },
  },
  reducers: {
    setUserData: (state, action: PayloadAction<{
      firstName: string;
      lastName: string;
      email: string;
      loginMethod: 'facebook' | 'apple' | 'email';
      accountType: 'personal' | 'business';
    }>) => {
      state.userData = {
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        email: action.payload.email,
        loginMethod: action.payload.loginMethod,
      };
      state.accountType = action.payload.accountType;
      state.isLoggedIn = true;
    },
    setAccountType: (state, action: PayloadAction<'personal' | 'business'>) => {
      state.accountType = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userData = {
        firstName: '',
        lastName: '',
        email: '',
        loginMethod: '' as 'facebook' | 'apple' | 'email',
      };
      state.accountType = 'personal';
    },
  },
});

export const { setUserData, setAccountType, logout } = userSlice.actions;

// Booking slice for managing home screen booking state
const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    pickupLocation: '',
    destination: '',
    selectedService: '',
    recentBookings: [],
    isEstimating: false,
  },
  reducers: {
    setPickupLocation: (state, action: PayloadAction<string>) => {
      state.pickupLocation = action.payload;
    },
    setDestination: (state, action: PayloadAction<string>) => {
      state.destination = action.payload;
    },
    setSelectedService: (state, action: PayloadAction<string>) => {
      state.selectedService = action.payload;
    },
    addRecentBooking: (state, action: PayloadAction<any>) => {
      state.recentBookings.unshift(action.payload);
      if (state.recentBookings.length > 5) {
        state.recentBookings.pop();
      }
    },
    setEstimating: (state, action: PayloadAction<boolean>) => {
      state.isEstimating = action.payload;
    },
    clearBookingForm: (state) => {
      state.pickupLocation = '';
      state.destination = '';
      state.selectedService = '';
    },
  },
});

export const { 
  setPickupLocation, 
  setDestination, 
  setSelectedService, 
  addRecentBooking, 
  setEstimating,
  clearBookingForm 
} = bookingSlice.actions;

// Redux Persist config
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['language', 'user', 'driver'],
};

const rootReducer = {
  counter: counterSlice.reducer,
  language: languageSlice.reducer,
  user: userSlice.reducer,
  booking: bookingSlice.reducer,
  driver: driverSlice.reducer,
};

const persistedReducer = persistReducer(persistConfig, (state, action) => {
  return {
    counter: rootReducer.counter(state?.counter, action),
    language: rootReducer.language(state?.language, action),
    user: rootReducer.user(state?.user, action),
    booking: rootReducer.booking(state?.booking, action),
    driver: rootReducer.driver(state?.driver, action),
  };
});

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
  },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 

export const language = languageSlice.reducer;
export const counter = counterSlice.reducer; 