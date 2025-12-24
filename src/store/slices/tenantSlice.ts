import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Tenant, GetTenantsParams, CreateTenantDto } from '@/services/api/tenantsApi';
import { tenantsApi } from '@/services/api/tenantsApi';

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: TenantState = {
  tenants: [],
  currentTenant: null,
  pagination: null,
  loading: false,
  error: null,
};

export const fetchTenants = createAsyncThunk(
  'tenants/fetchAll',
  async (params: GetTenantsParams & { append?: boolean }, { dispatch, rejectWithValue }) => {
    try {
      const { append, ...apiParams } = params;
      const response = await dispatch(tenantsApi.endpoints.getTenants.initiate(apiParams)).unwrap();
      return { ...response, append: append || false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenants');
    }
  }
);

export const fetchTenantById = createAsyncThunk(
  'tenants/fetchById',
  async (
    { id, headers }: { id: number; headers?: { pg_id?: number; organization_id?: number; user_id?: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // NOTE: tenantsApi.getTenantById currently doesn't accept header overrides.
      // Keeping the signature for backwards-compat with callers.
      void headers;
      const response = await dispatch(tenantsApi.endpoints.getTenantById.initiate(id)).unwrap();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenant');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenants/create',
  async (
    { data, headers }: { data: CreateTenantDto; headers?: { pg_id?: number; organization_id?: number; user_id?: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      void headers;
      const response = await dispatch(tenantsApi.endpoints.createTenant.initiate(data)).unwrap();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tenant');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenants/update',
  async (
    { id, data, headers }: { id: number; data: Partial<CreateTenantDto>; headers?: { pg_id?: number; organization_id?: number; user_id?: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      void headers;
      const response = await dispatch(tenantsApi.endpoints.updateTenant.initiate({ id, data })).unwrap();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tenant');
    }
  }
);

export const deleteTenant = createAsyncThunk(
  'tenants/delete',
  async (
    { id, headers }: { id: number; headers?: { pg_id?: number; organization_id?: number; user_id?: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      void headers;
      await dispatch(tenantsApi.endpoints.deleteTenant.initiate(id)).unwrap();
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tenant');
    }
  }
);

export const checkoutTenant = createAsyncThunk(
  'tenants/checkout',
  async (
    { id, headers }: { id: number; headers?: { pg_id?: number; organization_id?: number; user_id?: number } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      void headers;
      const response = await dispatch(tenantsApi.endpoints.checkoutTenant.initiate(id)).unwrap();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to checkout tenant');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    clearCurrentTenant: (state) => {
      state.currentTenant = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tenants
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        // Append data for infinite scroll or replace for new search
        if (action.payload.append && action.payload.pagination?.page > 1) {
          state.tenants = [...state.tenants, ...data];
        } else {
          state.tenants = data;
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch tenant by ID
      .addCase(fetchTenantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenantById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTenant = action.payload;
      })
      .addCase(fetchTenantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create tenant
      .addCase(createTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants.push(action.payload);
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update tenant
      .addCase(updateTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tenants.findIndex((t: Tenant) => t.s_no === action.payload.s_no);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
        state.currentTenant = action.payload;
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete tenant
      .addCase(deleteTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = state.tenants.filter((t: Tenant) => t.s_no !== action.payload);
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentTenant, clearError } = tenantSlice.actions;
export default tenantSlice.reducer;
