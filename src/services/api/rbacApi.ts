import { baseApi } from './baseApi';

type CentralEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

export type MyPermissionsResponse = {
  user_id: number;
  role_id: number;
  permissions_map: Record<string, boolean>;
  permissions: string[];
};

export type PermissionCatalogItem = {
  s_no: number;
  screen_name: string;
  action: string;
  description?: string | null;
};

export type UserPermissionOverride = {
  s_no: number;
  user_id: number;
  permission_id: number;
  effect: 'ALLOW' | 'DENY' | string;
  created_by: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  permissions_master?: PermissionCatalogItem;
};

export type ListOverridesArgs = { user_id?: number; permission_id?: number } | void;

export type UpsertOverridePayload = {
  user_id: number;
  permission_id: number;
  effect: 'ALLOW' | 'DENY';
  expires_at?: string;
};

export type RemoveOverridePayload = {
  user_id: number;
  permission_id: number;
};

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyPermissions: build.query<MyPermissionsResponse, void>({
      query: () => ({ url: '/auth/me/permissions', method: 'GET' }),
      transformResponse: (response: CentralEnvelope<MyPermissionsResponse> | any) => unwrapCentralData<MyPermissionsResponse>(response),
      providesTags: [{ type: 'User' as const, id: 'ME_PERMISSIONS' } as any],
    }),

    listPermissionsGrouped: build.query<Record<string, PermissionCatalogItem[]>, void>({
      query: () => ({ url: '/rbac/permissions/grouped', method: 'GET' }),
      transformResponse: (response: CentralEnvelope<Record<string, PermissionCatalogItem[]>> | any) =>
        unwrapCentralData<Record<string, PermissionCatalogItem[]>>(response),
      providesTags: [{ type: 'User' as const, id: 'PERMISSIONS_CATALOG' } as any],
    }),

    listUserPermissionOverrides: build.query<UserPermissionOverride[], ListOverridesArgs>({
      query: (args) => ({
        url: '/user-permission-overrides',
        method: 'GET',
        params: args ?? undefined,
      }),
      transformResponse: (response: CentralEnvelope<UserPermissionOverride[]> | any) => unwrapCentralData<UserPermissionOverride[]>(response),
      providesTags: (_res, _err, arg) => [{ type: 'User' as const, id: `OVERRIDES_${(arg as any)?.user_id ?? 'LIST'}` } as any],
    }),

    upsertUserPermissionOverride: build.mutation<UserPermissionOverride, UpsertOverridePayload>({
      query: (body) => ({
        url: '/user-permission-overrides',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<UserPermissionOverride> | any) => unwrapCentralData<UserPermissionOverride>(response),
      invalidatesTags: (_res, _err, arg) => [{ type: 'User' as const, id: `OVERRIDES_${arg.user_id}` } as any],
    }),

    removeUserPermissionOverride: build.mutation<null, RemoveOverridePayload>({
      query: (body) => ({
        url: '/user-permission-overrides',
        method: 'DELETE',
        body,
      }),
      transformResponse: (response: CentralEnvelope<null> | any) => unwrapCentralData<null>(response),
      invalidatesTags: (_res, _err, arg) => [{ type: 'User' as const, id: `OVERRIDES_${arg.user_id}` } as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyPermissionsQuery,
  useLazyGetMyPermissionsQuery,
  useListPermissionsGroupedQuery,
  useLazyListPermissionsGroupedQuery,
  useListUserPermissionOverridesQuery,
  useLazyListUserPermissionOverridesQuery,
  useUpsertUserPermissionOverrideMutation,
  useRemoveUserPermissionOverrideMutation,
} = rbacApi;
