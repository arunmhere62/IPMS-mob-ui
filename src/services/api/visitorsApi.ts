import { baseApi } from './baseApi';
import type { CreateVisitorDto, GetVisitorsParams, Visitor } from '../visitors/visitorService';

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
  overrideExisting: false,
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
