import { baseApi } from './baseApi';
import { extractResponseData, isApiResponseSuccess, extractPaginatedData } from '../../../utils/apiResponseHandler';

// ─── Types ────────────────────────────────────────────────────

export type SubmissionStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type SubmissionPaymentMethod = 'UPI' | 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';

export interface TenantPaymentSubmission {
  s_no: number;
  rent_payment_id: number;
  tenant_id: number;
  pg_id: number;
  organization_id: number;
  paid_amount: string;
  paid_date: string;
  transaction_ref: string | null;
  payment_method: SubmissionPaymentMethod;
  payment_screenshot_url: string | null;
  tenant_notes: string | null;
  payment_config_snapshot: any;
  status: SubmissionStatus;
  verified_by: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  tenants?: {
    s_no: number;
    name: string;
    phone_no: string | null;
    email: string | null;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
  rent_payments?: {
    s_no: number;
    amount_paid: string;
    actual_rent_amount: string;
    status: string;
    payment_method: string;
    remarks: string | null;
    rooms?: { s_no: number; room_no: string };
    beds?: { s_no: number; bed_no: string };
  };
  users?: {
    s_no: number;
    name: string;
  };
}

export interface VerificationStats {
  pending_verification: number;
  verified: number;
  rejected: number;
  total: number;
}

export interface GetSubmissionsParams {
  status?: string;
  pg_id?: number;
  page?: number;
  limit?: number;
}

type WithMessage = { message?: unknown };

const normalizeEntity = <T>(response: unknown): { success: boolean; data: T; message?: string } => {
  const msg = (response as WithMessage | null | undefined)?.message;
  return {
    success: isApiResponseSuccess(response as unknown),
    data: extractResponseData<T>(response as unknown),
    message: typeof msg === 'string' ? msg : undefined,
  };
};

const normalizePaginatedList = <T>(response: unknown): { success: boolean; data: T[]; pagination?: unknown; message?: string } => {
  const msg = (response as WithMessage | null | undefined)?.message;
  const paged = extractPaginatedData<T>(response as unknown);
  return {
    success: isApiResponseSuccess(response as unknown),
    data: paged.data,
    pagination: paged.pagination,
    message: typeof msg === 'string' ? msg : undefined,
  };
};

// ─── API ──────────────────────────────────────────────────────

export const paymentVerificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSubmissions: build.query<{ success: boolean; data: TenantPaymentSubmission[]; pagination?: unknown }, GetSubmissionsParams | void>({
      query: (params) => ({
        url: '/payment-verification',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: unknown) => normalizePaginatedList<TenantPaymentSubmission>(response),
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'PaymentSubmissions' as const, id: 'LIST' },
          ...items.map((s) => ({ type: 'PaymentSubmission' as const, id: s.s_no })),
        ];
      },
    }),

    getSubmissionById: build.query<{ success: boolean; data: TenantPaymentSubmission }, number>({
      query: (id) => ({ url: `/payment-verification/${id}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<TenantPaymentSubmission>(response),
      providesTags: (_res, _err, id) => [{ type: 'PaymentSubmission' as const, id }],
    }),

    getVerificationStats: build.query<{ success: boolean; data: VerificationStats }, void>({
      query: () => ({ url: '/payment-verification/stats', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<VerificationStats>(response),
      providesTags: ['VerificationStats'],
    }),

    verifySubmission: build.mutation<{ success: boolean; message?: string }, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/payment-verification/${id}/verify`,
        method: 'POST',
        body: { notes },
      }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response) as any,
      invalidatesTags: ['PaymentSubmissions', 'VerificationStats', 'TenantPayments'],
    }),

    rejectSubmission: build.mutation<{ success: boolean; message?: string }, { id: number; rejection_reason: string }>({
      query: ({ id, rejection_reason }) => ({
        url: `/payment-verification/${id}/reject`,
        method: 'POST',
        body: { rejection_reason },
      }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response) as any,
      invalidatesTags: ['PaymentSubmissions', 'VerificationStats', 'TenantPayments'],
    }),
  }),
});

export const {
  useGetSubmissionsQuery,
  useLazyGetSubmissionsQuery,
  useGetSubmissionByIdQuery,
  useGetVerificationStatsQuery,
  useVerifySubmissionMutation,
  useRejectSubmissionMutation,
} = paymentVerificationApi;
