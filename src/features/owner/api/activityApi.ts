import { baseApi } from './baseApi';

export type ActivityActionType =
  | 'APP_INSTALL'
  | 'APP_UPDATE'
  | 'APP_OPEN'
  | 'APP_CLOSE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOKEN_REFRESHED'
  | 'PROFILE_UPDATED'
  | 'ACCOUNT_DELETED';

export interface LogActivityDto {
  action_type: ActivityActionType;
  user_id?: number;
  tenant_id?: number;
  app_version?: string;
  os_version?: string;
  device_model?: string;
  device_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityLog {
  s_no: number;
  user_id: number | null;
  tenant_id: number | null;
  action_type: ActivityActionType;
  app_version: string | null;
  os_version: string | null;
  device_model: string | null;
  device_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ApiEnvelope<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logActivity: builder.mutation<ActivityLog, LogActivityDto>({
      query: (dto) => ({
        url: '/activity/log',
        method: 'POST',
        body: dto,
      }),
      transformResponse: (res: ApiEnvelope<ActivityLog> | ActivityLog) =>
        (res as ApiEnvelope<ActivityLog>)?.data ?? (res as ActivityLog),
    }),
    logBatchActivities: builder.mutation<{ count: number }, LogActivityDto[]>({
      query: (dtos) => ({
        url: '/activity/batch',
        method: 'POST',
        body: dtos,
      }),
      transformResponse: (res: ApiEnvelope<{ count: number }> | { count: number }) =>
        (res as ApiEnvelope<{ count: number }>)?.data ?? (res as { count: number }),
    }),
    getActivityLogs: builder.query<
      { logs: ActivityLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { user_id?: number; tenant_id?: number; action_type?: string; date_from?: string; date_to?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/activity/logs',
        method: 'GET',
        params,
      }),
      transformResponse: (res: ApiEnvelope<any> | any) =>
        (res as ApiEnvelope<any>)?.data ?? (res as any),
    }),
    getActivityStats: builder.query<
      Record<string, unknown>,
      { user_id?: number; tenant_id?: number; date_from?: string; date_to?: string }
    >({
      query: (params) => ({
        url: '/activity/stats',
        method: 'GET',
        params,
      }),
      transformResponse: (res: ApiEnvelope<any> | any) =>
        (res as ApiEnvelope<any>)?.data ?? (res as any),
    }),
  }),
});

export const {
  useLogActivityMutation,
  useLogBatchActivitiesMutation,
  useGetActivityLogsQuery,
  useGetActivityStatsQuery,
} = activityApi;
