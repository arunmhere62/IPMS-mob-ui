import { baseApi } from './baseApi';

export interface TenantStatus {
  ACTIVE: 'ACTIVE';
  INACTIVE: 'INACTIVE';
}

export interface TenantPayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount?: number;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  status?: string;
  remarks?: string;
}

export interface AdvancePayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_method?: string;
  status?: string;
  remarks?: string;
}

export interface RefundPayment {
  s_no: number;
  amount_paid: number;
  payment_method?: string;
  payment_date: string;
  status?: string;
  remarks?: string;
  actual_rent_amount?: number;
}

export interface CurrentBill {
  s_no: number;
  bill_amount: number;
  bill_date: string;
  created_at: string;
  updated_at: string;
}

export interface PendingPaymentMonth {
  month: string;
  year: number;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  is_overdue: boolean;
}

export interface PendingPayment {
  tenant_id: number;
  tenant_name: string;
  room_no?: string;
  total_pending: number;
  current_month_pending: number;
  overdue_months: number;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  last_payment_date?: string;
  next_due_date?: string;
  monthly_rent: number;
  pending_months: PendingPaymentMonth[];
}

export interface Tenant {
  s_no: number;
  tenant_id: string;
  name: string;
  phone_no?: string;
  whatsapp_number?: string;
  email?: string;
  pg_id: number;
  room_id?: number;
  bed_id?: number;
  check_in_date: string;
  check_out_date?: string;
  status: 'ACTIVE' | 'INACTIVE';
  occupation?: string;
  tenant_address?: string;
  city_id?: number;
  state_id?: number;
  images?: any;
  proof_documents?: any;
  created_at: string;
  updated_at: string;
  pg_locations?: {
    s_no: number;
    location_name: string;
    address: string;
  };
  rooms?: {
    s_no: number;
    room_no: string;
    rent_price?: number;
  };
  beds?: {
    s_no: number;
    bed_no: string;
  };
  city?: {
    s_no: number;
    name: string;
  };
  state?: {
    s_no: number;
    name: string;
  };
  tenant_payments?: TenantPayment[];
  advance_payments?: AdvancePayment[];
  refund_payments?: RefundPayment[];
  current_bills?: CurrentBill[];
  pending_payment?: PendingPayment | null;
  // Status fields calculated by TenantStatusService on API side
  is_rent_paid?: boolean;
  is_rent_partial?: boolean;
  rent_due_amount?: number;
  partial_due_amount?: number;
  pending_due_amount?: number;
  is_advance_paid?: boolean;
  pending_months?: number;
}

export interface CreateTenantDto {
  name: string;
  phone_no?: string;
  whatsapp_number?: string;
  email?: string;
  pg_id: number;
  room_id?: number;
  bed_id?: number;
  check_in_date: string;
  check_out_date?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  occupation?: string;
  tenant_address?: string;
  city_id?: number;
  state_id?: number;
  images?: any;
  proof_documents?: any;
}

export interface CreateCurrentBillDto {
  room_id?: number;
  tenant_id?: number;
  bill_amount: number;
  bill_date: string;
  split_equally?: boolean;
  remarks?: string;
  pg_id?: number;
}

export type CurrentBillResponse = {
  success: boolean;
  data: any;
  message?: string;
};

export interface GetTenantsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  pg_id?: number;
  room_id?: number;
  organization_id?: number;
  user_id?: number;
  pending_rent?: boolean;
  pending_advance?: boolean;
  partial_rent?: boolean;
}

export interface GetTenantsResponse {
  success: boolean;
  data: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface TenantResponse {
  success: boolean;
  message?: string;
  data: Tenant;
}

export type UpdateTenantCheckoutDateRequest = {
  id: number;
  check_out_date?: string;
  clear_checkout?: boolean;
};

export type CheckoutTenantWithDateRequest = {
  id: number;
  check_out_date: string;
};

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const normalizeListResponse = <T>(response: any): { success: boolean; data: T; pagination?: any; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);

  // Legacy shape { success, data, pagination }
  if (unwrapped && typeof unwrapped === 'object' && 'success' in unwrapped && 'data' in unwrapped) {
    return unwrapped as any;
  }

  const items = unwrapped?.data ?? unwrapped;
  const pagination = unwrapped?.pagination;

  return {
    success: (response as any)?.success ?? true,
    data: items as T,
    pagination,
    message: (response as any)?.message,
  };
};

const normalizeEntityResponse = <T>(response: any): { success: boolean; data: T; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);

  // Legacy shape { success, data, message }
  if (unwrapped && typeof unwrapped === 'object' && 'success' in unwrapped && 'data' in unwrapped) {
    return unwrapped as any;
  }

  return {
    success: (response as any)?.success ?? true,
    data: (unwrapped?.data ?? unwrapped) as T,
    message: (response as any)?.message,
  };
};

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTenants: build.query<GetTenantsResponse, GetTenantsParams | void>({
      query: (params) => {
        const qp = new URLSearchParams();

        if (params?.page) qp.append('page', String(params.page));
        if (params?.limit) qp.append('limit', String(params.limit));
        if (params?.status) qp.append('status', params.status);
        if (params?.search) qp.append('search', params.search);
        if (params?.room_id) qp.append('room_id', String(params.room_id));
        if (params?.pending_rent) qp.append('pending_rent', 'true');
        if (params?.pending_advance) qp.append('pending_advance', 'true');
        if (params?.partial_rent) qp.append('partial_rent', 'true');

        const queryString = qp.toString();
        return {
          url: `/tenants${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      transformResponse: (response: ApiEnvelope<any> | any): GetTenantsResponse => {
        const normalized = normalizeListResponse<any>(response);
        const extracted = normalized.data;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;

        return {
          success: Boolean(normalized.success),
          data: Array.isArray(items) ? items : [],
          pagination: extracted?.pagination ?? normalized.pagination,
        };
      },
      providesTags: (result) => {
        const tenants = result?.data || [];
        return [
          { type: 'Tenants' as const, id: 'LIST' },
          ...tenants.map((t) => ({ type: 'Tenant' as const, id: t.s_no })),
        ];
      },
    }),

    getTenantById: build.query<TenantResponse, number>({
      query: (id) => ({ url: `/tenants/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      providesTags: (_result, _err, id) => [{ type: 'Tenant', id }],
    }),

    createTenant: build.mutation<TenantResponse, CreateTenantDto>({
      query: (body) => ({ url: '/tenants', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      invalidatesTags: [{ type: 'Tenants', id: 'LIST' }],
    }),

    updateTenant: build.mutation<TenantResponse, { id: number; data: Partial<CreateTenantDto> }>({
      query: ({ id, data }) => ({ url: `/tenants/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Tenants', id: 'LIST' },
        { type: 'Tenant', id: arg.id },
      ],
    }),

    deleteTenant: build.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/tenants/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => {
        const unwrapped = unwrapCentralData<any>(response);
        return (unwrapped as any)?.data ?? unwrapped;
      },
      invalidatesTags: (_res, _err, id) => [
        { type: 'Tenants', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    checkoutTenant: build.mutation<TenantResponse, number>({
      query: (id) => ({ url: `/tenants/${id}/checkout`, method: 'POST' }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Tenants', id: 'LIST' },
        { type: 'Tenant', id },
      ],
    }),

    checkoutTenantWithDate: build.mutation<TenantResponse, CheckoutTenantWithDateRequest>({
      query: ({ id, check_out_date }) => ({
        url: `/tenants/${id}/checkout`,
        method: 'POST',
        body: { check_out_date },
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Tenants', id: 'LIST' },
        { type: 'Tenant', id: arg.id },
      ],
    }),

    updateTenantCheckoutDate: build.mutation<TenantResponse, UpdateTenantCheckoutDateRequest>({
      query: ({ id, ...body }) => ({
        url: `/tenants/${id}/checkout-date`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<Tenant>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Tenants', id: 'LIST' },
        { type: 'Tenant', id: arg.id },
      ],
    }),

    createCurrentBill: build.mutation<CurrentBillResponse, CreateCurrentBillDto>({
      query: (body) => ({ url: '/current-bills', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<any> | any) => normalizeEntityResponse<any>(response),
      invalidatesTags: [{ type: 'Tenants', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTenantsQuery,
  useLazyGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  useCreateCurrentBillMutation,
  useCheckoutTenantMutation,
  useCheckoutTenantWithDateMutation,
  useUpdateTenantCheckoutDateMutation,
} = tenantsApi;
