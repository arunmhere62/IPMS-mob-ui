import {
  extractResponseData,
  isApiResponseSuccess,
  getApiErrorMessage,
  extractPaginatedData,
  transformApiResponse,
  type ApiResponse,
} from '../apiResponseHandler';

describe('extractResponseData', () => {
  it('extracts data from the new API response structure', () => {
    const response = { success: true, statusCode: 200, message: 'OK', data: { id: 1 } };
    expect(extractResponseData(response)).toEqual({ id: 1 });
  });

  it('returns the raw response when it does not match the new structure', () => {
    const response = { id: 1, name: 'Test' };
    expect(extractResponseData(response)).toEqual({ id: 1, name: 'Test' });
  });

  it('returns the raw response for non-object values', () => {
    expect(extractResponseData('raw data')).toBe('raw data');
    expect(extractResponseData(null)).toBeNull();
    expect(extractResponseData(123)).toBe(123);
  });

  it('returns undefined when response is missing success and statusCode', () => {
    expect(extractResponseData({})).toEqual({});
  });
});

describe('isApiResponseSuccess', () => {
  it('returns true when success is true', () => {
    expect(isApiResponseSuccess({ success: true, statusCode: 200 })).toBe(true);
  });

  it('returns false when success is false', () => {
    expect(isApiResponseSuccess({ success: false, statusCode: 400 })).toBe(false);
  });

  it('returns true for non-object responses (legacy behavior)', () => {
    expect(isApiResponseSuccess('data')).toBe(true);
    expect(isApiResponseSuccess(null)).toBe(true);
    expect(isApiResponseSuccess(123)).toBe(true);
  });

  it('handles missing success property', () => {
    expect(isApiResponseSuccess({ statusCode: 200 })).toBe(true);
  });
});

describe('getApiErrorMessage', () => {
  it('returns the message from the response', () => {
    expect(getApiErrorMessage({ message: 'Something went wrong' })).toBe('Something went wrong');
  });

  it('returns the message from the nested error object', () => {
    expect(getApiErrorMessage({ error: { message: 'Nested error' } })).toBe('Nested error');
  });

  it('returns default message when no message is found', () => {
    expect(getApiErrorMessage({})).toBe('An error occurred');
    expect(getApiErrorMessage(null)).toBe('An error occurred');
  });
});

describe('extractPaginatedData', () => {
  it('extracts data and pagination from paginated response', () => {
    const response = {
      success: true,
      statusCode: 200,
      message: 'OK',
      data: {
        data: [{ id: 1 }, { id: 2 }],
        pagination: { total: 2, page: 1 },
      },
    };
    const result = extractPaginatedData<{ id: number }>(response);
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.pagination).toEqual({ total: 2, page: 1 });
  });

  it('returns empty array when data is not an array', () => {
    const response = {
      success: true,
      data: {
        data: { id: 1 },
        pagination: { total: 1 },
      },
    };
    const result = extractPaginatedData<{ id: number }>(response);
    expect(result.data).toEqual([]);
  });

  it('returns empty array for legacy response that is not in new wrapper format', () => {
    const response = { data: [{ id: 1 }] };
    const result = extractPaginatedData<{ id: number }>(response);
    // Legacy responses without success/statusCode are not recognized as arrays by this helper
    expect(result.data).toEqual([]);
  });

  it('returns empty array for non-object response', () => {
    const result = extractPaginatedData<string>(null);
    expect(result.data).toEqual([]);
  });
});

describe('transformApiResponse', () => {
  it('returns data for successful response', () => {
    const response: ApiResponse<{ id: number }> = {
      success: true,
      statusCode: 200,
      message: 'OK',
      data: { id: 1 },
      timestamp: '2026-07-01T00:00:00Z',
    };
    expect(transformApiResponse(response)).toEqual({ id: 1 });
  });

  it('throws an error with response message when success is false', () => {
    const response: ApiResponse = {
      success: false,
      statusCode: 400,
      message: 'Bad request',
      timestamp: '2026-07-01T00:00:00Z',
    };
    expect(() => transformApiResponse(response)).toThrow('Bad request');
  });

  it('throws an error with response message when success is false and message is empty', () => {
    const response: ApiResponse = {
      success: false,
      statusCode: 400,
      message: '',
      error: { code: 'VALIDATION_ERROR', details: 'Validation failed' },
      timestamp: '2026-07-01T00:00:00Z',
    };
    expect(() => transformApiResponse(response)).toThrow('An error occurred');
  });

  it('returns null for null response', () => {
    expect(transformApiResponse(null as unknown as ApiResponse)).toBeNull();
  });
});
