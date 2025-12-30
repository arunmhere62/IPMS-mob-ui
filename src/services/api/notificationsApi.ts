import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export type RegisterTokenRequest = {
  fcm_token: string;
  device_type: string;
  device_id?: string;
  device_name?: string;
};

export type SendTestNotificationRequest = {
  title: string;
  body: string;
  data?: Record<string, any>;
};

export type TestNotificationResponse = {
  success: boolean;
  message: string;
  result?: {
    successCount: number;
    failureCount: number;
    totalTokens: number;
    tokensUsed: string[];
  };
};

export type UnregisterTokenRequest = {
  fcm_token: string;
};

export type UnreadCountResponse = {
  count?: number;
};

export type NotificationHistoryResponse = any;

export type NotificationSettings = any;

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registerNotificationToken: build.mutation<any, RegisterTokenRequest>({
      query: (body) => ({
        url: '/notifications/register-token',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    unregisterNotificationToken: build.mutation<any, UnregisterTokenRequest>({
      query: (body) => ({
        url: '/notifications/unregister-token',
        method: 'DELETE',
        body,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    getUnreadNotificationCount: build.query<UnreadCountResponse, void>({
      query: () => ({ url: '/notifications/unread-count', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    getNotificationHistory: build.query<NotificationHistoryResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/notifications/history',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    markNotificationAsRead: build.mutation<any, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    markAllNotificationsAsRead: build.mutation<any, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    updateNotificationSettings: build.mutation<any, NotificationSettings>({
      query: (body) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    getNotificationSettings: build.query<any, void>({
      query: () => ({
        url: '/notifications/settings',
        method: 'GET',
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    sendTestNotification: build.mutation<any, void>({
      query: () => ({
        url: '/notifications/test',
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),

    sendStaticTestNotification: build.mutation<TestNotificationResponse, SendTestNotificationRequest>({
      query: (body) => ({
        url: '/notifications/test-static',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),
  }),
  overrideExisting: true,
});

export const {
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation,
  useGetUnreadNotificationCountQuery,
  useLazyGetUnreadNotificationCountQuery,
  useGetNotificationHistoryQuery,
  useLazyGetNotificationHistoryQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useUpdateNotificationSettingsMutation,
  useGetNotificationSettingsQuery,
  useLazyGetNotificationSettingsQuery,
  useSendTestNotificationMutation,
  useSendStaticTestNotificationMutation,
} = notificationsApi;
