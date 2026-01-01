import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Permission } from '../config/rbac.config';
import { getBackendPermissionKeyCandidates } from '../config/rbac-backend-map';

/**
 * Custom hook for role-based access control
 * 
 * Usage:
 * const { can, canAccess, accessibleScreens } = usePermissions();
 * 
 * if (can('create_tenant')) {
 *   // Show create button
 * }
 */
export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role_name || '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole.toLowerCase() === 'super_admin';
  const permissionsMap = useSelector((state: RootState) => (state as any).rbac?.permissionsMap || {});
  const loadedAt = useSelector((state: RootState) => (state as any).rbac?.loadedAt || null);
  const isReady = Boolean(loadedAt);


  return {
    /**
     * Check if user has a specific permission
     * @param permission - Permission to check
     * @returns boolean
     */
    can: (permission: Permission): boolean => {
      if (isSuperAdmin) return true;
      const keys = getBackendPermissionKeyCandidates(permission);
      return keys.some((k) => Boolean((permissionsMap as any)[k]));
    },

    /**
     * Check if user has any of the permissions
     * @param permissions - Array of permissions
     * @returns boolean
     */
    canAny: (permissions: Permission[]): boolean => {
      if (isSuperAdmin) return true;
      return permissions.some((p) => {
        const keys = getBackendPermissionKeyCandidates(p);
        return keys.some((k) => Boolean((permissionsMap as any)[k]));
      });
    },

    /**
     * Check if user has all of the permissions
     * @param permissions - Array of permissions
     * @returns boolean
     */
    canAll: (permissions: Permission[]): boolean => {
      if (isSuperAdmin) return true;
      return permissions.every((p) => {
        const keys = getBackendPermissionKeyCandidates(p);
        return keys.some((k) => Boolean((permissionsMap as any)[k]));
      });
    },

    /**
     * Check if user can access a screen
     * @param screenPath - Screen path/name
     * @returns boolean
     */
    canAccess: (screenPath: string): boolean => {
      return true;
    },

    /**
     * Get all permissions for current user
     * @returns Permission[]
     */
    isReady,

    /**
     * Get current user role
     * @returns string
     */
    role: userRole,

    /**
     * Check if user is SuperAdmin
     * @returns boolean
     */
    isSuperAdmin,

    /**
     * Check if user is Admin
     * @returns boolean
     */
    isAdmin: userRole === 'ADMIN' || userRole.toLowerCase() === 'admin',

    /**
     * Get user info
     */
    user,
  };
};
