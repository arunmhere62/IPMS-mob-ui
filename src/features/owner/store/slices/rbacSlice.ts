import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionFlags } from '../../api/rbacApi';

export type RbacState = {
  permissionsMap: Record<string, boolean>;
  loadedAt: number | null;
  subscription: SubscriptionFlags | null;
};

const initialState: RbacState = {
  permissionsMap: {},
  loadedAt: null,
  subscription: null,
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    setPermissionsMap: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.permissionsMap = action.payload;
      state.loadedAt = Date.now();
    },
    setSubscription: (state, action: PayloadAction<SubscriptionFlags | null>) => {
      state.subscription = action.payload;
    },
    clearPermissions: (state) => {
      state.permissionsMap = {};
      state.loadedAt = null;
      state.subscription = null;
    },
  },
});

export const { setPermissionsMap, setSubscription, clearPermissions } = rbacSlice.actions;
export default rbacSlice.reducer;
