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
import { getApiBaseUrl } from '../../../config';

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

// Dynamic base query — recreates when API URL changes at runtime
let _cachedUrl = '';
let _cachedBaseQuery: ReturnType<typeof fetchBaseQuery> | null = null;

const getDynamicBaseQuery = () => {
  const currentUrl = getApiBaseUrl();
  if (currentUrl !== _cachedUrl || !_cachedBaseQuery) {
    _cachedUrl = currentUrl;
    _cachedBaseQuery = fetchBaseQuery({
      baseUrl: currentUrl,
      responseHandler: async (response) => {
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

        if (tenantToken) {
          headers.set('Authorization', `Bearer ${tenantToken}`);
        }

        if (tenant?.tenant_id) {
          headers.set('x-tenant-id', String(tenant.tenant_id));
        }

        const pgId = state.tenantAuth?.pg?.pg_id;
        if (pgId) {
          headers.set('x-pg-id', String(pgId));
        }

        const orgId = tenant?.organization_id;
        if (orgId) {
          headers.set('x-organization-id', String(orgId));
        }

        return headers;
      },
    });
  }
  return _cachedBaseQuery;
};

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
    url: `${getApiBaseUrl()}/tenant-auth/refresh`,
    headers: { 'content-type': 'application/json' },
    requestData: { body: { refreshToken: '***' } },
    timestamp: new Date(),
  });
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/tenant-auth/refresh`, {
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
  
  const currentApiUrl = getApiBaseUrl();
  const baseUrl = currentApiUrl.endsWith('/') ? currentApiUrl.slice(0, -1) : currentApiUrl;
  const urlPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const fullUrl = `${baseUrl}${urlPath}`;
  console.log('TenantBaseApi - Request URL:', fullUrl);
  
  networkLogger.addLog({
    id: logId,
    method,
    url: fullUrl,
    headers: headersObj,
    requestData: { params: req.params, body: req.body },
    timestamp: new Date(),
  });
  
  // First attempt
  let result = await getDynamicBaseQuery()(args, api, extraOptions);
  
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
        result = await getDynamicBaseQuery()(args, api, extraOptions);
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
