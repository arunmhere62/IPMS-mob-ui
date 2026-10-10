import { useSelector } from 'react-redux';
import { Permission } from '../config/rbac.config';
import { getBackendPermissionKeyCandidates } from '../config/rbac-backend-map';
import { RootState } from '@/features/owner/store';

const screenPermissionMap: Record<string, Permission> = {
  dashboard: Permission.VIEW_DASHBOARD,
  rooms: Permission.VIEW_ROOM,
  roomdetails: Permission.VIEW_ROOM,
  beds: Permission.VIEW_BED,
  tenants: Permission.VIEW_TENANTS,
  tenantdetails: Permission.VIEW_TENANTS,
  upcomingvacancies: Permission.VIEW_TENANTS,
  pglocations: Permission.VIEW_PG_LOCATIONS,
  pgdetails: Permission.VIEW_PG_LOCATIONS,
  payments: Permission.VIEW_PAYMENT,
  rentpayments: Permission.VIEW_PAYMENT,
  advancepayments: Permission.VIEW_PAYMENT,
  refundpayments: Permission.VIEW_PAYMENT,
  tenantrentpaymentsscreen: Permission.VIEW_PAYMENT,
  tenantadvancepaymentsscreen: Permission.VIEW_PAYMENT,
  tenantrefundpaymentsscreen: Permission.VIEW_PAYMENT,
  paymentverification: Permission.VIEW_PAYMENT_VERIFICATION,
  paymentconfig: Permission.VIEW_PAYMENT_CONFIG,
  expenses: Permission.VIEW_EXPENSE,
  employees: Permission.VIEW_EMPLOYEE,
  employeedetails: Permission.VIEW_EMPLOYEE,
  visitors: Permission.VIEW_VISITOR,
  visitordetails: Permission.VIEW_VISITOR,
  tickets: Permission.VIEW_TICKET,
  ticketdetails: Permission.VIEW_TICKET,
  pgtenanttickets: Permission.VIEW_TICKET,
  pgtenantticketdetail: Permission.VIEW_TICKET,
  roomelectricitybills: Permission.VIEW_ELECTRICITY_BILL,
};

const superAdminScreens = new Set(['organizations', 'employeepermissionoverrides']);

const unguardedScreens = new Set([
  'settings',
  'userprofile',
  'faqwebview',
  'legaldocuments',
  'legalwebview',
  'subscriptionplans',
  'subscriptionhistory',
  'subscriptionconfirm',
  'paymentwebview',
  'invoiceviewer',
  'networklogger',
  'maintabs',
]);

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
  const userRole = user?.role_name ?? '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole.toLowerCase() === 'super_admin';
  const permissionsMap = useSelector((state: RootState) => (state as any).rbac?.permissionsMap ?? {});
  const loadedAt = useSelector((state: RootState) => (state as any).rbac?.loadedAt ?? null);
  const isReady = loadedAt != null;

  /**
   * Check a single permission key against the map.
   * Default-allow: if the key is NOT in the map, return true.
   * Only deny when the key exists and is explicitly false.
   */
  const checkKey = (key: string): boolean => {
    if (isSuperAdmin) return true;
    if (!(key in permissionsMap)) return true; // not mapped → allow
    return Boolean((permissionsMap as any)[key]);
  };

  return {
    /**
     * Check if user has a specific permission
     * @param permission - Permission to check
     * @returns boolean
     */
    can: (permission: Permission): boolean => {
      const keys = getBackendPermissionKeyCandidates(permission);
      return keys.some((k) => checkKey(k));
    },

    /**
     * Check if user has any of the permissions
     * @param permissions - Array of permissions
     * @returns boolean
     */
    canAny: (permissions: Permission[]): boolean => {
      return permissions.some((p) => {
        const keys = getBackendPermissionKeyCandidates(p);
        return keys.some((k) => checkKey(k));
      });
    },

    /**
     * Check if user has all of the permissions
     * @param permissions - Array of permissions
     * @returns boolean
     */
    canAll: (permissions: Permission[]): boolean => {
      return permissions.every((p) => {
        const keys = getBackendPermissionKeyCandidates(p);
        return keys.some((k) => checkKey(k));
      });
    },

    /**
     * Check if user can access a screen
     * @param screenPath - Screen path/name
     * @returns boolean
     */
    canAccess: (screenPath: string): boolean => {
      const screenName = String(screenPath).split(/[/?#]/).filter(Boolean).pop()?.replace(/[-_]/g, '').toLowerCase() ?? '';
      const requiredPermission = screenPermissionMap[screenName];
      if (requiredPermission) {
        const keys = getBackendPermissionKeyCandidates(requiredPermission);
        return keys.some((key) => checkKey(key));
      }
      return unguardedScreens.has(screenName) || (isSuperAdmin && superAdminScreens.has(screenName));
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
