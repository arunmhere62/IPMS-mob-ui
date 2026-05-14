import { BottomNavVisibilityProvider } from '../components/BottomNavVisibility';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { Permission } from '../config/rbac.config';
import { navigationRef } from './navigationRef';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '../features/owner/store/slices/rbacSlice';
import { usePermissionsPolling } from '../hooks/usePermissionsPolling';

import { Theme } from '../theme';

import {
  NavigationContainer,
  type NavigationState,
  type ParamListBase,
  useNavigation,
  type NavigationProp,
  useNavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Auth Screens
import { RoleSelectionScreen } from '../features/auth/screens/RoleSelectionScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { OTPVerificationScreen } from '../features/auth/screens/OTPVerificationScreen';
import { SignupScreenNew } from '../features/auth/screens/SignupScreenNew';
import { SignupOtpScreen } from '../features/auth/screens/SignupOtpScreen';
import { LegalDocumentsScreen } from '../features/owner/screens/legal/LegalDocumentsScreen';
import { LegalWebViewScreen } from '../features/owner/screens/legal/LegalWebViewScreen';

// Tenant Portal Screens

// Main Screens
import { DashboardScreen } from '../features/owner/screens/dashboard/DashboardScreen';
import { TenantsScreen } from '../features/owner/screens/tenants/TenantsScreen';
import { TenantDetailsScreen } from '../features/owner/screens/tenants/TenantDetailsScreen';
import { AddTenantScreen } from '../features/owner/screens/tenants/AddTenantScreen';
import { RoomsScreen } from '../features/owner/screens/rooms/RoomsScreen';
import { RoomDetailsScreen } from '../features/owner/screens/rooms/RoomDetailsScreen';
import { BedsScreen } from '../features/owner/screens/beds/BedsScreen';
import { RentPaymentsScreen } from '../features/owner/screens/payments/RentPaymentsScreen';
import { AdvancePaymentsScreen } from '../features/owner/screens/payments/AdvancePaymentsScreen';
import { RefundPaymentsScreen } from '../features/owner/screens/payments/RefundPaymentsScreen';
import { PGLocationsScreen } from '../features/owner/screens/pg-locations/PGLocationsScreen';
import { PGDetailsScreen } from '../features/owner/screens/pg-locations/PGDetailsScreen';
import { OrganizationsScreen } from '../features/owner/screens/organizations/OrganizationsScreen';
import { BottomNav } from '../components/BottomNav';
import { ExpenseScreen } from '@/features/owner/screens/expense/ExpenseScreen';
import { EmployeesScreen } from '@/features/owner/screens/employees/EmployeesScreen';
import { AddEmployeeScreen } from '@/features/owner/screens/employees/AddEmployeeScreen';
import EmployeeDetailsScreen from '@/features/owner/screens/employees/EmployeeDetailsScreen';
import EmployeePermissionOverridesScreen from '@/features/owner/screens/employees/EmployeePermissionOverridesScreen';
import { VisitorsScreen } from '@/features/owner/screens/visitors/VisitorsScreen';
import AddVisitorScreen from '@/features/owner/screens/visitors/AddVisitorScreen';
import VisitorDetailsScreen from '@/features/owner/screens/visitors/VisitorDetailsScreen';
import { PaymentsScreen } from '@/features/owner/screens/payments/PaymentsScreen';
import { TenantRentPaymentsScreen } from '@/features/owner/screens/tenants/TenantRentPaymentsScreen';
import { TenantRefundPaymentsScreen } from '@/features/owner/screens/tenants/TenantRefundPaymentsScreen';
import { TenantAdvancePaymentsScreen } from '@/features/owner/screens/tenants/TenantAdvancePaymentsScreen';
import { NetworkLoggerScreen } from '@/screens/network/NetworkLoggerScreen';
import { PgTenantTicketsScreen } from '@/features/owner/screens/pg-tenant-tickets/PgTenantTicketsScreen';
import { PgTenantTicketDetailScreen } from '@/features/owner/screens/pg-tenant-tickets/PgTenantTicketDetailScreen';
import { TenantOTPVerificationScreen } from '@/features/tenant/TenantOTPVerificationScreen';
import { TenantDashboardScreen } from '@/features/tenant/TenantDashboardScreen';
import { TenantTicketsScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketsScreen';
import { TenantCreateTicketScreen } from '@/features/tenant/screens/tenant-tickets/TenantCreateTicketScreen';
import { TenantTicketDetailScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketDetailScreen';
import { TenantLoginScreen } from '@/features/tenant/TenantLoginScreen';
import { SettingsScreen } from '@/features/owner/screens/settings/SettingsScreen';
import { RootState } from '@/features/owner/store';
import { UserProfileScreen } from '@/features/owner/screens/settings/UserProfileScreen';
import { TicketsScreen } from '@/features/owner/screens/tickets/TicketsScreen';
import { CreateTicketScreen } from '@/features/owner/screens/tickets/CreateTicketScreen';
import { TicketDetailsScreen } from '@/features/owner/screens/tickets/TicketDetailsScreen';
import { SubscriptionPlansScreen } from '@/features/owner/screens/subscription/SubscriptionPlansScreen';
import { SubscriptionHistoryScreen } from '@/features/owner/screens/subscription/SubscriptionHistoryScreen';
import { SubscriptionConfirmScreen } from '@/features/owner/screens/subscription/SubscriptionConfirmScreen';
import { PaymentOptionsScreen } from '@/features/owner/screens/subscription/PaymentOptionsScreen';
import { PaymentWebViewScreen } from '@/features/owner/screens/subscription/PaymentWebViewScreen';
import { FaqWebViewScreen } from '@/features/owner/screens/settings/FaqWebViewScreen';

const Stack = createNativeStackNavigator<ParamListBase>();
const Tab = createBottomTabNavigator<ParamListBase>();

// Main tabs component that keeps screens mounted
const MainTabs = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const currentRoute = useNavigationState((state) => {
    const s = state as unknown as NavigationState;
    if (!s || !s.routes || s.index === undefined) {
      console.log('BottomNav currentRoute = Dashboard (fallback)');
      return 'Dashboard';
    }
    
    const route = s.routes[s.index] as unknown as {
      name?: string;
      state?: {
        index: number;
        routes: Array<{ name: string }>;
      };
    };
    
    if (route?.state?.routes?.[route.state.index]) {
      const tabRoute = route.state.routes[route.state.index].name;
      console.log('BottomNav currentRoute =', tabRoute, '(from nested state)');
      return tabRoute;
    }
    
    // If we get 'MainTabs' (stack route), force Dashboard as default
    if (route?.name === 'MainTabs') {
      console.log('BottomNav currentRoute = Dashboard (MainTabs fallback)');
      return 'Dashboard';
    }
    
    console.log('BottomNav currentRoute =', route?.name || 'Dashboard', '(direct route)');
    return route?.name || 'Dashboard';
  });

  // Define screen configurations with permissions
  // Super Admin will use separate web app
  const screens = [
    {
      name: 'Dashboard',
      component: DashboardScreen,
      permission: Permission.VIEW_DASHBOARD,
    },
    {
      name: 'Tenants',
      component: TenantsScreen,
      permission: Permission.VIEW_TENANTS,
    },
    {
      name: 'Payments',
      component: PaymentsScreen,
      permission: Permission.VIEW_PAYMENT,
    },
    {
      name: 'Settings',
      component: SettingsScreen,
    },
  ];

  return (
    <BottomNavVisibilityProvider>
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1, }}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              lazy: true,
            }}
            sceneContainerStyle={{ backgroundColor: Theme.colors.background.primary }}
            initialRouteName="Dashboard"
          >
            {screens.map((screen) => (
              <Tab.Screen
                key={screen.name}
                name={screen.name}
                component={screen.component}
              />
            ))}
          </Tab.Navigator>
        </View>
        <BottomNav navigation={navigation} currentRoute={currentRoute} />
      </View>
    </BottomNavVisibilityProvider>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, lastUserRole: adminLastRole } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated: isTenantAuthenticated, lastUserRole: tenantLastRole } = useSelector((state: RootState) => state.tenantAuth);
  const dispatch = useDispatch();

  // Determine which login screen to show based on last user role
  const lastUserRole = isAuthenticated ? 'admin' : isTenantAuthenticated ? 'tenant' : adminLastRole || tenantLastRole;
  const initialAuthRoute = lastUserRole === 'admin' ? 'Login' : lastUserRole === 'tenant' ? 'TenantLogin' : 'RoleSelection';

  usePermissionsPolling();

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearPermissions());
    }
  }, [isAuthenticated, dispatch]);

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

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName={!isAuthenticated && !isTenantAuthenticated ? initialAuthRoute : undefined}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background.primary },
        }}
      >
        {!isAuthenticated && !isTenantAuthenticated ? (
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="TenantLogin" component={TenantLoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreenNew} />
            <Stack.Screen name="SignupOtp" component={SignupOtpScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="LegalDocuments" component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>} />
            <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
            {/* Tenant Portal Auth Screens */}
            <Stack.Screen name="TenantOTPVerification" component={TenantOTPVerificationScreen} />
          </>
        ) : isTenantAuthenticated ? (
          <>
            {/* Tenant Portal Screens */}
            <Stack.Screen name="TenantDashboard" component={TenantDashboardScreen} />
            <Stack.Screen name="TenantTickets" component={TenantTicketsScreen} />
            <Stack.Screen name="TenantCreateTicket" component={TenantCreateTicketScreen} />
            <Stack.Screen name="TenantTicketDetail" component={TenantTicketDetailScreen as any} />
          </>
        ) : (
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
            <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
            <Stack.Screen name="Beds" component={BedsScreen} />
            <Stack.Screen name="TenantDetails" component={TenantDetailsScreen} />
            <Stack.Screen name="AddTenant" component={AddTenantScreen} />
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
            <Stack.Screen name="PaymentOptions" component={PaymentOptionsScreen} />
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
