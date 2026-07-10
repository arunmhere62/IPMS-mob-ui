import { baseApi } from './baseApi';

export interface AppPublicStatus {
  is_maintenance_mode: boolean;
  maintenance_message?: string | null;
  is_registration_open: boolean;
  force_update_android: boolean;
  force_update_ios: boolean;
  current_version_android?: string | null;
  current_version_ios?: string | null;
  minimum_version_android?: string | null;
  minimum_version_ios?: string | null;
  show_announcement?: boolean | null;
  announcement_title?: string | null;
  announcement_message?: string | null;
  payment_gateway_enabled?: boolean | null;
}

export interface AppSettings extends AppPublicStatus {
  s_no: number;
  android_store_url?: string | null;
  ios_store_url?: string | null;
  max_login_attempts: number;
  otp_expiry_seconds: number;
  otp_resend_cooldown_seconds: number;
  announcement_start_date?: string | null;
  announcement_end_date?: string | null;
  updated_at?: string | null;
  updated_by?: number | null;
}

export type UpdateAppSettingsDto = Partial<Omit<AppSettings, 's_no' | 'updated_at' | 'updated_by'>>;

interface ApiEnvelope<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export const appSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicAppStatus: builder.query<AppPublicStatus, void>({
      query: () => '/app-settings/status',
      transformResponse: (res: ApiEnvelope<AppPublicStatus> | AppPublicStatus) =>
        (res as ApiEnvelope<AppPublicStatus>)?.data ?? (res as AppPublicStatus),
    }),
    getAppSettings: builder.query<AppSettings, void>({
      query: () => '/app-settings',
      transformResponse: (res: ApiEnvelope<AppSettings> | AppSettings) =>
        (res as ApiEnvelope<AppSettings>)?.data ?? (res as AppSettings),
      providesTags: [{ type: 'AppSettings' as const, id: 'SINGLE' }],
    }),
    updateAppSettings: builder.mutation<AppSettings, UpdateAppSettingsDto>({
      query: (dto) => ({
        url: '/app-settings',
        method: 'PUT',
        body: dto,
      }),
      transformResponse: (res: ApiEnvelope<AppSettings> | AppSettings) =>
        (res as ApiEnvelope<AppSettings>)?.data ?? (res as AppSettings),
      invalidatesTags: [{ type: 'AppSettings' as const, id: 'SINGLE' }],
    }),
  }),
});

export const {
  useGetPublicAppStatusQuery,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
} = appSettingsApi;
