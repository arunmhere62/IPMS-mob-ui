import { baseApi } from './baseApi';
import { extractResponseData, isApiResponseSuccess } from '../../../utils/apiResponseHandler';

// ─── Types ────────────────────────────────────────────────────

export type PaymentConfigScopeType = 'ALL_PG' | 'SPECIFIC_PG';

export interface OwnerPaymentConfig {
  s_no: number;
  organization_id: number;
  owner_user_id: number;
  scope_type: PaymentConfigScopeType;
  pg_id: number | null;
  upi_id: string;
  upi_qr_image_url: string | null;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  payment_instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pg_locations?: {
    s_no: number;
    location_name: string;
    address: string;
  } | null;
  // Override metadata returned by findAll()
  overrides_default?: boolean;
  overridden_by?: string[];
}

export interface CreatePaymentConfigDto {
  scope_type: PaymentConfigScopeType;
  pg_id?: number;
  upi_id: string;
  upi_qr_image_url?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_instructions?: string;
  is_active?: boolean;
}

export interface UpdatePaymentConfigDto {
  upi_id?: string;
  upi_qr_image_url?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_instructions?: string;
  is_active?: boolean;
}

type WithMessage = { data?: unknown; message?: unknown; success?: unknown };

const normalizeEntity = <T>(response: unknown): { success: boolean; data: T; message?: string } => {
  const payload = extractResponseData<unknown>(response);
  const nestedEnvelope = payload && typeof payload === 'object' && 'success' in payload && 'data' in payload
    ? payload as WithMessage
    : undefined;
  const outerEnvelope = response as WithMessage | null | undefined;
  const msg = nestedEnvelope?.message ?? outerEnvelope?.message;

  return {
    success: typeof nestedEnvelope?.success === 'boolean'
      ? nestedEnvelope.success
      : isApiResponseSuccess(response),
    data: (nestedEnvelope ? nestedEnvelope.data : payload) as T,
    message: typeof msg === 'string' ? msg : undefined,
  };
};

// ─── API ──────────────────────────────────────────────────────

export const paymentConfigApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentConfigs: build.query<{ success: boolean; data: OwnerPaymentConfig[] }, void>({
      query: () => ({ url: '/payment-config', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<OwnerPaymentConfig[]>(response),
      providesTags: ['PaymentConfigs'],
    }),

    getPaymentConfigById: build.query<{ success: boolean; data: OwnerPaymentConfig }, number>({
      query: (id) => ({ url: `/payment-config/${id}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<OwnerPaymentConfig>(response),
      providesTags: (_res, _err, id) => [{ type: 'PaymentConfig' as const, id }],
    }),

    resolvePaymentConfigForPg: build.query<{ success: boolean; data: OwnerPaymentConfig | null }, number>({
      query: (pgId) => ({ url: `/payment-config/pg/${pgId}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<OwnerPaymentConfig | null>(response),
    }),

    createPaymentConfig: build.mutation<{ success: boolean; data: OwnerPaymentConfig; message?: string }, CreatePaymentConfigDto>({
      query: (body) => ({ url: '/payment-config', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeEntity<OwnerPaymentConfig>(response),
      invalidatesTags: ['PaymentConfigs'],
    }),

    updatePaymentConfig: build.mutation<{ success: boolean; data: OwnerPaymentConfig; message?: string }, { id: number; body: UpdatePaymentConfigDto }>({
      query: ({ id, body }) => ({ url: `/payment-config/${id}`, method: 'PATCH', body }),
      transformResponse: (response: unknown) => normalizeEntity<OwnerPaymentConfig>(response),
      invalidatesTags: ['PaymentConfigs'],
    }),

    deletePaymentConfig: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/payment-config/${id}`, method: 'DELETE' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response) as any,
      invalidatesTags: ['PaymentConfigs'],
    }),
  }),
});

export const {
  useGetPaymentConfigsQuery,
  useLazyGetPaymentConfigsQuery,
  useGetPaymentConfigByIdQuery,
  useResolvePaymentConfigForPgQuery,
  useLazyResolvePaymentConfigForPgQuery,
  useCreatePaymentConfigMutation,
  useUpdatePaymentConfigMutation,
  useDeletePaymentConfigMutation,
} = paymentConfigApi;
