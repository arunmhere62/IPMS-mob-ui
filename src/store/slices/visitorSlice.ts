import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import visitorService, { Visitor, GetVisitorsParams } from '../../services/visitors/visitorService';

interface VisitorState {
  visitors: Visitor[];
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

const initialState: VisitorState = {
  visitors: [],
  pagination: null,
  loading: false,
  error: null,
};

export const fetchVisitors = createAsyncThunk(
  'visitors/fetchAll',
  async (params: GetVisitorsParams & { append?: boolean }, { rejectWithValue }) => {
    try {
      const { append, ...apiParams } = params;
      const response = await visitorService.getAllVisitors(apiParams);
      return { ...response, append: append || false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch visitors');
    }
  }
);

export const deleteVisitor = createAsyncThunk(
  'visitors/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await visitorService.deleteVisitor(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete visitor');
    }
  }
);

const visitorSlice = createSlice({
  name: 'visitors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all visitors
      .addCase(fetchVisitors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitors.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data as Visitor[];
        // Append data for infinite scroll or replace for new search
        if (action.payload.append && action.payload.pagination && action.payload.pagination.page > 1) {
          state.visitors = [...state.visitors, ...data];
        } else {
          state.visitors = data;
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVisitors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete visitor
      .addCase(deleteVisitor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVisitor.fulfilled, (state, action) => {
        state.loading = false;
        state.visitors = state.visitors.filter(v => v.s_no !== action.payload);
      })
      .addCase(deleteVisitor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = visitorSlice.actions;
export default visitorSlice.reducer;
