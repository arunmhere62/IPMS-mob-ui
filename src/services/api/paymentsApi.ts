import { baseApi } from './baseApi';
import type { Payment } from '../../types';


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

type ApiEnvelope<T> = {
  data?: T;
};

export type TenantPaymentsListParams = {
  tenant_id?: number;
  status?: string;
  page?: number;
  limit?: number;
};

export type TenantPaymentsListResponse = {
  success: boolean;
  data: Payment[];
  pagination?: any;
};

export type TenantPaymentResponse = {
  success: boolean;
  data: any;
  message?: string;
};

export type AdvancePaymentsListResponse = {
  success: boolean;
  data: AdvancePayment[];
  pagination?: any;
};

export type AdvancePaymentResponse = {
  success: boolean;
  data: any;
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
  pagination?: any;
};

export type UpdatePaymentStatusRequest = {
  id: number;
  status: string;
  payment_date?: string;
};

export type NextPaymentDatesParams = {
  tenant_id: number;
  rentCycleType?: string;
  skipGaps?: boolean;
};

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Tenant Payments (Rent)
    getTenantPayments: build.query<TenantPaymentsListResponse, TenantPaymentsListParams | void>({
      query: (params) => ({
        url: '/tenant-payments',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): TenantPaymentsListResponse => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
          pagination: extracted?.pagination ?? payload?.pagination,
        };
      },
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'TenantPayments' as const, id: 'LIST' },
          ...items.map((p: any) => ({ type: 'TenantPayment' as const, id: p.s_no })),
        ];
      },
    }),

    getTenantPaymentById: build.query<TenantPaymentResponse, number>({
      query: (id) => ({ url: `/tenant-payments/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'TenantPayment' as const, id }],
    }),

    getPaymentsByTenant: build.query<TenantPaymentResponse, number>({
      query: (tenant_id) => ({ url: `/tenant-payments/tenant/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, tenant_id) => [{ type: 'TenantPayments' as const, id: tenant_id }],
    }),

    createTenantPayment: build.mutation<TenantPaymentResponse, Partial<Payment>>({
      query: (body) => ({ url: '/tenant-payments', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'TenantPayments', id: 'LIST' }],
    }),

    updateTenantPayment: build.mutation<TenantPaymentResponse, { id: number; data: Partial<Payment> }>({
      query: ({ id, data }) => ({ url: `/tenant-payments/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'TenantPayments', id: 'LIST' },
        { type: 'TenantPayment', id: arg.id },
      ],
    }),

    updatePaymentStatus: build.mutation<TenantPaymentResponse, UpdatePaymentStatusRequest>({
      query: ({ id, status, payment_date }) => ({
        url: `/tenant-payments/${id}/status`,
        method: 'PATCH',
        body: { status, payment_date },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'TenantPayments', id: 'LIST' },
        { type: 'TenantPayment', id: arg.id },
      ],
    }),

    deleteTenantPayment: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/tenant-payments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'TenantPayments', id: 'LIST' },
        { type: 'TenantPayment', id },
      ],
    }),

    detectPaymentGaps: build.query<any, number>({
      query: (tenant_id) => ({ url: `/tenant-payments/gaps/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, tenant_id) => [{ type: 'TenantPaymentGaps' as const, id: tenant_id }],
    }),

    getNextPaymentDates: build.query<any, NextPaymentDatesParams>({
      query: ({ tenant_id, rentCycleType = 'CALENDAR', skipGaps = false }) => ({
        url: `/tenant-payments/next-dates/${tenant_id}`,
        method: 'GET',
        params: { rentCycleType, skipGaps },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, arg) => [{ type: 'TenantPaymentNextDates' as const, id: arg.tenant_id }],
    }),

    // Advance Payments
    getAdvancePayments: build.query<AdvancePaymentsListResponse, GetAdvancePaymentsParams | void>({
      query: (params) => ({ url: '/advance-payments', method: 'GET', params: params || undefined }),
      transformResponse: (response: ApiEnvelope<any> | any): AdvancePaymentsListResponse => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
          pagination: extracted?.pagination ?? payload?.pagination,
        };
      },
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'AdvancePayments' as const, id: 'LIST' },
          ...(Array.isArray(items) ? items : []).map((p: AdvancePayment) => ({
            type: 'AdvancePayment' as const,
            id: p.s_no,
          })),
        ];
      },
    }),

    getAdvancePaymentsByTenant: build.query<AdvancePaymentsListResponse, number>({
      query: (tenant_id) => ({ url: `/advance-payments/tenant/${tenant_id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any): AdvancePaymentsListResponse => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
          pagination: extracted?.pagination ?? payload?.pagination,
        };
      },
      providesTags: (_res, _err, tenant_id) => [{ type: 'AdvancePayments' as const, id: tenant_id }],
    }),

    createAdvancePayment: build.mutation<AdvancePaymentResponse, CreateAdvancePaymentDto>({
      query: (body) => ({ url: '/advance-payments', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'AdvancePayments', id: 'LIST' }],
    }),

    updateAdvancePayment: build.mutation<AdvancePaymentResponse, { id: number; data: Partial<CreateAdvancePaymentDto> }>({
      query: ({ id, data }) => ({ url: `/advance-payments/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'AdvancePayments', id: 'LIST' },
        { type: 'AdvancePayment', id: arg.id },
      ],
    }),

    updateAdvancePaymentStatus: build.mutation<AdvancePaymentResponse, UpdatePaymentStatusRequest>({
      query: ({ id, status, payment_date }) => ({
        url: `/advance-payments/${id}/status`,
        method: 'PATCH',
        body: { status, payment_date },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'AdvancePayments', id: 'LIST' },
        { type: 'AdvancePayment', id: arg.id },
      ],
    }),

    deleteAdvancePayment: build.mutation<any, number>({
      query: (id) => ({ url: `/advance-payments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'AdvancePayments', id: 'LIST' },
        { type: 'AdvancePayment', id },
      ],
    }),

    // Refund Payments
    getRefundPayments: build.query<RefundPaymentsListResponse, GetRefundPaymentsParams | void>({
      query: (params) => ({ url: '/refund-payments', method: 'GET', params: params || undefined }),
      transformResponse: (response: ApiEnvelope<any> | any): RefundPaymentsListResponse => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
          pagination: extracted?.pagination ?? payload?.pagination,
        };
      },
      providesTags: (result) => {
        const items = result?.data || [];
        return [
          { type: 'RefundPayments' as const, id: 'LIST' },
          ...(Array.isArray(items) ? items : []).map((p: RefundPayment) => ({
            type: 'RefundPayment' as const,
            id: p.s_no,
          })),
        ];
      },
    }),

    getRefundPaymentById: build.query<any, number>({
      query: (id) => ({ url: `/refund-payments/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'RefundPayment' as const, id }],
    }),

    createRefundPayment: build.mutation<any, CreateRefundPaymentDto>({
      query: (body) => ({
        url: '/refund-payments',
        method: 'POST',
        body,
        headers: { 'X-Skip-Global-Error': 'true' },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'RefundPayments', id: 'LIST' }],
    }),

    updateRefundPayment: build.mutation<any, { id: number; data: Partial<CreateRefundPaymentDto> }>({
      query: ({ id, data }) => ({ url: `/refund-payments/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'RefundPayments', id: 'LIST' },
        { type: 'RefundPayment', id: arg.id },
      ],
    }),

    deleteRefundPayment: build.mutation<any, number>({
      query: (id) => ({ url: `/refund-payments/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'RefundPayments', id: 'LIST' },
        { type: 'RefundPayment', id },
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
  useUpdateTenantPaymentMutation,
  useUpdatePaymentStatusMutation,
  useDeleteTenantPaymentMutation,
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
  useGetRefundPaymentsQuery,
  useLazyGetRefundPaymentsQuery,
  useGetRefundPaymentByIdQuery,
  useLazyGetRefundPaymentByIdQuery,
  useCreateRefundPaymentMutation,
  useUpdateRefundPaymentMutation,
  useDeleteRefundPaymentMutation,
} = paymentsApi;
