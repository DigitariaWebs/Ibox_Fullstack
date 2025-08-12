import express from 'express';
import rateLimit from 'express-rate-limit';
import uploadController from '../controllers/uploadController.js';
import { protect, restrictTo, rateLimitByUser } from '../middleware/auth.js';
import { 
  uploadProfile,
  uploadDocument,
  uploadOrderPhotos,
  handleUploadError,
  validateUploadedFiles,
  cleanupFiles,
  serveUploadedFile
} from '../middleware/upload.js';
import { body, param } from 'express-validator';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// Rate limiting for upload operations
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per window
  message: {
    success: false,
    message: 'Too many upload requests from this IP, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Apply rate limiting and input sanitization
router.use(uploadRateLimit);
router.use(sanitizeInput);
router.use(cleanupFiles); // Clean up files on errors

// File serving route (public access for now - in production, add authentication)
router.get('/files/:category/:filename', serveUploadedFile);

// All other routes require authentication
router.use(protect);

// Upload profile picture
router.post('/profile-picture',
  rateLimitByUser(5, 60), // 5 profile picture uploads per hour
  uploadProfile.single('profilePicture'),
  handleUploadError,
  validateUploadedFiles,
  uploadController.uploadProfilePicture
);

// Upload transporter documents
router.post('/documents',
  restrictTo('transporter'),
  rateLimitByUser(10, 60), // 10 document uploads per hour
  uploadDocument.array('documents', 5), // Accept up to 5 documents
  handleUploadError,
  [
    body('documentType')
      .isIn(['license', 'insurance', 'vehicle_registration', 'identity', 'other'])
      .withMessage('Document type must be license, insurance, vehicle_registration, identity, or other')
  ],
  handleValidationErrors,
  validateUploadedFiles,
  uploadController.uploadTransporterDocuments
);

// Upload order photos
router.post('/order-photos',
  rateLimitByUser(15, 60), // 15 photo uploads per hour
  uploadOrderPhotos.array('photos', 10), // Accept up to 10 photos
  handleUploadError,
  [
    body('orderId')
      .isMongoId()
      .withMessage('Valid order ID is required'),
    
    body('photoType')
      .isIn(['package', 'delivery_proof', 'pickup_proof', 'damage', 'other'])
      .withMessage('Photo type must be package, delivery_proof, pickup_proof, damage, or other')
  ],
  handleValidationErrors,
  validateUploadedFiles,
  uploadController.uploadOrderPhotos
);

// Get user's uploaded files
router.get('/files',
  uploadController.getUserFiles
);

// Get specific file information
router.get('/files/:category/:filename/info',
  [
    param('category')
      .isIn(['profiles', 'documents', 'orders'])
      .withMessage('Category must be profiles, documents, or orders'),
    
    param('filename')
      .matches(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/)
      .withMessage('Invalid filename format')
  ],
  handleValidationErrors,
  uploadController.getFileInfo
);

// Delete uploaded file
router.delete('/files/:category/:filename',
  rateLimitByUser(10, 60), // 10 file deletions per hour
  [
    param('category')
      .isIn(['profiles', 'documents', 'orders'])
      .withMessage('Category must be profiles, documents, or orders'),
    
    param('filename')
      .matches(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/)
      .withMessage('Invalid filename format')
  ],
  handleValidationErrors,
  uploadController.deleteUploadedFile
);

// Development routes
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/routes', (req, res) => {
    const routes = [];
    
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: layer.route.path,
          methods: methods,
          description: getRouteDescription(layer.route.path, methods),
          access: getRouteAccess(layer.route.path)
        });
      }
    });

    res.json({
      success: true,
      message: 'File upload routes',
      data: {
        routes: routes,
        baseUrl: '/api/v1/upload',
        uploadLimits: {
          profile: { maxSize: '5MB', maxFiles: 1, types: ['jpg', 'png', 'gif', 'webp'] },
          documents: { maxSize: '10MB', maxFiles: 5, types: ['pdf', 'jpg', 'png', 'doc', 'docx'] },
          photos: { maxSize: '5MB', maxFiles: 10, types: ['jpg', 'png', 'gif', 'webp'] }
        },
        authenticatedUser: req.user ? {
          id: req.user.id,
          email: req.user.email,
          userType: req.user.userType
        } : null
      }
    });
  });

  // Debug endpoint to check upload directories
  router.get('/debug/directories', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    const uploadBase = path.join(process.cwd(), 'uploads');
    const directories = ['profiles', 'documents', 'orders', 'temp'];
    
    const dirInfo = {};
    
    directories.forEach(dir => {
      const dirPath = path.join(uploadBase, dir);
      try {
        const exists = fs.existsSync(dirPath);
        const files = exists ? fs.readdirSync(dirPath) : [];
        dirInfo[dir] = {
          exists,
          path: dirPath,
          fileCount: files.length,
          files: files.slice(0, 10) // Show first 10 files
        };
      } catch (error) {
        dirInfo[dir] = {
          exists: false,
          error: error.message
        };
      }
    });

    res.json({
      success: true,
      message: 'Upload directories information',
      data: {
        baseDirectory: uploadBase,
        directories: dirInfo
      }
    });
  });
}

function getRouteDescription(path, method) {
  const descriptions = {
    'GET /files/:category/:filename': 'Serve uploaded file',
    'POST /profile-picture': 'Upload user profile picture',
    'POST /documents': 'Upload transporter documents',
    'POST /order-photos': 'Upload order-related photos',
    'GET /files': 'Get user\'s uploaded files',
    'GET /files/:category/:filename/info': 'Get file information',
    'DELETE /files/:category/:filename': 'Delete uploaded file'
  };

  return descriptions[`${method} ${path}`] || 'File upload endpoint';
}

function getRouteAccess(path) {
  if (path.includes('/documents')) {
    return 'transporters only';
  }
  if (path.includes('/files/:category/:filename') && !path.includes('/info')) {
    return 'public (file serving)';
  }
  return 'authenticated users';
}

// Error handling middleware specific to upload routes
router.use((err, req, res, next) => {
  console.error('Upload route error:', err);

  // Clean up any uploaded files on error
  if (req.files) {
    const fs = require('fs/promises');
    req.files.forEach(file => {
      fs.unlink(file.path).catch(unlinkErr => {
        console.error('Error cleaning up file:', unlinkErr);
      });
    });
  }

  if (req.file) {
    const fs = require('fs/promises');
    fs.unlink(req.file.path).catch(unlinkErr => {
      console.error('Error cleaning up file:', unlinkErr);
    });
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large',
      code: 'FILE_TOO_LARGE',
      maxSize: '5MB for images, 10MB for documents'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  // Generic upload error
  res.status(500).json({
    success: false,
    message: 'Internal server error in file upload service',
    code: 'UPLOAD_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default router;