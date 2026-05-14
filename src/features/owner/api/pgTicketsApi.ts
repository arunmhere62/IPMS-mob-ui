import { baseApi } from './baseApi';

export type PgTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type PgTenantTicket = {
  s_no: number;
  pg_id?: number;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: PgTicketStatus;
  created_at: string;
  updated_at: string;
  tenants?: { s_no: number; name: string; phone_no?: string };
  users?: { s_no: number; name: string };
  _count?: { tenant_ticket_comments: number };
};

export type PgTenantTicketComment = {
  s_no: number;
  message: string | null;
  sender_type: 'TENANT' | 'OWNER';
  sender_id: number;
  attachments: string[] | null;
  created_at: string;
};

export type PgTenantTicketDetail = PgTenantTicket & {
  tenant_ticket_comments: PgTenantTicketComment[];
};

export type PgTicketsListResponse = {
  tickets: PgTenantTicket[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export type PgTicketDetailResponse = {
  ticket: PgTenantTicketDetail;
};

export const pgTicketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPgTenantTickets: build.query<PgTicketsListResponse, { status?: string; category?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/pg/tickets', method: 'GET', params }),
      transformResponse: (r: any) => {
        const payload = r?.data ?? r;
        const tickets = payload?.tickets ?? (Array.isArray(payload) ? payload : []);
        const pagination = payload?.pagination ?? { total: tickets.length, page: 1, limit: 20, totalPages: 1 };
        return { tickets, pagination };
      },
      providesTags: [{ type: 'PgTenantTickets' as const, id: 'LIST' }],
    }),

    getPgTenantTicketById: build.query<PgTicketDetailResponse, { id: number; pgId?: number }>({
      query: ({ id, pgId }) => ({
        url: `/pg/tickets/${id}`,
        method: 'GET',
        headers: pgId ? { 'x-pg-location-id': String(pgId) } : undefined,
      }),
      transformResponse: (r: any) => {
        const ticket = r?.data ?? r;
        return { ticket };
      },
      providesTags: (_r, _e, arg) => [{ type: 'PgTenantTicket' as const, id: arg.id }],
    }),

    updatePgTicketStatus: build.mutation<any, { id: number; pgId?: number; status: PgTicketStatus }>({
      query: ({ id, pgId, status }) => ({
        url: `/pg/tickets/${id}/status`,
        method: 'PATCH',
        body: { status },
        headers: pgId ? { 'x-pg-location-id': String(pgId) } : undefined,
      }),
      transformResponse: (r: any) => r?.data ?? r,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PgTenantTickets' as const, id: 'LIST' },
        { type: 'PgTenantTicket' as const, id: arg.id },
      ],
    }),

    addPgTicketComment: build.mutation<any, { id: number; pgId?: number; comment: string }>({
      query: ({ id, pgId, comment }) => ({
        url: `/pg/tickets/${id}/comments`,
        method: 'POST',
        body: { message: comment },
        headers: pgId ? { 'x-pg-location-id': String(pgId) } : undefined,
      }),
      transformResponse: (r: any) => r?.data ?? r,
      invalidatesTags: (_r, _e, arg) => [{ type: 'PgTenantTicket' as const, id: arg.id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPgTenantTicketsQuery,
  useGetPgTenantTicketByIdQuery,
  useUpdatePgTicketStatusMutation,
  useAddPgTicketCommentMutation,
} = pgTicketsApi;
