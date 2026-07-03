import rbacReducer, {
  setPermissionsMap,
  setSubscription,
  setIsOnboardingComplete,
  clearPermissions,
  type RbacState,
} from '../rbacSlice';

describe('rbacSlice', () => {
  const initialState: RbacState = {
    permissionsMap: {},
    loadedAt: null,
    subscription: null,
    isOnboardingComplete: null,
  };

  it('should return initial state', () => {
    expect(rbacReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setPermissionsMap', () => {
    it('sets permissions map and updates loadedAt', () => {
      const permissionsMap = { create_tenant: true, delete_tenant: false };
      const action = setPermissionsMap(permissionsMap);
      const state = rbacReducer(initialState, action);

      expect(state.permissionsMap).toEqual(permissionsMap);
      expect(state.loadedAt).toBeGreaterThan(0);
      expect(typeof state.loadedAt).toBe('number');
    });

    it('replaces existing permissions', () => {
      const existingState: RbacState = {
        permissionsMap: { old_permission: true },
        loadedAt: 123456,
        subscription: null,
        isOnboardingComplete: null,
      };
      const newPermissions = { new_permission: true };
      const action = setPermissionsMap(newPermissions);
      const state = rbacReducer(existingState, action);

      expect(state.permissionsMap).toEqual(newPermissions);
      expect(state.loadedAt).not.toBe(123456);
    });

    it('handles empty permissions map', () => {
      const action = setPermissionsMap({});
      const state = rbacReducer(initialState, action);

      expect(state.permissionsMap).toEqual({});
      expect(state.loadedAt).toBeGreaterThan(0);
    });
  });

  describe('setSubscription', () => {
    it('sets subscription', () => {
      const subscription = { plan: 'premium', expires_at: '2026-12-31' };
      const action = setSubscription(subscription as any);
      const state = rbacReducer(initialState, action);

      expect(state.subscription).toEqual(subscription);
    });

    it('sets subscription to null', () => {
      const existingState: RbacState = {
        permissionsMap: {},
        loadedAt: 123456,
        subscription: { plan: 'basic' } as any,
        isOnboardingComplete: null,
      };
      const action = setSubscription(null);
      const state = rbacReducer(existingState, action);

      expect(state.subscription).toBeNull();
    });
  });

  describe('setIsOnboardingComplete', () => {
    it('sets onboarding complete to true', () => {
      const action = setIsOnboardingComplete(true);
      const state = rbacReducer(initialState, action);

      expect(state.isOnboardingComplete).toBe(true);
    });

    it('sets onboarding complete to false', () => {
      const action = setIsOnboardingComplete(false);
      const state = rbacReducer(initialState, action);

      expect(state.isOnboardingComplete).toBe(false);
    });

    it('sets onboarding complete to null', () => {
      const existingState: RbacState = {
        permissionsMap: {},
        loadedAt: 123456,
        subscription: null,
        isOnboardingComplete: true,
      };
      const action = setIsOnboardingComplete(null);
      const state = rbacReducer(existingState, action);

      expect(state.isOnboardingComplete).toBeNull();
    });
  });

  describe('clearPermissions', () => {
    it('clears all rbac state', () => {
      const existingState: RbacState = {
        permissionsMap: { create_tenant: true },
        loadedAt: 123456,
        subscription: { plan: 'premium' } as any,
        isOnboardingComplete: true,
      };
      const action = clearPermissions();
      const state = rbacReducer(existingState, action);

      expect(state.permissionsMap).toEqual({});
      expect(state.loadedAt).toBeNull();
      expect(state.subscription).toBeNull();
      expect(state.isOnboardingComplete).toBeNull();
    });

    it('clears state even when already empty', () => {
      const action = clearPermissions();
      const state = rbacReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });
});
