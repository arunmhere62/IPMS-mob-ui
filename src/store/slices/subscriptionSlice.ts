import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import subscriptionService, { 
  SubscriptionPlan, 
  UserSubscription, 
  SubscriptionStatus,
  SubscriptionHistory 
} from '../../services/subscription/subscriptionService';

interface SubscriptionState {
  data: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  subscriptionStatus: SubscriptionStatus | null;
  history: UserSubscription[];
  historyPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  data: [],
  currentSubscription: null,
  subscriptionStatus: null,
  history: [],
  historyPagination: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getPlans();
      // API returns { success, plans } - extract plans array
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getCurrentSubscription();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const fetchSubscriptionStatus = createAsyncThunk(
  'subscription/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      console.log('🔍 Thunk received response:', response);
      // Service now returns SubscriptionStatus directly
      return response;
    } catch (error: any) {
      console.error('❌ Subscription status error:', error);
      console.error('❌ Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch status');
    }
  }
);

export const fetchSubscriptionHistory = createAsyncThunk(
  'subscription/fetchHistory',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getSubscriptionHistory(params);
      console.log('📜 History API response:', response);
      // Handle different response structures
      const historyData = response.data || response;
      console.log('📜 History data extracted:', historyData);
      return historyData;
    } catch (error: any) {
      console.error('❌ History fetch error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const subscribeToPlan = createAsyncThunk(
  'subscription/subscribe',
  async (planId: number, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.subscribeToPlan(planId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to subscribe');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Plans
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        console.log('✅ Plans stored in Redux:', state.data);
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Current Subscription
    builder
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = (action.payload as any)?.data || action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Subscription Status
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        console.log('✅ Subscription status fulfilled:', payload);
        
        // Payload is now SubscriptionStatus directly
        state.subscriptionStatus = payload;
        
        console.log('📊 Redux state updated:', state.subscriptionStatus);
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch History
    builder
      .addCase(fetchSubscriptionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        const payload: any = action.payload;
        state.history = payload.data || payload.subscriptions || [];
        state.historyPagination = payload.pagination || null;
        console.log('✅ History stored in Redux:', { 
          history: state.history, 
          pagination: state.historyPagination 
        });
      })
      .addCase(fetchSubscriptionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Subscribe to Plan
    builder
      .addCase(subscribeToPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload.subscription;
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
