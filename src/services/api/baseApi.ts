import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config';
import type { RootState } from '../../store';
import { networkLogger } from '../../utils/networkLogger';
import { setCredentials, logout } from '../../store/slices/authSlice';

const toPlainHeaders = (headers: any): Record<string, any> => {
  if (!headers) return {};
  // Headers-like objects / similar
  if (typeof headers.toJSON === 'function') {
    return headers.toJSON();
  }
  // Fetch Headers
  if (typeof headers.forEach === 'function') {
    const out: Record<string, any> = {};
    headers.forEach((value: any, key: string) => {
      out[key] = value;
    });
    return out;
  }
  try {
    return { ...headers };
  } catch {
    return {};
  }
};

const needsPgHeader = (url?: string) => {
  if (!url) return false;
  const path = (url.split('?')[0] || '').toString();
  return /^\/(tenants|rooms|beds|advance-payments|refund-payments|payments|pending-payments)(\/|$)/.test(path);
};

const applyAuthAndContextHeaders = (headers: Headers, state: RootState) => {
  const { user, accessToken } = state.auth;

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const userId = (user as any)?.s_no ?? (user as any)?.id ?? (user as any)?.user_id ?? (user as any)?.userId ?? (user as any)?.sNo;
  if (userId !== undefined && userId !== null && String(userId).length > 0) {
    headers.set('x-user-id', String(userId));
  }

  const organizationId =
    (user as any)?.organization_id ?? (user as any)?.organizationId ?? (user as any)?.org_id ?? (user as any)?.orgId;
  if (organizationId !== undefined && organizationId !== null && String(organizationId).length > 0) {
    headers.set('x-organization-id', String(organizationId));
  }

  const selectedPGLocationId = state.pgLocations.selectedPGLocationId;
  if (selectedPGLocationId) {
    headers.set('x-pg-location-id', selectedPGLocationId.toString());
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;

    applyAuthAndContextHeaders(headers, state);

    return headers;
  },
});

let refreshInFlight: Promise<{ accessToken: string; refreshToken?: string } | null> | null = null;

const refreshAccessToken = async (api: any): Promise<{ accessToken: string; refreshToken?: string } | null> => {
  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;
  const user = state.auth.user;

  if (!refreshToken || !user) return null;

  const logId = `refresh-${Date.now()}-${Math.random()}`;
  const startedAt = Date.now();
  networkLogger.addLog({
    id: logId,
    method: 'POST',
    url: `${API_BASE_URL}/auth/refresh`,
    headers: { 'content-type': 'application/json' },
    requestData: {
      body: { refreshToken: '***' },
    },
    timestamp: new Date(),
  });

  const refreshResult = await rawBaseQuery(
    {
      url: '/auth/refresh',
      method: 'POST',
      body: { refreshToken },
    },
    api,
    {}
  );

  if ('error' in refreshResult && refreshResult.error) {
    networkLogger.updateLog(logId, {
      status: (refreshResult.error as any).status as any,
      responseData: (refreshResult.error as any).data,
      error: 'RTK_QUERY_ERROR',
      duration: Date.now() - startedAt,
    });
    return null;
  }

  const data: any = (refreshResult as any).data;
  const inner = data && typeof data === 'object' && 'success' in data && 'statusCode' in data ? (data as any).data : data;

  networkLogger.updateLog(logId, {
    status: 200,
    responseData: data,
    duration: Date.now() - startedAt,
  });

  return {
    accessToken: inner?.accessToken ?? inner?.access_token,
    refreshToken: inner?.refreshToken ?? inner?.refresh_token,
  };
};

const refreshAccessTokenLocked = async (api: any) => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        return await refreshAccessToken(api);
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return await refreshInFlight;
};

const baseQueryWithPgGuard: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const url = typeof args === 'string' ? args : args.url;
  const state = api.getState() as RootState;
  const selectedPGLocationId = state.pgLocations.selectedPGLocationId;

  const isAuthRefreshCall = (u?: string) => {
    const path = (u || '').split('?')[0];
    return path === '/auth/refresh' || path.endsWith('/auth/refresh');
  };

  const maskAuthHeader = (headers: Record<string, any>) => {
    const h = { ...headers };
    const key = Object.keys(h).find((k) => k.toLowerCase() === 'authorization');
    if (key && typeof h[key] === 'string') {
      h[key] = 'Bearer ***';
    }
    return h;
  };

  const buildUrlWithParams = (baseUrl: string, path: string, params?: Record<string, any>) => {
    if (!params) return `${baseUrl}${path}`;
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      sp.append(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `${baseUrl}${path}${path.includes('?') ? '&' : '?'}${qs}` : `${baseUrl}${path}`;
  };

  if (needsPgHeader(url) && !selectedPGLocationId) {
    return {
      error: {
        status: 'CUSTOM_ERROR' as any,
        data: '⚠️ Please select a PG location first',
      },
    };
  }

  const logId = `${Date.now()}-${Math.random()}`;
  const startedAt = Date.now();

  const req: FetchArgs = typeof args === 'string' ? { url: args } : args;
  const method = (req.method || 'GET').toString().toUpperCase();

  const fullUrl = buildUrlWithParams(API_BASE_URL, req.url, (req as any).params);

  // Compute *final* outgoing headers (same logic as fetchBaseQuery.prepareHeaders)
  const outgoingHeaders = new Headers((req.headers as any) || undefined);
  applyAuthAndContextHeaders(outgoingHeaders, state);
  const headersObj = maskAuthHeader(toPlainHeaders(outgoingHeaders));

  networkLogger.addLog({
    id: logId,
    method,
    url: fullUrl,
    headers: headersObj,
    requestData: {
      params: (req as any).params,
      body: (req as any).body,
    },
    timestamp: new Date(),
  });

  let result = await rawBaseQuery(args, api, extraOptions);

  if ('error' in result && result.error && (result.error as any).status === 401 && !isAuthRefreshCall(url)) {
    const refreshed = await refreshAccessTokenLocked(api);
    if (refreshed?.accessToken) {
      const currentState = api.getState() as RootState;
      const currentUser = currentState.auth.user;
      if (currentUser) {
        api.dispatch(
          setCredentials({
            user: currentUser,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? currentState.auth.refreshToken ?? undefined,
          })
        );
      }

      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  const duration = Date.now() - startedAt;
  if ('error' in result && result.error) {
    networkLogger.updateLog(logId, {
      status: (result.error as any).status as any,
      headers: {
        request: headersObj,
        response: maskAuthHeader(toPlainHeaders((result as any).meta?.response?.headers)),
      },
      responseData: (result.error as any).data,
      error: 'RTK_QUERY_ERROR',
      duration,
    });
  } else {
    networkLogger.updateLog(logId, {
      status: 200,
      headers: {
        request: headersObj,
        response: maskAuthHeader(toPlainHeaders((result as any).meta?.response?.headers)),
      },
      responseData: (result as any).data,
      duration,
    });
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithPgGuard,
  tagTypes: [
    'Tenants',
    'Tenant',
    'Employees',
    'Employee',
    'EmployeeStats',
    'EmployeeSalaries',
    'EmployeeSalary',
    'EmployeeSalaryStats',
    'Expenses',
    'Expense',
    'ExpenseStats',
    'Countries',
    'States',
    'Cities',
    'Organizations',
    'Organization',
    'OrganizationStats',
    'PGLocations',
    'PGLocation',
    'PGLocationDetails',
    'PGLocationSummary',
    'PGLocationFinancialAnalytics',
    'TenantPayments',
    'TenantPayment',
    'TenantPaymentGaps',
    'TenantPaymentNextDates',
    'AdvancePayments',
    'AdvancePayment',
    'RefundPayments',
    'RefundPayment',
    'Roles',
    'Role',
    'Rooms',
    'Room',
    'Beds',
    'Bed',
    'SubscriptionPlans',
    'CurrentSubscription',
    'SubscriptionStatus',
    'SubscriptionHistory',
    'Users',
    'User',
    'Tickets',
    'Ticket',
    'TicketStats',
    'Visitors',
    'Visitor',
    'VisitorStats',
    'S3Objects',
    'S3Object',
    'LegalRequiredStatus',
  ],
  endpoints: () => ({}),
});
