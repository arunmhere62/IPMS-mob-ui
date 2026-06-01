import { tenantBaseApi } from './tenantBaseApi';

// Matches backend raw tenant response
export interface TenantProfileData {
  // Tenant basic info
  s_no: number;
  tenant_id: string;
  name: string;
  phone_no: string;
  whatsapp_number: string | null;
  email: string | null;
  status: string;
  occupation: string | null;
  tenant_address: string | null;
  check_in_date: string | null;
  check_out_date: string | null;

  // IDs
  pg_id: number;
  room_id: number;
  bed_id: number;

  // Location
  city_id: number | null;
  state_id: number | null;
  city: { s_no: number; name: string } | null;
  state: { s_no: number; name: string } | null;

  // PG info
  pg_locations: {
    s_no: number;
    location_name: string;
    address: string;
    rent_cycle_type: string;
    city: { s_no: number; name: string; country_code: string; state_code: string } | null;
    state: { s_no: number; name: string; iso_code: string; country_code: string } | null;
  } | null;

  // Room/Bed info
  rooms: { s_no: number; room_no: string } | null;
  beds: { s_no: number; bed_no: string; bed_price: string } | null;

  // Rent cycles
  tenant_rent_cycles: Array<{
    s_no: number;
    cycle_type: string;
    anchor_day: number | null;
    cycle_start: string;
    cycle_end: string | null;
  }>;

  // Images / Docs
  images: string[];
  proof_documents: string[];

  // Payments
  rent_payments: Array<{
    s_no: number;
    payment_date: string;
    pg_id: number;
    room_id: number;
    bed_id: number;
    amount_paid: string;
    actual_rent_amount: string;
    cycle_id: number;
    payment_method: string;
    status: string;
    remarks: string | null;
    bed_rent_amount_snapshot: number;
    tenant_rent_cycles: { s_no: number; cycle_type: string; cycle_start: string; cycle_end: string } | null;
    pg_locations: { s_no: number; location_name: string } | null;
    rooms: { s_no: number; room_no: string } | null;
    beds: { s_no: number; bed_no: string } | null;
  }>;
  advance_payments: Array<{
    s_no: number;
    payment_date: string;
    pg_id: number;
    room_id: number;
    bed_id: number;
    amount_paid: string;
    actual_rent_amount: string;
    payment_method: string;
    status: string;
    remarks: string | null;
    pg_locations: { s_no: number; location_name: string } | null;
    rooms: { s_no: number; room_no: string } | null;
    beds: { s_no: number; bed_no: string } | null;
  }>;
  refund_payments: Array<{
    s_no: number;
    payment_date: string;
    amount_paid: string;
    payment_method: string;
    status: string;
    remarks: string | null;
  }>;
  current_bills: any[];

  // Tenant allocations
  tenant_allocations: Array<{
    s_no: number;
    effective_from: string;
    effective_to: string | null;
    bed_price_snapshot: string;
    pg_id: number;
    room_id: number;
    bed_id: number;
    pg_locations: { s_no: number; location_name: string } | null;
    rooms: { s_no: number; room_no: string } | null;
    beds: { s_no: number; bed_no: string } | null;
  }>;

  // Payment status
  is_rent_paid: boolean;
  is_rent_partial: boolean;
  rent_due_amount: number;
  partial_due_amount: number;
  pending_due_amount: number;
  is_advance_paid: boolean;
  is_refund_paid: boolean;
  pending_months: number;
  unpaid_months: Array<{ cycle_start: string; cycle_end: string; cycle_type: string }>;
  payment_status: string;
}

export interface TenantPaymentsData {
  payments: Array<{
    s_no: number;
    payment_date: string;
    amount_paid: string;
    payment_method: string;
    status: string;
    remarks: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantDuesData {
  totalDue: number;
  pendingPayments: Array<{
    s_no: number;
    payment_date: string;
    amount_paid: string;
    payment_method: string;
    status: string;
    remarks: string | null;
  }>;
}

export interface TicketOverview {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
}

export interface Ticket {
  s_no: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  _count: {
    tenant_ticket_comments: number;
  };
}

export interface UnreadTickets {
  count: number;
  tickets: Ticket[];
}

export interface TenantTicketStatsData {
  overview: TicketOverview;
  recentTickets: Ticket[];
  unreadTickets: UnreadTickets;
}

// Full API response: Central envelope -> actual data (no ResponseUtil wrapper)
export interface TenantProfileResponse {
  statusCode: number;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    apiMs: number;
    dbMs: number;
    dbQueries: number;
  };
  data: TenantProfileData;
}

export interface TenantPaymentsResponse {
  success: boolean;
  message: string;
  data: TenantPaymentsData;
}

export interface TenantDuesResponse {
  success: boolean;
  message: string;
  data: TenantDuesData;
}

export interface TenantTicketStatsResponse {
  success: boolean;
  message: string;
  data: TenantTicketStatsData;
}

export const tenantPortalApi = tenantBaseApi.injectEndpoints({
  endpoints: (build) => ({
    // Get tenant profile with PG, room, bed details
    getTenantProfile: build.query<TenantProfileResponse, void>({
      query: () => ({
        url: 'tenant/profile',
        method: 'GET',
      }),
    }),

    // Get tenant payment history
    getTenantPayments: build.query<TenantPaymentsResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `tenant/payments?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
    }),

    // Get tenant pending dues
    getTenantDues: build.query<TenantDuesResponse, void>({
      query: () => ({
        url: 'tenant/dues',
        method: 'GET',
      }),
    }),

    // Get tenant ticket stats
    getTenantTicketStats: build.query<TenantTicketStatsResponse, void>({
      query: () => ({
        url: 'tenant/ticket-stats',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetTenantProfileQuery,
  useLazyGetTenantProfileQuery,
  useGetTenantPaymentsQuery,
  useGetTenantDuesQuery,
  useGetTenantTicketStatsQuery,
} = tenantPortalApi;
