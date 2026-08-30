import { tenantBaseApi } from './tenantBaseApi';

// Matches backend slim tenant profile response (no payment data)
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
  expected_vacate_date: string | null;

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

  // Images / Docs (scalar fields on tenant model)
  images: string[];
  proof_documents: string[];

  // Tenant allocations (bed price history)
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

export interface UpdateExpectedVacateDateRequest {
  expected_vacate_date: string | null;
}

export interface UpdateExpectedVacateDateResponse {
  success: boolean;
  message: string;
  data: any;
}

// ─── Manual Payment Flow Types ────────────────────────────────

export interface TenantPaymentConfig {
  has_payment_config: boolean;
  config: {
    upi_id: string;
    upi_qr_image_url: string | null;
    account_holder_name: string | null;
    bank_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    payment_instructions: string | null;
  } | null;
  pg_name: string;
}

export interface TenantPaymentConfigResponse {
  success: boolean;
  message: string;
  data: TenantPaymentConfig;
}

export interface TenantPaymentSubmission {
  s_no: number;
  rent_payment_id: number;
  tenant_id: number;
  pg_id: number;
  paid_amount: string;
  paid_date: string;
  transaction_ref: string | null;
  payment_method: string;
  payment_screenshot_url: string | null;
  tenant_notes: string | null;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verified_at: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  rent_payments?: {
    s_no: number;
    amount_paid: string;
    actual_rent_amount: string;
    status: string;
    payment_method: string;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}

export interface TenantPaymentSubmissionsResponse {
  success: boolean;
  message: string;
  data: {
    data: TenantPaymentSubmission[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface SubmitPaymentProofRequest {
  rent_payment_id?: number; // Optional — if not provided, cycle_id is used
  paid_amount: number;
  paid_date: string;
  transaction_ref?: string;
  payment_method?: string;
  payment_screenshot_url?: string;
  tenant_notes?: string;
  // Used when no rent_payment row exists yet (unpaid cycle)
  cycle_id?: number;
  cycle_start?: string;
  cycle_end?: string;
}

export interface SubmitPaymentProofResponse {
  success: boolean;
  message: string;
  data: TenantPaymentSubmission;
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

    // Update expected vacate date
    updateExpectedVacateDate: build.mutation<UpdateExpectedVacateDateResponse, UpdateExpectedVacateDateRequest>({
      query: (data) => ({
        url: 'tenant/expected-vacate-date',
        method: 'PATCH',
        body: data,
      }),
    }),

    // Logout current tenant and revoke server tokens
    tenantLogout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/tenant-auth/logout',
        method: 'POST',
      }),
    }),

    // ─── Manual Payment Flow ──────────────────────────────────

    // Get owner's payment config (UPI/QR) for this tenant's PG
    getTenantPaymentConfig: build.query<TenantPaymentConfigResponse, void>({
      query: () => ({
        url: 'tenant/payment-config',
        method: 'GET',
      }),
      providesTags: ['TenantPaymentConfig'],
    }),

    // Get my payment submissions ("I Paid" history)
    getTenantPaymentSubmissions: build.query<TenantPaymentSubmissionsResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `tenant/payment-submissions?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['TenantPaymentSubmissions'],
    }),

    // Submit payment proof ("I Paid" flow)
    submitPaymentProof: build.mutation<SubmitPaymentProofResponse, SubmitPaymentProofRequest>({
      query: (data) => ({
        url: 'tenant/payment-submissions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TenantPaymentSubmissions', 'TenantPaymentConfig', 'TenantProfile', 'TenantDues', 'TenantPayments'],
    }),
  }),
});

export const {
  useGetTenantProfileQuery,
  useLazyGetTenantProfileQuery,
  useGetTenantPaymentsQuery,
  useGetTenantDuesQuery,
  useGetTenantTicketStatsQuery,
  useUpdateExpectedVacateDateMutation,
  useTenantLogoutMutation,
  useGetTenantPaymentConfigQuery,
  useLazyGetTenantPaymentConfigQuery,
  useGetTenantPaymentSubmissionsQuery,
  useSubmitPaymentProofMutation,
} = tenantPortalApi;
