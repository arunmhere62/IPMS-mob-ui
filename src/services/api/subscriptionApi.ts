import { baseApi } from './baseApi';

export interface SubscriptionPlan {
  s_no: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  currency: string;
  features: string[];
  is_active: boolean;
  max_pg_locations?: number | null;
  max_tenants?: number | null;
  max_users?: number | null;
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
    payment_url: string;
    order_id: string;
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
        return (unwrapped as any)?.data ?? unwrapped;
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
  useCancelSubscriptionMutation,
  useRenewSubscriptionMutation,
} = subscriptionApi;
