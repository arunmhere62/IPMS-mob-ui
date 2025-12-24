import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Payment } from '../../types';
import { paymentsApi } from '../../services/api/paymentsApi';

interface PaymentState {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  pagination: null,
  loading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (params: {
    tenant_id?: number;
    status?: string;
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    room_id?: number;
    bed_id?: number;
    month?: string;
    year?: number;
    append?: boolean; // Flag to append data for infinite scroll
  } = {}, { rejectWithValue, dispatch }) => {
    try {
      const response = await dispatch(paymentsApi.endpoints.getTenantPayments.initiate(params)).unwrap();
      return { ...response, append: params?.append || false };
    } catch (error: any) {
      return rejectWithValue(error.data?.message || 'Failed to fetch payments');
    }
  }
);

export const createPayment = createAsyncThunk<Payment, Partial<Payment>>(
  'payments/create',
  async (data: Partial<Payment>, { rejectWithValue, dispatch }) => {
    try {
      const response = await dispatch(paymentsApi.endpoints.createTenantPayment.initiate(data)).unwrap();
      return response.data as Payment;
    } catch (error: any) {
      return rejectWithValue(error.data?.message || 'Failed to create payment');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        // Append data for infinite scroll or replace for new search
        if (action.payload.append && action.payload.pagination?.page > 1) {
          state.payments = [...state.payments, ...data];
        } else {
          state.payments = data;
        }
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.push(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
