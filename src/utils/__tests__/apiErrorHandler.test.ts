import {
  getErrorMessage,
  getErrorTitle,
  isRetryableError,
  formatErrorForLogging,
  getValidationErrors,
} from '../apiErrorHandler';

describe('getErrorMessage', () => {
  it('returns the message from an ApiError object', () => {
    expect(getErrorMessage({ message: 'Custom error' })).toBe('Custom error');
  });

  it('returns mapped message from error code', () => {
    expect(getErrorMessage({ error: { code: 'ERR_001' } })).toBe(
      'Invalid request. Please check your input.',
    );
  });

  it('returns the code itself if no mapping exists', () => {
    expect(getErrorMessage({ error: { code: 'UNKNOWN_CODE' } })).toBe('UNKNOWN_CODE');
  });

  it('returns status-specific messages for 401', () => {
    expect(getErrorMessage({ statusCode: 401 })).toBe('Please log in to continue.');
  });

  it('returns status-specific messages for 403', () => {
    expect(getErrorMessage({ statusCode: 403 })).toBe('You do not have permission.');
  });

  it('returns status-specific messages for 404', () => {
    expect(getErrorMessage({ statusCode: 404 })).toBe('The requested resource was not found.');
  });

  it('returns status-specific messages for 409', () => {
    expect(getErrorMessage({ statusCode: 409 })).toBe('There is a conflict with the current state.');
  });

  it('returns status-specific messages for 500', () => {
    expect(getErrorMessage({ statusCode: 500 })).toBe('Server error. Please try again later.');
  });

  it('returns status-specific messages for 400', () => {
    expect(getErrorMessage({ statusCode: 400 })).toBe('Invalid request. Please try again.');
  });

  it('handles response.status fallback', () => {
    expect(getErrorMessage({ response: { status: 404 } })).toBe(
      'The requested resource was not found.',
    );
  });

  it('returns default message for unknown errors', () => {
    expect(getErrorMessage({})).toBe('An unexpected error occurred.');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
    expect(getErrorMessage('string error')).toBe('An unexpected error occurred.');
  });
});

describe('getErrorTitle', () => {
  it('returns correct titles for known status codes', () => {
    expect(getErrorTitle(400)).toBe('Bad Request');
    expect(getErrorTitle(401)).toBe('Unauthorized');
    expect(getErrorTitle(403)).toBe('Forbidden');
    expect(getErrorTitle(404)).toBe('Not Found');
    expect(getErrorTitle(409)).toBe('Conflict');
    expect(getErrorTitle(422)).toBe('Validation Error');
    expect(getErrorTitle(429)).toBe('Too Many Requests');
    expect(getErrorTitle(500)).toBe('Server Error');
  });

  it('returns generic title for unknown status codes', () => {
    expect(getErrorTitle(300)).toBe('Error');
    expect(getErrorTitle(0)).toBe('Error');
    expect(getErrorTitle(-1)).toBe('Error');
  });
});

describe('isRetryableError', () => {
  it('returns true for retryable status codes', () => {
    expect(isRetryableError({ statusCode: 408 })).toBe(true);
    expect(isRetryableError({ statusCode: 429 })).toBe(true);
    expect(isRetryableError({ statusCode: 500 })).toBe(true);
    expect(isRetryableError({ statusCode: 502 })).toBe(true);
    expect(isRetryableError({ statusCode: 503 })).toBe(true);
    expect(isRetryableError({ statusCode: 504 })).toBe(true);
  });

  it('returns false for non-retryable status codes', () => {
    expect(isRetryableError({ statusCode: 400 })).toBe(false);
    expect(isRetryableError({ statusCode: 401 })).toBe(false);
    expect(isRetryableError({ statusCode: 404 })).toBe(false);
  });

  it('returns true for network errors', () => {
    expect(isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isRetryableError({ message: 'Network Error' })).toBe(true);
  });

  it('returns false when no status or code is present', () => {
    expect(isRetryableError({})).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe('formatErrorForLogging', () => {
  it('formats error details into JSON', () => {
    const error = {
      message: 'Server error',
      statusCode: 500,
      error: { code: 'ERR_500' },
      path: '/api/test',
      timestamp: '2026-07-01T00:00:00Z',
    };
    const result = formatErrorForLogging(error);
    expect(JSON.parse(result)).toEqual({
      message: 'Server error',
      statusCode: 500,
      errorCode: 'ERR_500',
      path: '/api/test',
      timestamp: '2026-07-01T00:00:00Z',
    });
  });

  it('falls back to response.status when statusCode is not present', () => {
    const error = { response: { status: 404 } };
    const result = formatErrorForLogging(error);
    expect(JSON.parse(result).statusCode).toBe(404);
  });

  it('handles non-object errors', () => {
    expect(formatErrorForLogging('string error')).toBeTruthy();
    expect(formatErrorForLogging(null)).toBeTruthy();
  });
});

describe('getValidationErrors', () => {
  it('extracts field errors from an array of details', () => {
    const error = {
      error: {
        details: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ],
      },
    };
    expect(getValidationErrors(error)).toEqual({
      email: 'Invalid email',
      password: 'Too short',
    });
  });

  it('skips invalid entries in the details array', () => {
    const error = {
      error: {
        details: [
          { field: 'email', message: 'Invalid email' },
          { message: 'Generic error' }, // missing field
          null,
        ],
      },
    };
    expect(getValidationErrors(error)).toEqual({
      email: 'Invalid email',
    });
  });

  it('returns details object as-is when it is an object', () => {
    const error = {
      error: {
        details: { name: 'Required', age: 'Must be positive' },
      },
    };
    expect(getValidationErrors(error)).toEqual({
      name: 'Required',
      age: 'Must be positive',
    });
  });

  it('returns empty object when details are missing or invalid', () => {
    expect(getValidationErrors({ error: {} })).toEqual({});
    expect(getValidationErrors({ error: { details: 'invalid' } })).toEqual({});
    expect(getValidationErrors(null)).toEqual({});
  });
});
