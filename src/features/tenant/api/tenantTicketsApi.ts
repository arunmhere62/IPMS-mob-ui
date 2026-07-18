import { tenantBaseApi } from "./tenantBaseApi";

export type TenantTicketCategory = 'MAINTENANCE' | 'COMPLAINT' | 'REQUEST' | 'OTHER';
export type TenantTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TenantTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TenantTicket {
  s_no: number;
  category: TenantTicketCategory;
  title: string;
  description: string | null;
  status: TenantTicketStatus;
  priority: TenantTicketPriority;
  created_at: string;
  updated_at: string;
  users: { s_no: number; name: string } | null;
  _count?: { tenant_ticket_comments: number };
}

export interface TenantTicketComment {
  s_no: number;
  ticket_id: number;
  sender_type: 'TENANT' | 'OWNER';
  sender_id: number;
  message: string | null;
  attachments: string[] | null;
  created_at: string;
}

export interface TenantTicketDetail extends TenantTicket {
  tenant_ticket_comments: TenantTicketComment[];
}

export interface CreateTenantTicketPayload {
  category: TenantTicketCategory;
  title: string;
  description?: string;
  priority?: TenantTicketPriority;
}

export interface AddTenantCommentPayload {
  message?: string;
  attachments?: string[];
}

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export const tenantTicketsApi = tenantBaseApi.injectEndpoints({
  endpoints: (build) => ({
    getTenantTickets: build.query<
      { tickets: TenantTicket[]; total: number; page: number; limit: number },
      { status?: string; page?: number; limit?: number }
    >({
      query: ({ status, page = 1, limit = 20 }) => ({
        url: `/tenant/tickets`,
        method: 'GET',
        params: { status, page, limit },
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: [{ type: 'TenantTickets' as const, id: 'LIST' }],
    }),

    getTenantTicketById: build.query<TenantTicketDetail, number>({
      query: (id) => ({ url: `/tenant/tickets/${id}`, method: 'GET' }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_r, _e, id) => [{ type: 'TenantTicketDetail' as const, id }],
      keepUnusedDataFor: 0,
    }),

    createTenantTicket: build.mutation<TenantTicket, CreateTenantTicketPayload>({
      query: (body) => ({ url: `/tenant/tickets`, method: 'POST', body }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: [{ type: 'TenantTickets' as const, id: 'LIST' }],
    }),

    addTenantTicketComment: build.mutation<
      TenantTicketComment,
      { ticketId: number; payload: AddTenantCommentPayload }
    >({
      query: ({ ticketId, payload }) => ({
        url: `/tenant/tickets/${ticketId}/comments`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: (res: any) => res?.data ?? res,
    }),

    closeTenantTicket: build.mutation<TenantTicket, number>({
      query: (id) => ({ url: `/tenant/tickets/${id}/close`, method: 'PATCH' }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_r, _e, id) => [
        { type: 'TenantTickets' as const, id: 'LIST' },
        { type: 'TenantTicketDetail' as const, id },
      ],
    }),

    registerTenantPushToken: build.mutation<
      { success: boolean; message: string },
      { fcm_token: string; device_type?: string; device_id?: string; device_name?: string }
    >({
      query: (body) => ({ url: `/tenant/tickets/notifications/token`, method: 'POST', body }),
      transformResponse: (res: any) => res?.data ?? res,
    }),

    unregisterTenantPushToken: build.mutation<
      { success: boolean; message: string },
      { fcm_token: string }
    >({
      query: (body) => ({ url: `/tenant/tickets/notifications/token`, method: 'DELETE', body }),
      transformResponse: (res: any) => res?.data ?? res,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTenantTicketsQuery,
  useGetTenantTicketByIdQuery,
  useCreateTenantTicketMutation,
  useAddTenantTicketCommentMutation,
  useCloseTenantTicketMutation,
  useRegisterTenantPushTokenMutation,
  useUnregisterTenantPushTokenMutation,
} = tenantTicketsApi;
