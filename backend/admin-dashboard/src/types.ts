// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  error?: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    tokens: AuthToken;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

// Driver Verification Types
export interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  createdAt: string;
  profilePicture?: string;
  transporterDetails?: TransporterDetails;
}

export interface TransporterDetails {
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  verificationDocuments: VerificationDocuments;
  submissionStatus: SubmissionStatus;
  backgroundCheckConsent: boolean;
  lastDocumentUpload?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface VerificationDocuments {
  profilePhoto?: string;
  driverLicense?: string;
  vehicleFront?: string;
  vehicleBack?: string;
  vehicleLeft?: string;
  vehicleRight?: string;
  vehicleInterior?: string;
  licensePlate?: string;
  insurance?: string;
}

export interface SubmissionStatus {
  [key: string]: {
    submitted: boolean;
    submittedAt?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
  };
}

export interface VerificationProgress {
  completed: number;
  total: number;
  percentage: number;
  steps: {
    profilePhoto: boolean;
    phoneVerified: boolean;
    driverLicense: boolean;
    vehiclePhotos: boolean;
    vehiclePlate: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  };
}

export interface VerificationDetails {
  driver: Driver;
  verification: {
    status: string;
    progress: VerificationProgress;
    submissionStatus: SubmissionStatus;
    documents: VerificationDocuments;
    backgroundCheckConsent: boolean;
    lastDocumentUpload?: string;
    rejectionReason?: string;
    verifiedAt?: string;
    verifiedBy?: string;
  };
}

// Statistics Types
export interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Step Configuration
export interface StepConfig {
  name: string;
  icon: string;
  description: string;
}

export const STEP_CONFIGS: Record<string, StepConfig> = {
  profilePhoto: { name: 'Profile Photo', icon: '👤', description: 'Driver profile picture' },
  phoneVerified: { name: 'Phone Verification', icon: '📱', description: 'Phone number verified' },
  driverLicense: { name: 'Driver License', icon: '🆔', description: 'Driver license document' },
  vehiclePhotos: { name: 'Vehicle Photos', icon: '🚗', description: 'Front, back, left, right, interior photos' },
  vehiclePlate: { name: 'License Plate', icon: '🔢', description: 'Vehicle license plate photo' },
  insurance: { name: 'Insurance', icon: '📄', description: 'Vehicle insurance document' },
  backgroundCheck: { name: 'Background Check', icon: '🔍', description: 'Background check consent' }
};

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Modal Types
export interface ModalState {
  isOpen: boolean;
  type?: 'driver-details' | 'image-viewer' | 'confirmation';
  data?: any;
}

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  VERIFICATION_STATS: '/api/v1/admin/verifications/stats',
  VERIFICATIONS: '/api/v1/admin/verifications',
  VERIFICATION_DETAILS: (driverId: string) => `/api/v1/admin/verifications/${driverId}`,
  APPROVE_VERIFICATION: (driverId: string) => `/api/v1/admin/verifications/${driverId}/approve`,
  REJECT_VERIFICATION: (driverId: string) => `/api/v1/admin/verifications/${driverId}/reject`,
  APPROVE_STEP: (driverId: string) => `/api/v1/admin/verifications/${driverId}/approve-step`,
  REJECT_STEP: (driverId: string) => `/api/v1/admin/verifications/${driverId}/reject-step`,
} as const;
