import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RbacState = {
  permissionsMap: Record<string, boolean>;
  loadedAt: number | null;
};

const initialState: RbacState = {
  permissionsMap: {},
  loadedAt: null,
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    setPermissionsMap: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.permissionsMap = action.payload;
      state.loadedAt = Date.now();
    },
    clearPermissions: (state) => {
      state.permissionsMap = {};
      state.loadedAt = null;
    },
  },
});

export const { setPermissionsMap, clearPermissions } = rbacSlice.actions;
export default rbacSlice.reducer;
