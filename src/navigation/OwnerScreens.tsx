import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabs } from './components';
import { stackScreenOptions } from './navigationTheme';
import { RentPaymentsScreen } from '@/features/owner/screens/payments/RentPaymentsScreen';
import { AdvancePaymentsScreen } from '@/features/owner/screens/payments/AdvancePaymentsScreen';
import { RefundPaymentsScreen } from '@/features/owner/screens/payments/RefundPaymentsScreen';
import { PaymentsScreen } from '@/features/owner/screens/payments/PaymentsScreen';
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
import { PaymentWebViewScreen } from '@/features/owner/screens/subscription/PaymentWebViewScreen';
import { InvoiceViewerScreen } from '@/features/owner/screens/subscription/InvoiceViewerScreen';
import { PaymentConfigScreen } from '@/features/owner/screens/payment-config/PaymentConfigScreen';
import { PaymentVerificationScreen } from '@/features/owner/screens/payment-verification/PaymentVerificationScreen';
import { NetworkLoggerScreen } from '@/screens/network/NetworkLoggerScreen';
import { LegalDocumentsScreen } from '@/features/owner/screens/legal/LegalDocumentsScreen';
import { LegalWebViewScreen } from '@/features/owner/screens/legal/LegalWebViewScreen';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Permission } from '@/config/rbac.config';

const Stack = createNativeStackNavigator();

const withPermission = (Screen: React.ComponentType<any>, permission: Permission) => {
  const ProtectedScreen: React.FC<any> = (props) => (
    <ProtectedRoute requiredPermission={permission}>
      <Screen {...props} />
    </ProtectedRoute>
  );
  ProtectedScreen.displayName = `Protected(${Screen.displayName || Screen.name || 'Screen'})`;
  return ProtectedScreen;
};

const withPermissions = (
  Screen: React.ComponentType<any>,
  permissions: Permission[],
  requireAll: boolean,
) => {
  const ProtectedScreen: React.FC<any> = (props) => (
    <ProtectedRoute requiredPermissions={permissions} requireAll={requireAll}>
      <Screen {...props} />
    </ProtectedRoute>
  );
  ProtectedScreen.displayName = `Protected(${Screen.displayName || Screen.name || 'Screen'})`;
  return ProtectedScreen;
};

const withSuperAdmin = (Screen: React.ComponentType<any>) => {
  const ProtectedScreen: React.FC<any> = (props) => (
    <ProtectedRoute requireSuperAdmin>
      <Screen {...props} />
    </ProtectedRoute>
  );
  ProtectedScreen.displayName = `SuperAdmin(${Screen.displayName || Screen.name || 'Screen'})`;
  return ProtectedScreen;
};

const QuickSetupRoute = withPermissions(
  QuickSetupScreen,
  [Permission.VIEW_ROOM, Permission.CREATE_ROOM, Permission.CREATE_BED],
  true,
);
const OrganizationsRoute = withSuperAdmin(OrganizationsScreen);
const EmployeePermissionOverridesRoute = withSuperAdmin(EmployeePermissionOverridesScreen);
const PGLocationsRoute = withPermission(PGLocationsScreen, Permission.VIEW_PG_LOCATIONS);
const PGDetailsRoute = withPermission(PGDetailsScreen, Permission.VIEW_PG_LOCATIONS);
const RoomsRoute = withPermission(RoomsScreen, Permission.VIEW_ROOM);
const RoomDetailsRoute = withPermission(RoomDetailsScreen, Permission.VIEW_ROOM);
const BedsRoute = withPermission(BedsScreen, Permission.VIEW_BED);
const TenantDetailsRoute = withPermission(TenantDetailsScreen, Permission.VIEW_TENANTS);
const VacanciesRoute = withPermission(UpcomingVacanciesScreen, Permission.VIEW_TENANTS);
const PaymentsRoute = withPermission(PaymentsScreen, Permission.VIEW_PAYMENT);
const RentPaymentsRoute = withPermission(RentPaymentsScreen, Permission.VIEW_PAYMENT);
const AdvancePaymentsRoute = withPermission(AdvancePaymentsScreen, Permission.VIEW_PAYMENT);
const RefundPaymentsRoute = withPermission(RefundPaymentsScreen, Permission.VIEW_PAYMENT);
const TenantRentPaymentsRoute = withPermission(TenantRentPaymentsScreen, Permission.VIEW_PAYMENT);
const TenantAdvancePaymentsRoute = withPermission(TenantAdvancePaymentsScreen, Permission.VIEW_PAYMENT);
const TenantRefundPaymentsRoute = withPermission(TenantRefundPaymentsScreen, Permission.VIEW_PAYMENT);
const ExpensesRoute = withPermission(ExpenseScreen, Permission.VIEW_EXPENSE);
const EmployeesRoute = withPermission(EmployeesScreen, Permission.VIEW_EMPLOYEE);
const EmployeeDetailsRoute = withPermission(EmployeeDetailsScreen, Permission.VIEW_EMPLOYEE);
const VisitorsRoute = withPermission(VisitorsScreen, Permission.VIEW_VISITOR);
const VisitorDetailsRoute = withPermission(VisitorDetailsScreen, Permission.VIEW_VISITOR);
const TicketsRoute = withPermission(TicketsScreen, Permission.VIEW_TICKET);
const TicketDetailsRoute = withPermission(TicketDetailsScreen, Permission.VIEW_TICKET);
const PgTenantTicketsRoute = withPermission(PgTenantTicketsScreen, Permission.VIEW_TICKET);
const PgTenantTicketDetailRoute = withPermission(PgTenantTicketDetailScreen, Permission.VIEW_TICKET);
const ElectricityBillsRoute = withPermission(RoomElectricityBillsScreen, Permission.VIEW_ELECTRICITY_BILL);
const PaymentConfigRoute = withPermission(PaymentConfigScreen, Permission.VIEW_PAYMENT_CONFIG);
const PaymentVerificationRoute = withPermission(PaymentVerificationScreen, Permission.VIEW_PAYMENT_VERIFICATION);
const CreateTicketRoute = withPermission(CreateTicketScreen, Permission.CREATE_TICKET);
const AddVisitorRoute: React.FC<any> = (props) => {
  const permission = props.route?.params?.visitorId
    ? Permission.EDIT_VISITOR
    : Permission.CREATE_VISITOR;
  return (
    <ProtectedRoute requiredPermission={permission}>
      <AddVisitorScreen {...props} />
    </ProtectedRoute>
  );
};

const AddTenantRoute: React.FC<any> = (props) => {
  const permission = props.route?.params?.tenantId
    ? Permission.EDIT_TENANT
    : Permission.CREATE_TENANT;
  return (
    <ProtectedRoute requiredPermission={permission}>
      <AddTenantScreen {...props} />
    </ProtectedRoute>
  );
};

const AddEmployeeRoute: React.FC<any> = (props) => {
  const permission = props.route?.params?.employeeId
    ? Permission.EDIT_EMPLOYEE
    : Permission.CREATE_EMPLOYEE;
  return (
    <ProtectedRoute requiredPermission={permission}>
      <AddEmployeeScreen {...props} />
    </ProtectedRoute>
  );
};

export const OwnerScreens: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="RentPayments" component={RentPaymentsRoute} />
    <Stack.Screen name="AdvancePayments" component={AdvancePaymentsRoute} />
    <Stack.Screen name="RefundPayments" component={RefundPaymentsRoute} />
    <Stack.Screen name="Payments" component={PaymentsRoute} />
    <Stack.Screen
      name="LegalDocuments"
      component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>}
    />
    <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} />
    <Stack.Screen name="PGLocations" component={PGLocationsRoute} />
    <Stack.Screen name="PGDetails" component={PGDetailsRoute} />
    <Stack.Screen name="Organizations" component={OrganizationsRoute} />
    <Stack.Screen name="Rooms" component={RoomsRoute} />
    <Stack.Screen name="QuickSetup" component={QuickSetupRoute} />
    <Stack.Screen name="RoomDetails" component={RoomDetailsRoute} />
    <Stack.Screen name="RoomElectricityBills" component={ElectricityBillsRoute} />
    <Stack.Screen name="Beds" component={BedsRoute} />
    <Stack.Screen name="TenantDetails" component={TenantDetailsRoute} />
    <Stack.Screen name="AddTenant" component={AddTenantRoute} />
    <Stack.Screen name="UpcomingVacancies" component={VacanciesRoute} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="Expenses" component={ExpensesRoute} />
    <Stack.Screen name="Employees" component={EmployeesRoute} />
    <Stack.Screen name="AddEmployee" component={AddEmployeeRoute} />
    <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsRoute} />
    <Stack.Screen name="EmployeePermissionOverrides" component={EmployeePermissionOverridesRoute} />
    <Stack.Screen name="Visitors" component={VisitorsRoute} />
    <Stack.Screen name="AddVisitor" component={AddVisitorRoute} />
    <Stack.Screen name="VisitorDetails" component={VisitorDetailsRoute} />
    <Stack.Screen name="Tickets" component={TicketsRoute} />
    <Stack.Screen name="CreateTicket" component={CreateTicketRoute} />
    <Stack.Screen name="TicketDetails" component={TicketDetailsRoute} />
    <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
    <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
    <Stack.Screen name="SubscriptionConfirm" component={SubscriptionConfirmScreen} />
    <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <Stack.Screen name="InvoiceViewer" component={InvoiceViewerScreen} />
    <Stack.Screen name="TenantRentPaymentsScreen" component={TenantRentPaymentsRoute} />
    <Stack.Screen name="TenantAdvancePaymentsScreen" component={TenantAdvancePaymentsRoute} />
    <Stack.Screen name="TenantRefundPaymentsScreen" component={TenantRefundPaymentsRoute} />
    <Stack.Screen name="NetworkLogger" component={NetworkLoggerScreen} />
    <Stack.Screen name="FaqWebView" component={FaqWebViewScreen} />
    <Stack.Screen name="PgTenantTickets" component={PgTenantTicketsRoute} />
    <Stack.Screen name="PgTenantTicketDetail" component={PgTenantTicketDetailRoute} />
    <Stack.Screen name="PaymentConfig" component={PaymentConfigRoute} />
    <Stack.Screen name="PaymentVerification" component={PaymentVerificationRoute} />
  </Stack.Navigator>
);
