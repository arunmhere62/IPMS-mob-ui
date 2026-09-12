import { describe, expect, it } from '@jest/globals';
import rbacReducer, {
  setPermissionsMap,
  setSubscription,
  clearPermissions,
  type RbacState,
} from '../rbacSlice';

describe('rbacSlice', () => {
  const initialState: RbacState = {
    permissionsMap: {},
    loadedAt: null,
    subscription: null,
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
      };
      const action = setSubscription(null);
      const state = rbacReducer(existingState, action);

      expect(state.subscription).toBeNull();
    });
  });

  describe('clearPermissions', () => {
    it('clears all rbac state', () => {
      const existingState: RbacState = {
        permissionsMap: { create_tenant: true },
        loadedAt: 123456,
        subscription: { plan: 'premium' } as any,
      };
      const action = clearPermissions();
      const state = rbacReducer(existingState, action);

      expect(state.permissionsMap).toEqual({});
      expect(state.loadedAt).toBeNull();
      expect(state.subscription).toBeNull();
    });

    it('clears state even when already empty', () => {
      const action = clearPermissions();
      const state = rbacReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });
});
