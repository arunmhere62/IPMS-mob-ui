import { baseApi } from './baseApi';

export interface OrganizationAdmin {
  s_no: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  created_at: string;
}

export interface PGLocationRoom {
  s_no: number;
  room_no: string;
  beds_count: number;
}

export interface PGLocationDetail {
  s_no: number;
  location_name: string;
  address: string;
  status: string;
  rooms_count: number;
  beds_count: number;
  rooms: PGLocationRoom[];
}

export interface Organization {
  s_no: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  admins: OrganizationAdmin[];
  pg_locations_count: number;
  pg_locations: PGLocationDetail[];
}

export interface OrganizationStats {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  totalUsers: number;
  totalPGLocations: number;
  totalTenants: number;
  totalRevenue: number;
  recentOrganizations: number;
}

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
}

export interface GetOrganizationsResponse {
  success: boolean;
  data: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface GetOrganizationStatsResponse {
  success: boolean;
  data: OrganizationStats;
}

export type UpdateOrganizationDto = {
  name?: string;
  description?: string;
};

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapData = <T>(response: ApiEnvelope<T> | unknown): T | unknown => {
  if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
    return (response as ApiEnvelope<T>).data ?? response;
  }
  return response;
};

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllOrganizations: build.query<GetOrganizationsResponse, GetOrganizationsParams | void>({
      query: (params) => ({
        url: '/organizations',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<GetOrganizationsResponse> | unknown) => unwrapData<GetOrganizationsResponse>(response) as GetOrganizationsResponse,
      providesTags: (result) => {
        const items = (result as GetOrganizationsResponse | undefined)?.data;
        return [
          { type: 'Organizations' as const, id: 'LIST' },
          ...(Array.isArray(items) ? items.map((o) => ({ type: 'Organization' as const, id: o.s_no })) : []),
        ];
      },
    }),

    getOrganizationStats: build.query<GetOrganizationStatsResponse, void>({
      query: () => ({ url: '/organizations/stats', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetOrganizationStatsResponse> | unknown) => unwrapData<GetOrganizationStatsResponse>(response) as GetOrganizationStatsResponse,
      providesTags: [{ type: 'OrganizationStats' as const, id: 'SINGLE' }],
    }),

    getOrganizationById: build.query<unknown, number>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) => unwrapData<unknown>(response),
      providesTags: (_res, _err, id) => [{ type: 'Organization' as const, id }],
    }),

    updateOrganization: build.mutation<unknown, { id: number; data: UpdateOrganizationDto }>({
      query: ({ id, data }) => ({ url: `/organizations/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) => unwrapData<unknown>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Organizations' as const, id: 'LIST' },
        { type: 'Organization' as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllOrganizationsQuery,
  useLazyGetAllOrganizationsQuery,
  useGetOrganizationStatsQuery,
  useLazyGetOrganizationStatsQuery,
  useGetOrganizationByIdQuery,
  useLazyGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
} = organizationApi;
