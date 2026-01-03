import { baseApi } from './baseApi';
import type { Payment } from '../../types';
import { extractPaginatedData, extractResponseData, isApiResponseSuccess } from '../../utils/apiResponseHandler';


export type RentCycleType = 'CALENDAR' | 'MIDMONTH';

export type RentPaymentGap = {
  gapId?: string | number;
  gapStart: string;
  gapEnd: string;
  daysMissing: number;
  cycle_id?: number;
  remainingDue?: number;
  rentDue?: number;
  totalPaid?: number;
  due?: number;
  expected_from_allocations?: number;
};

export type DetectPaymentGapsResponse = {
  hasGaps: boolean;
  gaps: RentPaymentGap[];
};

export type NextPaymentDatesResponse = {
  suggestedCycleId?: number | null;
  suggestedStartDate?: string;
  suggestedEndDate?: string;
};

export type CreateTenantPaymentDto = {
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount: number;
  payment_date?: string;
  payment_method: Payment['payment_method'];
  status: Payment['status'];
  cycle_id: number;
  remarks?: string;
};

export interface AdvancePayment {
  s_no: number;
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  tenant_unavailable_reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null;
  tenants?: {
    s_no: number;
    tenant_id: string;
    name: string;
    phone_no?: string;
    is_deleted?: boolean;
    status?: string;
    check_out_date?: string;
  };
  rooms?: {
    s_no: number;
    room_no: string;
  };
  beds?: {
    s_no: number;
    bed_no: string;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}

export interface CreateAdvancePaymentDto {
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_date?: string;
  payment_method: string;
  status?: string;
  remarks?: string;
}

export interface GetAdvancePaymentsParams {
  tenant_id?: number;
  status?: string;
  month?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  room_id?: number;
  bed_id?: number;
  page?: number;
  limit?: number;
}

export interface AdvancePaymentsResponse {
  success: boolean;
  data: AdvancePayment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

export type TenantPaymentsListParams = {
  tenant_id?: number;
  pg_id?: number;
  status?: string;
  page?: number;
  limit?: number;
};

export type TenantPaymentsListResponse = {
  success: boolean;
  data: Payment[];
  pagination?: unknown;
};

export type TenantPaymentResponse<T = unknown> = {
  success: boolean;
  data: T;
  message?: string;
};

export type VoidWithReasonArg = { id: number; voided_reason?: string };

export type AdvancePaymentsListResponse = {
  success: boolean;
  data: AdvancePayment[];
  pagination?: unknown;
};

export type AdvancePaymentResponse = {
  success: boolean;
  data: unknown;
  message?: string;
};


export interface RefundPayment {
  s_no: number;
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_date: string;
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'FAILED';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  tenant_unavailable_reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null;
  tenants?: {
    s_no: number;
    tenant_id: string;
    name: string;
    phone_no: string;
    is_deleted?: boolean;
    status?: string;
    check_out_date?: string;
  };
  rooms?: {
    s_no: number;
    room_no: string;
  };
  beds?: {
    s_no: number;
    bed_no: string;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}

export interface CreateRefundPaymentDto {
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_date: string;
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'FAILED';
  remarks?: string;
}

export interface GetRefundPaymentsParams {
  tenant_id?: number;
  status?: string;
  month?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  room_id?: number;
  bed_id?: number;
  page?: number;
  limit?: number;
}

export interface RefundPaymentsResponse {
  success: boolean;
  data: {
    data: RefundPayment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export type RefundPaymentsListResponse = {
  success: boolean;
  data: RefundPayment[];
  pagination?: unknown;
  message?: string;
};

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Tenant Payments (Rent)
    getTenantPayments: build.query<TenantPaymentsListResponse, TenantPaymentsListParams | void>({
      query: (params) => ({
        url: '/rent-payments',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: unknown): TenantPaymentsListResponse => {
        const normalized = normalizePaginatedList<Payment>(response);
        return {
          success: normalized.success,
          data: normalized.data,
          pagination: normalized.pagination,
        };
      },
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'TenantPayments' as const, id: 'LIST' },
          ...items.map((p) => ({ type: 'TenantPayment' as const, id: (p as unknown as { s_no: number }).s_no })),
        ];
      },
    }),

    getTenantPaymentById: build.query<TenantPaymentResponse, number>({
      query: (id) => ({ url: `/rent-payments/${id}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      providesTags: (_res, _err, id) => [{ type: 'TenantPayment' as const, id }],
    }),

    getPaymentsByTenant: build.query<TenantPaymentResponse, number>({
      query: (tenant_id) => ({ url: `/rent-payments/tenant/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      providesTags: (_res, _err, tenant_id) => [{ type: 'TenantPayments' as const, id: tenant_id }],
    }),

    createTenantPayment: build.mutation<TenantPaymentResponse<Payment>, CreateTenantPaymentDto>({
      query: (body) => ({ url: '/rent-payments', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeEntity<Payment>(response),
      invalidatesTags: [
        { type: 'TenantPayments' as const, id: 'LIST' },
        { type: 'Tenants', id: 'LIST' },
      ],
    }),

    updatePaymentStatus: build.mutation<unknown, { id: number; status: string; payment_date?: string }>({
      query: ({ id, status, payment_date }) => ({
        url: `/rent-payments/${id}/status`,
        method: 'PATCH',
        body: { status, payment_date },
      }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'TenantPayments', id: 'LIST' },
        { type: 'TenantPayment', id: arg.id },
      ],
    }),

    voidTenantPayment: build.mutation<TenantPaymentResponse, number | VoidWithReasonArg>({
      query: (arg) => {
        const id = typeof arg === 'number' ? arg : arg.id;
        const voided_reason = typeof arg === 'number' ? undefined : arg.voided_reason;
        return {
          url: `/rent-payments/${id}`,
          method: 'DELETE',
          body: voided_reason ? { voided_reason } : undefined,
        };
      },
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => {
        const id = typeof arg === 'number' ? arg : arg.id;
        return [
        { type: 'TenantPayments', id: 'LIST' },
        { type: 'TenantPayment', id },
        { type: 'Tenants', id: 'LIST' },
        ];
      },
    }),

    detectPaymentGaps: build.query<DetectPaymentGapsResponse, number>({
      query: (tenant_id) => ({ url: `/rent-payments/gaps/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: unknown) => extractResponseData<DetectPaymentGapsResponse>(response),
      providesTags: (_res, _err, tenant_id) => [{ type: 'TenantPaymentGaps' as const, id: tenant_id }],
    }),

    getNextPaymentDates: build.query<NextPaymentDatesResponse, { tenant_id: number; rentCycleType?: RentCycleType; skipGaps?: boolean }>({
      query: ({ tenant_id, rentCycleType, skipGaps }) => ({
        url: `/rent-payments/next-dates/${tenant_id}`,
        method: 'GET',
        params: { rentCycleType, skipGaps },
      }),
      transformResponse: (response: unknown) => extractResponseData<NextPaymentDatesResponse>(response),
      providesTags: (_res, _err, arg) => [{ type: 'TenantPaymentNextDates' as const, id: arg.tenant_id }],
    }),

    // Advance Payments
    getAdvancePayments: build.query<AdvancePaymentsListResponse, GetAdvancePaymentsParams | void>({
      query: (params) => ({ url: '/advance-payments', method: 'GET', params: params || undefined }),
      transformResponse: (response: unknown): AdvancePaymentsListResponse => normalizePaginatedList<AdvancePayment>(response),
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'AdvancePayments' as const, id: 'LIST' },
          ...items.map((p) => ({ type: 'AdvancePayment' as const, id: p.s_no })),
        ];
      },
    }),

    getAdvancePaymentsByTenant: build.query<AdvancePaymentsListResponse, number>({
      query: (tenant_id) => ({ url: `/advance-payments/tenant/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: unknown): AdvancePaymentsListResponse => normalizePaginatedList<AdvancePayment>(response),
      providesTags: (_res, _err, tenant_id) => [{ type: 'AdvancePayments' as const, id: tenant_id }],
    }),

    createAdvancePayment: build.mutation<AdvancePaymentResponse, CreateAdvancePaymentDto>({
      query: (body) => ({ url: '/advance-payments', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'AdvancePayments' as const, id: 'LIST' },
        { type: 'Tenants' as const, id: 'LIST' },
        { type: 'Tenant' as const, id: (arg as unknown as { tenant_id?: number }).tenant_id as number },
      ],
    }),

    updateAdvancePayment: build.mutation<AdvancePaymentResponse, { id: number; data: Partial<CreateAdvancePaymentDto> }>({
      query: ({ id, data }) => ({ url: `/advance-payments/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'AdvancePayments' as const, id: 'LIST' },
        { type: 'AdvancePayment' as const, id: arg.id },
      ],
    }),

    updateAdvancePaymentStatus: build.mutation<unknown, { id: number; status: string; payment_date?: string }>({
      query: ({ id, status, payment_date }) => ({
        url: `/advance-payments/${id}/status`,
        method: 'PATCH',
        body: { status, payment_date },
      }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'AdvancePayments' as const, id: 'LIST' },
        { type: 'AdvancePayment' as const, id: arg.id },
      ],
    }),

    deleteAdvancePayment: build.mutation<unknown, number>({
      query: (id) => ({ url: `/advance-payments/${id}`, method: 'DELETE' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, id) => [
        { type: 'AdvancePayments' as const, id: 'LIST' },
        { type: 'AdvancePayment' as const, id },
      ],
    }),

    voidAdvancePayment: build.mutation<unknown, number | VoidWithReasonArg>({
      query: (arg) => {
        const id = typeof arg === 'number' ? arg : arg.id;
        const voided_reason = typeof arg === 'number' ? undefined : arg.voided_reason;
        return {
          url: `/advance-payments/${id}/void`,
          method: 'PATCH',
          body: voided_reason ? { voided_reason } : undefined,
        };
      },
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => {
        const id = typeof arg === 'number' ? arg : arg.id;
        return [
        { type: 'AdvancePayments' as const, id: 'LIST' },
        { type: 'AdvancePayment' as const, id },
        ];
      },
    }),

    // Refund Payments
    getRefundPayments: build.query<RefundPaymentsListResponse, GetRefundPaymentsParams | void>({
      query: (params) => ({ url: '/refund-payments', method: 'GET', params: params || undefined }),
      transformResponse: (response: unknown): RefundPaymentsListResponse => normalizePaginatedList<RefundPayment>(response),
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'RefundPayments' as const, id: 'LIST' },
          ...items.map((p) => ({ type: 'RefundPayment' as const, id: p.s_no })),
        ];
      },
    }),

    getRefundPaymentById: build.query<unknown, number>({
      query: (id) => ({ url: `/refund-payments/${id}`, method: 'GET' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      providesTags: (_res, _err, id) => [{ type: 'RefundPayment' as const, id }],
    }),

    createRefundPayment: build.mutation<unknown, unknown>({
      query: (body) => ({
        url: '/refund-payments',
        method: 'POST',
        body,
        headers: { 'X-Skip-Global-Error': 'true' },
      }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'RefundPayments' as const, id: 'LIST' },
        { type: 'Tenants' as const, id: 'LIST' },
        { type: 'Tenant' as const, id: (arg as unknown as { tenant_id?: number }).tenant_id as number },
      ],
    }),

    updateRefundPayment: build.mutation<unknown, { id: number; data: Partial<CreateRefundPaymentDto> }>({
      query: ({ id, data }) => ({ url: `/refund-payments/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'RefundPayments' as const, id: 'LIST' },
        { type: 'RefundPayment' as const, id: arg.id },
      ],
    }),

    deleteRefundPayment: build.mutation<unknown, number>({
      query: (id) => ({ url: `/refund-payments/${id}`, method: 'DELETE' }),
      transformResponse: (response: unknown) => normalizeEntity<unknown>(response),
      invalidatesTags: (_res, _err, id) => [
        { type: 'RefundPayments' as const, id: 'LIST' },
        { type: 'RefundPayment' as const, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTenantPaymentsQuery,
  useLazyGetTenantPaymentsQuery,
  useGetTenantPaymentByIdQuery,
  useLazyGetTenantPaymentByIdQuery,
  useGetPaymentsByTenantQuery,
  useLazyGetPaymentsByTenantQuery,
  useCreateTenantPaymentMutation,
  useUpdatePaymentStatusMutation,
  useVoidTenantPaymentMutation,
  useDetectPaymentGapsQuery,
  useLazyDetectPaymentGapsQuery,
  useGetNextPaymentDatesQuery,
  useLazyGetNextPaymentDatesQuery,
  useGetAdvancePaymentsQuery,
  useLazyGetAdvancePaymentsQuery,
  useGetAdvancePaymentsByTenantQuery,
  useLazyGetAdvancePaymentsByTenantQuery,
  useCreateAdvancePaymentMutation,
  useUpdateAdvancePaymentMutation,
  useUpdateAdvancePaymentStatusMutation,
  useDeleteAdvancePaymentMutation,
  useVoidAdvancePaymentMutation,
  useGetRefundPaymentsQuery,
  useLazyGetRefundPaymentsQuery,
  useGetRefundPaymentByIdQuery,
  useLazyGetRefundPaymentByIdQuery,
  useCreateRefundPaymentMutation,
  useUpdateRefundPaymentMutation,
  useDeleteRefundPaymentMutation,
} = paymentsApi;
