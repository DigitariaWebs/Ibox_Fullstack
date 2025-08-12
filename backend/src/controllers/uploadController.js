import User from '../models/User.js';
import authService from '../services/authService.js';
import { deleteFile, getFileInfo } from '../middleware/upload.js';

class UploadController {
  // Upload profile picture
  async uploadProfilePicture(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          code: 'NO_FILE'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        // Clean up uploaded file if user not found
        await deleteFile(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Delete old profile picture if it exists
      if (user.profilePicture) {
        const oldPicturePath = user.profilePicture.replace(/^\/uploads\//, 'uploads/');
        await deleteFile(oldPicturePath);
      }

      // Update user profile picture URL
      const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
      user.profilePicture = profilePictureUrl;
      await user.save();

      // Log profile picture update
      await authService.logSecurityEvent(req.userId, 'profile_picture_updated', {
        filename: req.file.filename,
        size: req.file.size,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: profilePictureUrl,
          fileInfo: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading profile picture',
        code: 'UPLOAD_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload transporter documents
  async uploadTransporterDocuments(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        // Clean up uploaded files if user not found
        if (req.files) {
          for (const file of req.files) {
            await deleteFile(file.path);
          }
        }
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.userType !== 'transporter') {
        // Clean up uploaded files
        if (req.files) {
          for (const file of req.files) {
            await deleteFile(file.path);
          }
        }
        return res.status(403).json({
          success: false,
          message: 'Only transporters can upload documents',
          code: 'INVALID_USER_TYPE'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
          code: 'NO_FILES'
        });
      }

      const { documentType } = req.body;
      const validDocumentTypes = ['license', 'insurance', 'vehicle_registration', 'identity', 'other'];

      if (!documentType || !validDocumentTypes.includes(documentType)) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteFile(file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Valid document type is required',
          code: 'INVALID_DOCUMENT_TYPE',
          validTypes: validDocumentTypes
        });
      }

      // Ensure transporter details exist
      if (!user.transporterDetails) {
        user.transporterDetails = {};
      }

      if (!user.transporterDetails.documents) {
        user.transporterDetails.documents = {};
      }

      // Process uploaded files
      const uploadedDocuments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));

      // Update user documents
      if (!user.transporterDetails.documents[documentType]) {
        user.transporterDetails.documents[documentType] = [];
      }

      // Replace existing documents of this type
      user.transporterDetails.documents[documentType] = uploadedDocuments;
      user.transporterDetails.lastDocumentUpdate = new Date();
      
      // Mark for verification review if new documents uploaded
      user.transporterDetails.verificationStatus = 'pending_review';

      await user.save();

      // Log document upload
      await authService.logSecurityEvent(req.userId, 'transporter_documents_uploaded', {
        documentType,
        fileCount: req.files.length,
        filenames: req.files.map(f => f.filename),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          documentType,
          documents: uploadedDocuments,
          verificationStatus: user.transporterDetails.verificationStatus
        }
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          await deleteFile(file.path);
        }
      }
      
      console.error('Upload transporter documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading documents',
        code: 'UPLOAD_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload order photos (package photos, delivery proof, etc.)
  async uploadOrderPhotos(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No photos uploaded',
          code: 'NO_FILES'
        });
      }

      const { orderId, photoType } = req.body;
      const validPhotoTypes = ['package', 'delivery_proof', 'pickup_proof', 'damage', 'other'];

      if (!orderId) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteFile(file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
          code: 'ORDER_ID_REQUIRED'
        });
      }

      if (!photoType || !validPhotoTypes.includes(photoType)) {
        // Clean up uploaded files
        for (const file of req.files) {
          await deleteFile(file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Valid photo type is required',
          code: 'INVALID_PHOTO_TYPE',
          validTypes: validPhotoTypes
        });
      }

      // TODO: Verify order exists and user has access to it
      // const order = await Order.findById(orderId);
      // Placeholder validation for now

      // Process uploaded photos
      const uploadedPhotos = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/orders/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.userId,
        photoType: photoType
      }));

      // Log photo upload
      await authService.logSecurityEvent(req.userId, 'order_photos_uploaded', {
        orderId,
        photoType,
        photoCount: req.files.length,
        filenames: req.files.map(f => f.filename),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Photos uploaded successfully',
        data: {
          orderId,
          photoType,
          photos: uploadedPhotos
        }
      });

      // TODO: Update order with photo references
      // TODO: Emit real-time event if needed

    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          await deleteFile(file.path);
        }
      }
      
      console.error('Upload order photos error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading photos',
        code: 'UPLOAD_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete uploaded file
  async deleteUploadedFile(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { category, filename } = req.params;
      const validCategories = ['profiles', 'documents', 'orders'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file category',
          code: 'INVALID_CATEGORY',
          validCategories
        });
      }

      // Security check: verify user owns the file or has permission
      // This is a simplified check - in production, implement proper ownership verification
      if (category === 'profiles') {
        const user = await User.findById(req.userId);
        if (!user || !user.profilePicture || !user.profilePicture.includes(filename)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to delete this file',
            code: 'DELETE_PERMISSION_DENIED'
          });
        }
      }

      const filePath = `uploads/${category}/${filename}`;
      const deleted = await deleteFile(filePath);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'File not found or already deleted',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Update user record if it's a profile picture
      if (category === 'profiles') {
        await User.findByIdAndUpdate(req.userId, { profilePicture: null });
      }

      // Log file deletion
      await authService.logSecurityEvent(req.userId, 'file_deleted', {
        category,
        filename,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting file',
        code: 'DELETE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get file information
  async getFileInfo(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { category, filename } = req.params;
      const validCategories = ['profiles', 'documents', 'orders'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file category',
          code: 'INVALID_CATEGORY',
          validCategories
        });
      }

      const filePath = `uploads/${category}/${filename}`;
      const fileInfo = await getFileInfo(filePath);

      if (!fileInfo.exists) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'File information retrieved successfully',
        data: {
          filename,
          category,
          url: `/uploads/${category}/${filename}`,
          ...fileInfo
        }
      });
    } catch (error) {
      console.error('Get file info error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving file information',
        code: 'FILE_INFO_ERROR'
      });
    }
  }

  // Get user's uploaded files
  async getUserFiles(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { category } = req.query;
      
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const files = {
        profile: user.profilePicture ? [{
          type: 'profile',
          url: user.profilePicture,
          filename: user.profilePicture.split('/').pop()
        }] : [],
        documents: user.transporterDetails?.documents || {},
        stats: {
          totalFiles: 0,
          profilePicture: !!user.profilePicture,
          documentsCount: 0
        }
      };

      // Count documents
      if (user.transporterDetails?.documents) {
        files.stats.documentsCount = Object.values(user.transporterDetails.documents)
          .reduce((total, docs) => total + (Array.isArray(docs) ? docs.length : 0), 0);
      }

      files.stats.totalFiles = files.profile.length + files.stats.documentsCount;

      // Filter by category if requested
      if (category) {
        const filteredFiles = {};
        if (files[category]) {
          filteredFiles[category] = files[category];
          filteredFiles.stats = files.stats;
        }
        
        res.json({
          success: true,
          message: 'User files retrieved successfully',
          data: filteredFiles
        });
      } else {
        res.json({
          success: true,
          message: 'User files retrieved successfully',
          data: files
        });
      }
    } catch (error) {
      console.error('Get user files error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user files',
        code: 'USER_FILES_ERROR'
      });
    }
  }
}

export default new UploadController();