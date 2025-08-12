import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDirs = {
  profiles: path.join(__dirname, '../../uploads/profiles'),
  documents: path.join(__dirname, '../../uploads/documents'),
  orders: path.join(__dirname, '../../uploads/orders'),
  temp: path.join(__dirname, '../../uploads/temp')
};

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  try {
    for (const dir of Object.values(uploadDirs)) {
      await fs.mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

// Initialize upload directories
createUploadDirs();

// File type configurations
const fileTypeConfig = {
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  document: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  },
  video: {
    allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.mp4', '.mpeg', '.mov']
  }
};

// Generate unique filename
const generateFilename = (originalname, userId) => {
  const ext = path.extname(originalname).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${userId}_${timestamp}_${hash}${ext}`;
};

// Configure storage for different upload types
const createStorage = (uploadType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let destPath;
      
      switch (uploadType) {
        case 'profile':
          destPath = uploadDirs.profiles;
          break;
        case 'document':
          destPath = uploadDirs.documents;
          break;
        case 'order':
          destPath = uploadDirs.orders;
          break;
        default:
          destPath = uploadDirs.temp;
      }
      
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const userId = req.userId || 'anonymous';
      const filename = generateFilename(file.originalname, userId);
      cb(null, filename);
    }
  });
};

// File filter function
const createFileFilter = (fileType) => {
  return (req, file, cb) => {
    const config = fileTypeConfig[fileType];
    
    if (!config) {
      return cb(new Error(`Invalid file type configuration: ${fileType}`), false);
    }
    
    // Check MIME type
    if (!config.allowedTypes.includes(file.mimetype)) {
      const error = new Error(`Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(ext)) {
      const error = new Error(`Invalid file extension. Allowed extensions: ${config.extensions.join(', ')}`);
      error.code = 'INVALID_FILE_EXTENSION';
      return cb(error, false);
    }
    
    cb(null, true);
  };
};

// Create multer instances for different upload types
export const uploadProfile = multer({
  storage: createStorage('profile'),
  fileFilter: createFileFilter('image'),
  limits: {
    fileSize: fileTypeConfig.image.maxSize,
    files: 1
  }
});

export const uploadDocument = multer({
  storage: createStorage('document'),
  fileFilter: createFileFilter('document'),
  limits: {
    fileSize: fileTypeConfig.document.maxSize,
    files: 5 // Allow up to 5 documents at once
  }
});

export const uploadOrderPhotos = multer({
  storage: createStorage('order'),
  fileFilter: createFileFilter('image'),
  limits: {
    fileSize: fileTypeConfig.image.maxSize,
    files: 10 // Allow up to 10 photos per order
  }
});

export const uploadVideo = multer({
  storage: createStorage('order'),
  fileFilter: createFileFilter('video'),
  limits: {
    fileSize: fileTypeConfig.video.maxSize,
    files: 1
  }
});

// Generic upload for temporary files
export const uploadTemp = multer({
  storage: createStorage('temp'),
  fileFilter: (req, file, cb) => {
    // Accept all file types for temp uploads but with size limits
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Middleware to handle upload errors
export const handleUploadError = (error, req, res, next) => {
  console.error('Upload error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size allowed is ${Math.round(error.limit / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum allowed is ${error.limit}`,
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          code: 'UPLOAD_ERROR'
        });
    }
  }
  
  // Handle custom file type errors
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  // Generic upload error
  return res.status(500).json({
    success: false,
    message: 'Internal server error during file upload',
    code: 'UPLOAD_SERVER_ERROR'
  });
};

// Middleware to validate uploaded files
export const validateUploadedFiles = (req, res, next) => {
  if (!req.files && !req.file) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
      code: 'NO_FILES'
    });
  }
  
  const files = req.files || [req.file];
  const validatedFiles = [];
  
  for (const file of files) {
    // Additional file validation can be added here
    // For example, virus scanning, content validation, etc.
    
    validatedFiles.push({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
    });
  }
  
  req.validatedFiles = validatedFiles;
  next();
};

// Middleware to clean up uploaded files on error
export const cleanupFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response is an error and we have uploaded files, clean them up
    if (res.statusCode >= 400 && (req.files || req.file)) {
      const files = req.files || [req.file];
      
      files.forEach(file => {
        if (file && file.path) {
          fs.unlink(file.path).catch(err => {
            console.error('Error cleaning up file:', err);
          });
        }
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware to resize images (requires sharp)
export const resizeImage = (width, height, quality = 90) => {
  return async (req, res, next) => {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return next();
    }
    
    try {
      // Note: This requires the 'sharp' package to be installed
      // For now, we'll just pass through without resizing
      // TODO: Install sharp and implement image resizing
      console.log(`Image resize requested: ${width}x${height} at ${quality}% quality`);
      next();
    } catch (error) {
      console.error('Image resize error:', error);
      next(); // Continue without resizing
    }
  };
};

// Utility function to delete file
export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file info
export const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// File serving middleware for uploaded files
export const serveUploadedFile = (req, res, next) => {
  const { category, filename } = req.params;
  
  if (!uploadDirs[category]) {
    return res.status(404).json({
      success: false,
      message: 'Invalid file category',
      code: 'INVALID_CATEGORY'
    });
  }
  
  const filePath = path.join(uploadDirs[category], filename);
  
  // Security check: ensure file is within upload directory
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDirs[category]);
  
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }
  
  // Serve the file
  res.sendFile(resolvedPath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }
      
      console.error('File serving error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error serving file',
        code: 'FILE_SERVE_ERROR'
      });
    }
  });
};

export default {
  uploadProfile,
  uploadDocument,
  uploadOrderPhotos,
  uploadVideo,
  uploadTemp,
  handleUploadError,
  validateUploadedFiles,
  cleanupFiles,
  resizeImage,
  deleteFile,
  getFileInfo,
  serveUploadedFile
};