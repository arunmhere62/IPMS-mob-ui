import { baseApi } from './baseApi';

export type DashboardBedMetrics = {
  pg_id: number;
  total_beds: number;
  total_pg_value: number;
  occupied_beds: number;
  occupancy_rate: number;
};

export type DashboardTenantStatusWidget<TTenant = unknown> = {
  count: number;
  tenants: TTenant[];
};

export type DashboardSummaryData<TTenant = unknown> = {
  pg_id: number;
  bed_metrics: DashboardBedMetrics;
  tenant_status: {
    pending_rent: DashboardTenantStatusWidget<TTenant>;
    partial_rent: DashboardTenantStatusWidget<TTenant>;
    without_advance: DashboardTenantStatusWidget<TTenant>;
  };
};

export type DashboardMonthlyMetricsData = {
  pg_id: number;
  monthly_metrics: {
    month_start: string;
    month_end: string;
    cash_received: number;
    refunds_paid: number;
    rent_earned: number;
    mrr_value: number;
  };
};

export type DashboardMonthlyMetricsResponse = {
  success: boolean;
  statusCode?: number;
  message?: string;
  timestamp?: string;
  data: DashboardMonthlyMetricsData;
};

export type DashboardSummaryResponse<TTenant = unknown> = {
  success: boolean;
  statusCode?: number;
  message?: string;
  timestamp?: string;
  data: DashboardSummaryData<TTenant>;
};

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapCentralData = <T>(response: unknown): T => {
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'statusCode' in response &&
    'data' in response
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardSummary: build.query<DashboardSummaryResponse, void>({
      query: () => ({
        url: '/dashboard/summary',
        method: 'GET',
      }),
      keepUnusedDataFor: 60,
      transformResponse: (response: unknown): DashboardSummaryResponse => {
        const env = response as ApiEnvelope<unknown> | null | undefined;
        const maybeNested = env?.data;
        const r = maybeNested ?? response;

        // If backend returns standard ResponseUtil.success envelope, keep it.
        if (r && typeof r === 'object' && 'success' in r && 'statusCode' in r && 'data' in r) {
          return r as DashboardSummaryResponse;
        }

        // Fallback normalization
        const unwrapped = unwrapCentralData<DashboardSummaryData>(r);
        return {
          success: true,
          data: unwrapped,
        } as DashboardSummaryResponse;
      },
      providesTags: (_result) => [{ type: 'Dashboard' as const, id: 'SUMMARY' }],
    }),
    getDashboardMonthlyMetrics: build.query<DashboardMonthlyMetricsResponse, { monthStart?: string; monthEnd?: string }>({
      query: (params) => ({
        url: '/dashboard/monthly-metrics',
        method: 'GET',
        params,
      }),
      keepUnusedDataFor: 60,
      transformResponse: (response: unknown): DashboardMonthlyMetricsResponse => {
        const env = response as ApiEnvelope<unknown> | null | undefined;
        const maybeNested = env?.data;
        const r = maybeNested ?? response;

        // If backend returns standard ResponseUtil.success envelope, keep it.
        if (r && typeof r === 'object' && 'success' in r && 'statusCode' in r && 'data' in r) {
          return r as DashboardMonthlyMetricsResponse;
        }

        // Fallback normalization
        const unwrapped = unwrapCentralData<DashboardMonthlyMetricsData>(r);
        return {
          success: true,
          data: unwrapped,
        } as DashboardMonthlyMetricsResponse;
      },
      providesTags: (_result) => [{ type: 'Dashboard' as const, id: 'MONTHLY_METRICS' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery, useLazyGetDashboardSummaryQuery, useGetDashboardMonthlyMetricsQuery, useLazyGetDashboardMonthlyMetricsQuery } = dashboardApi;
