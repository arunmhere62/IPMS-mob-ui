import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionFlags } from '../../api/rbacApi';

export type RbacState = {
  permissionsMap: Record<string, boolean>;
  loadedAt: number | null;
  subscription: SubscriptionFlags | null;
  isOnboardingComplete: boolean | null;
  onboardingHasRooms: boolean;
  onboardingHasTenants: boolean;
};

const initialState: RbacState = {
  permissionsMap: {},
  loadedAt: null,
  subscription: null,
  isOnboardingComplete: null,
  onboardingHasRooms: false,
  onboardingHasTenants: false,
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
    setIsOnboardingComplete: (state, action: PayloadAction<boolean | null>) => {
      state.isOnboardingComplete = action.payload;
    },
    setOnboardingFlags: (state, action: PayloadAction<{ hasRooms: boolean; hasTenants: boolean }>) => {
      state.onboardingHasRooms = action.payload.hasRooms;
      state.onboardingHasTenants = action.payload.hasTenants;
    },
    clearPermissions: (state) => {
      state.permissionsMap = {};
      state.loadedAt = null;
      state.subscription = null;
      state.isOnboardingComplete = null;
      state.onboardingHasRooms = false;
      state.onboardingHasTenants = false;
    },
  },
});

export const { setPermissionsMap, setSubscription, setIsOnboardingComplete, setOnboardingFlags, clearPermissions } = rbacSlice.actions;
export default rbacSlice.reducer;
