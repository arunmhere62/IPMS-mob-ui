export interface User {
  s_no: number;
  name: string;
  email: string;
  phone?: string;
  role_id: number;
  role_name?: string;
  organization_id: number;
  organization_name?: string;
  organization_description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  address?: string;
  city_id?: number;
  state_id?: number;
  city_name?: string;
  state_name?: string;
  gender?: 'MALE' | 'FEMALE';
  profile_images?: any;
  pincode?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  pg_locations?: Array<{
    s_no: number;
    location_name: string;
    address?: string;
    pincode?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    pg_type?: string;
    rent_cycle_type?: string;
    rent_cycle_start?: number | null;
    rent_cycle_end?: number | null;
    city_id?: number | null;
    state_id?: number | null;
  }>;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface Tenant {
  s_no: number;
  tenant_id: string;
  name: string;
  phone_no?: string;
  whatsapp_number?: string;
  email?: string;
  pg_id?: number;
  room_id?: number;
  bed_id?: number;
  check_in_date: string;
  check_out_date?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  occupation?: string;
  tenant_address?: string;
  images?: any;
  proof_documents?: any;
  is_deleted?: boolean;
  city_id?: number;
  state_id?: number;
  created_at?: string;
  updated_at?: string;
  // Payment status fields
  is_rent_paid?: boolean;
  is_rent_partial?: boolean;
  rent_due_amount?: number;
  partial_due_amount?: number;
  pending_due_amount?: number;
  is_advance_paid?: boolean;
  is_refund_paid?: boolean;
  pending_months?: number;
  // Relations
  pg_locations?: {
    s_no: number;
    location_name: string;
    address: string;
  };
  rooms?: {
    s_no: number;
    room_no: string;
  };
  beds?: {
    s_no: number;
    bed_no: string;
    bed_price?: string | number;
  };
  city?: {
    s_no: number;
    name: string;
  };
  state?: {
    s_no: number;
    name: string;
  };
  tenant_payments?: Array<{
    s_no: number;
    amount_paid: number;
    payment_date: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED' | 'REFUNDED';
    actual_rent_amount?: number;
    start_date?: string;
    end_date?: string;
  }>;
  advance_payments?: Array<{
    s_no: number;
    amount_paid: number;
    payment_date: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED' | 'REFUNDED';
    actual_rent_amount?: number;
  }>;
  refund_payments?: Array<{
    s_no: number;
    amount_paid: number;
    payment_date: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED' | 'REFUNDED';
  }>;
}

export interface PGLocation {
  s_no: number;
  location_name: string;
  address: string;
  pincode?: string;
  city_id?: number;
  state_id?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  images?: any;
  organization_id: number;
}

export interface Room {
  s_no: number;
  room_id?: string;
  pg_id?: number;
  room_no?: string;
  images?: any;
}

export interface Bed {
  s_no: number;
  bed_no: string;
  bed_price?: number;
  room_id?: number;
  pg_id?: number;
  images?: any;
}

export interface Payment {
  s_no: number;
  tenant_id: number;
  pg_id: number;
  room_id: number;
  bed_id: number;
  amount_paid: number;
  payment_date?: string;
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED' | 'REFUNDED';
  remarks?: string;
  actual_rent_amount: number;
  start_date?: string;
  end_date?: string;
  current_bill?: number;
  current_bill_id?: number;
  tenant_unavailable_reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null;
  tenants?: {
    s_no: number;
    tenant_id: string;
    name: string;
    phone_no?: string;
    is_deleted?: boolean;
    status?: string;
    check_out_date?: string;
  };
  rooms?: {
    s_no: number;
    room_no?: string;
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

export interface Expense {
  s_no: number;
  pg_id?: number;
  expense_type?: string;
  amount?: number;
  paid_to?: string;
  paid_date?: string;
  payment_method?: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER';
  remarks?: string;
}

export interface Visitor {
  s_no: number;
  pg_id?: number;
  visitor_name?: string;
  phone_no?: string;
  purpose?: string;
  visited_date?: string;
  visited_room_id?: number;
  visited_bed_id?: number;
  address?: string;
  convertedTo_tenant: boolean;
  pg_locations?: {
    s_no: number;
    location_name: string;
    address?: string;
  };
}
