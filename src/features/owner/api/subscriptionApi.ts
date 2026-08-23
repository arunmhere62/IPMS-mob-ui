import { baseApi } from './baseApi';

export interface SubscriptionPlan {
  s_no: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  currency: string;
  features: string[] | null;
  is_active: boolean;
  is_free?: boolean;
  is_trial?: boolean;
  gst_breakdown?: {
    cgst_rate: number;
    cgst_amount: number;
    sgst_rate: number;
    sgst_amount: number;
    igst_rate?: number;
    igst_amount?: number;
    total_price_including_gst: number;
  };
  limits?: {
    max_pg_locations?: number | null;
    max_tenants?: number | null;
    max_rooms?: number | null;
    max_beds?: number | null;
    max_employees?: number | null;
    max_users?: number | null;
    max_invoices_per_month?: number | null;
    max_sms_per_month?: number | null;
    max_whatsapp_per_month?: number | null;
  };
  max_pg_locations?: number | null;
  max_tenants?: number | null;
  max_beds?: number | null;
  max_employees?: number | null;
  max_rooms?: number | null;
  max_users?: number | null;
  max_invoices_per_month?: number | null;
  max_sms_per_month?: number | null;
  max_whatsapp_per_month?: number | null;
}

export interface UserSubscription {
  s_no?: number;  // Backend uses s_no
  id?: number;    // Keep for compatibility
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  payment_status?: 'PAID' | 'PENDING' | 'FAILED';
  amount_paid?: number;
  plan?: SubscriptionPlan;
  subscription_plans?: SubscriptionPlan;  // Backend might use this
  created_at: string;
  updated_at: string;
  auto_renew?: boolean;
  organization_id?: number;
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: UserSubscription;
  last_subscription?: UserSubscription | null;
  days_remaining?: number;
  is_trial?: boolean;
}

export interface SubscriptionHistory {
  data: UserSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const unwrapNestedData = (value: any) => {
  let current = value;
  for (let i = 0; i < 5; i += 1) {
    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as any).data;
      continue;
    }
    break;
  }
  return current;
};

const normalizeListResponse = <T>(response: any): { success: boolean; data: T; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);

  // legacy shape { success, data, message }
  if (unwrapped && typeof unwrapped === 'object' && 'success' in unwrapped && 'data' in unwrapped) {
    return unwrapped as any;
  }

  return {
    success: (response as any)?.success ?? true,
    data: unwrapped as T,
    message: (response as any)?.message,
  };
};

const normalizeSubscriptionStatus = (response: any): SubscriptionStatus => {
  const unwrapped = unwrapCentralData<any>(response);

  // Expected direct shape
  if (unwrapped && typeof unwrapped === 'object' && 'has_active_subscription' in unwrapped) {
    return unwrapped as SubscriptionStatus;
  }

  // Sometimes comes as { success, data: { has_active_subscription, ... } }
  if (unwrapped && typeof unwrapped === 'object' && 'data' in unwrapped) {
    const maybeInner = (unwrapped as any).data;
    if (maybeInner && typeof maybeInner === 'object' && 'has_active_subscription' in maybeInner) {
      return maybeInner as SubscriptionStatus;
    }
  }

  return unwrapped as SubscriptionStatus;
};

export type GetPlansResponse = { success: boolean; data: SubscriptionPlan[] };
export type GetCurrentSubscriptionResponse = { success: boolean; data: UserSubscription | null };
export type GetSubscriptionHistoryResponse = { success: boolean; data: UserSubscription[] };

export type SubscribeToPlanResponse = {
  success: boolean;
  data: {
    subscription: UserSubscription;
    plan?: SubscriptionPlan;
    pricing?: {
      currency: string;
      base_price: number;
      cgst_amount: number;
      sgst_amount: number;
      total_price_including_gst: number;
    };
    payment_url: string;
    order_id: string;
  };
};

export type UpgradePlanResponse = SubscribeToPlanResponse;

export type PreparePaymentResponse = {
  success: boolean;
  data: {
    payment_url: string;
    order_id: string;
    payment_method: string;
  };
};

export type PaymentStatusResponse = {
  success: boolean;
  data: {
    order_id: string;
    payment_status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ABORTED';
    order_status: 'Pending' | 'Success' | 'Failure' | 'Aborted';
    tracking_id?: string | null;
    bank_ref_no?: string | null;
    payment_mode?: string | null;
    status_code?: string | null;
    status_message?: string | null;
    amount?: string;
    currency?: string;
    subscription_id?: number | null;
    subscription_status?: UserSubscription['status'] | null;
  };
};

export type RenewSubscriptionResponse = {
  success: boolean;
  data: {
    subscription: UserSubscription;
    payment_url?: string;
  };
};

export type CancelSubscriptionResponse = { success: boolean; message: string };

/**
 * Request body for the Apple IAP receipt validation endpoint.
 * The client sends the StoreKit 2 JWS transaction (purchaseToken) and the
 * productId purchased. The backend verifies with Apple's App Store Server
 * API, maps productId -> plan_id, and creates/activates the subscription.
 */
export interface ValidateIapReceiptRequest {
  /** StoreKit 2 JWS transaction token (Purchase.purchaseToken on iOS) */
  transactionToken: string;
  /** Apple IAP product id, e.g. com.indianpgmanagement.sub.monthly */
  productId: string;
  /** Transaction id from StoreKit (PurchaseIOS.transactionId) */
  transactionId?: string;
  /** Original transaction id for renewals */
  originalTransactionId?: string;
}

export interface ValidateIapReceiptResponse {
  success: boolean;
  data?: {
    subscription: UserSubscription;
    plan?: SubscriptionPlan;
  };
  message?: string;
}

export interface SubscriptionInvoice {
  s_no: number;
  invoice_number: string;
  payment_id: number;
  user_id: number;
  organization_id: number;
  subscription_id: number;
  plan_id: number;
  invoice_date: string;
  seller_legal_name: string;
  seller_trade_name: string;
  seller_gstin: string;
  seller_address: string;
  seller_state_code: string;
  seller_duns_number: string | null;
  buyer_name: string;
  buyer_gstin: string | null;
  buyer_address: string;
  buyer_state_code: string;
  place_of_supply: string;
  service_description: string;
  hsn_sac_code: string;
  taxable_value: string | number;
  cgst_rate: string | number | null;
  cgst_amount: string | number | null;
  sgst_rate: string | number | null;
  sgst_amount: string | number | null;
  igst_rate: string | number | null;
  igst_amount: string | number | null;
  total_amount: string | number;
  gst_number: string | null;
  billing_address: string | null;
  is_reverse_charge: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  subscription_payments?: {
    s_no: number;
    order_id: string;
    status: string;
    payment_mode: string | null;
    tracking_id: string | null;
    bank_ref_no: string | null;
    amount: string;
    currency: string;
    created_at: string;
  };
}

export type GetInvoicesResponse = { success: boolean; data: SubscriptionInvoice[] };
export type GetInvoiceResponse = { success: boolean; data: SubscriptionInvoice };

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query<GetPlansResponse, void>({
      query: () => ({ url: '/subscription/plans', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetPlansResponse> | any) => normalizeListResponse<SubscriptionPlan[]>(response),
      providesTags: [{ type: 'SubscriptionPlans' as const, id: 'LIST' }],
    }),

    getCurrentSubscription: build.query<GetCurrentSubscriptionResponse, void>({
      query: () => ({ url: '/subscription/current', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetCurrentSubscriptionResponse> | any) =>
        normalizeListResponse<UserSubscription | null>(response),
      providesTags: [{ type: 'CurrentSubscription' as const, id: 'SINGLE' }],
    }),

    getSubscriptionStatus: build.query<SubscriptionStatus, void>({
      query: () => ({ url: '/subscription/status', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<SubscriptionStatus> | any) => normalizeSubscriptionStatus(response),
      providesTags: [{ type: 'SubscriptionStatus' as const, id: 'SINGLE' }],
    }),

    getSubscriptionHistory: build.query<GetSubscriptionHistoryResponse, void>({
      query: () => ({ url: '/subscription/history', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetSubscriptionHistoryResponse> | any) =>
        normalizeListResponse<UserSubscription[]>(response),
      providesTags: [{ type: 'SubscriptionHistory' as const, id: 'LIST' }],
    }),

    subscribeToPlan: build.mutation<SubscribeToPlanResponse, { planId: number }>({
      query: ({ planId }) => ({
        url: '/subscription/subscribe',
        method: 'POST',
        body: { plan_id: planId },
      }),
      transformResponse: (response: ApiEnvelope<SubscribeToPlanResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        const nested = unwrapNestedData(unwrapped);
        return nested as any;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
        { type: 'SubscriptionHistory', id: 'LIST' },
      ],
    }),

    upgradePlan: build.mutation<UpgradePlanResponse, { planId: number }>({
      query: ({ planId }) => ({
        url: '/subscription/upgrade',
        method: 'POST',
        body: { plan_id: planId },
      }),
      transformResponse: (response: ApiEnvelope<UpgradePlanResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        const nested = unwrapNestedData(unwrapped);
        return nested as any;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
        { type: 'SubscriptionHistory', id: 'LIST' },
      ],
    }),

    cancelSubscription: build.mutation<CancelSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<CancelSubscriptionResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        return (unwrapped as any)?.data ?? unwrapped;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
        { type: 'SubscriptionHistory', id: 'LIST' },
      ],
    }),

    preparePayment: build.mutation<PreparePaymentResponse, { orderId: string; paymentMethod: string }>({
      query: ({ orderId, paymentMethod }) => ({
        url: '/subscription/payment/prepare',
        method: 'POST',
        body: { order_id: orderId, payment_method: paymentMethod },
      }),
      transformResponse: (response: ApiEnvelope<PreparePaymentResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        const nested = unwrapNestedData(unwrapped);
        return nested as any;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
      ],
    }),

    checkPaymentStatus: build.mutation<PaymentStatusResponse, { orderId: string }>({
      query: ({ orderId }) => ({
        url: '/subscription/payment/status',
        method: 'GET',
        params: { order_id: orderId },
      }),
      transformResponse: (response: ApiEnvelope<PaymentStatusResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        const nested = unwrapNestedData(unwrapped);
        return nested as any;
      },
    }),

    renewSubscription: build.mutation<RenewSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/renew`,
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<RenewSubscriptionResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        return (unwrapped as any)?.data ?? unwrapped;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
        { type: 'SubscriptionHistory', id: 'LIST' },
      ],
    }),

    /**
     * Apple IAP receipt validation (iOS only).
     * Sends the StoreKit 2 JWS transaction to the backend, which verifies it
     * with Apple's App Store Server API and grants the subscription entitlement.
     * On success, the active subscription is created/updated server-side.
     */
    validateIapReceipt: build.mutation<ValidateIapReceiptResponse, ValidateIapReceiptRequest>({
      query: (body) => ({
        url: '/subscription/iap/validate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiEnvelope<ValidateIapReceiptResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        return (unwrapped as any)?.data ?? unwrapped;
      },
      invalidatesTags: [
        { type: 'CurrentSubscription', id: 'SINGLE' },
        { type: 'SubscriptionStatus', id: 'SINGLE' },
        { type: 'SubscriptionHistory', id: 'LIST' },
      ],
    }),

    getInvoices: build.query<GetInvoicesResponse, void>({
      query: () => ({ url: '/subscription/invoices', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetInvoicesResponse> | any) =>
        normalizeListResponse<SubscriptionInvoice[]>(response),
      providesTags: [{ type: 'SubscriptionInvoices' as const, id: 'LIST' }],
    }),

    getInvoiceById: build.query<GetInvoiceResponse, { invoiceId: number }>({
      query: ({ invoiceId }) => ({ url: `/subscription/invoices/${invoiceId}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetInvoiceResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        return { success: true, data: unwrapped };
      },
      providesTags: (_res, _err, arg) => [{ type: 'SubscriptionInvoices' as const, id: arg.invoiceId }],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetPlansQuery,
  useLazyGetPlansQuery,
  useGetCurrentSubscriptionQuery,
  useLazyGetCurrentSubscriptionQuery,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionStatusQuery,
  useGetSubscriptionHistoryQuery,
  useLazyGetSubscriptionHistoryQuery,
  useSubscribeToPlanMutation,
  useUpgradePlanMutation,
  useCancelSubscriptionMutation,
  useRenewSubscriptionMutation,
  usePreparePaymentMutation,
  useCheckPaymentStatusMutation,
  useValidateIapReceiptMutation,
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useLazyGetInvoiceByIdQuery,
} = subscriptionApi;
