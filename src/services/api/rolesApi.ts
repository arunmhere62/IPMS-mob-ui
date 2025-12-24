import { baseApi } from './baseApi';
import type { Role, RolesResponse } from '../roles/rolesService';

type ApiEnvelope<T> = {
  data?: T;
};

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<RolesResponse, void>({
      query: () => ({ url: '/auth/roles', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<RolesResponse> | any) => (response as any)?.data ?? response,
      providesTags: (result) => {
        const roles = (result as any)?.data || [];
        return [
          { type: 'Roles' as const, id: 'LIST' },
          ...roles.map((r: Role) => ({ type: 'Role' as const, id: r.s_no })),
        ];
      },
    }),

    getRoleById: build.query<{ success: boolean; data: Role | null; message?: string }, number>({
      query: (id) => ({ url: `/auth/roles/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'Role' as const, id }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetRolesQuery, useLazyGetRolesQuery, useGetRoleByIdQuery, useLazyGetRoleByIdQuery } = rolesApi;
