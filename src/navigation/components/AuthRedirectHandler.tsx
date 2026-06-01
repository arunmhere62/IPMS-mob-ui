import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  type ParamListBase,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import { RootState } from '@/features/owner/store';

/**
 * AuthRedirectHandler - Handles automatic redirects based on last user role
 *
 * When a user is not authenticated but has previously logged in (stored in lastUserRole),
 * this component redirects them from RoleSelection to their respective login screen:
 * - 'admin' (PG Owner) -> Login screen
 * - 'tenant' -> TenantLogin screen
 *
 * Must be rendered inside NavigationContainer to access navigation context.
 */
export const AuthRedirectHandler: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const { isAuthenticated, lastUserRole: adminLastRole } = useSelector(
    (state: RootState) => state.auth
  );
  const { isAuthenticated: isTenantAuthenticated, lastUserRole: tenantLastRole } = useSelector(
    (state: RootState) => state.tenantAuth
  );

  const lastUserRole = isAuthenticated
    ? 'admin'
    : isTenantAuthenticated
      ? 'tenant'
      : adminLastRole || tenantLastRole;

  useEffect(() => {
    // Only redirect if user is not authenticated and has a lastUserRole
    if (!isAuthenticated && !isTenantAuthenticated && lastUserRole) {
      const targetRoute = lastUserRole === 'admin' ? 'Login' : 'TenantLogin';
      const currentRoute = navigation.getState()?.routes[navigation.getState()?.index]?.name;

      // Navigate from RoleSelection to the appropriate login screen
      if (currentRoute === 'RoleSelection') {
        // Small delay to allow initial render to complete
        const timeout = setTimeout(() => {
          navigation.navigate(targetRoute);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [isAuthenticated, isTenantAuthenticated, lastUserRole, navigation]);

  return null;
};
