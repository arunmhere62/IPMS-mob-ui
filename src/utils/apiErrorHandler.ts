import { ApiError } from '../components/ErrorAlert/ErrorAlert';

/**
 * Error code mappings for user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // 4xx Errors
  'ERR_001': 'Invalid request. Please check your input.',
  'ERR_002': 'Resource not found.',
  'ERR_003': 'Unauthorized. Please log in again.',
  'ERR_004': 'Forbidden. You do not have permission.',
  'ERR_005': 'This resource already exists.',
  'ERR_006': 'Validation failed. Please check your input.',
  'ERR_007': 'Too many requests. Please try again later.',

  // 5xx Errors
  'ERR_500': 'Server error. Please try again later.',
  'ERR_501': 'Service unavailable. Please try again later.',

  // Network Errors
  'NETWORK_ERROR': 'Network error. Please check your connection.',
  'TIMEOUT': 'Request timeout. Please try again.',
  'UNKNOWN_ERROR': 'An unexpected error occurred.',

  // Specific Errors
  'ALREADY_EXISTS': 'This record already exists.',
  'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
  'VALIDATION_ERROR': 'Validation failed. Please check your input.',
  'UNAUTHORIZED': 'You are not authorized to perform this action.',
  'FORBIDDEN': 'You do not have permission to access this resource.',
  'CONFLICT': 'There is a conflict with the current state.',
  'DATABASE_ERROR': 'Database error occurred. Please try again.',
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: ApiError | unknown): string => {
  const err = (error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined);
  // If it's already an ApiError with a message
  if (typeof err?.message === 'string') {
    return err.message;
  }

  // Try to get from error code
  const innerError = err?.error;
  if (innerError && typeof innerError === 'object') {
    const innerObj = innerError as Record<string, unknown>;
    if (typeof innerObj.code === 'string') {
      return ERROR_MESSAGES[innerObj.code] || innerObj.code;
    }
  }

  // Default message based on status code
  const response = err?.response;
  const responseStatus =
    response && typeof response === 'object' ? (response as Record<string, unknown>).status : undefined;
  const statusCodeRaw = err?.statusCode ?? responseStatus;
  const statusCode = typeof statusCodeRaw === 'number' ? statusCodeRaw : undefined;
  if (typeof statusCode === 'number') {
    if (statusCode === 401) return 'Please log in to continue.';
    if (statusCode === 403) return 'You do not have permission.';
    if (statusCode === 404) return 'The requested resource was not found.';
    if (statusCode === 409) return 'There is a conflict with the current state.';
    if (statusCode >= 500) return 'Server error. Please try again later.';
    if (statusCode >= 400) return 'Invalid request. Please try again.';
  }

  return 'An unexpected error occurred.';
};

/**
 * Get error title based on status code
 */
export const getErrorTitle = (statusCode: number): string => {
  if (statusCode === 400) return 'Bad Request';
  if (statusCode === 401) return 'Unauthorized';
  if (statusCode === 403) return 'Forbidden';
  if (statusCode === 404) return 'Not Found';
  if (statusCode === 409) return 'Conflict';
  if (statusCode === 422) return 'Validation Error';
  if (statusCode === 429) return 'Too Many Requests';
  if (statusCode >= 500) return 'Server Error';
  return 'Error';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ApiError | unknown): boolean => {
  const err = (error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined);
  const response = err?.response;
  const responseStatus =
    response && typeof response === 'object' ? (response as Record<string, unknown>).status : undefined;
  const statusCodeRaw = err?.statusCode ?? responseStatus;
  const statusCode = typeof statusCodeRaw === 'number' ? statusCodeRaw : undefined;
  
  // Retryable status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  
  // Network errors are retryable
  if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error') {
    return true;
  }

  return typeof statusCode === 'number' ? retryableStatuses.includes(statusCode) : false;
};

/**
 * Format error details for logging
 */
export const formatErrorForLogging = (error: ApiError | unknown): string => {
  const err = (error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined);
  const response = err?.response;
  const responseStatus =
    response && typeof response === 'object' ? (response as Record<string, unknown>).status : undefined;
  const innerError = err?.error;
  const innerCode =
    innerError && typeof innerError === 'object' ? (innerError as Record<string, unknown>).code : undefined;

  const details = {
    message: err?.message,
    statusCode: err?.statusCode ?? responseStatus,
    errorCode: innerCode,
    path: err?.path,
    timestamp: err?.timestamp,
  };

  return JSON.stringify(details, null, 2);
};

/**
 * Extract field-specific validation errors
 */
export const getValidationErrors = (error: ApiError | unknown): Record<string, string> => {
  const err = (error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined);
  const innerError = err?.error;
  const details =
    innerError && typeof innerError === 'object' ? (innerError as Record<string, unknown>).details : undefined;
  if (!details) {
    return {};
  }
  
  // If details is an array (common for validation errors)
  if (Array.isArray(details)) {
    const fieldErrors: Record<string, string> = {};
    details.forEach((err: unknown) => {
      if (!err || typeof err !== 'object') return;
      const obj = err as Record<string, unknown>;
      const field = obj.field;
      const message = obj.message;
      if (typeof field === 'string' && typeof message === 'string') {
        fieldErrors[field] = message;
      }
    });
    return fieldErrors;
  }

  // If details is an object
  if (typeof details === 'object') {
    return details as Record<string, string>;
  }

  return {};
};
