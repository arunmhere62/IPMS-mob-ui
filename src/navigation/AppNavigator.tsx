/**
 * AppNavigator - Root Navigation Component
 *
 * Architecture:
 * - AuthRedirectHandler: Handles automatic redirects based on lastUserRole
 * - MainTabs: Bottom tab navigator for Owner users
 * - Screen imports organized by feature areas
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Theme } from '@/theme';
import { RootState } from '@/features/owner/store';
import { clearPermissions } from '@/features/owner/store/slices/rbacSlice';
import { usePermissionsPolling } from '@/hooks/usePermissionsPolling';
import { useAppSettingsPolling } from '@/hooks/useAppSettingsPolling';
import { navigationRef } from './navigationRef';
import { AuthRedirectHandler, MainTabs } from './components';

// ==================== AUTH SCREENS ====================
import { RoleSelectionScreen } from '@/features/auth/screens/RoleSelectionScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { OTPVerificationScreen } from '@/features/auth/screens/OTPVerificationScreen';
import { SignupScreenNew } from '@/features/auth/screens/SignupScreenNew';
import { SignupOtpScreen } from '@/features/auth/screens/SignupOtpScreen';
import { LegalDocumentsScreen } from '@/features/owner/screens/legal/LegalDocumentsScreen';
import { LegalWebViewScreen } from '@/features/owner/screens/legal/LegalWebViewScreen';

// ==================== TENANT SCREENS ====================
import { TenantLoginScreen } from '@/features/tenant/TenantLoginScreen';
import { TenantOTPVerificationScreen } from '@/features/tenant/TenantOTPVerificationScreen';
import { TenantDashboardScreen } from '@/features/tenant/TenantDashboardScreen';
import { TenantTicketsScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketsScreen';
import { TenantCreateTicketScreen } from '@/features/tenant/screens/tenant-tickets/TenantCreateTicketScreen';
import { TenantTicketDetailScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketDetailScreen';

// ==================== OWNER SCREENS ====================
import { RentPaymentsScreen } from '@/features/owner/screens/payments/RentPaymentsScreen';
import { AdvancePaymentsScreen } from '@/features/owner/screens/payments/AdvancePaymentsScreen';
import { RefundPaymentsScreen } from '@/features/owner/screens/payments/RefundPaymentsScreen';
import { PGLocationsScreen } from '@/features/owner/screens/pg-locations/PGLocationsScreen';
import { PGDetailsScreen } from '@/features/owner/screens/pg-locations/PGDetailsScreen';
import { OrganizationsScreen } from '@/features/owner/screens/organizations/OrganizationsScreen';
import { ExpenseScreen } from '@/features/owner/screens/expense/ExpenseScreen';
import { EmployeesScreen } from '@/features/owner/screens/employees/EmployeesScreen';
import { AddEmployeeScreen } from '@/features/owner/screens/employees/AddEmployeeScreen';
import EmployeeDetailsScreen from '@/features/owner/screens/employees/EmployeeDetailsScreen';
import EmployeePermissionOverridesScreen from '@/features/owner/screens/employees/EmployeePermissionOverridesScreen';
import { VisitorsScreen } from '@/features/owner/screens/visitors/VisitorsScreen';
import AddVisitorScreen from '@/features/owner/screens/visitors/AddVisitorScreen';
import VisitorDetailsScreen from '@/features/owner/screens/visitors/VisitorDetailsScreen';
import { TenantRentPaymentsScreen } from '@/features/owner/screens/tenants/TenantRentPaymentsScreen';
import { TenantRefundPaymentsScreen } from '@/features/owner/screens/tenants/TenantRefundPaymentsScreen';
import { TenantAdvancePaymentsScreen } from '@/features/owner/screens/tenants/TenantAdvancePaymentsScreen';
import { TenantDetailsScreen } from '@/features/owner/screens/tenants/TenantDetailsScreen';
import { AddTenantScreen } from '@/features/owner/screens/tenants/AddTenantScreen';
import { UpcomingVacanciesScreen } from '@/features/owner/screens/tenants/UpcomingVacanciesScreen';
import { RoomsScreen } from '@/features/owner/screens/rooms/RoomsScreen';
import { RoomDetailsScreen } from '@/features/owner/screens/rooms/RoomDetailsScreen';
import { RoomElectricityBillsScreen } from '@/features/owner/screens/rooms/electricity-bill/RoomElectricityBillsScreen';
import { QuickSetupScreen } from '@/features/owner/screens/quick-setup/QuickSetupScreen';
import { BedsScreen } from '@/features/owner/screens/beds/BedsScreen';
import { TicketsScreen } from '@/features/owner/screens/tickets/TicketsScreen';
import { CreateTicketScreen } from '@/features/owner/screens/tickets/CreateTicketScreen';
import { TicketDetailsScreen } from '@/features/owner/screens/tickets/TicketDetailsScreen';
import { PgTenantTicketsScreen } from '@/features/owner/screens/pg-tenant-tickets/PgTenantTicketsScreen';
import { PgTenantTicketDetailScreen } from '@/features/owner/screens/pg-tenant-tickets/PgTenantTicketDetailScreen';
import { UserProfileScreen } from '@/features/owner/screens/settings/UserProfileScreen';
import { FaqWebViewScreen } from '@/features/owner/screens/settings/FaqWebViewScreen';
import { SubscriptionPlansScreen } from '@/features/owner/screens/subscription/SubscriptionPlansScreen';
import { SubscriptionHistoryScreen } from '@/features/owner/screens/subscription/SubscriptionHistoryScreen';
import { SubscriptionConfirmScreen } from '@/features/owner/screens/subscription/SubscriptionConfirmScreen';
import { PaymentOptionsScreen } from '@/features/owner/screens/subscription/PaymentOptionsScreen';
import { PaymentWebViewScreen } from '@/features/owner/screens/subscription/PaymentWebViewScreen';
import { NetworkLoggerScreen } from '@/screens/network/NetworkLoggerScreen';

const Stack = createNativeStackNavigator();

// ==================== NAVIGATION THEME ====================
const navigationTheme = {
  dark: false,
  colors: {
    primary: Theme.colors.primary,
    background: Theme.colors.background.primary,
    card: Theme.colors.background.primary,
    text: Theme.colors.text.primary,
    border: Theme.colors.border,
    notification: Theme.colors.primary,
  },
};

// ==================== STACK OPTIONS ====================
const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Theme.colors.background.primary },
};

// ==================== MAIN APP NAVIGATOR ====================
export const AppNavigator = () => {
  const { isAuthenticated, lastUserRole: adminLastRole } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated: isTenantAuthenticated, lastUserRole: tenantLastRole } = useSelector((state: RootState) => state.tenantAuth);
  const isOnboardingComplete = useSelector((state: RootState) => (state as any).rbac?.isOnboardingComplete ?? null);
  const dispatch = useDispatch();

  // Determine which login screen to show based on last user role
  const lastUserRole = isAuthenticated
    ? 'admin'
    : isTenantAuthenticated
      ? 'tenant'
      : adminLastRole || tenantLastRole;

  const initialAuthRoute = lastUserRole === 'admin'
    ? 'Login'
    : lastUserRole === 'tenant'
      ? 'TenantLogin'
      : 'RoleSelection';

  usePermissionsPolling();
  useAppSettingsPolling();

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearPermissions());
    }
  }, [isAuthenticated, dispatch]);

  // Onboarding: user lands on Dashboard. DashboardScreen auto-starts the tour
  // (arrow on Quick Setup) when isOnboardingComplete is false.
  // After QuickSetup completes, it navigates back to Dashboard with the rooms tour.
  useEffect(() => {
    if (!isAuthenticated || isTenantAuthenticated) return;
    if (isOnboardingComplete === null) return;

    const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
    if (isOnboardingComplete === true && currentRoute === 'QuickSetup') {
      navigationRef.current?.navigate('MainTabs', { screen: 'Dashboard' });
    }
  }, [isAuthenticated, isTenantAuthenticated, isOnboardingComplete]);

  // Determine which screens to show based on auth state
  const isUnauthenticated = !isAuthenticated && !isTenantAuthenticated;

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <AuthRedirectHandler />
      <Stack.Navigator
        initialRouteName={isUnauthenticated ? initialAuthRoute : undefined}
        screenOptions={stackScreenOptions}
      >
        {isUnauthenticated ? (
          // ==================== AUTH SCREENS ====================
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="TenantLogin" component={TenantLoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreenNew} />
            <Stack.Screen name="SignupOtp" component={SignupOtpScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="LegalDocuments" component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>} />
            <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
            <Stack.Screen name="TenantOTPVerification" component={TenantOTPVerificationScreen} />
          </>
        ) : isTenantAuthenticated ? (
          // ==================== TENANT SCREENS ====================
          <>
            <Stack.Screen name="TenantDashboard" component={TenantDashboardScreen} />
            <Stack.Screen name="TenantTickets" component={TenantTicketsScreen} />
            <Stack.Screen name="TenantCreateTicket" component={TenantCreateTicketScreen} />
            <Stack.Screen name="TenantTicketDetail" component={TenantTicketDetailScreen as any} />
          </>
        ) : (
          // ==================== OWNER SCREENS ====================
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RentPayments" component={RentPaymentsScreen} />
            <Stack.Screen name="AdvancePayments" component={AdvancePaymentsScreen} />
            <Stack.Screen name="RefundPayments" component={RefundPaymentsScreen} />
            <Stack.Screen name="LegalDocuments" component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>} />
            <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
            <Stack.Screen name="PGLocations" component={PGLocationsScreen} />
            <Stack.Screen name="PGDetails" component={PGDetailsScreen} />
            <Stack.Screen name="Organizations" component={OrganizationsScreen} />
            <Stack.Screen name="Rooms" component={RoomsScreen} />
            <Stack.Screen name="QuickSetup" component={QuickSetupScreen} />
            <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
            <Stack.Screen name="RoomElectricityBills" component={RoomElectricityBillsScreen} />
            <Stack.Screen name="Beds" component={BedsScreen} />
            <Stack.Screen name="TenantDetails" component={TenantDetailsScreen} />
            <Stack.Screen name="AddTenant" component={AddTenantScreen} />
            <Stack.Screen name="UpcomingVacancies" component={UpcomingVacanciesScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Expenses" component={ExpenseScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
            <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
            <Stack.Screen name="EmployeePermissionOverrides" component={EmployeePermissionOverridesScreen} />
            <Stack.Screen name="Visitors" component={VisitorsScreen} />
            <Stack.Screen name="AddVisitor" component={AddVisitorScreen} />
            <Stack.Screen name="VisitorDetails" component={VisitorDetailsScreen as unknown as React.ComponentType<unknown>} />
            <Stack.Screen name="Tickets" component={TicketsScreen} />
            <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
            <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
            <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
            <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
            <Stack.Screen name="SubscriptionConfirm" component={SubscriptionConfirmScreen} />
            <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
            <Stack.Screen name="TenantRentPaymentsScreen" component={TenantRentPaymentsScreen} />
            <Stack.Screen name="TenantAdvancePaymentsScreen" component={TenantAdvancePaymentsScreen} />
            <Stack.Screen name="TenantRefundPaymentsScreen" component={TenantRefundPaymentsScreen} />
            <Stack.Screen name="NetworkLogger" component={NetworkLoggerScreen} />
            <Stack.Screen name="FaqWebView" component={FaqWebViewScreen} />
            <Stack.Screen name="PgTenantTickets" component={PgTenantTicketsScreen} />
            <Stack.Screen name="PgTenantTicketDetail" component={PgTenantTicketDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

