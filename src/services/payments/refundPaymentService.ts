import axiosInstance from "../core/axiosInstance";

export interface RefundPayment {
  s_no: number;
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_date: string;
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'FAILED';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  tenant_unavailable_reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null;
  tenants?: {
    s_no: number;
    tenant_id: string;
    name: string;
    phone_no: string;
    is_deleted?: boolean;
    status?: string;
    check_out_date?: string;
  };
  rooms?: {
    s_no: number;
    room_no: string;
  };
  beds?: {
    s_no: number;
    bed_no: string;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}

export interface CreateRefundPaymentDto {
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  actual_rent_amount?: number;
  payment_date: string;
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'FAILED';
  remarks?: string;
}

export interface GetRefundPaymentsParams {
  tenant_id?: number;
  status?: string;
  month?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  room_id?: number;
  bed_id?: number;
  page?: number;
  limit?: number;
}

export interface RefundPaymentsResponse {
  success: boolean;
  data: {
    data: RefundPayment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const refundPaymentService = {
  /**
   * Get all refund payments with filters
   */
  async getRefundPayments(
    params: GetRefundPaymentsParams = {},
    headers?: { pg_id?: number; organization_id?: number; user_id?: number }
  ): Promise<RefundPaymentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.tenant_id) queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.room_id) queryParams.append('room_id', params.room_id.toString());
    if (params.bed_id) queryParams.append('bed_id', params.bed_id.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const requestHeaders: any = {};
    if (headers?.pg_id) requestHeaders['X-PG-Location-Id'] = headers.pg_id.toString();
    if (headers?.organization_id) requestHeaders['X-Organization-Id'] = headers.organization_id.toString();
    if (headers?.user_id) requestHeaders['X-User-Id'] = headers.user_id.toString();

    const response = await axiosInstance.get<RefundPaymentsResponse>(
      `/refund-payments?${queryParams.toString()}`,
      { headers: requestHeaders }
    );

    return response.data;
  },

  /**
   * Get single refund payment
   */
  async getRefundPaymentById(
    id: number,
    headers?: { pg_id?: number; organization_id?: number; user_id?: number }
  ): Promise<{ success: boolean; data: RefundPayment }> {
    const requestHeaders: any = {};
    if (headers?.pg_id) requestHeaders['X-PG-Location-Id'] = headers.pg_id.toString();
    if (headers?.organization_id) requestHeaders['X-Organization-Id'] = headers.organization_id.toString();
    if (headers?.user_id) requestHeaders['X-User-Id'] = headers.user_id.toString();

    const response = await axiosInstance.get<{ success: boolean; data: RefundPayment }>(
      `/refund-payments/${id}`,
      { headers: requestHeaders }
    );

    return response.data;
  },

  /**
   * Create a new refund payment
   */
  async createRefundPayment(
    data: CreateRefundPaymentDto,
    headers?: { pg_id?: number; organization_id?: number; user_id?: number }
  ): Promise<{ success: boolean; message: string; data: RefundPayment }> {
    const requestHeaders: any = {};
    if (headers?.pg_id) requestHeaders['X-PG-Location-Id'] = headers.pg_id.toString();
    if (headers?.organization_id) requestHeaders['X-Organization-Id'] = headers.organization_id.toString();
    if (headers?.user_id) requestHeaders['X-User-Id'] = headers.user_id.toString();
    requestHeaders['X-Skip-Global-Error'] = 'true';

    const response = await axiosInstance.post<{ success: boolean; message: string; data: RefundPayment }>(
      '/refund-payments',
      data,
      { headers: requestHeaders }
    );

    return response.data;
  },

  /**
   * Update a refund payment
   */
  async updateRefundPayment(
    id: number,
    data: Partial<CreateRefundPaymentDto>,
    headers?: { pg_id?: number; organization_id?: number; user_id?: number }
  ): Promise<{ success: boolean; message: string; data: RefundPayment }> {
    const requestHeaders: any = {};
    if (headers?.pg_id) requestHeaders['X-PG-Location-Id'] = headers.pg_id.toString();
    if (headers?.organization_id) requestHeaders['X-Organization-Id'] = headers.organization_id.toString();
    if (headers?.user_id) requestHeaders['X-User-Id'] = headers.user_id.toString();

    const response = await axiosInstance.patch<{ success: boolean; message: string; data: RefundPayment }>(
      `/refund-payments/${id}`,
      data,
      { headers: requestHeaders }
    );

    return response.data;
  },

  /**
   * Delete a refund payment
   */
  async deleteRefundPayment(
    id: number,
    headers?: { pg_id?: number; organization_id?: number; user_id?: number }
  ): Promise<{ success: boolean; message: string }> {
    const requestHeaders: any = {};
    if (headers?.pg_id) requestHeaders['X-PG-Location-Id'] = headers.pg_id.toString();
    if (headers?.organization_id) requestHeaders['X-Organization-Id'] = headers.organization_id.toString();
    if (headers?.user_id) requestHeaders['X-User-Id'] = headers.user_id.toString();

    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/refund-payments/${id}`,
      { headers: requestHeaders }
    );

    return response.data;
  },
};

export default refundPaymentService;
