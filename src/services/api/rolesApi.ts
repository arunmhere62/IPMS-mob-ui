import { baseApi } from './baseApi';

export interface Role {
  s_no: number;
  role_name: string;
  status?: string;
  permissions?: Record<string, any>;
  _count?: {
    users: number;
  };
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
  message?: string;
}

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const normalizeListResponse = <T>(response: any): { success: boolean; data: T[]; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);

  // Centralized envelope may return an array directly
  if (Array.isArray(unwrapped)) {
    return {
      success: (response as any)?.success ?? true,
      data: unwrapped as T[],
      message: (response as any)?.message,
    };
  }

  // Or it may return an object containing `data`
  const items = Array.isArray(unwrapped?.data) ? unwrapped.data : [];
  return {
    success: (unwrapped as any)?.success ?? (response as any)?.success ?? true,
    data: items as T[],
    message: (unwrapped as any)?.message ?? (response as any)?.message,
  };
};

const normalizeEntityResponse = <T>(response: any): { success: boolean; data: T | null; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);
  return {
    success: (response as any)?.success ?? true,
    data: (unwrapped as T) ?? null,
    message: (response as any)?.message,
  };
};

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<RolesResponse, void>({
      query: () => ({ url: '/auth/roles', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<RolesResponse> | any) => normalizeListResponse<Role>(response),
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
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Role>(response),
      providesTags: (_res, _err, id) => [{ type: 'Role' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetRolesQuery, useLazyGetRolesQuery, useGetRoleByIdQuery, useLazyGetRoleByIdQuery } = rolesApi;
