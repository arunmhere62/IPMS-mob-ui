/**
 * AppNavigator - Root Navigation Component
 *
 * Architecture:
 * - useAuthRoute: Hook that determines which stack to show based on auth state
 * - AuthRedirectHandler: Handles automatic redirects based on lastUserRole
 * - AuthScreens / TenantScreens / OwnerScreens: Screen stacks split by role
 *
 * The navigator re-mounts (via key) when switching between auth/tenant/owner
 * states so that initialRouteName is respected after logout.
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';

import { RootState } from '@/features/owner/store';
import { clearPermissions } from '@/features/owner/store/slices/rbacSlice';
import { usePermissionsPolling } from '@/hooks/usePermissionsPolling';
import { useAppSettingsPolling } from '@/hooks/useAppSettingsPolling';
import { navigationRef } from './navigationRef';
import { navigationTheme } from './navigationTheme';
import { AuthRedirectHandler } from './components';
import { useAuthRoute } from '@/hooks/useAuthRoute';
import { AuthScreens } from './AuthScreens';
import { TenantScreens } from './TenantScreens';
import { OwnerScreens } from './OwnerScreens';

export const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const {
    isUnauthenticated,
    isTenantAuthenticated,
    initialAuthRoute,
    navigatorKey,
  } = useAuthRoute();

  usePermissionsPolling();
  useAppSettingsPolling();

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearPermissions());
    }
  }, [isAuthenticated, dispatch]);

  // Safety gate: an authenticated owner must have an organization before
  // any dashboard/PG-guarded API can be called. The unified sign-in flow
  // creates the organization before login, so this normally only protects
  // incomplete/legacy accounts.
  const needsOwnerSetup = isAuthenticated && !isTenantAuthenticated && user && !user.organization_id;

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <AuthRedirectHandler />
      {isUnauthenticated || needsOwnerSetup ? (
        <AuthScreens
          key={navigatorKey}
          initialRouteName={needsOwnerSetup ? 'Signup' : initialAuthRoute}
        />
      ) : isTenantAuthenticated ? (
        <TenantScreens key={navigatorKey} />
      ) : (
        <OwnerScreens key={navigatorKey} />
      )}
    </NavigationContainer>
  );
};
