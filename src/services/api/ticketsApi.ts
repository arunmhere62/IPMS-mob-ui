import { baseApi } from './baseApi';

export interface CreateTicketData {
  title: string;
  description: string;
  category: 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attachments?: string[];
  pg_id?: number;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  assigned_to?: number;
  attachments?: string[];
}

export interface AddCommentData {
  comment: string;
  attachments?: string[];
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  my_tickets?: boolean;
  search?: string;
}

type ApiEnvelope<T> = {
  data?: T;
};

export type Ticket = {
  s_no: number;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reported_by: number;
  assigned_to?: number;
  organization_id?: number;
  pg_id?: number;
  attachments?: string[];
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  users_issue_tickets_reported_byTousers?: any;
  users_issue_tickets_assigned_toTousers?: any;
  issue_ticket_comments?: any[];
};

export type TicketsListResponse = {
  success: boolean;
  data: Ticket[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type TicketResponse = {
  success: boolean;
  data: Ticket;
  message?: string;
};

export type TicketStatsResponse = {
  success: boolean;
  data: any;
};

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTickets: build.query<TicketsListResponse, TicketFilters | void>({
      query: (filters) => ({
        url: '/tickets',
        method: 'GET',
        params: filters || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): TicketsListResponse => {
        const payload = (response as any)?.data ?? response;
        const data = Array.isArray(payload) ? payload : payload?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(data) ? data : [],
          pagination: payload?.pagination,
        };
      },
      providesTags: (result) => {
        const tickets = result?.data || [];
        return [
          { type: 'Tickets' as const, id: 'LIST' },
          ...tickets.map((t) => ({ type: 'Ticket' as const, id: t.s_no })),
        ];
      },
    }),

    getTicketById: build.query<TicketResponse, number>({
      query: (id) => ({ url: `/tickets/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, id) => [{ type: 'Ticket' as const, id }],
    }),

    createTicket: build.mutation<TicketResponse, CreateTicketData>({
      query: (body) => ({ url: '/tickets', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: [{ type: 'Tickets' as const, id: 'LIST' }],
    }),

    updateTicket: build.mutation<TicketResponse, { id: number; data: UpdateTicketData }>({
      query: ({ id, data }) => ({ url: `/tickets/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Tickets' as const, id: 'LIST' },
        { type: 'Ticket' as const, id: arg.id },
      ],
    }),

    deleteTicket: build.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({ url: `/tickets/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Tickets' as const, id: 'LIST' },
        { type: 'Ticket' as const, id },
      ],
    }),

    addTicketComment: build.mutation<any, { ticketId: number; data: AddCommentData }>({
      query: ({ ticketId, data }) => ({ url: `/tickets/${ticketId}/comments`, method: 'POST', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [{ type: 'Ticket' as const, id: arg.ticketId }],
    }),

    getTicketStats: build.query<TicketStatsResponse, void>({
      query: () => ({ url: '/tickets/stats', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: [{ type: 'TicketStats' as const, id: 'SINGLE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketsQuery,
  useLazyGetTicketsQuery,
  useGetTicketByIdQuery,
  useLazyGetTicketByIdQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useAddTicketCommentMutation,
  useGetTicketStatsQuery,
  useLazyGetTicketStatsQuery,
} = ticketsApi;
