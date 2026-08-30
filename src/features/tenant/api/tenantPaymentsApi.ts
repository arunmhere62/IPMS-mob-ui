import { tenantBaseApi } from './tenantBaseApi';
import { extractResponseData } from '@/utils/apiResponseHandler';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Per-cycle summary returned by /tenant/payments-summary */
export interface PaymentCycleSummary {
  cycle_id: number;
  start_date: string;
  end_date: string;
  expected_rent: number;
  due: number;
  totalPaid: number;
  remainingDue: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

/** Rent payment with enriched cycle data */
export interface RentPayment {
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
  active_submission_id: number | null;
  bed_rent_amount_snapshot: number | null;
  cycle_status: string | null;
  cycle_due: number | string | null;
  cycle_total_paid: number | string | null;
  cycle_remaining_due: number | null;
  is_cycle_settled: boolean | null;
  tenant_rent_cycles: {
    s_no: number;
    cycle_type: string;
    cycle_start: string;
    cycle_end: string;
  } | null;
  pg_locations: { s_no: number; location_name: string } | null;
  rooms: { s_no: number; room_no: string } | null;
  beds: { s_no: number; bed_no: string } | null;
}

/** Advance payment */
export interface AdvancePayment {
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
}

/** Refund payment */
export interface RefundPayment {
  s_no: number;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  status: string;
  remarks: string | null;
}

/** Rent cycle */
export interface TenantRentCycle {
  s_no: number;
  cycle_type: string;
  anchor_day: number | null;
  cycle_start: string;
  cycle_end: string | null;
}

/** Tenant allocation (bed price history) */
export interface TenantAllocation {
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
}

/** Full payments summary response data */
export interface TenantPaymentsSummaryData {
  s_no: number;
  tenant_id: string;
  pg_id: number;
  room_id: number;
  bed_id: number;
  beds: { s_no: number; bed_no: string; bed_price: string } | null;
  rooms: { s_no: number; room_no: string } | null;
  pg_locations: { s_no: number; location_name: string; rent_cycle_type: string } | null;
  tenant_rent_cycles: TenantRentCycle[];
  rent_payments: RentPayment[];
  advance_payments: AdvancePayment[];
  refund_payments: RefundPayment[];
  tenant_allocations: TenantAllocation[];
  advance_payment_summary: {
    total_advance_paid: number;
    total_advance_count: number;
  };
  refund_payment_summary: {
    total_refund_given: number;
    total_refund_count: number;
  };
  net_advance_remaining: number;
  is_rent_paid: boolean;
  is_rent_partial: boolean;
  is_advance_paid: boolean;
  is_refund_paid: boolean;
  rent_due_amount: number;
  partial_due_amount: number;
  pending_due_amount: number;
  unpaid_months: Array<{ cycle_start: string; cycle_end: string; cycle_type: string }>;
  payment_status: string;
  has_pending_verification: boolean;
  payment_cycle_summaries: PaymentCycleSummary[];
  transfer_difference_due_cycle: PaymentCycleSummary | null;
}

// ─── API Response Envelope ──────────────────────────────────────────────────

export interface TenantPaymentsSummaryResponse {
  statusCode: number;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    apiMs: number;
    dbMs: number;
    dbQueries: number;
  };
  data: TenantPaymentsSummaryData;
}

// ─── Shared rent-payment types (same as owner's paymentsApi) ────────────────

export type RentCycleType = 'CALENDAR' | 'MIDMONTH';

export type RentPaymentGap = {
  gapId?: string | number;
  gapStart: string;
  gapEnd: string;
  daysMissing: number;
  cycle_id?: number;
  remainingDue?: number;
  rentDue?: number;
  totalPaid?: number;
  due?: number;
  expected_from_allocations?: number;
  priority?: number;
};

export type DetectPaymentGapsResponse = {
  hasGaps: boolean;
  gaps: RentPaymentGap[];
};

export type NextPaymentDatesResponse = {
  suggestedCycleId?: number | null;
  suggestedStartDate?: string;
  suggestedEndDate?: string;
};

// ─── RTK Query API ──────────────────────────────────────────────────────────

export const tenantPaymentsApi = tenantBaseApi.injectEndpoints({
  endpoints: (build) => ({
    // Get tenant payments summary (rent, advance, refund, cycles, dues)
    getTenantPaymentsSummary: build.query<TenantPaymentsSummaryResponse, void>({
      query: () => ({
        url: 'tenant/payments-summary',
        method: 'GET',
      }),
      providesTags: ['TenantPayments'],
    }),

    // Detect missing rent periods (same endpoint as owner app — /rent-payments/gaps/:tenant_id)
    detectPaymentGaps: build.query<DetectPaymentGapsResponse, number>({
      query: (tenant_id) => ({
        url: `rent-payments/gaps/${tenant_id}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => extractResponseData<DetectPaymentGapsResponse>(response),
      providesTags: ['TenantPayments'],
    }),

    // Get suggested next payment dates (same endpoint as owner app — /rent-payments/next-dates/:tenant_id)
    getNextPaymentDates: build.query<NextPaymentDatesResponse, { tenant_id: number; rentCycleType?: RentCycleType; skipGaps?: boolean }>({
      query: ({ tenant_id, rentCycleType, skipGaps }) => ({
        url: `rent-payments/next-dates/${tenant_id}`,
        method: 'GET',
        params: { rentCycleType, skipGaps },
      }),
      transformResponse: (response: unknown) => extractResponseData<NextPaymentDatesResponse>(response),
      providesTags: ['TenantPayments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTenantPaymentsSummaryQuery,
  useLazyGetTenantPaymentsSummaryQuery,
  useDetectPaymentGapsQuery,
  useLazyDetectPaymentGapsQuery,
  useGetNextPaymentDatesQuery,
  useLazyGetNextPaymentDatesQuery,
} = tenantPaymentsApi;
