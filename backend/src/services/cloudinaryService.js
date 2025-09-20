import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';

class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    this.uploader = cloudinary.uploader;
    this.uploadAsync = promisify(this.uploader.upload.bind(this.uploader));
  }

  /**
   * Upload Base64 image to Cloudinary
   * @param {string} base64Data - Base64 encoded image
   * @param {string} folder - Cloudinary folder path
   * @param {string} publicId - Optional public ID
   * @returns {Promise<string>} Cloudinary URL
   */
  async uploadBase64Image(base64Data, folder = 'verification', publicId = null) {
    try {
      const options = {
        folder: folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max size
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await this.uploadAsync(base64Data, options);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Upload file buffer to Cloudinary
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Cloudinary folder path
   * @param {string} publicId - Optional public ID
   * @returns {Promise<string>} Cloudinary URL
   */
  async uploadBuffer(buffer, folder = 'verification', publicId = null) {
    try {
      const options = {
        folder: folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await this.uploader.upload_stream(options, (error, result) => {
        if (error) throw error;
        return result;
      }).end(buffer);

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary buffer upload error:', error);
      throw new Error('Failed to upload buffer to Cloudinary');
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(publicId) {
    try {
      const result = await this.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  extractPublicId(url) {
    const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/);
    return match ? match[1] : null;
  }

  /**
   * Generate optimized image URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized URL
   */
  generateOptimizedUrl(publicId, options = {}) {
    const defaultOptions = {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const transformOptions = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, transformOptions);
  }

  /**
   * Upload verification document with specific settings
   * @param {string} base64Data - Base64 image data
   * @param {string} documentType - Type of document
   * @param {string} userId - User ID for organization
   * @returns {Promise<string>} Cloudinary URL
   */
  async uploadVerificationDocument(base64Data, documentType, userId) {
    const folder = `verification/${documentType}`;
    const publicId = `${userId}_${documentType}_${Date.now()}`;
    
    return this.uploadBase64Image(base64Data, folder, publicId);
  }

  /**
   * Check if URL is from Cloudinary
   * @param {string} url - URL to check
   * @returns {boolean} Is Cloudinary URL
   */
  isCloudinaryUrl(url) {
    return url && url.includes('cloudinary.com');
  }
}

export default new CloudinaryService();
