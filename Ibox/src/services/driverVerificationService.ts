import apiService from './api';
import { readAsStringAsync } from 'expo-file-system/legacy';

export interface VerificationDocument {
  documentType: string;
  imageData: string;
}

export interface VerificationStatus {
  isVerified: boolean;
  verificationStep: number;
  totalSteps: number;
  completedSteps: {
    profilePhoto: boolean;
    phoneVerified: boolean;
    driverLicense: boolean;
    vehiclePhotos: boolean;
    vehiclePlate: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  };
  pendingReview: boolean;
  documents: Record<string, string>;
  backgroundCheckConsent: boolean;
  verifiedAt: string | null;
  rejectionReason: string | null;
  submissionStatus: {
    profilePhoto: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    driverLicense: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    vehiclePhotos: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    vehiclePlate: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
    insurance: {
      submitted: boolean;
      submittedAt: string | null;
      status: 'pending' | 'approved' | 'rejected';
      reviewedAt: string | null;
      reviewedBy: string | null;
      rejectionReason: string | null;
    };
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    documentType: string;
    uploaded: boolean;
    verificationDocuments: Record<string, string>;
    fileInfo?: {
      mimeType: string;
      size: number;
      extension: string;
      isValid: boolean;
    };
  };
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploadedDocuments: Array<{
      documentType: string;
      uploaded: boolean;
      fileInfo: {
        mimeType: string;
        size: number;
        extension: string;
        isValid: boolean;
      };
    }>;
    errors?: Array<{
      documentType: string;
      error: string;
    }>;
    verificationDocuments: Record<string, string>;
    totalUploaded: number;
    totalErrors: number;
  };
}

class DriverVerificationService {
  private baseUrl = '/driver';

  /**
   * Get driver verification status
   */
  async getVerificationStatus(): Promise<VerificationStatus> {
    try {
      const response = await apiService.get(`${this.baseUrl}/verification/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      throw error;
    }
  }

  /**
   * Upload a single verification document
   */
  async uploadDocument(documentType: string, imageData: string): Promise<UploadResponse> {
    try {
      console.log(`📸 Uploading ${documentType}...`);
      
      const response = await apiService.post(`${this.baseUrl}/verification/upload`, {
        documentType,
        imageData
      });

      console.log(`✅ ${documentType} uploaded successfully`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error uploading ${documentType}:`, error);
      throw error;
    }
  }

  /**
   * Upload multiple verification documents at once
   */
  async uploadMultipleDocuments(documents: VerificationDocument[]): Promise<BulkUploadResponse> {
    try {
      console.log(`📸 Bulk uploading ${documents.length} documents...`);
      
      const response = await apiService.post(`${this.baseUrl}/verification/upload-multiple`, {
        documents
      });

      console.log(`✅ Bulk upload completed: ${response.data.totalUploaded} uploaded, ${response.data.totalErrors} errors`);
      return response.data;
    } catch (error) {
      console.error('❌ Error bulk uploading documents:', error);
      throw error;
    }
  }

  /**
   * Submit background check consent
   */
  async submitBackgroundConsent(consentGiven: boolean): Promise<any> {
    try {
      console.log(`📋 Submitting background check consent: ${consentGiven}`);
      
      const response = await apiService.post(`${this.baseUrl}/verification/consent`, {
        consentGiven,
        consentDate: new Date().toISOString()
      });

      console.log('✅ Background check consent submitted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting background consent:', error);
      throw error;
    }
  }

  /**
   * Convert image URI to Base64 string
   */
  async imageUriToBase64(uri: string): Promise<string> {
    try {
      console.log('📸 Converting image URI to Base64:', uri);
      
      // Check if URI is already Base64
      if (uri.startsWith('data:image/')) {
        console.log('📸 URI is already Base64, using directly');
        return uri;
      }
      
      // Use expo-file-system to read the file and convert to Base64
      const base64 = await readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      
      // Determine the MIME type from the file extension
      let mimeType = 'image/jpeg'; // default
      if (uri.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (uri.toLowerCase().includes('.gif')) {
        mimeType = 'image/gif';
      } else if (uri.toLowerCase().includes('.webp')) {
        mimeType = 'image/webp';
      }
      
      const base64DataUrl = `data:${mimeType};base64,${base64}`;
      console.log('✅ Image converted to Base64 successfully');
      
      return base64DataUrl;
    } catch (error) {
      console.error('❌ Error converting image to Base64:', error);
      throw new Error(`Failed to convert image to Base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compress image before upload (reduce quality to save space)
   */
  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      // For React Native, we'll use the existing ImagePicker quality setting
      // This is a placeholder for future image compression implementation
      return uri;
    } catch (error) {
      console.error('❌ Error compressing image:', error);
      return uri; // Return original if compression fails
    }
  }

  /**
   * Map frontend document types to backend document types
   */
  mapDocumentType(frontendType: string, step: string): string {
    switch (step) {
      case 'profilePhoto':
        return 'profilePhoto';
      case 'driverLicense':
        return 'driverLicense'; // Use single driverLicense field
      case 'vehiclePhotos':
        // Map vehicle photo types correctly
        const vehicleMapping = {
          'front': 'vehicleFront',
          'back': 'vehicleBack',
          'left': 'vehicleLeft',
          'right': 'vehicleRight',
          'interior': 'vehicleInterior'
        };
        return vehicleMapping[frontendType] || frontendType;
      case 'vehiclePlate':
        return 'licensePlate';
      case 'insurance':
        return 'insurance';
      default:
        return frontendType;
    }
  }

  /**
   * Validate image before upload
   */
  validateImage(imageData: string): { isValid: boolean; error?: string } {
    try {
      // Check if it's a valid Base64 image
      if (!imageData.startsWith('data:image/')) {
        return { isValid: false, error: 'Invalid image format' };
      }

      // Check file size (rough estimate)
      const sizeInBytes = (imageData.length * 3) / 4;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes > maxSize) {
        return { isValid: false, error: 'Image size exceeds 5MB limit' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid image data' };
    }
  }

  /**
   * Get upload progress for multiple documents
   */
  calculateUploadProgress(uploadedCount: number, totalCount: number): number {
    return Math.round((uploadedCount / totalCount) * 100);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get verification step requirements
   */
  getStepRequirements(step: string) {
    const requirements = {
      profilePhoto: {
        requiredDocuments: ['profilePhoto'],
        estimatedTime: '2 minutes',
        description: 'Upload a clear, recent photo of yourself'
      },
      driverLicense: {
        requiredDocuments: ['driverLicense'],
        estimatedTime: '2 minutes',
        description: 'Upload a clear photo of your driver license'
      },
      vehiclePhotos: {
        requiredDocuments: ['vehicleFront', 'vehicleBack', 'vehicleLeft', 'vehicleRight', 'vehicleInterior'],
        estimatedTime: '5 minutes',
        description: 'Capture your vehicle from all required angles'
      },
      vehiclePlate: {
        requiredDocuments: ['licensePlate'],
        estimatedTime: '1 minute',
        description: 'Capture a clear photo of your license plate'
      },
      insurance: {
        requiredDocuments: ['insurance'],
        estimatedTime: '3 minutes',
        description: 'Upload current vehicle insurance certificate'
      },
      backgroundCheck: {
        requiredDocuments: [],
        estimatedTime: '24-48 hours',
        description: 'Complete automated background verification'
      }
    };

    return requirements[step] || requirements.profilePhoto;
  }
}

// Create singleton instance
const driverVerificationService = new DriverVerificationService();

export default driverVerificationService;
