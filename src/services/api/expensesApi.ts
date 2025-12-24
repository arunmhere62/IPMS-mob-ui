import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export type ExpensesListParams = {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
};

export type ExpensesListResponse = {
  success: boolean;
  data: Expense[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type ExpenseStatsParams = {
  startDate?: string;
  endDate?: string;
};


export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface CreateExpenseDto {
  expense_type: string;
  amount: number;
  paid_to: string;
  paid_date: string;
  payment_method: PaymentMethod;
  remarks?: string;
}

export interface UpdateExpenseDto {
  expense_type?: string;
  amount?: number;
  paid_to?: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface Expense {
  s_no: number;
  pg_id: number;
  expense_type: string;
  amount: number;
  paid_to: string;
  paid_date: string;
  payment_method: PaymentMethod;
  remarks?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  pg_locations?: {
    location_name: string;
  };
}

export type ExpenseStatsResponse = unknown;

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExpenses: build.query<ExpensesListResponse, ExpensesListParams | void>({
      query: (params) => ({
        url: '/expenses',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): ExpensesListResponse => {
        const payload = (response as any)?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(data) ? data : [],
          pagination: payload?.pagination,
        };
      },
      providesTags: (result) => {
        const list = (result as any)?.data ?? result;
        const items = Array.isArray(list) ? list : list?.data;
        return [
          { type: 'Expenses' as const, id: 'LIST' },
          ...(Array.isArray(items) ? items : []).map((e: Expense) => ({ type: 'Expense' as const, id: e.s_no })),
        ];
      },
    }),

    getExpenseById: build.query<any, number>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'Expense', id }],
    }),

    createExpense: build.mutation<any, CreateExpenseDto>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'Expenses', id: 'LIST' }],
    }),

    updateExpense: build.mutation<any, { id: number; data: UpdateExpenseDto }>({
      query: ({ id, data }) => ({ url: `/expenses/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Expense', id: arg.id },
      ],
    }),

    deleteExpense: build.mutation<any, number>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'Expenses', id: 'LIST' },
        { type: 'Expense', id },
      ],
    }),

    getExpenseStats: build.query<ExpenseStatsResponse, ExpenseStatsParams | void>({
      query: (params) => ({
        url: '/expenses/stats',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<ExpenseStatsResponse> | any) => (response as any)?.data ?? response,
      providesTags: [{ type: 'ExpenseStats' as const, id: 'SINGLE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useGetExpenseByIdQuery,
  useLazyGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery,
  useLazyGetExpenseStatsQuery,
} = expensesApi;
