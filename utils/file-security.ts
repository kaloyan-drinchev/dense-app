import { Alert } from 'react-native';

// File upload security constants
export const FILE_SECURITY = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB for images
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mov', 'video/avi'],
  MAX_FILENAME_LENGTH: 100,
  DANGEROUS_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'],
};

// Validate file size
export const validateFileSize = (fileSize: number, maxSize: number = FILE_SECURITY.MAX_FILE_SIZE): boolean => {
  if (fileSize > maxSize) {
    Alert.alert(
      'File Too Large',
      `Please select a file smaller than ${Math.round(maxSize / (1024 * 1024))}MB`
    );
    return false;
  }
  return true;
};

// Validate file type
export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    Alert.alert(
      'Invalid File Type',
      `Please select a valid file type: ${allowedTypes.join(', ')}`
    );
    return false;
  }
  return true;
};

// Validate filename
export const validateFilename = (filename: string): boolean => {
  // Check filename length
  if (filename.length > FILE_SECURITY.MAX_FILENAME_LENGTH) {
    Alert.alert('Invalid Filename', 'Filename is too long');
    return false;
  }

  // Check for dangerous extensions
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (FILE_SECURITY.DANGEROUS_EXTENSIONS.includes(extension)) {
    Alert.alert('Invalid File Type', 'This file type is not allowed for security reasons');
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = ['<script', 'javascript:', 'data:', 'vbscript:'];
  if (suspiciousPatterns.some(pattern => filename.toLowerCase().includes(pattern))) {
    Alert.alert('Invalid Filename', 'Filename contains suspicious content');
    return false;
  }

  return true;
};

// Comprehensive file validation
export const validateFile = (
  file: { 
    uri: string; 
    fileSize?: number; 
    mimeType?: string; 
    fileName?: string;
  },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    isImage?: boolean;
  } = {}
): boolean => {
  const { maxSize, allowedTypes, isImage } = options;

  // Validate file size
  if (file.fileSize && !validateFileSize(file.fileSize, maxSize)) {
    return false;
  }

  // Validate file type
  if (file.mimeType && allowedTypes && !validateFileType(file.mimeType, allowedTypes)) {
    return false;
  }

  // Validate filename
  if (file.fileName && !validateFilename(file.fileName)) {
    return false;
  }

  // Additional image-specific validation
  if (isImage && file.mimeType) {
    if (!FILE_SECURITY.ALLOWED_IMAGE_TYPES.includes(file.mimeType.toLowerCase())) {
      Alert.alert('Invalid Image Type', 'Please select a valid image file (JPEG, PNG, WebP)');
      return false;
    }
  }

  return true;
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, FILE_SECURITY.MAX_FILENAME_LENGTH); // Limit length
};

// Get file extension safely
export const getFileExtension = (filename: string): string => {
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return extension || '';
};

// Check if file is image
export const isImageFile = (mimeType: string): boolean => {
  return FILE_SECURITY.ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
};

// Check if file is video
export const isVideoFile = (mimeType: string): boolean => {
  return FILE_SECURITY.ALLOWED_VIDEO_TYPES.includes(mimeType.toLowerCase());
};
