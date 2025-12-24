import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { getApiErrorMessage } from './apiResponseHandler';

export type ErrorType = 'network' | 'timeout' | 'server' | 'client' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  isRetryable: boolean;
  statusCode?: number;
  originalError: any;
}

/**
 * Show success alert
 * Can accept either a message string or an API response object
 */
export const showSuccessAlert = (messageOrResponse: string | any, title?: string): void => {
  try {
    let message: string;
    let alertTitle: string;
    
    if (typeof messageOrResponse === 'string') {
      // Direct message string
      message = messageOrResponse;
      alertTitle = title || 'Success';
    } else if (messageOrResponse && typeof messageOrResponse === 'object') {
      // API response object - extract message from response structure
      console.log('showSuccessAlert received object:', messageOrResponse);
      
      // Try to get message from various possible locations
      if (messageOrResponse.message) {
        message = messageOrResponse.message;
      } else if (messageOrResponse.data && messageOrResponse.data.message) {
        message = messageOrResponse.data.message;
      } else {
        message = 'Operation completed successfully';
      }
      alertTitle = title || (messageOrResponse.success ? 'Success' : 'Complete');
    } else {
      message = 'Operation completed successfully';
      alertTitle = title || 'Success';
    }
    
    console.log('Final message for alert:', message);
    Alert.alert(alertTitle, message);
  } catch (e) {
    console.error('Error in showSuccessAlert:', e);
    Alert.alert(title || 'Success', typeof messageOrResponse === 'string' ? messageOrResponse : 'Operation completed successfully');
  }
};

/**
 * Show error alert from backend response
 * Uses API response handler for new centralized response structure
 */
export const showErrorAlert = (error: any, title: string = 'Error'): void => {
  let errorMessage = '';
  
  try {
    if (typeof error === 'string') {
      Alert.alert(title, error);
      return;
    }

    const rtkData = (error as any)?.data ?? (error as any)?.error?.data;
    const axiosData = (error as any)?.response?.data;
    const candidateData = rtkData ?? axiosData ?? error;

    // First try to use API response handler for new structure
    if (candidateData) {
      errorMessage = getApiErrorMessage(candidateData);
    }
    
    // Fallback to legacy error extraction if API handler didn't find message
    if (!errorMessage) {
      if (candidateData) {
        const data = candidateData;
        
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data?.message && typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data?.error) {
          // Handle case where error is an object with code/details
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error?.message) {
            errorMessage = data.error.message;
          }
        } else if (data?.errors) {
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors[0]?.message || data.errors[0] || '';
          } else {
            errorMessage = data.errors;
          }
        }
      }
      
      // Fallback to error message
      if (!errorMessage && error?.message) {
        errorMessage = error.message;
      }

      if (!errorMessage && typeof (error as any)?.error === 'string') {
        errorMessage = (error as any).error;
      }
      
      // Last resort - stringify the error
      if (!errorMessage) {
        errorMessage = JSON.stringify(candidateData) || 'An error occurred. Please try again.';
      }
    }
    
    Alert.alert(title, errorMessage);
  } catch (e) {
    console.error('Error in showErrorAlert:', e);
    Alert.alert(title, 'An error occurred. Please try again.');
  }
};

/**
 * Categorize error type
 */
export const categorizeError = (error: any): ErrorInfo => {
  const axiosError = error as AxiosError;
  
  // Network errors (no response from server)
  if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
    return {
      type: 'network',
      message: 'No internet connection. Please check your network.',
      isRetryable: true,
      originalError: error,
    };
  }
  
  // Timeout errors
  if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Server is taking too long to respond.',
      isRetryable: true,
      originalError: error,
    };
  }
  
  // Server errors (5xx)
  if (axiosError.response?.status && axiosError.response.status >= 500) {
    return {
      type: 'server',
      message: 'Server error. Please try again later.',
      isRetryable: true,
      statusCode: axiosError.response.status,
      originalError: error,
    };
  }
  
  // Client errors (4xx)
  if (axiosError.response?.status && axiosError.response.status >= 400) {
    return {
      type: 'client',
      message: (axiosError.response.data as any)?.message || 'Request failed. Please check your input.',
      isRetryable: false,
      statusCode: axiosError.response.status,
      originalError: error,
    };
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: error?.message || 'An unexpected error occurred.',
    isRetryable: false,
    originalError: error,
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = categorizeError(error);
      
      // Don't retry if error is not retryable or this is the last attempt
      if (!errorInfo.isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Global error handler that logs errors and optionally opens network logger
 */
export const handleGlobalError = (error: any, context?: string) => {
  const errorInfo = categorizeError(error);
  
  console.error(`[${errorInfo.type.toUpperCase()} Error${context ? ` - ${context}` : ''}]:`, errorInfo.message);
  
  // Log error details
  if (error?.response) {
    console.error('Response Error:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error?.request) {
    console.error('Request Error:', error.request);
  } else {
    console.error('Error Message:', error?.message || error);
  }
  
  // Stack trace in development
  if (__DEV__ && error?.stack) {
    console.error('Stack Trace:', error.stack);
  }
  
  return errorInfo;
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = () => {
  try {
    // Log all promise rejections
    const globalAny = global as any;
    
    if (typeof globalAny.ErrorUtils !== 'undefined') {
      const originalErrorHandler = globalAny.ErrorUtils.getGlobalHandler();
      
      globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        console.error('🔴 Global Error Caught:', error, 'Fatal:', isFatal);
        handleGlobalError(error, 'Global Handler');
        
        // Call original handler
        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      });
    }
    
    // Handle unhandled promise rejections
    if (typeof globalAny.addEventListener === 'function') {
      globalAny.addEventListener('unhandledrejection', (event: any) => {
        console.error('🔴 Unhandled Promise Rejection:', event.reason);
        handleGlobalError(event.reason, 'Promise Rejection');
      });
    }
    
    console.log('✅ Global error handlers initialized');
  } catch (error) {
    console.error('❌ Failed to setup global error handlers:', error);
  }
};
