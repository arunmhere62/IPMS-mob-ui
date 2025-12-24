import { baseApi } from './baseApi';


type ApiEnvelope<T> = {
  data?: T;
};

export type EmployeeSalariesListParams = {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
};
export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
export interface CreateEmployeeSalaryDto {
  user_id: number;
  salary_amount: number;
  month: string; // YYYY-MM-DD format
  paid_date?: string; // YYYY-MM-DD format
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface UpdateEmployeeSalaryDto {
  salary_amount?: number;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface EmployeeSalary {
  s_no: number;
  user_id: number;
  pg_id: number;
  salary_amount: number;
  month: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  users?: {
    s_no: number;
    name: string;
    email?: string;
    phone?: string;
    role_id?: number;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}
export type EmployeeSalariesListResponse = {
  success: boolean;
  data: EmployeeSalary[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type EmployeeSalaryResponse = {
  success: boolean;
  data: EmployeeSalary;
  message?: string;
};

export type EmployeeSalaryStatsParams = {
  startMonth?: string;
  endMonth?: string;
};

export type EmployeeSalaryStatsResponse = {
  success: boolean;
  data: any;
};

export const employeeSalaryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployeeSalaries: build.query<EmployeeSalariesListResponse, EmployeeSalariesListParams | void>({
      query: (params) => ({
        url: '/employee-salary',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): EmployeeSalariesListResponse => {
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
          { type: 'EmployeeSalaries' as const, id: 'LIST' },
          ...items.map((s) => ({ type: 'EmployeeSalary' as const, id: s.s_no })),
        ];
      },
    }),

    getEmployeeSalariesByEmployee: build.query<EmployeeSalariesListResponse, { userId: number } & EmployeeSalariesListParams>({
      query: ({ userId, ...params }) => ({
        url: `/employee-salary/employee/${userId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): EmployeeSalariesListResponse => {
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
          { type: 'EmployeeSalaries' as const, id: 'LIST' },
          ...items.map((s) => ({ type: 'EmployeeSalary' as const, id: s.s_no })),
        ];
      },
    }),

    getEmployeeSalaryById: build.query<EmployeeSalaryResponse, number>({
      query: (id) => ({ url: `/employee-salary/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'EmployeeSalary' as const, id }],
    }),

    createEmployeeSalary: build.mutation<EmployeeSalaryResponse, CreateEmployeeSalaryDto>({
      query: (body) => ({ url: '/employee-salary', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'EmployeeSalaries' as const, id: 'LIST' }],
    }),

    updateEmployeeSalary: build.mutation<EmployeeSalaryResponse, { id: number; data: UpdateEmployeeSalaryDto }>({
      query: ({ id, data }) => ({ url: `/employee-salary/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'EmployeeSalaries' as const, id: 'LIST' },
        { type: 'EmployeeSalary' as const, id: arg.id },
      ],
    }),

    deleteEmployeeSalary: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/employee-salary/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'EmployeeSalaries' as const, id: 'LIST' },
        { type: 'EmployeeSalary' as const, id },
      ],
    }),

    getEmployeeSalaryStats: build.query<EmployeeSalaryStatsResponse, EmployeeSalaryStatsParams | void>({
      query: (params) => ({
        url: '/employee-salary/stats',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: [{ type: 'EmployeeSalaryStats' as const, id: 'SINGLE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmployeeSalariesQuery,
  useLazyGetEmployeeSalariesQuery,
  useGetEmployeeSalariesByEmployeeQuery,
  useLazyGetEmployeeSalariesByEmployeeQuery,
  useGetEmployeeSalaryByIdQuery,
  useLazyGetEmployeeSalaryByIdQuery,
  useCreateEmployeeSalaryMutation,
  useUpdateEmployeeSalaryMutation,
  useDeleteEmployeeSalaryMutation,
  useGetEmployeeSalaryStatsQuery,
  useLazyGetEmployeeSalaryStatsQuery,
} = employeeSalaryApi;
