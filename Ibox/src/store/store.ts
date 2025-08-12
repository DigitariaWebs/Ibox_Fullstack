import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist/es/constants';

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
  whitelist: ['language', 'user'],
};

const rootReducer = {
  counter: counterSlice.reducer,
  language: languageSlice.reducer,
  user: userSlice.reducer,
  booking: bookingSlice.reducer,
};

const persistedReducer = persistReducer(persistConfig, (state, action) => {
  return {
    counter: rootReducer.counter(state?.counter, action),
    language: rootReducer.language(state?.language, action),
    user: rootReducer.user(state?.user, action),
    booking: rootReducer.booking(state?.booking, action),
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