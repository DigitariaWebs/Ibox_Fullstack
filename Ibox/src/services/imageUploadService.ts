/**
 * Image Upload Service
 * 
 * Handles profile picture upload functionality including:
 * - Image selection from gallery or camera
 * - Image compression and optimization
 * - Upload to backend API
 * - Error handling and user feedback
 */

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import profileService, { ProfilePictureUpload } from './profileService';

export interface ImageUploadOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageUploadResult {
  success: boolean;
  profilePictureUrl?: string;
  error?: string;
}

class ImageUploadService {
  private defaultOptions: ImageUploadOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 800,
  };

  /**
   * Request camera and gallery permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library permissions to update your profile picture.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Show image selection options (camera or gallery)
   */
  async selectImageSource(): Promise<'camera' | 'gallery' | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Profile Picture',
        'Choose how you want to update your profile picture',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { 
            text: 'Take Photo', 
            onPress: () => resolve('camera') 
          },
          { 
            text: 'Choose from Gallery', 
            onPress: () => resolve('gallery') 
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  /**
   * Pick image from camera
   */
  async pickFromCamera(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    return ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: finalOptions.allowsEditing,
      aspect: finalOptions.aspect,
      quality: finalOptions.quality,
      base64: false,
      exif: false,
    });
  }

  /**
   * Pick image from gallery
   */
  async pickFromGallery(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: finalOptions.allowsEditing,
      aspect: finalOptions.aspect,
      quality: finalOptions.quality,
      base64: false,
      exif: false,
    });
  }

  /**
   * Compress and optimize image
   */
  async processImage(imageUri: string, options: ImageUploadOptions = {}): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: finalOptions.maxWidth,
              height: finalOptions.maxHeight,
            },
          },
        ],
        {
          compress: finalOptions.quality || 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image processing failed:', error);
      return imageUri; // Return original if processing fails
    }
  }

  /**
   * Upload profile picture to backend
   */
  async uploadProfilePicture(imageUri: string): Promise<ImageUploadResult> {
    try {
      // Process the image first
      const processedImageUri = await this.processImage(imageUri);
      
      // Prepare upload data
      const filename = `profile_${Date.now()}.jpg`;
      const uploadData: ProfilePictureUpload = {
        uri: processedImageUri,
        type: 'image/jpeg',
        name: filename,
      };

      // Upload to backend
      const result = await profileService.uploadProfilePicture(uploadData);
      
      return {
        success: true,
        profilePictureUrl: result.profilePicture,
      };
    } catch (error: any) {
      console.error('Profile picture upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload profile picture',
      };
    }
  }

  /**
   * Complete profile picture update flow
   */
  async updateProfilePicture(options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      // Check permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return {
          success: false,
          error: 'Camera and photo library permissions are required',
        };
      }

      // Let user select source
      const source = await this.selectImageSource();
      if (!source) {
        return {
          success: false,
          error: 'No image source selected',
        };
      }

      // Pick image based on source
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        result = await this.pickFromCamera(options);
      } else {
        result = await this.pickFromGallery(options);
      }

      // Check if user cancelled
      if (result.canceled) {
        return {
          success: false,
          error: 'Image selection cancelled',
        };
      }

      // Validate result
      if (!result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'No image selected',
        };
      }

      const selectedImage = result.assets[0];
      
      // Upload the image
      return await this.uploadProfilePicture(selectedImage.uri);
    } catch (error: any) {
      console.error('Profile picture update failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile picture',
      };
    }
  }

  /**
   * Delete current profile picture
   */
  async deleteProfilePicture(): Promise<boolean> {
    try {
      // For now, just upload a null value to remove the picture
      // In a real implementation, you might have a separate delete endpoint
      const updateData: ProfilePictureUpload = {
        uri: '',
        type: 'image/jpeg',
        name: 'delete',
      };

      await profileService.uploadProfilePicture(updateData);
      return true;
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      return false;
    }
  }

  /**
   * Validate image file
   */
  validateImage(imageUri: string): boolean {
    // Basic validation - check if URI exists and has valid format
    if (!imageUri || typeof imageUri !== 'string') {
      return false;
    }

    // Check for valid image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowercaseUri = imageUri.toLowerCase();
    
    return validExtensions.some(ext => lowercaseUri.includes(ext)) || 
           lowercaseUri.includes('data:image/') || 
           lowercaseUri.includes('file://') ||
           lowercaseUri.includes('content://');
  }

  /**
   * Get image size in KB
   */
  async getImageSize(imageUri: string): Promise<number | null> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return blob.size / 1024; // Convert to KB
    } catch (error) {
      console.error('Failed to get image size:', error);
      return null;
    }
  }

  /**
   * Check if image is too large
   */
  async isImageTooLarge(imageUri: string, maxSizeKB: number = 5120): Promise<boolean> {
    const size = await this.getImageSize(imageUri);
    return size ? size > maxSizeKB : false;
  }
}

// Export singleton instance
const imageUploadService = new ImageUploadService();
export default imageUploadService;