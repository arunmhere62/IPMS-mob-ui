import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Create a simple mock store
export const mockStore = configureStore({
  reducer: {
    pgLocations: () => ({ selectedPGLocationId: 1 }),
    auth: () => ({ user: { id: 1 } }),
    rbac: () => ({ permissionsMap: {}, loadedAt: null }),
    tenantAuth: () => ({ tenant: { tenant_id: 1, name: 'Test Tenant' }, accessToken: 'mock-token' }),
    appSettings: () => ({ appSettings: { status: 'active' } }),
  },
});

// Helper to render with navigation and redux context
export const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>,
  );
};

// Helper to render with custom store
export const renderWithCustomStore = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>,
  );
};
