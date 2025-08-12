import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import signUpService from '../services/signUpService';
import apiService from '../services/api';

// Types for our sign-up data
export interface SignUpData {
  // Step 1: Account Type
  accountType?: 'customer' | 'transporter';
  
  // Step 2: Identity
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  legalAccepted?: boolean;
  
  // Step 2-b: OTP
  otp?: string;
  
  // Step 3: Address & Locale
  defaultAddress?: string;
  secondaryAddress?: string;
  language?: string;
  
  // Step 4-a: Customer Extras
  paymentData?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  } | null;
  isBusiness?: boolean;
  companyName?: string;
  taxId?: string;
  
  // Step 4-b: Transporter Vehicle
  vehicleType?: string;
  plate?: string;
  payloadKg?: number;
  vehiclePhotos?: string[];
  
  // Step 5-b: Transporter Identity & Compliance
  licenseImages?: string[];
  licenseExpiry?: string;
  insuranceDoc?: string;
  bgCheckConsent?: boolean;
  
  // Step 6-b: Transporter Banking
  bankIban?: string;
  bankRouting?: string;
  bankAccount?: string;
  bankHolder?: string;
  
  // Step 7: Confirmation
  confirmAll?: boolean;
  
  // Meta
  currentStep?: number;
  isCompleted?: boolean;
}

type SignUpAction = 
  | { type: 'UPDATE_DATA'; payload: Partial<SignUpData> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET_DATA' }
  | { type: 'LOAD_DATA'; payload: SignUpData };

interface SignUpContextType {
  signUpData: SignUpData;
  updateSignUpData: (data: Partial<SignUpData>) => void;
  setCurrentStep: (step: number) => void;
  resetSignUpData: () => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  
  // Registration methods
  registerUser: () => Promise<{ success: boolean; message: string; user?: any }>;
  validateCurrentStep: (step: number) => { isValid: boolean; errors: string[] };
  isStepComplete: (step: number) => boolean;
  getCompletionPercentage: () => number;
  getNextIncompleteStep: () => number | null;
  
  // State tracking
  isRegistering: boolean;
  registrationError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
}

const initialSignUpData: SignUpData = {
  currentStep: 0,
  isCompleted: false,
  vehiclePhotos: [],
  licenseImages: [],
};

const signUpReducer = (state: SignUpData, action: SignUpAction): SignUpData => {
  switch (action.type) {
    case 'UPDATE_DATA':
      return { ...state, ...action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET_DATA':
      return initialSignUpData;
    case 'LOAD_DATA':
      return { ...initialSignUpData, ...action.payload };
    default:
      return state;
  }
};

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

const STORAGE_KEY = '@ibox_signup_data';

export const SignUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signUpData, dispatch] = useReducer(signUpReducer, initialSignUpData);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const updateSignUpData = (data: Partial<SignUpData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const resetSignUpData = () => {
    dispatch({ type: 'RESET_DATA' });
    AsyncStorage.removeItem(STORAGE_KEY);
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signUpData));
    } catch (error) {
      console.error('Failed to save sign-up data:', error);
    }
  };

  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        dispatch({ type: 'LOAD_DATA', payload: data });
      }
    } catch (error) {
      console.error('Failed to load sign-up data:', error);
    }
  };

  // Check connection status
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await apiService.checkConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Registration methods
  const registerUser = async (): Promise<{ success: boolean; message: string; user?: any }> => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }

      // Use the signUpService to register
      const result = await signUpService.registerUser(signUpData);

      if (result.success) {
        // Clear signup data on successful registration
        dispatch({ type: 'UPDATE_DATA', payload: { isCompleted: true } });
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('✅ User registration successful:', result.user?.email);
      } else {
        setRegistrationError(result.message);
        console.error('❌ Registration failed:', result.message);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setRegistrationError(errorMessage);
      console.error('❌ Registration error:', error);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsRegistering(false);
    }
  };

  const validateCurrentStep = (step: number): { isValid: boolean; errors: string[] } => {
    // Use signUpService validation but focus on specific step
    const fullValidation = signUpService.validateSignUpData(signUpData);
    
    // Filter errors relevant to the current step
    const stepErrors = fullValidation.errors.filter(error => {
      // This is a simplified filter - in a real app you'd want more specific step-based validation
      switch (step) {
        case 1:
          return error.includes('account type');
        case 2:
          return error.includes('name') || error.includes('email') || error.includes('phone') || error.includes('password') || error.includes('terms');
        case 3:
          return error.includes('address') || error.includes('language');
        case 4:
          return error.includes('company') || error.includes('tax') || error.includes('vehicle') || error.includes('license plate') || error.includes('payload');
        case 5:
          return error.includes('license') || error.includes('insurance') || error.includes('background');
        case 6:
          return error.includes('banking') || error.includes('account');
        default:
          return false;
      }
    });

    return {
      isValid: stepErrors.length === 0,
      errors: stepErrors,
    };
  };

  const isStepComplete = (step: number): boolean => {
    return signUpService.isStepComplete(signUpData, step);
  };

  const getCompletionPercentage = (): number => {
    return signUpService.getCompletionPercentage(signUpData);
  };

  const getNextIncompleteStep = (): number | null => {
    return signUpService.getNextIncompleteStep(signUpData);
  };

  // Auto-save to storage whenever data changes
  useEffect(() => {
    if (signUpData.currentStep !== undefined && signUpData.currentStep > 0) {
      saveToStorage();
    }
  }, [signUpData]);

  // Load data and check connection on mount
  useEffect(() => {
    const initialize = async () => {
      await loadFromStorage();
      await checkConnection();
    };
    initialize();
  }, []);

  const value: SignUpContextType = {
    signUpData,
    updateSignUpData,
    setCurrentStep,
    resetSignUpData,
    saveToStorage,
    loadFromStorage,
    
    // Registration methods
    registerUser,
    validateCurrentStep,
    isStepComplete,
    getCompletionPercentage,
    getNextIncompleteStep,
    
    // State tracking
    isRegistering,
    registrationError,
    connectionStatus,
  };

  return (
    <SignUpContext.Provider value={value}>
      {children}
    </SignUpContext.Provider>
  );
};

export const useSignUp = () => {
  const context = useContext(SignUpContext);
  if (context === undefined) {
    throw new Error('useSignUp must be used within a SignUpProvider');
  }
  return context;
};