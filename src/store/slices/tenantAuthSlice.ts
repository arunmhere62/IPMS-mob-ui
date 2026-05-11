import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TenantUser = {
  tenant_id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  // Room/Bed info
  room_no?: string | null;
  bed_no?: string | null;
  bed_price?: string | null;
  // Payment status
  payment_status?: string | null;
  rent_due_amount?: number;
  pending_months?: number;
  check_in_date?: string | null;
};

export type TenantPG = {
  pg_id: number;
  location_name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  rent_cycle_type?: string;
};

export type TenantRentCycle = {
  s_no: number;
  cycle_type: string;
  anchor_day: number | null;
  cycle_start: string;
  cycle_end: string | null;
};

export type TenantPayment = {
  s_no: number;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  status: string;
  remarks: string | null;
};

export type TenantAuthState = {
  tenant: TenantUser | null;
  pg: TenantPG | null;
  rentCycles: TenantRentCycle[];
  lastUserRole: 'tenant' | null; // Remember tenant login
  recentPayments: TenantPayment[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: TenantAuthState = {
  tenant: null,
  pg: null,
  rentCycles: [],
  recentPayments: [],
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  lastUserRole: null,
};

const tenantPersistConfig = {
  key: 'tenantAuth',
  storage: AsyncStorage,
  whitelist: ['tenant', 'pg', 'rentCycles', 'recentPayments'],
  blacklist: ['accessToken', 'refreshToken', 'isAuthenticated'], // Blacklist sensitive data - require fresh login
};

const tenantAuthSlice = createSlice({
  name: 'tenantAuth',
  initialState,
  reducers: {
    // Set credentials after successful OTP verification
    setTenantCredentials: (
      state,
      action: PayloadAction<{
        tenant: TenantUser;
        pg: TenantPG | null;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.tenant = action.payload.tenant;
      state.pg = action.payload.pg;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },

    // Update tenant and pg data (from API)
    setTenantData: (
      state,
      action: PayloadAction<{
        tenant: TenantUser;
        pg: TenantPG | null;
        rentCycles?: TenantRentCycle[];
        recentPayments?: TenantPayment[];
        room_no?: string | null;
        bed_no?: string | null;
        bed_price?: string | null;
        payment_status?: string | null;
        rent_due_amount?: number;
        pending_months?: number;
      }>
    ) => {
      state.tenant = {
        ...action.payload.tenant,
        room_no: action.payload.room_no,
        bed_no: action.payload.bed_no,
        bed_price: action.payload.bed_price,
        payment_status: action.payload.payment_status,
        rent_due_amount: action.payload.rent_due_amount,
        pending_months: action.payload.pending_months,
      };
      state.pg = action.payload.pg;
      state.rentCycles = action.payload.rentCycles ?? [];
      state.recentPayments = action.payload.recentPayments ?? [];
    },

    // Update tenant info
    updateTenantInfo: (state, action: PayloadAction<Partial<TenantUser>>) => {
      if (state.tenant) {
        state.tenant = { ...state.tenant, ...action.payload };
      }
    },

    // Update access token after refresh
    updateTenantAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    // Clear tenant auth state (keeps lastUserRole for remembering user type)
    tenantLogout: (state) => {
      state.tenant = null;
      state.pg = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.rentCycles = [];
      state.recentPayments = [];
      state.isAuthenticated = false;
      state.lastUserRole = 'tenant';
    },
    setLastUserRole: (state, action: PayloadAction<'tenant' | null>) => {
      state.lastUserRole = action.payload;
    },

    // Set loading state
    setTenantLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setTenantError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearTenantError: (state) => {
      state.error = null;
    },

    // Reset state
    resetTenantAuth: (state) => {
      return initialState;
    },
  },
});

export const {
  setTenantCredentials,
  setTenantData,
  updateTenantInfo,
  updateTenantAccessToken,
  tenantLogout,
  setTenantLoading,
  setTenantError,
  clearTenantError,
  resetTenantAuth,
} = tenantAuthSlice.actions;

export default tenantAuthSlice.reducer;
