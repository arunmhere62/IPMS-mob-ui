import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PermissionGuard } from '../PermissionGuard';
import { Permission } from '../../config/rbac.config';

const renderWithPermissions = (permissionsMap: Record<string, boolean>, props: React.ComponentProps<typeof PermissionGuard>) => {
  const store = configureStore({
    reducer: {
      rbac: () => ({ permissionsMap, loadedAt: Date.now() }),
      auth: () => ({ user: { id: 1 } }),
    },
  });
  return render(
    <Provider store={store}>
      <PermissionGuard {...props} />
    </Provider>
  );
};

describe('PermissionGuard', () => {
  it('renders children when no permission specified', () => {
    const { getByText } = renderWithPermissions({}, { children: <Text>Visible</Text> });
    expect(getByText('Visible')).toBeTruthy();
  });

  it('renders children when single permission is granted', () => {
    const { getByText } = renderWithPermissions(
      { [Permission.CREATE_TENANT]: true },
      { children: <Text>Visible</Text>, permission: Permission.CREATE_TENANT }
    );
    expect(getByText('Visible')).toBeTruthy();
  });

  it('renders fallback when single permission is denied', () => {
    const { queryByText, getByText } = renderWithPermissions(
      { [Permission.CREATE_TENANT]: false },
      { children: <Text>Hidden</Text>, permission: Permission.CREATE_TENANT, fallback: <Text>Fallback</Text> }
    );
    expect(queryByText('Hidden')).toBeNull();
    expect(getByText('Fallback')).toBeTruthy();
  });

  it('renders null fallback by default when permission denied', () => {
    const { queryByText } = renderWithPermissions(
      { [Permission.CREATE_TENANT]: false },
      { children: <Text>Hidden</Text>, permission: Permission.CREATE_TENANT }
    );
    expect(queryByText('Hidden')).toBeNull();
  });

  it('renders children when any permission matches (requireAll=false)', () => {
    const { getByText } = renderWithPermissions(
      { [Permission.EDIT_TENANT]: true, [Permission.DELETE_TENANT]: false },
      {
        children: <Text>Visible</Text>,
        permissions: [Permission.EDIT_TENANT, Permission.DELETE_TENANT],
        requireAll: false,
      }
    );
    expect(getByText('Visible')).toBeTruthy();
  });

  it('renders fallback when no permissions match (requireAll=false)', () => {
    const { queryByText } = renderWithPermissions(
      { [Permission.EDIT_TENANT]: false, [Permission.DELETE_TENANT]: false },
      {
        children: <Text>Hidden</Text>,
        permissions: [Permission.EDIT_TENANT, Permission.DELETE_TENANT],
        requireAll: false,
        fallback: <Text>Fallback</Text>,
      }
    );
    expect(queryByText('Hidden')).toBeNull();
  });

  it('renders children when all permissions match (requireAll=true)', () => {
    const { getByText } = renderWithPermissions(
      { [Permission.EDIT_TENANT]: true, [Permission.DELETE_TENANT]: true },
      {
        children: <Text>Visible</Text>,
        permissions: [Permission.EDIT_TENANT, Permission.DELETE_TENANT],
        requireAll: true,
      }
    );
    expect(getByText('Visible')).toBeTruthy();
  });

  it('renders fallback when not all permissions match (requireAll=true)', () => {
    const { queryByText } = renderWithPermissions(
      { [Permission.EDIT_TENANT]: true, [Permission.DELETE_TENANT]: false },
      {
        children: <Text>Hidden</Text>,
        permissions: [Permission.EDIT_TENANT, Permission.DELETE_TENANT],
        requireAll: true,
        fallback: <Text>Fallback</Text>,
      }
    );
    expect(queryByText('Hidden')).toBeNull();
  });
});
