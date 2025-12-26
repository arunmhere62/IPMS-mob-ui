/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * This file defines:
 * 1. Available roles in the system
 * 2. Permissions for each role
 * 3. Screen/route access control
 * 4. Feature-level permissions
 */

// ============================================
// ROLE DEFINITIONS
// ============================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  
  // PG Locations
  VIEW_PG_LOCATIONS = 'view_pg_locations',
  CREATE_PG_LOCATION = 'create_pg_location',
  EDIT_PG_LOCATION = 'edit_pg_location',
  DELETE_PG_LOCATION = 'delete_pg_location',
  
  // Tenants
  VIEW_TENANTS = 'view_tenants',
  CREATE_TENANT = 'create_tenant',
  EDIT_TENANT = 'edit_tenant',
  DELETE_TENANT = 'delete_tenant',
  
  // Payments
  VIEW_PAYMENTS = 'view_payments',
  CREATE_PAYMENT = 'create_payment',
  EDIT_PAYMENT = 'edit_payment',
  DELETE_PAYMENT = 'delete_payment',
  APPROVE_PAYMENT = 'approve_payment',
  
  // Rooms & Beds
  VIEW_ROOMS = 'view_rooms',
  CREATE_ROOM = 'create_room',
  EDIT_ROOM = 'edit_room',
  DELETE_ROOM = 'delete_room',
  
  // Expenses
  VIEW_EXPENSES = 'view_expenses',
  CREATE_EXPENSE = 'create_expense',
  EDIT_EXPENSE = 'edit_expense',
  DELETE_EXPENSE = 'delete_expense',
  
  // Users & Employees
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  
  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Settings
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',
  
  // Organization Management (SuperAdmin only)
  VIEW_ALL_ORGANIZATIONS = 'view_all_organizations',
  MANAGE_ORGANIZATIONS = 'manage_organizations',
}

// ============================================
// ROLE PERMISSIONS MAPPING
// ============================================

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // SuperAdmin has ALL permissions
    ...Object.values(Permission),
  ],
  
  [UserRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    
    // PG Locations - Full access
    Permission.VIEW_PG_LOCATIONS,
    Permission.CREATE_PG_LOCATION,
    Permission.EDIT_PG_LOCATION,
    Permission.DELETE_PG_LOCATION,
    
    // Tenants - Full access
    Permission.VIEW_TENANTS,
    Permission.CREATE_TENANT,
    Permission.EDIT_TENANT,
    Permission.DELETE_TENANT,
    
    // Payments - Full access
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENT,
    Permission.EDIT_PAYMENT,
    Permission.DELETE_PAYMENT,
    Permission.APPROVE_PAYMENT,
    
    // Rooms - Full access
    Permission.VIEW_ROOMS,
    Permission.CREATE_ROOM,
    Permission.EDIT_ROOM,
    Permission.DELETE_ROOM,
    
    // Expenses - Full access
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.EDIT_EXPENSE,
    Permission.DELETE_EXPENSE,
    
    // Users - Full access
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    
    // Settings
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],
  
  [UserRole.EMPLOYEE]: [
    Permission.VIEW_DASHBOARD,
    
    // PG Locations - Full access
    Permission.VIEW_PG_LOCATIONS,
    Permission.CREATE_PG_LOCATION,
    Permission.EDIT_PG_LOCATION,
    Permission.DELETE_PG_LOCATION,
    
    // Tenants - Full access
    Permission.VIEW_TENANTS,
    Permission.CREATE_TENANT,
    Permission.EDIT_TENANT,
    Permission.DELETE_TENANT,
    
    // Payments - Full access
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENT,
    Permission.EDIT_PAYMENT,
    Permission.DELETE_PAYMENT,
    Permission.APPROVE_PAYMENT,
    
    // Rooms - Full access
    Permission.VIEW_ROOMS,
    Permission.CREATE_ROOM,
    Permission.EDIT_ROOM,
    Permission.DELETE_ROOM,
    
    // Expenses - Full access
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.EDIT_EXPENSE,
    Permission.DELETE_EXPENSE,
    
    // Users - Full access
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    
    // Settings
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],
};

// ============================================
// SCREEN ACCESS CONFIGURATION
// ============================================

export interface ScreenConfig {
  name: string;
  path: string;
  requiredPermission: Permission;
  icon?: string;
  showInMenu?: boolean;
}

export const ScreenAccessConfig: ScreenConfig[] = [
  {
    name: 'Dashboard',
    path: 'Dashboard',
    requiredPermission: Permission.VIEW_DASHBOARD,
    icon: '🏠',
    showInMenu: true,
  },
  {
    name: 'Tenants',
    path: 'Tenants',
    requiredPermission: Permission.VIEW_TENANTS,
    icon: '👥',
    showInMenu: true,
  },
  {
    name: 'Payments',
    path: 'Payments',
    requiredPermission: Permission.VIEW_PAYMENTS,
    icon: '💰',
    showInMenu: true,
  },
  {
    name: 'PG Locations',
    path: 'PGLocations',
    requiredPermission: Permission.VIEW_PG_LOCATIONS,
    icon: '🏢',
    showInMenu: true,
  },
  {
    name: 'Expenses',
    path: 'Expenses',
    requiredPermission: Permission.VIEW_EXPENSES,
    icon: '💸',
    showInMenu: true,
  },
  {
    name: 'Reports',
    path: 'Reports',
    requiredPermission: Permission.VIEW_REPORTS,
    icon: '📊',
    showInMenu: true,
  },
  {
    name: 'Settings',
    path: 'Settings',
    requiredPermission: Permission.VIEW_SETTINGS,
    icon: '⚙️',
    showInMenu: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: string, permission: Permission): boolean => {
  const userRole = role as UserRole;
  const permissions = RolePermissions[userRole];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: string): Permission[] => {
  const userRole = role as UserRole;
  return RolePermissions[userRole] || [];
};

/**
 * Check if user can access a screen
 */
export const canAccessScreen = (role: string, screenPath: string): boolean => {
  const screen = ScreenAccessConfig.find(s => s.path === screenPath);
  if (!screen) return false;
  return hasPermission(role, screen.requiredPermission);
};

/**
 * Get accessible screens for a role
 */
export const getAccessibleScreens = (role: string): ScreenConfig[] => {
  return ScreenAccessConfig.filter(screen => 
    hasPermission(role, screen.requiredPermission)
  );
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (role: string, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if user has all of the required permissions
 */
export const hasAllPermissions = (role: string, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};
