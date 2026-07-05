import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders, renderWithCustomStore, mockStore } from '../test-utils';
import { configureStore } from '@reduxjs/toolkit';

describe('test-utils', () => {
  describe('mockStore', () => {
    it('has pgLocations state with selectedPGLocationId', () => {
      const state = mockStore.getState();
      expect(state.pgLocations).toEqual({ selectedPGLocationId: 1 });
    });

    it('has auth state with user id', () => {
      const state = mockStore.getState();
      expect(state.auth).toEqual({ user: { id: 1 } });
    });

    it('has rbac state', () => {
      const state = mockStore.getState();
      expect(state.rbac).toEqual({ permissionsMap: {}, loadedAt: null });
    });

    it('has tenantAuth state', () => {
      const state = mockStore.getState();
      expect(state.tenantAuth.tenant).toEqual({ tenant_id: 1, name: 'Test Tenant' });
      expect(state.tenantAuth.accessToken).toBe('mock-token');
    });

    it('has appSettings state', () => {
      const state = mockStore.getState();
      expect(state.appSettings).toEqual({ appSettings: { status: 'active' } });
    });
  });

  describe('renderWithProviders', () => {
    it('renders component with navigation and redux providers', () => {
      const { getByText } = renderWithProviders(<Text>Test Child</Text>);
      expect(getByText('Test Child')).toBeTruthy();
    });
  });

  describe('renderWithCustomStore', () => {
    it('renders with custom store', () => {
      const customStore = configureStore({
        reducer: {
          pgLocations: () => ({ selectedPGLocationId: 99 }),
          auth: () => ({ user: { id: 42 } }),
          rbac: () => ({ permissionsMap: {}, loadedAt: null }),
          tenantAuth: () => ({ tenant: null, accessToken: null }),
          appSettings: () => ({ appSettings: { status: 'active' } }),
        },
      });
      const { getByText } = renderWithCustomStore(<Text>Custom Store</Text>, customStore);
      expect(getByText('Custom Store')).toBeTruthy();
      expect(customStore.getState().pgLocations.selectedPGLocationId).toBe(99);
    });
  });
});
