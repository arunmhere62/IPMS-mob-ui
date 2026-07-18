import {
  showSuccessAlert,
  showErrorAlert,
  categorizeError,
  retryWithBackoff,
  handleGlobalError,
  setupGlobalErrorHandlers,
  ErrorInfo,
} from '../errorHandler';
import { Alert } from 'react-native';
import { showToast } from '../toastService';

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  __DEV__: true,
}));

jest.mock('../toastService', () => ({
  showToast: jest.fn(),
}));

jest.mock('../apiResponseHandler', () => ({
  getApiErrorMessage: jest.fn(() => 'API error message'),
}));

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('showSuccessAlert', () => {
    it('shows alert with string message', () => {
      showSuccessAlert('Operation successful');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation successful');
    });

    it('shows alert with custom title', () => {
      showSuccessAlert('Operation successful', { title: 'Custom Title' });
      expect(Alert.alert).toHaveBeenCalledWith('Custom Title', 'Operation successful');
    });

    it('shows alert with custom ok text', () => {
      showSuccessAlert('Operation successful', { okText: 'Done' });
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation successful', [
        { text: 'Done', onPress: undefined },
      ]);
    });

    it('calls onOk callback when provided', () => {
      const onOk = jest.fn();
      showSuccessAlert('Operation successful', { onOk });
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation successful', [
        { text: 'OK', onPress: onOk },
      ]);
    });

    it('extracts message from API response object with message field', () => {
      const response = { success: true, message: 'API success message' };
      showSuccessAlert(response);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'API success message');
    });

    it('extracts message from API response object with nested data.message', () => {
      const response = { data: { message: 'Nested message' } };
      showSuccessAlert(response);
      expect(Alert.alert).toHaveBeenCalledWith('Complete', 'Nested message');
    });

    it('uses default message when no message found in object', () => {
      showSuccessAlert({ data: {} });
      expect(Alert.alert).toHaveBeenCalledWith('Complete', 'Operation completed successfully');
    });

    it('uses success title when response has success: true', () => {
      const response = { success: true, message: 'Success' };
      showSuccessAlert(response);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Success');
    });

    it('uses complete title when response has no success field', () => {
      const response = { message: 'Done' };
      showSuccessAlert(response);
      expect(Alert.alert).toHaveBeenCalledWith('Complete', 'Done');
    });

    it('shows toast when handler is available', () => {
      (showToast as jest.Mock).mockReturnValue(true);
      showSuccessAlert('Operation successful');
      expect(showToast).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Operation successful',
        variant: 'success',
      });
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('falls back to alert when toast handler is not available', () => {
      (showToast as jest.Mock).mockReturnValue(false);
      showSuccessAlert('Operation successful');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation successful');
    });

    it('handles null input', () => {
      showSuccessAlert(null);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation completed successfully');
    });

    it('handles undefined input', () => {
      showSuccessAlert(undefined);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation completed successfully');
    });

    it('handles number input', () => {
      showSuccessAlert(123);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation completed successfully');
    });

    it('handles error in try-catch and falls back to safe message', () => {
      (Alert.alert as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Alert error');
      });
      showSuccessAlert('Test message');
      // Should call alert again with fallback
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });

    it('handles empty string message', () => {
      showSuccessAlert('');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Operation completed successfully');
    });
  });

  describe('showErrorAlert', () => {
    it('shows alert with string error', () => {
      showErrorAlert('Error message');
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error message');
    });

    it('shows alert with custom title', () => {
      showErrorAlert('Error message', 'Custom Error');
      expect(Alert.alert).toHaveBeenCalledWith('Custom Error', 'Error message');
    });

    it('extracts message from error object with message field', () => {
      const error = { message: 'Error occurred' };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error occurred');
    });

    it('extracts message from nested data.message', () => {
      const error = { data: { message: 'Nested error' } };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Nested error');
    });

    it('extracts message from error.error string', () => {
      const error = { error: 'Error string' };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error string');
    });

    it('extracts message from error.error.message', () => {
      const error = { error: { message: 'Error object message' } };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error object message');
    });

    it('extracts message from errors array', () => {
      const error = { errors: [{ message: 'First error' }] };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'First error');
    });

    it('extracts string from errors array', () => {
      const error = { errors: ['String error'] };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'String error');
    });

    it('handles RTK Query error structure', () => {
      const error = {
        data: { message: 'RTK error' },
      };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'RTK error');
    });

    it('handles HTTP client error structure', () => {
      const error = {
        response: { data: { message: 'HTTP error' } },
      };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'HTTP error');
    });

    it('handles error object with error object containing code/details', () => {
      const error = {
        data: { error: { code: 'ERR_001', details: 'Details' } },
      };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('handles errors object (not array)', () => {
      const error = { errors: 'Errors string' };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Errors string');
    });

    it('falls back to error.message when no other message found', () => {
      const error = { message: 'Fallback message' };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Fallback message');
    });

    it('stringifies error when no message found', () => {
      const error = { code: 'ERR_001' };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });

    it('handles null error', () => {
      showErrorAlert(null);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'An error occurred. Please try again.');
    });

    it('handles undefined error', () => {
      showErrorAlert(undefined);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'An error occurred. Please try again.');
    });

    it('handles error in try-catch and shows fallback', () => {
      (Alert.alert as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Alert error');
      });
      showErrorAlert('Test error');
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });

    it('handles deeply nested error structures', () => {
      const error = {
        data: {
          error: {
            data: {
              message: 'Deeply nested',
            },
          },
        },
      };
      showErrorAlert(error);
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('categorizeError', () => {
    it('categorizes network error', () => {
      const error = { code: 'ERR_NETWORK' };
      const result = categorizeError(error);
      expect(result.type).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('No internet connection. Please check your network.');
    });

    it('categorizes network error with Network Error message', () => {
      const error = { message: 'Network Error' };
      const result = categorizeError(error);
      expect(result.type).toBe('network');
      expect(result.isRetryable).toBe(true);
    });

    it('categorizes timeout error with ECONNABORTED code', () => {
      const error = { code: 'ECONNABORTED' };
      const result = categorizeError(error);
      expect(result.type).toBe('timeout');
      expect(result.isRetryable).toBe(true);
      expect(result.message).toBe('Request timed out. Server is taking too long to respond.');
    });

    it('categorizes timeout error with timeout in message', () => {
      const error = { message: 'Request timeout' };
      const result = categorizeError(error);
      expect(result.type).toBe('timeout');
      expect(result.isRetryable).toBe(true);
    });

    it('categorizes server error (500)', () => {
      const error = { status: 500 };
      const result = categorizeError(error);
      expect(result.type).toBe('server');
      expect(result.isRetryable).toBe(true);
      expect(result.statusCode).toBe(500);
    });

    it('categorizes server error (502)', () => {
      const error = { status: 502 };
      const result = categorizeError(error);
      expect(result.type).toBe('server');
      expect(result.isRetryable).toBe(true);
    });

    it('categorizes server error (503)', () => {
      const error = { status: 503 };
      const result = categorizeError(error);
      expect(result.type).toBe('server');
      expect(result.isRetryable).toBe(true);
    });

    it('categorizes client error (400)', () => {
      const error = { status: 400 };
      const result = categorizeError(error);
      expect(result.type).toBe('client');
      expect(result.isRetryable).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it('categorizes client error (404)', () => {
      const error = { status: 404 };
      const result = categorizeError(error);
      expect(result.type).toBe('client');
      expect(result.isRetryable).toBe(false);
    });

    it('extracts message from response data for client error', () => {
      const error = {
        status: 400,
        data: { message: 'Validation failed' },
      };
      const result = categorizeError(error);
      expect(result.message).toBe('Validation failed');
    });

    it('categorizes unknown error', () => {
      const error = { message: 'Unknown error' };
      const result = categorizeError(error);
      expect(result.type).toBe('unknown');
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Unknown error');
    });

    it('handles error with response.status', () => {
      const error = { response: { status: 500 } };
      const result = categorizeError(error);
      expect(result.type).toBe('server');
      expect(result.statusCode).toBe(500);
    });

    it('handles error with response.data', () => {
      const error = {
        response: { data: { message: 'Response error' } },
        status: 400,
      };
      const result = categorizeError(error);
      expect(result.message).toBe('Response error');
    });

    it('handles null error', () => {
      const result = categorizeError(null);
      expect(result.type).toBe('unknown');
      expect(result.isRetryable).toBe(false);
    });

    it('handles undefined error', () => {
      const result = categorizeError(undefined);
      expect(result.type).toBe('unknown');
      expect(result.isRetryable).toBe(false);
    });

    it('handles string error', () => {
      const result = categorizeError('String error');
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('String error');
    });

    it('preserves original error in result', () => {
      const error = { message: 'Test error' };
      const result = categorizeError(error);
      expect(result.originalError).toBe(error);
    });

    it('handles error with no message', () => {
      const error = { code: 'ERR_001' };
      const result = categorizeError(error);
      expect(result.message).toBe('An unexpected error occurred.');
    });
  });

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not retry on non-retryable error', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 400 });
      await expect(retryWithBackoff(fn, { maxRetries: 3 })).rejects.toEqual({ status: 400 });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('uses default options when not provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
    });

    it('handles zero maxRetries', async () => {
      const fn = jest.fn().mockRejectedValue({ code: 'ECONNABORTED' });
      await expect(retryWithBackoff(fn, { maxRetries: 0 })).rejects.toEqual({ code: 'ECONNABORTED' });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('handles negative maxRetries', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, { maxRetries: -1 });
      expect(result).toBe('success');
    });
  });

  describe('handleGlobalError', () => {
    it('logs network error', () => {
      const error = { code: 'ERR_NETWORK' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = handleGlobalError(error, 'Test Context');
      expect(result.type).toBe('network');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[NETWORK Error - Test Context]:',
        'No internet connection. Please check your network.'
      );
      consoleErrorSpy.mockRestore();
    });

    it('logs error with response details', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' },
          headers: { 'content-type': 'application/json' },
        },
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      handleGlobalError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Response Error:', expect.any(Object));
      consoleErrorSpy.mockRestore();
    });

    it('logs error with request details', () => {
      const error = { request: { url: '/api/test' } };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      handleGlobalError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Request Error:', error.request);
      consoleErrorSpy.mockRestore();
    });

    it('logs error message', () => {
      const error = { message: 'Error message' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      handleGlobalError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error Message:', 'Error message');
      consoleErrorSpy.mockRestore();
    });

    it('logs stack trace in development', () => {
      const error = { message: 'Error', stack: 'Error stack trace' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      handleGlobalError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack Trace:', 'Error stack trace');
      consoleErrorSpy.mockRestore();
    });

    it('handles error without context', () => {
      const error = { message: 'Test error' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      handleGlobalError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[UNKNOWN Error]:', 'Test error');
      consoleErrorSpy.mockRestore();
    });

    it('handles null error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = handleGlobalError(null);
      expect(result.type).toBe('unknown');
      consoleErrorSpy.mockRestore();
    });

    it('returns error info', () => {
      const error = { message: 'Test error' };
      const result = handleGlobalError(error);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('isRetryable');
      expect(result).toHaveProperty('originalError');
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('sets up global error handler when ErrorUtils exists', () => {
      const globalAny = global as any;
      globalAny.ErrorUtils = {
        getGlobalHandler: jest.fn(() => jest.fn()),
        setGlobalHandler: jest.fn(),
      };
      
      setupGlobalErrorHandlers();
      
      expect(globalAny.ErrorUtils.setGlobalHandler).toHaveBeenCalled();
      
      delete globalAny.ErrorUtils;
    });

    it('handles missing ErrorUtils gracefully', () => {
      const globalAny = global as any;
      delete globalAny.ErrorUtils;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() => setupGlobalErrorHandlers()).not.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('sets up unhandled rejection handler when addEventListener exists', () => {
      const globalAny = global as any;
      globalAny.addEventListener = jest.fn();
      
      setupGlobalErrorHandlers();
      
      expect(globalAny.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      
      delete globalAny.addEventListener;
    });

    it('handles missing addEventListener gracefully', () => {
      const globalAny = global as any;
      delete globalAny.addEventListener;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() => setupGlobalErrorHandlers()).not.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('logs success message when setup completes', () => {
      const globalAny = global as any;
      globalAny.ErrorUtils = {
        getGlobalHandler: jest.fn(() => jest.fn()),
        setGlobalHandler: jest.fn(),
      };
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      setupGlobalErrorHandlers();
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Global error handlers initialized');
      consoleLogSpy.mockRestore();
      
      delete globalAny.ErrorUtils;
    });

    it('logs error when setup fails', () => {
      const globalAny = global as any;
      globalAny.ErrorUtils = {
        getGlobalHandler: () => {
          throw new Error('Setup failed');
        },
        setGlobalHandler: jest.fn(),
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      setupGlobalErrorHandlers();
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to setup global error handlers:', expect.any(Error));
      consoleErrorSpy.mockRestore();
      
      delete globalAny.ErrorUtils;
    });
  });
});
