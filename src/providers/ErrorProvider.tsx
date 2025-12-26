import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApiError } from '../components/ErrorAlert/ErrorAlert';

interface ErrorContextType {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  showError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showError = useCallback((error: any) => {
    // Handle API error response
    if (error?.response?.data?.success === false) {
      setError(error.response.data as ApiError);
    }
    // Handle HTTP client error
    else if (error?.response?.status) {
      setError({
        success: false,
        statusCode: error.response.status,
        message: error.response.data?.message || error.message || 'An error occurred',
        error: error.response.data?.error,
        timestamp: new Date().toISOString(),
        path: error.config?.url || '',
      });
    }
    // Handle network error
    else if (error?.message === 'Network Error') {
      setError({
        success: false,
        statusCode: 0,
        message: 'Network error. Please check your connection.',
        error: { code: 'NETWORK_ERROR' },
        timestamp: new Date().toISOString(),
        path: '',
      });
    }
    // Handle generic error
    else {
      setError({
        success: false,
        statusCode: 500,
        message: error?.message || 'An unexpected error occurred',
        error: { code: 'UNKNOWN_ERROR' },
        timestamp: new Date().toISOString(),
        path: '',
      });
    }
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        error,
        setError,
        clearError,
        showError,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};
