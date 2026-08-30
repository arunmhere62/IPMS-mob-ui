import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';

export type UserRole = 'admin' | 'tenant' | null;

/**
 * Determines the user's last login role and which auth route
 * to show when unauthenticated.
 *
 * - If owner is authenticated → 'admin'
 * - If tenant is authenticated → 'tenant'
 * - Otherwise falls back to persisted lastUserRole from either slice
 */
export const useAuthRoute = () => {
  const { isAuthenticated, lastUserRole: adminLastRole } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isAuthenticated: isTenantAuthenticated, lastUserRole: tenantLastRole } = useSelector(
    (state: RootState) => state.tenantAuth,
  );

  const lastUserRole: UserRole = isAuthenticated
    ? 'admin'
    : isTenantAuthenticated
      ? 'tenant'
      : adminLastRole || tenantLastRole;

  const isUnauthenticated = !isAuthenticated && !isTenantAuthenticated;

  const initialAuthRoute = lastUserRole === 'admin'
    ? 'Login'
    : lastUserRole === 'tenant'
      ? 'TenantLogin'
      : 'RoleSelection';

  // Force navigator re-mount when switching between auth/tenant/owner states.
  // Without this, initialRouteName is ignored on state changes (it only
  // applies on first mount), causing logout to default to RoleSelection
  // instead of the remembered login screen.
  const navigatorKey = isUnauthenticated
    ? `auth-${initialAuthRoute}`
    : isTenantAuthenticated
      ? 'tenant'
      : 'owner';

  return {
    isAuthenticated,
    isTenantAuthenticated,
    isUnauthenticated,
    lastUserRole,
    initialAuthRoute,
    navigatorKey,
  };
};
