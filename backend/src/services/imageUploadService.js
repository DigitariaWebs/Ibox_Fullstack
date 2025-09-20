import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageUploadService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.uploadDir = path.join(__dirname, '../../uploads/verification');
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Convert image file to Base64 string
   * @param {string} filePath - Path to the image file
   * @param {string} mimeType - MIME type of the image
   * @returns {string} Base64 encoded string
   */
  async fileToBase64(filePath, mimeType = 'image/jpeg') {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64String = fileBuffer.toString('base64');
      
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error('Error converting file to Base64:', error);
      throw new Error('Failed to convert file to Base64');
    }
  }

  /**
   * Convert Base64 string to file and save
   * @param {string} base64String - Base64 encoded string
   * @param {string} filename - Name for the saved file
   * @returns {string} Path to saved file
   */
  async base64ToFile(base64String, filename) {
    try {
      // Extract MIME type and data from Base64 string
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 format');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Validate MIME type
      if (!this.allowedTypes.includes(mimeType)) {
        throw new Error('Unsupported file type');
      }

      // Convert Base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Check file size
      if (buffer.length > this.maxFileSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = this.getExtensionFromMimeType(mimeType);
      const uniqueFilename = `${timestamp}_${randomString}_${filename}${extension}`;
      
      const filePath = path.join(this.uploadDir, uniqueFilename);
      
      // Save file
      fs.writeFileSync(filePath, buffer);
      
      return filePath;
    } catch (error) {
      console.error('Error converting Base64 to file:', error);
      throw new Error('Failed to save Base64 file');
    }
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File extension
   */
  getExtensionFromMimeType(mimeType) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    
    return extensions[mimeType] || '.jpg';
  }

  /**
   * Validate Base64 image string
   * @param {string} base64String - Base64 encoded string
   * @returns {boolean} Is valid
   */
  validateBase64Image(base64String) {
    try {
      // Check if it's a valid Base64 image format
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return false;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Check MIME type
      if (!this.allowedTypes.includes(mimeType)) {
        return false;
      }

      // Check if Base64 data is valid
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) {
        return false;
      }

      // Check file size
      if (buffer.length > this.maxFileSize) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Compress Base64 image (reduce quality to save space)
   * @param {string} base64String - Original Base64 string
   * @param {number} quality - Quality factor (0.1 to 1.0)
   * @returns {string} Compressed Base64 string
   */
  async compressBase64Image(base64String, quality = 0.8) {
    try {
      // For now, we'll return the original string
      // In production, you might want to use a library like 'sharp' for compression
      return base64String;
    } catch (error) {
      console.error('Error compressing image:', error);
      return base64String; // Return original if compression fails
    }
  }

  /**
   * Delete file from upload directory
   * @param {string} filePath - Path to file to delete
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  /**
   * Get file info from Base64 string
   * @param {string} base64String - Base64 encoded string
   * @returns {object} File information
   */
  getFileInfo(base64String) {
    try {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 format');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return {
        mimeType,
        size: buffer.length,
        extension: this.getExtensionFromMimeType(mimeType),
        isValid: this.validateBase64Image(base64String)
      };
    } catch (error) {
      return {
        mimeType: null,
        size: 0,
        extension: null,
        isValid: false
      };
    }
  }

  /**
   * Clean up old files (older than 30 days)
   */
  async cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

// Create singleton instance
const imageUploadService = new ImageUploadService();

export default imageUploadService;
