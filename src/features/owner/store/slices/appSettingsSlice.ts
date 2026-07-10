import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppPublicStatus } from '../../api/appSettingsApi';

export type AppSettingsState = {
  appSettings: AppPublicStatus | null;
  loadedAt: number | null;
};

const initialState: AppSettingsState = {
  appSettings: null,
  loadedAt: null,
};

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    setAppSettings: (state, action: PayloadAction<AppPublicStatus | null>) => {
      state.appSettings = action.payload;
      state.loadedAt = Date.now();
    },
    clearAppSettings: (state) => {
      state.appSettings = null;
      state.loadedAt = null;
    },
  },
});

export const { setAppSettings, clearAppSettings } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
