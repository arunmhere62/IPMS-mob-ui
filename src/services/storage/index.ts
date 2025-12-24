/**
 * Storage Services - Unified Exports
 * 
 * Use imageUploadService for all new implementations
 * Legacy services kept for backward compatibility
 */

// Legacy Service (Backward Compatibility)
export { awsS3ServiceBackend, S3Utils, type UploadResult as S3UploadResult, type DeleteResult as S3DeleteResult } from './awsS3ServiceBackend';
