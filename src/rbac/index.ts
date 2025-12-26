/**
 * RBAC (Role-Based Access Control) Module
 * 
 * Central export point for all RBAC functionality
 * 
 * Usage:
 * import { usePermissions, Permission, ProtectedRoute } from '../rbac';
 */

// Configuration
export { Permission } from '../config/rbac.config';

// Hooks
export { usePermissions } from '../hooks/usePermissions';

// Components
export { ProtectedRoute } from '../components/ProtectedRoute';
export { PermissionGuard } from '../components/PermissionGuard';
