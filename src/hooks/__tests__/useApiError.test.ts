import { renderHook, act } from '@testing-library/react-native';
import { useApiError } from '../useApiError';
import { ApiError } from '../../components/ErrorAlert/ErrorAlert';

describe('useApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null error', () => {
    const { result } = renderHook(() => useApiError());
    expect(result.current.error).toBeNull();
  });

  it('sets error manually', () => {
    const { result } = renderHook(() => useApiError());
    const mockError: ApiError = {
      success: false,
      statusCode: 400,
      message: 'Test error',
      error: { code: 'ERR_001' },
      timestamp: new Date().toISOString(),
      path: '/test',
    };

    act(() => {
      result.current.setError(mockError);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('clears error', () => {
    const { result } = renderHook(() => useApiError());
    const mockError: ApiError = {
      success: false,
      statusCode: 400,
      message: 'Test error',
      error: { code: 'ERR_001' },
      timestamp: new Date().toISOString(),
      path: '/test',
    };

    act(() => {
      result.current.setError(mockError);
    });

    expect(result.current.error).toEqual(mockError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles HTTP error response with data', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: {
        data: {
          success: false,
          statusCode: 404,
          message: 'Not found',
          error: { code: 'ERR_002' },
          timestamp: new Date().toISOString(),
          path: '/test',
        },
      },
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual(error.response.data);
  });

  it('handles network error', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 'Network Error' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 0,
      message: 'Network error. Please check your connection.',
      error: { code: 'NETWORK_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles timeout error', () => {
    const { result } = renderHook(() => useApiError());
    const error = { code: 'ECONNABORTED' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 408,
      message: 'Request timeout. Please try again.',
      error: { code: 'TIMEOUT' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles generic error with message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 'Generic error' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 500,
      message: 'Generic error',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles generic error without message', () => {
    const { result } = renderHook(() => useApiError());
    const error = {};

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles error with response.status', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: 403 },
      message: 'Forbidden',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 403,
      message: 'Forbidden',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles null error', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.handleApiError(null);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles undefined error', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.handleApiError(undefined);
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles string error', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.handleApiError('String error');
    });

    expect(result.current.error).toEqual({
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred',
      error: { code: 'UNKNOWN_ERROR' },
      timestamp: expect.any(String),
      path: '',
    });
  });

  it('handles error with nested error object', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: {
        data: {
          success: false,
          statusCode: 401,
          message: 'Unauthorized',
          error: { code: 'ERR_003' },
          timestamp: new Date().toISOString(),
          path: '/test',
        },
      },
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual(error.response.data);
  });

  it('clearError is memoized', () => {
    const { result } = renderHook(() => useApiError());
    const clearError1 = result.current.clearError;
    const clearError2 = result.current.clearError;
    expect(clearError1).toBe(clearError2);
  });

  it('handleApiError is memoized', () => {
    const { result } = renderHook(() => useApiError());
    const handleApiError1 = result.current.handleApiError;
    const handleApiError2 = result.current.handleApiError;
    expect(handleApiError1).toBe(handleApiError2);
  });

  it('handles error with response.status 0', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: 0 },
      message: 'Network error',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500); // 0 is invalid HTTP status, falls back to 500
  });

  it('handles error with response.status negative', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: -1 },
      message: 'Invalid status',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500); // -1 is invalid HTTP status, falls back to 500
  });

  it('handles error with response.status very large', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: 9999 },
      message: 'Invalid status',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500); // 9999 is invalid HTTP status, falls back to 500
  });

  it('handles error with NaN status', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: NaN },
      message: 'NaN status',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500); // NaN is invalid HTTP status, falls back to 500
  });

  it('handles error with Infinity status', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: Infinity },
      message: 'Infinity status',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500); // Infinity is invalid HTTP status, falls back to 500
  });

  it('handles error with empty message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: '' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe(''); // Empty string is now preserved
  });

  it('handles error with very long message', () => {
    const { result } = renderHook(() => useApiError());
    const longMessage = 'x'.repeat(10000);
    const error = { message: longMessage };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe(longMessage);
  });

  it('handles error with special characters in message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 'Error with special chars: \n\t\r<>&"\'🚀' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('Error with special chars: \n\t\r<>&"\'🚀');
  });

  it('handles error with Unicode in message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 'Error with emoji 🚀 and unicode 中文' };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('Error with emoji 🚀 and unicode 中文');
  });

  it('handles error with null message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: null };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('An unexpected error occurred');
  });

  it('handles error with undefined message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: undefined };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('An unexpected error occurred');
  });

  it('handles error with number message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 404 };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('404'); // Number is converted to string
  });

  it('handles error with object message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: { nested: 'error' } };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('[object Object]'); // Object is converted to string
  });

  it('handles error with array message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: ['error1', 'error2'] };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('error1,error2'); // Array is converted to string
  });

  it('handles error with boolean message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: true };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('true'); // Boolean is converted to string
  });

  it('handles error with zero message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: 0 };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('0'); // 0 is converted to string
  });

  it('handles error with false message', () => {
    const { result } = renderHook(() => useApiError());
    const error = { message: false };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.message).toBe('false'); // false is converted to string
  });

  it('handles multiple consecutive errors', () => {
    const { result } = renderHook(() => useApiError());
    const error1 = { message: 'Error 1' };
    const error2 = { message: 'Error 2' };
    const error3 = { message: 'Error 3' };

    act(() => {
      result.current.handleApiError(error1);
    });
    expect(result.current.error?.message).toBe('Error 1');

    act(() => {
      result.current.handleApiError(error2);
    });
    expect(result.current.error?.message).toBe('Error 2');

    act(() => {
      result.current.handleApiError(error3);
    });
    expect(result.current.error?.message).toBe('Error 3');
  });

  it('handles setting error to null manually', () => {
    const { result } = renderHook(() => useApiError());
    const mockError: ApiError = {
      success: false,
      statusCode: 400,
      message: 'Test error',
      error: { code: 'ERR_001' },
      timestamp: new Date().toISOString(),
      path: '/test',
    };

    act(() => {
      result.current.setError(mockError);
    });

    expect(result.current.error).toEqual(mockError);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('handles error with both response.data and response.status', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: {
        data: {
          success: false,
          statusCode: 500,
          message: 'Server error',
          error: { code: 'ERR_500' },
          timestamp: new Date().toISOString(),
          path: '/test',
        },
        status: 500,
      },
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error).toEqual(error.response.data);
  });

  it('handles error with response but no data', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      response: { status: 404 },
      message: 'Not found',
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(404);
    expect(result.current.error?.message).toBe('Not found');
  });

  it('handles error with nested error object and no data', () => {
    const { result } = renderHook(() => useApiError());
    const error = {
      error: {
        message: 'Nested error',
      },
    };

    act(() => {
      result.current.handleApiError(error);
    });

    expect(result.current.error?.statusCode).toBe(500);
    expect(result.current.error?.message).toBe('An unexpected error occurred');
  });
});
