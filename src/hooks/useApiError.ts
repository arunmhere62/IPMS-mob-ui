import { useState, useCallback } from 'react';
import { ApiError } from '../components/ErrorAlert/ErrorAlert';

interface UseApiErrorReturn {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleApiError: (error: any) => void;
}

export const useApiError = (): UseApiErrorReturn => {
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((error: any) => {
    // Handle HTTP error response
    if (error?.response?.data) {
      const apiError = error.response.data as ApiError;
      setError(apiError);
    }
    // Handle network error
    else if (error?.message === 'Network Error') {
      setError({
        success: false,
        statusCode: 0,
        message: 'Network error. Please check your connection.',
        error: {
          code: 'NETWORK_ERROR',
        },
        timestamp: new Date().toISOString(),
        path: '',
      });
    }
    // Handle timeout
    else if (error?.code === 'ECONNABORTED') {
      setError({
        success: false,
        statusCode: 408,
        message: 'Request timeout. Please try again.',
        error: {
          code: 'TIMEOUT',
        },
        timestamp: new Date().toISOString(),
        path: '',
      });
    }
    // Handle generic error
    else {
      setError({
        success: false,
        statusCode: error?.response?.status || 500,
        message: error?.message || 'An unexpected error occurred',
        error: {
          code: 'UNKNOWN_ERROR',
        },
        timestamp: new Date().toISOString(),
        path: '',
      });
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleApiError,
  };
};
