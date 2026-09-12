/**
 * AWS Configuration
 * 
 * Centralized configuration for AWS services.
 * In production, these values should come from environment variables.
 */

export const AWS_CONFIG = {
  // S3 Configuration
  S3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    // Fallback to hardcoded bucket name if env var not available
    // In React Native, env vars need to be set at build time
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'indianpgmanagement',
  },
  
  // File upload limits
  LIMITS: {
    maxImageSizeMB: 10,
    maxDocumentSizeMB: 20,
    maxVideoSizeMB: 100,
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  },
  
  // Folder structure
  FOLDERS: {
    tenants: {
      images: 'tenants/images',
      documents: 'tenants/documents',
      contracts: 'tenants/contracts',
    },
    pgLocations: {
      images: 'pg-locations/images',
      documents: 'pg-locations/documents',
      floorPlans: 'pg-locations/floor-plans',
    },
    expenses: {
      receipts: 'expenses/receipts',
      invoices: 'expenses/invoices',
    },
    employees: {
      images: 'employees/images',
      documents: 'employees/documents',
    },
    rooms: {
      images: 'rooms/images',
    },
    beds: {
      images: 'beds/images',
    },
    visitors: {
      images: 'visitors/images',
      documents: 'visitors/documents',
    },
    tickets: {
      attachments: 'tickets/attachments',
    },
    organization: {
      logo: 'organization/logo',
      documents: 'organization/documents',
    },
    temp: 'temp', // For temporary files
    archive: 'archive', // For archived files
  },
  
  // Default settings
  DEFAULTS: {
    imageQuality: 0.8,
    thumbnailSize: { width: 200, height: 200 },
    signedUrlExpiry: 3600, // 1 hour in seconds
    isPublic: true,
  },
};

// Environment-specific configurations
export const getAWSConfig = () => {
  // In a real app, you might want to use different configs for dev/staging/prod
  const environment: string = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return {
        ...AWS_CONFIG,
        // Override with production-specific settings if needed
      };
    case 'staging':
      return {
        ...AWS_CONFIG,
        // Override with staging-specific settings if needed
      };
    default:
      return AWS_CONFIG;
  }
};

// Utility functions for configuration
export const getS3Config = () => getAWSConfig().S3;
export const getFolderConfig = () => getAWSConfig().FOLDERS;
export const getLimitsConfig = () => getAWSConfig().LIMITS;
export const getDefaultsConfig = () => getAWSConfig().DEFAULTS;

// Validation functions
export const validateFileType = (contentType: string, category: 'image' | 'document' | 'video'): boolean => {
  const limits = getLimitsConfig();
  
  switch (category) {
    case 'image':
      return limits.allowedImageTypes.includes(contentType);
    case 'document':
      return limits.allowedDocumentTypes.includes(contentType);
    case 'video':
      return limits.allowedVideoTypes.includes(contentType);
    default:
      return false;
  }
};

export const validateFileSize = (sizeInBytes: number, category: 'image' | 'document' | 'video'): boolean => {
  const limits = getLimitsConfig();
  const sizeMB = sizeInBytes / (1024 * 1024);
  
  switch (category) {
    case 'image':
      return sizeMB <= limits.maxImageSizeMB;
    case 'document':
      return sizeMB <= limits.maxDocumentSizeMB;
    case 'video':
      return sizeMB <= limits.maxVideoSizeMB;
    default:
      return false;
  }
};

export default AWS_CONFIG;
