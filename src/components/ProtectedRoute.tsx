import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../config/rbac.config';
import { Theme } from '../theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is enough
  fallback?: React.ReactNode;
  screenName?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps a screen/component and only renders it if user has required permissions
 * 
 * Usage:
 * <ProtectedRoute requiredPermission={Permission.VIEW_TENANTS}>
 *   <TenantsScreen />
 * </ProtectedRoute>
 * 
 * Or check multiple permissions:
 * <ProtectedRoute 
 *   requiredPermissions={[Permission.VIEW_TENANTS, Permission.CREATE_TENANT]}
 *   requireAll={false}
 * >
 *   <TenantsScreen />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
  screenName,
}) => {
  const { can, canAny, canAll } = usePermissions();

  // Check single permission
  if (requiredPermission && !can(requiredPermission)) {
    return fallback || <AccessDenied />;
  }

  // Check multiple permissions
  if (requiredPermissions) {
    const hasAccess = requireAll 
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);
    
    if (!hasAccess) {
      return fallback || <AccessDenied />;
    }
  }

  return <>{children}</>;
};

/**
 * Default Access Denied Component
 */
const AccessDenied: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>
        You don't have permission to access this screen.
      </Text>
      <Text style={styles.subMessage}>
        Please contact your administrator if you believe this is an error.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.colors.light,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: Theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
