import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export type EmployeesListParams = {
  page?: number;
  limit?: number;
  pg_id?: number;
  role_id?: number;
  search?: string;
};

export type EmployeesListResponse = {
  success: boolean;
  data: Employee[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type EmployeeStatsParams = {
  pg_id?: number;
};


export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CreateEmployeeDto {
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  role_id: number;
  gender?: UserGender;
  address?: string;
  city_id?: number;
  state_id?: number;
  pincode?: string;
  country?: string;
  proof_documents?: string[];
  profile_images?: string[];
}

export interface UpdateEmployeeDto {
  name?: string;
  password?: string;
  phone?: string;
  role_id?: number;
  gender?: UserGender;
  address?: string;
  city_id?: number;
  state_id?: number;
  pincode?: string;
  country?: string;
  proof_documents?: string[];
  profile_images?: string[];
}

export interface Employee {
  s_no: number;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  role_id: number;
  organization_id?: number;
  gender?: UserGender;
  address?: string;
  city_id?: number;
  state_id?: number;
  pincode?: string;
  country?: string;
  proof_documents?: any;
  profile_images?: any;
  created_at: string;
  updated_at: string;
  roles?: {
    s_no: number;
    role_name: string;
  };
  city?: {
    s_no: number;
    name: string;
  };
  state?: {
    s_no: number;
    name: string;
  };
}
export type EmployeeStatsResponse = unknown;

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<EmployeesListResponse, EmployeesListParams | void>({
      query: (params) => ({
        url: '/employees',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): EmployeesListResponse => {
        const payload = (response as any)?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(data) ? data : [],
          pagination: payload?.pagination,
        };
      },
      providesTags: (result) => {
        const employees = result?.data || [];
        return [
          { type: 'Employees' as const, id: 'LIST' },
          ...employees.map((e) => ({ type: 'Employee' as const, id: e.s_no })),
        ];
      },
    }),

    getEmployeeById: build.query<Employee, number>({
      query: (id) => ({ url: `/employees/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<Employee> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: build.mutation<Employee, CreateEmployeeDto>({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<Employee> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }],
    }),

    updateEmployee: build.mutation<Employee, { id: number; data: UpdateEmployeeDto }>({
      query: ({ id, data }) => ({ url: `/employees/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<Employee> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Employees', id: 'LIST' },
        { type: 'Employee', id: arg.id },
      ],
    }),

    deleteEmployee: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Employees', id: 'LIST' },
        { type: 'Employee', id },
      ],
    }),

    getEmployeeStats: build.query<EmployeeStatsResponse, EmployeeStatsParams | void>({
      query: (params) => ({
        url: '/employees/stats',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<EmployeeStatsResponse> | any) => (response as any)?.data ?? response,
      providesTags: [{ type: 'EmployeeStats', id: 'SINGLE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmployeesQuery,
  useLazyGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useLazyGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeStatsQuery,
  useLazyGetEmployeeStatsQuery,
} = employeesApi;
