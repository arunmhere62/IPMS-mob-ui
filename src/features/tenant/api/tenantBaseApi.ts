import {
  createApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { RootState } from '@/features/owner/store';
import { updateTenantTokens, tenantLogout } from '../store/tenantAuthSlice';
import { setLastUserRole as setAdminLastUserRole } from '@/features/owner/store/slices/authSlice';
import { networkLogger } from '../../../utils/networkLogger';
import { API_BASE_URL } from '../../../config';

// Simple mutex implementation
let isRefreshing = false;
const refreshQueue: Array<() => void> = [];

const acquireRefreshLock = async (): Promise<() => void> => {
  if (!isRefreshing) {
    isRefreshing = true;
    return () => {
      isRefreshing = false;
      // Process queue
      while (refreshQueue.length > 0) {
        const resolve = refreshQueue.shift();
        resolve?.();
      }
    };
  }
  
  return new Promise((resolve) => {
    refreshQueue.push(() => resolve(() => {}));
  });
};

// Raw base query without any enhancements
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  responseHandler: async (response) => {
    // Prevent RTK Query PARSING_ERROR when server returns non-JSON
    const text = await response.text();
    if (!text) return null as any;
    try {
      return JSON.parse(text);
    } catch {
      return { rawText: text } as any;
    }
  },
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const tenantToken = state.tenantAuth?.accessToken;
    const tenant = state.tenantAuth?.tenant;

    console.log('TenantBaseApi - Tenant token:', tenantToken ? 'present' : 'missing');

    if (tenantToken) {
      headers.set('Authorization', `Bearer ${tenantToken}`);
      console.log('TenantBaseApi - Authorization header set');
    } else {
      console.log('TenantBaseApi - No tenant token available!');
    }

    // Set tenant headers from Redux store
    if (tenant?.tenant_id) {
      headers.set('x-tenant-id', String(tenant.tenant_id));
      console.log('TenantBaseApi - x-tenant-id header set:', tenant.tenant_id);
    }

    // pg_id from separate pg state
    const pgId = state.tenantAuth?.pg?.pg_id;
    if (pgId) {
      headers.set('x-pg-id', String(pgId));
      console.log('TenantBaseApi - x-pg-id header set:', pgId);
    }

    // organization_id from tenant data
    const orgId = tenant?.organization_id;
    if (orgId) {
      headers.set('x-organization-id', String(orgId));
      console.log('TenantBaseApi - x-organization-id header set:', orgId);
    }

    return headers;
  },
});

// Tenant token refresh function
const refreshTenantToken = async (api: any): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const state = api.getState() as RootState;
  const refreshToken = state.tenantAuth?.refreshToken;
  
  if (!refreshToken) {
    console.log('No tenant refresh token available');
    return null;
  }
  
  const logId = `tenant-refresh-${Date.now()}-${Math.random()}`;
  const startedAt = Date.now();
  
  networkLogger.addLog({
    id: logId,
    method: 'POST',
    url: `${API_BASE_URL}/tenant-auth/refresh`,
    headers: { 'content-type': 'application/json' },
    requestData: { body: { refreshToken: '***' } },
    timestamp: new Date(),
  });
  
  try {
    const response = await fetch(`${API_BASE_URL}/tenant-auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      networkLogger.updateLog(logId, {
        status: response.status,
        error: 'Token refresh failed',
        duration: Date.now() - startedAt,
      });
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    networkLogger.updateLog(logId, {
      status: 200,
      responseData: data,
      duration: Date.now() - startedAt,
    });
    
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  } catch (error) {
    console.error('Tenant token refresh error:', error);
    networkLogger.updateLog(logId, {
      error: String(error),
      duration: Date.now() - startedAt,
    });
    return null;
  }
};

// Helper to convert headers to plain object
const toPlainHeaders = (headers: any): Record<string, any> => {
  if (!headers) return {};
  if (typeof headers.toJSON === 'function') return headers.toJSON();
  if (typeof headers.forEach === 'function') {
    const out: Record<string, any> = {};
    headers.forEach((value: any, key: string) => { out[key] = value; });
    return out;
  }
  try { return { ...headers }; } catch { return {}; }
};

// Base query with tenant token refresh handling
const baseQueryWithTenantRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const url = typeof args === 'string' ? args : args.url;
  const req: FetchArgs = typeof args === 'string' ? { url: args } : args;
  const method = (req.method || 'GET').toUpperCase();
  
  // Check if this is a refresh call
  const isTenantRefreshCall = (u?: string) => {
    const path = (u || '').split('?')[0];
    return path === '/tenant-auth/refresh' || path.endsWith('/tenant-auth/refresh');
  };
  
  // Log the request
  const logId = `tenant-${Date.now()}-${Math.random()}`;
  const startedAt = Date.now();
  const state = api.getState() as RootState;
  const tenantToken = state.tenantAuth?.accessToken;
  
  const outgoingHeaders = new Headers((req.headers as any) || undefined);
  if (tenantToken) {
    outgoingHeaders.set('Authorization', `Bearer ${tenantToken}`);
  }
  const headersObj = toPlainHeaders(outgoingHeaders);
  
  // Ensure proper URL construction with slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const urlPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const fullUrl = `${baseUrl}${urlPath}`;
  console.log('TenantBaseApi - Request URL:', fullUrl);
  console.log('TenantBaseApi - API_BASE_URL:', API_BASE_URL);
  console.log('TenantBaseApi - req.url:', req.url);
  
  networkLogger.addLog({
    id: logId,
    method,
    url: fullUrl,
    headers: headersObj,
    requestData: { params: req.params, body: req.body },
    timestamp: new Date(),
  });
  
  // Log the actual args being passed to fetchBaseQuery
  console.log('TenantBaseApi - rawBaseQuery args:', JSON.stringify(args));
  console.log('TenantBaseApi - API_BASE_URL in use:', API_BASE_URL);
  
  // First attempt
  let result = await rawBaseQuery(args, api, extraOptions);
  console.log('TenantBaseApi - rawBaseQuery result:', result);
  
  // If we get a 401 and it's not a refresh call itself, try to refresh the token
  if (result.error && (result.error as any).status === 401 && !isTenantRefreshCall(url)) {
    const release = await acquireRefreshLock();
    
    try {
      // Try to get a new token
      const refreshed = await refreshTenantToken(api);
      
      if (refreshed) {
        // Update both tokens in Redux (token rotation)
        api.dispatch(updateTenantTokens({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        }));

        // Retry the original request with new token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout tenant
        // Clear owner's lastUserRole so redirect goes to tenant login
        api.dispatch(setAdminLastUserRole(null));
        api.dispatch(tenantLogout());
      }
    } finally {
      release();
    }
  }
  
  // Log the response
  const duration = Date.now() - startedAt;
  if ('error' in result && result.error) {
    networkLogger.updateLog(logId, {
      status: (result.error as any).status as any,
      headers: { request: headersObj, response: toPlainHeaders((result as any).meta?.response?.headers) },
      responseData: (result.error as any).data,
      error: 'RTK_QUERY_ERROR',
      duration,
    });
  } else {
    networkLogger.updateLog(logId, {
      status: 200,
      headers: { request: headersObj, response: toPlainHeaders((result as any).meta?.response?.headers) },
      responseData: (result as any).data,
      duration,
    });
  }
  
  return result;
};

// Create the tenant API
export const tenantBaseApi = createApi({
  reducerPath: 'tenantBaseApi',
  baseQuery: baseQueryWithTenantRefresh,
  endpoints: () => ({}),
  tagTypes: ['TenantProfile', 'TenantPayments', 'TenantDues', 'TenantTickets', 'TenantTicketDetail', 'S3Objects', 'S3Object'],
});
