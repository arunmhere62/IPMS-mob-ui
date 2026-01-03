/**
 * API Response Handler
 * Handles the new centralized response structure from backend
 * 
 * Response Structure:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "...",
 *   "data": { ... },
 *   "timestamp": "...",
 *   "path": "..."
 * }
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
  path?: string;
}

/**
 * Extract data from API response
 * Handles both old and new response formats
 */
export const extractResponseData = <T>(response: unknown): T => {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if ('success' in obj && 'statusCode' in obj) {
      return obj.data as T;
    }
  }
  return response as T;
};

/**
 * Check if API response is successful
 */
export const isApiResponseSuccess = (response: unknown): boolean => {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if ('success' in obj) {
      return obj.success === true;
    }
  }
  return true;
};

/**
 * Get error message from API response
 */
export const getApiErrorMessage = (response: unknown): string => {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      return obj.message;
    }
    const err = obj.error;
    if (err && typeof err === 'object') {
      const errObj = err as Record<string, unknown>;
      if (typeof errObj.message === 'string') return errObj.message;
    }
  }
  return 'An error occurred';
};

/**
 * Handle paginated response
 */
export const extractPaginatedData = <T>(response: unknown): { data: T[]; pagination?: unknown } => {
  const data = extractResponseData<unknown>(response);

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('data' in obj && 'pagination' in obj) {
      return {
        data: Array.isArray(obj.data) ? (obj.data as T[]) : [],
        pagination: obj.pagination,
      };
    }
  }

  return {
    data: Array.isArray(data) ? (data as T[]) : [],
  };
};

/**
 * Transform API response for frontend use
 */
export const transformApiResponse = <T>(response: ApiResponse<T>): T | null => {
  if (!response) return null;
  
  if (!isApiResponseSuccess(response)) {
    const errorMessage = getApiErrorMessage(response);
    throw new Error(errorMessage);
  }
  
  return extractResponseData(response);
};
