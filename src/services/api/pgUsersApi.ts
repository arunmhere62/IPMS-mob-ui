import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export type PgUserAssignment = {
  s_no: number;
  pg_id: number;
  user_id: number;
  is_active: boolean;
  monthly_salary_amount?: number | null;
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
    address?: string;
    status?: string;
  };
};

export type PgUserAssignmentResponse = {
  success: boolean;
  data: PgUserAssignment;
  message?: string;
};

export const pgUsersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPgUserAssignment: build.query<PgUserAssignmentResponse, { userId: number }>({
      query: ({ userId }) => ({ url: `/pg-users/assignment/${userId}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, arg) => [{ type: 'Employee' as const, id: arg.userId }],
    }),

    updatePgUserSalary: build.mutation<PgUserAssignmentResponse, { userId: number; monthly_salary_amount: number }>({
      query: ({ userId, monthly_salary_amount }) => ({
        url: `/pg-users/assignment/${userId}/salary`,
        method: 'PATCH',
        body: { monthly_salary_amount },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [{ type: 'Employee' as const, id: arg.userId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPgUserAssignmentQuery, useLazyGetPgUserAssignmentQuery, useUpdatePgUserSalaryMutation } = pgUsersApi;
