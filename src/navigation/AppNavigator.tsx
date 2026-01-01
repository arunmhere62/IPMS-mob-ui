import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Permission } from '../config/rbac.config';
import { navigationRef } from './navigationRef';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '../store/slices/rbacSlice';
import { usePermissionsPolling } from '../hooks/usePermissionsPolling';

// Use require to avoid TypeScript errors
const { NavigationContainer, useNavigation, useNavigationState } = require('@react-navigation/native');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { SignupScreenNew } from '../screens/auth/SignupScreenNew';
import { LegalDocumentsScreen } from '../screens/legal/LegalDocumentsScreen';
import { LegalWebViewScreen } from '../screens/legal/LegalWebViewScreen';

// Main Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TenantsScreen } from '../screens/tenants/TenantsScreen';
import { TenantDetailsScreen } from '../screens/tenants/TenantDetailsScreen';
import { AddTenantScreen } from '../screens/tenants/AddTenantScreen';
import { RoomsScreen } from '../screens/rooms/RoomsScreen';
import { RoomDetailsScreen } from '../screens/rooms/RoomDetailsScreen';
import { BedsScreen } from '../screens/beds/BedsScreen';
import { RentPaymentsScreen } from '../screens/payments/RentPaymentsScreen';
import { AdvancePaymentsScreen } from '../screens/payments/AdvancePaymentsScreen';
import { RefundPaymentsScreen } from '../screens/payments/RefundPaymentsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { UserProfileScreen } from '../screens/settings/UserProfileScreen';
import { PGLocationsScreen } from '../screens/pg-locations/PGLocationsScreen';
import { PGDetailsScreen } from '../screens/pg-locations/PGDetailsScreen';
import { OrganizationsScreen } from '../screens/organizations/OrganizationsScreen';
import { BottomNav } from '../components/BottomNav';
import { ExpenseScreen } from '@/screens/expense/ExpenseScreen';
import { EmployeeSalaryScreen } from '@/screens/employee-salary/EmployeeSalaryScreen';
import { EmployeesScreen } from '@/screens/employees/EmployeesScreen';
import { AddEmployeeScreen } from '@/screens/employees/AddEmployeeScreen';
import EmployeeDetailsScreen from '@/screens/employees/EmployeeDetailsScreen';
import EmployeePermissionOverridesScreen from '@/screens/employees/EmployeePermissionOverridesScreen';
import { VisitorsScreen } from '@/screens/visitors/VisitorsScreen';
import AddVisitorScreen from '@/screens/visitors/AddVisitorScreen';
import VisitorDetailsScreen from '@/screens/visitors/VisitorDetailsScreen';
import { TicketsScreen } from '@/screens/tickets/TicketsScreen';
import { CreateTicketScreen } from '@/screens/tickets/CreateTicketScreen';
import { TicketDetailsScreen } from '@/screens/tickets/TicketDetailsScreen';
import { SubscriptionPlansScreen } from '@/screens/subscription/SubscriptionPlansScreen';
import { SubscriptionHistoryScreen } from '@/screens/subscription/SubscriptionHistoryScreen';
import { PaymentOptionsScreen } from '@/screens/subscription/PaymentOptionsScreen';
import { PaymentWebViewScreen } from '@/screens/subscription/PaymentWebViewScreen';
import { PaymentsScreen } from '@/screens/payments/PaymentsScreen';
import { TenantRentPaymentsScreen } from '@/screens/tenants/TenantRentPaymentsScreen';
import { TenantRefundPaymentsScreen } from '@/screens/tenants/TenantRefundPaymentsScreen';
import { TenantAdvancePaymentsScreen } from '@/screens/tenants/TenantAdvancePaymentsScreen';
import { NetworkLoggerScreen } from '@/screens/network/NetworkLoggerScreen';
import { FaqWebViewScreen } from '@/screens/settings/FaqWebViewScreen';
import { PayrollRunsScreen } from '@/screens/payroll/PayrollRunsScreen';
import { PayrollRunDetailsScreen } from '@/screens/payroll/PayrollRunDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs component that keeps screens mounted
const MainTabs = () => {
  const navigation = useNavigation();
  const currentRoute = useNavigationState((state: any) => {
    if (!state || !state.routes || state.index === undefined) {
      console.log('BottomNav currentRoute = Dashboard (fallback)');
      return 'Dashboard';
    }
    
    const route = state.routes[state.index];
    
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
      permission: Permission.VIEW_PAYMENTS,
    },
    {
      name: 'Settings',
      component: SettingsScreen,
      permission: Permission.VIEW_SETTINGS,
    },
  ];

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={{ flex: 1, }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
            lazy: true,
            animationEnabled: false,
          }}
          sceneContainerStyle={{ backgroundColor: 'transparent' }}
          initialRouteName="Dashboard"
        >
          {screens.map((screen) => (
            <Tab.Screen
              key={screen.name}
              name={screen.name}
              component={screen.component}
              options={{ animationEnabled: false }}
            />
          ))}
        </Tab.Navigator>
      </View>
      <BottomNav navigation={navigation} currentRoute={currentRoute} />
    </View>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  usePermissionsPolling();

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearPermissions());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreenNew} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="LegalDocuments" component={LegalDocumentsScreen} />
            <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RentPayments" component={RentPaymentsScreen} />
            <Stack.Screen name="AdvancePayments" component={AdvancePaymentsScreen} />
            <Stack.Screen name="RefundPayments" component={RefundPaymentsScreen} />
            <Stack.Screen name="LegalDocuments" component={LegalDocumentsScreen} />
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
            <Stack.Screen name="EmployeeSalary" component={EmployeeSalaryScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
            <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
            <Stack.Screen name="EmployeePermissionOverrides" component={EmployeePermissionOverridesScreen} />
            <Stack.Screen name="Visitors" component={VisitorsScreen} />
            <Stack.Screen name="AddVisitor" component={AddVisitorScreen} />
            <Stack.Screen name="VisitorDetails" component={VisitorDetailsScreen} />
            <Stack.Screen name="Tickets" component={TicketsScreen} />
            <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
            <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
            <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
            <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
            <Stack.Screen name="PaymentOptions" component={PaymentOptionsScreen} />
            <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
            <Stack.Screen name="TenantRentPaymentsScreen" component={TenantRentPaymentsScreen} />
            <Stack.Screen name="TenantAdvancePaymentsScreen" component={TenantAdvancePaymentsScreen} />
            <Stack.Screen name="TenantRefundPaymentsScreen" component={TenantRefundPaymentsScreen} />
            <Stack.Screen name="PayrollRuns" component={PayrollRunsScreen} />
            <Stack.Screen name="PayrollRunDetails" component={PayrollRunDetailsScreen} />
            <Stack.Screen name="NetworkLogger" component={NetworkLoggerScreen} />
            <Stack.Screen name="FaqWebView" component={FaqWebViewScreen} />
          </>

        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
