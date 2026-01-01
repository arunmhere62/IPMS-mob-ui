import { baseApi } from './baseApi';


export interface VisitorRoom {
  s_no: number;
  room_no?: string | null;
}

export interface VisitorBed {
  s_no: number;
  bed_no?: string | null;
  bed_price?: string | null;
}

export interface VisitorLocation {
  s_no: number;
  name?: string | null;
}

export interface Visitor {
  s_no: number;
  pg_id?: number | null;
  visitor_name?: string;
  phone_no?: string;
  purpose?: string;
  visited_date?: string;
  visited_room_id?: number | null;
  visited_bed_id?: number | null;
  city_id?: number | null;
  state_id?: number | null;
  remarks?: string;
  convertedTo_tenant: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
  address?: string | null;
  rooms?: VisitorRoom | null;
  beds?: VisitorBed | null;
  city?: VisitorLocation | null;
  state?: VisitorLocation | null;
  pg_locations?: {
    s_no: number;
    location_name?: string | null;
    address?: string | null;
  } | null;
}

export interface CreateVisitorDto {
  visitor_name: string;
  phone_no: string;
  purpose?: string;
  visited_date?: string;
  visited_room_id?: number;
  visited_bed_id?: number;
  city_id?: number;
  state_id?: number;
  remarks?: string;
  convertedTo_tenant?: boolean;
}

export interface GetVisitorsParams {
  page?: number;
  limit?: number;
  search?: string;
  room_id?: number;
  converted_to_tenant?: boolean;
}

type ApiEnvelope<T> = {
  data?: T;
};

export type VisitorsListResponse = {
  success: boolean;
  data: Visitor[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type VisitorResponse = {
  success: boolean;
  data: Visitor;
  message?: string;
};

export type VisitorStatsResponse = {
  success: boolean;
  data: any;
};

export const visitorsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getVisitors: build.query<VisitorsListResponse, GetVisitorsParams | void>({
      query: (params) => ({
        url: '/visitors',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): VisitorsListResponse => {
        const payload = (response as any)?.data ?? response;
        const list = payload?.data ?? payload;
        const items = Array.isArray(list) ? list : list?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
          pagination: list?.pagination ?? payload?.pagination,
        };
      },
      providesTags: (result) => {
        const visitors = result?.data || [];
        return [
          { type: 'Visitors' as const, id: 'LIST' },
          ...visitors.map((v) => ({ type: 'Visitor' as const, id: v.s_no })),
        ];
      },
    }),

    getVisitorById: build.query<Visitor, number>({
      query: (id) => ({ url: `/visitors/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<Visitor> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'Visitor' as const, id }],
    }),

    createVisitor: build.mutation<VisitorResponse, CreateVisitorDto>({
      query: (body) => ({ url: '/visitors', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'Visitors' as const, id: 'LIST' }],
    }),

    updateVisitor: build.mutation<VisitorResponse, { id: number; data: Partial<CreateVisitorDto> }>({
      query: ({ id, data }) => ({ url: `/visitors/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Visitors' as const, id: 'LIST' },
        { type: 'Visitor' as const, id: arg.id },
      ],
    }),

    deleteVisitor: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/visitors/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'Visitors' as const, id: 'LIST' },
        { type: 'Visitor' as const, id },
      ],
    }),

    getVisitorStats: build.query<VisitorStatsResponse, void>({
      query: () => ({ url: '/visitors/stats', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: [{ type: 'VisitorStats' as const, id: 'SINGLE' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetVisitorsQuery,
  useLazyGetVisitorsQuery,
  useGetVisitorByIdQuery,
  useLazyGetVisitorByIdQuery,
  useCreateVisitorMutation,
  useUpdateVisitorMutation,
  useDeleteVisitorMutation,
  useGetVisitorStatsQuery,
  useLazyGetVisitorStatsQuery,
} = visitorsApi;
