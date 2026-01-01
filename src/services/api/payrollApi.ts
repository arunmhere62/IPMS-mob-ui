import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export type PayrollRunsListParams = {
  page?: number;
  limit?: number;
};

export type GeneratePayrollRunDto = {
  month: string; // YYYY-MM-01
};

export type CreatePayrollItemPaymentDto = {
  paid_amount: number;
  paid_date: string; // YYYY-MM-DD
  payment_method?: PaymentMethod;
  remarks?: string;
};

export type PayrollRunStatus = 'GENERATED' | 'LOCKED' | 'CANCELLED';
export type PayrollItemStatus = 'GENERATED' | 'PARTIALLY_PAID' | 'PAID';

export type PayrollRun = {
  s_no: number;
  organization_id: number;
  pg_id: number;
  month: string;
  status: PayrollRunStatus;
  generated_by: number;
  generated_at: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type PayrollItemPayment = {
  s_no: number;
  item_id: number;
  paid_amount: number;
  paid_date: string;
  payment_method?: PaymentMethod | null;
  remarks?: string | null;
  created_by?: number | null;
  created_at: string;
};

export type PayrollRunItem = {
  s_no: number;
  run_id: number;
  pg_id: number;
  user_id: number;
  net_amount: number;
  status: PayrollItemStatus;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    s_no: number;
    name: string;
    phone?: string;
    email?: string;
  };
  payroll_item_payments?: PayrollItemPayment[];
  total_paid?: number;
  balance_amount?: number;
};

export type PayrollRunDetails = PayrollRun & {
  payroll_run_items?: PayrollRunItem[];
};

export type PayrollRunsListResponse = {
  success: boolean;
  data: PayrollRun[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PayrollRunResponse = {
  success: boolean;
  data: PayrollRunDetails;
  message?: string;
};

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    generatePayrollRun: build.mutation<any, GeneratePayrollRunDto>({
      query: (body) => ({ url: '/payroll/generate', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'PayrollRuns' as const, id: 'LIST' }],
    }),

    getPayrollRuns: build.query<PayrollRunsListResponse, PayrollRunsListParams | void>({
      query: (params) => ({
        url: '/payroll/runs',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): PayrollRunsListResponse => {
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
          { type: 'PayrollRuns' as const, id: 'LIST' },
          ...items.map((r) => ({ type: 'PayrollRun' as const, id: r.s_no })),
        ];
      },
    }),

    getPayrollRunById: build.query<PayrollRunResponse, number>({
      query: (runId) => ({ url: `/payroll/runs/${runId}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, runId) => [{ type: 'PayrollRun' as const, id: runId }],
    }),

    addPayrollItemPayment: build.mutation<any, { runId: number; itemId: number; data: CreatePayrollItemPaymentDto }>({
      query: ({ itemId, data }) => ({
        url: `/payroll/items/${itemId}/payments`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [{ type: 'PayrollRun' as const, id: arg.runId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGeneratePayrollRunMutation,
  useGetPayrollRunsQuery,
  useLazyGetPayrollRunsQuery,
  useGetPayrollRunByIdQuery,
  useLazyGetPayrollRunByIdQuery,
  useAddPayrollItemPaymentMutation,
} = payrollApi;
