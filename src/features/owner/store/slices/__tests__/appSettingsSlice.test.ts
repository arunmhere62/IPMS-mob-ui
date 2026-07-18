import appSettingsReducer, {
  setAppSettings,
  clearAppSettings,
  type AppSettingsState,
} from '../appSettingsSlice';

describe('appSettingsSlice', () => {
  const initialState: AppSettingsState = {
    appSettings: null,
    loadedAt: null,
  };

  it('should return initial state', () => {
    expect(appSettingsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setAppSettings', () => {
    it('sets app settings and updates loadedAt', () => {
      const appSettings = { maintenance_mode: false, version: '1.0.0' };
      const action = setAppSettings(appSettings as any);
      const state = appSettingsReducer(initialState, action);

      expect(state.appSettings).toEqual(appSettings);
      expect(state.loadedAt).toBeGreaterThan(0);
      expect(typeof state.loadedAt).toBe('number');
    });

    it('replaces existing app settings', () => {
      const existingState: AppSettingsState = {
        appSettings: { maintenance_mode: true, version: '0.9.0' } as any,
        loadedAt: 123456,
      };
      const newSettings = { maintenance_mode: false, version: '1.0.0' };
      const action = setAppSettings(newSettings as any);
      const state = appSettingsReducer(existingState, action);

      expect(state.appSettings).toEqual(newSettings);
      expect(state.loadedAt).not.toBe(123456);
    });

    it('sets app settings to null', () => {
      const existingState: AppSettingsState = {
        appSettings: { maintenance_mode: false, version: '1.0.0' } as any,
        loadedAt: 123456,
      };
      const action = setAppSettings(null);
      const state = appSettingsReducer(existingState, action);

      expect(state.appSettings).toBeNull();
      expect(state.loadedAt).toBeGreaterThan(0);
    });
  });

  describe('clearAppSettings', () => {
    it('clears app settings state', () => {
      const existingState: AppSettingsState = {
        appSettings: { maintenance_mode: false, version: '1.0.0' } as any,
        loadedAt: 123456,
      };
      const action = clearAppSettings();
      const state = appSettingsReducer(existingState, action);

      expect(state.appSettings).toBeNull();
      expect(state.loadedAt).toBeNull();
    });

    it('clears state even when already empty', () => {
      const action = clearAppSettings();
      const state = appSettingsReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });
});
