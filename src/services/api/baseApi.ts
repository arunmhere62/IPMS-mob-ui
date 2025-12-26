import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config';
import type { RootState } from '../../store';
import { networkLogger } from '../../utils/networkLogger';

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

  if (user?.s_no) {
    headers.set('X-User-Id', user.s_no.toString());
  }

  if (user?.organization_id) {
    headers.set('X-Organization-Id', user.organization_id.toString());
  }

  const selectedPGLocationId = state.pgLocations.selectedPGLocationId;
  if (selectedPGLocationId) {
    headers.set('X-PG-Location-Id', selectedPGLocationId.toString());
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

const baseQueryWithPgGuard: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const url = typeof args === 'string' ? args : args.url;
  const state = api.getState() as RootState;
  const selectedPGLocationId = state.pgLocations.selectedPGLocationId;

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

  const result = await rawBaseQuery(args, api, extraOptions);

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
  ],
  endpoints: () => ({}),
});
