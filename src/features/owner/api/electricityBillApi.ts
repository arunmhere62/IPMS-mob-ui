import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const normalizeEntityResponse = <T>(response: any): { success: boolean; data: T; message?: string } => {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response && !('statusCode' in response)) {
    return response as any;
  }
  const unwrapped = unwrapCentralData<T>(response);
  return {
    success: (response as any)?.success ?? true,
    data: unwrapped,
    message: (response as any)?.message,
  };
};

const normalizeListResponse = <T>(response: any): { success: boolean; data: T[]; pagination?: any; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);
  if (Array.isArray(unwrapped)) {
    return {
      success: (response as any)?.success ?? true,
      data: unwrapped as T[],
      message: (response as any)?.message,
    };
  }
  const extractItems = (v: any): T[] => {
    if (Array.isArray(v)) return v as T[];
    if (Array.isArray(v?.data)) return v.data as T[];
    if (Array.isArray(v?.data?.data)) return v.data.data as T[];
    if (Array.isArray(v?.data?.data?.data)) return v.data.data.data as T[];
    return [];
  };
  const items = extractItems(unwrapped?.data ?? unwrapped);
  return {
    success: (unwrapped as any)?.success ?? (response as any)?.success ?? true,
    data: items as T[],
    pagination: (unwrapped as any)?.pagination,
    message: (unwrapped as any)?.message ?? (response as any)?.message,
  };
};

export type AllocationBasis = 'EQUAL' | 'RENT_CYCLE_DAYS' | 'CUSTOM';

export interface ElectricityBillItem {
  s_no: number;
  electricity_bill_id: number;
  tenant_id: number;
  share_amount: string | number;
  share_percentage: string | number;
  paid_amount: string | number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  allocation_basis: AllocationBasis;
  billing_days: number | null;
  payment_date: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  tenants?: {
    s_no: number;
    tenant_id: string;
    name: string;
    phone_no?: string;
  };
}

export interface ElectricityBill {
  s_no: number;
  pg_id: number;
  room_id: number;
  bill_period_start: string;
  bill_period_end: string;
  total_amount: string | number;
  units_consumed?: string | number | null;
  rate_per_unit?: string | number | null;
  meter_reading_start?: string | number | null;
  meter_reading_end?: string | number | null;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  rooms?: { s_no: number; room_no: string };
  pg_locations?: { s_no: number; location_name: string };
  electricity_bill_items?: ElectricityBillItem[];
}

export interface CustomAllocationItem {
  tenant_id: number;
  share_amount: number;
  share_percentage: number;
}

export interface CreateElectricityBillDto {
  pg_id: number;
  room_id: number;
  bill_period_start: string;
  bill_period_end: string;
  total_amount: number;
  units_consumed?: number;
  rate_per_unit?: number;
  meter_reading_start?: number;
  meter_reading_end?: number;
  due_date?: string;
  allocation_basis: AllocationBasis;
  custom_allocations?: CustomAllocationItem[];
  notes?: string;
}

export interface RecordPaymentDto {
  bill_item_id: number;
  tenant_id: number;
  amount: number;
  payment_method: string;
  payment_date?: string;
  remarks?: string;
}

export interface GetElectricityBillsParams {
  room_id?: number;
  status?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

export interface GetEligibleTenantsParams {
  room_id: number;
  bill_period_start: string;
  bill_period_end: string;
}

export interface EligibleTenant {
  tenant_id: number;
  tenant_display_id: string;
  name: string;
  phone_no?: string;
  check_in_date: string;
  check_out_date?: string;
  occupancy_days: number;
  status: 'ACTIVE' | 'CHECKED_OUT_DURING_PERIOD';
}

export interface EligibleTenantsResponse {
  success: boolean;
  data: EligibleTenant[];
  message?: string;
}

export interface ElectricityBillResponse {
  success: boolean;
  data: ElectricityBill;
  message?: string;
}

export interface ElectricityBillListResponse {
  success: boolean;
  data: ElectricityBill[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface ElectricityBillItemListResponse {
  success: boolean;
  data: ElectricityBillItem[];
  message?: string;
}

export const electricityBillApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getElectricityBills: build.query<ElectricityBillListResponse, GetElectricityBillsParams | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.room_id) qp.append('room_id', String(params.room_id));
        if (params?.status) qp.append('status', params.status);
        if (params?.year) qp.append('year', String(params.year));
        if (params?.month) qp.append('month', String(params.month));
        if (params?.page) qp.append('page', String(params.page));
        if (params?.limit) qp.append('limit', String(params.limit));
        const queryString = qp.toString();
        return {
          url: `/electricity-bills${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => {
        const normalized = normalizeListResponse<ElectricityBill>(response);
        return {
          success: normalized.success,
          data: normalized.data ?? [],
          pagination: normalized.pagination,
          message: normalized.message,
        };
      },
      providesTags: (result) => {
        const bills = result?.data || [];
        return [
          { type: 'ElectricityBills' as const, id: 'LIST' },
          ...bills.map((b) => ({ type: 'ElectricityBill' as const, id: b.s_no })),
        ];
      },
    }),

    getElectricityBillById: build.query<ElectricityBillResponse, number>({
      query: (id) => ({ url: `/electricity-bills/${id}`, method: 'GET' }),
      transformResponse: (response: any) => normalizeEntityResponse<ElectricityBill>(response),
      providesTags: (_res, _err, id) => [{ type: 'ElectricityBill' as const, id }],
    }),

    getPendingElectricityBillItemsByTenant: build.query<ElectricityBillItemListResponse, number>({
      query: (tenantId) => ({ url: `/electricity-bills/tenant/${tenantId}`, method: 'GET' }),
      transformResponse: (response: any) => {
        const normalized = normalizeListResponse<ElectricityBillItem>(response);
        return {
          success: normalized.success,
          data: normalized.data ?? [],
          message: normalized.message,
        };
      },
      providesTags: (_res, _err, tenantId) => [{ type: 'ElectricityBillItems' as const, id: tenantId }],
    }),

    getEligibleTenantsForPeriod: build.query<EligibleTenantsResponse, GetEligibleTenantsParams>({
      query: (params) => {
        const qp = new URLSearchParams();
        qp.append('room_id', String(params.room_id));
        qp.append('bill_period_start', params.bill_period_start);
        qp.append('bill_period_end', params.bill_period_end);
        return {
          url: `/electricity-bills/eligible-tenants?${qp.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => {
        const normalized = normalizeEntityResponse<EligibleTenant[]>(response);
        return {
          success: normalized.success,
          data: normalized.data ?? [],
          message: normalized.message,
        };
      },
    }),

    createElectricityBill: build.mutation<ElectricityBillResponse, CreateElectricityBillDto>({
      query: (body) => ({ url: '/electricity-bills', method: 'POST', body }),
      transformResponse: (response: any) => normalizeEntityResponse<ElectricityBill>(response),
      invalidatesTags: [
        { type: 'ElectricityBills' as const, id: 'LIST' },
        { type: 'Rooms' as const, id: 'LIST' },
      ],
    }),

    recordElectricityBillPayment: build.mutation<ElectricityBillItemResponse, RecordPaymentDto>({
      query: (body) => ({ url: '/electricity-bills/payments', method: 'POST', body }),
      transformResponse: (response: any) => normalizeEntityResponse<ElectricityBillItem>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ElectricityBills' as const, id: 'LIST' },
        { type: 'ElectricityBillItems' as const, id: arg.tenant_id },
        { type: 'ElectricityBill' as const, id: 'LIST' },
      ],
    }),

    deleteElectricityBill: build.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/electricity-bills/${id}`, method: 'DELETE' }),
      transformResponse: (response: any) => {
        const data = response?.data ?? response;
        return { success: data?.success ?? true, message: data?.message ?? 'Deleted successfully' };
      },
      invalidatesTags: (_res, _err, id) => [
        { type: 'ElectricityBills' as const, id: 'LIST' },
        { type: 'ElectricityBill' as const, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export interface ElectricityBillItemResponse {
  success: boolean;
  data: ElectricityBillItem;
  message?: string;
}

export const {
  useGetElectricityBillsQuery,
  useLazyGetElectricityBillsQuery,
  useGetElectricityBillByIdQuery,
  useGetPendingElectricityBillItemsByTenantQuery,
  useGetEligibleTenantsForPeriodQuery,
  useLazyGetEligibleTenantsForPeriodQuery,
  useCreateElectricityBillMutation,
  useRecordElectricityBillPaymentMutation,
  useDeleteElectricityBillMutation,
} = electricityBillApi;
