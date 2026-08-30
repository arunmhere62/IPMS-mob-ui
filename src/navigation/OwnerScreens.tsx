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

const Stack = createNativeStackNavigator();

export const OwnerScreens: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="RentPayments" component={RentPaymentsScreen} />
    <Stack.Screen name="AdvancePayments" component={AdvancePaymentsScreen} />
    <Stack.Screen name="RefundPayments" component={RefundPaymentsScreen} />
    <Stack.Screen name="Payments" component={PaymentsScreen} />
    <Stack.Screen
      name="LegalDocuments"
      component={LegalDocumentsScreen as unknown as React.ComponentType<unknown>}
    />
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
    <Stack.Screen
      name="VisitorDetails"
      component={VisitorDetailsScreen as unknown as React.ComponentType<unknown>}
    />
    <Stack.Screen name="Tickets" component={TicketsScreen} />
    <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
    <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
    <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
    <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
    <Stack.Screen name="SubscriptionConfirm" component={SubscriptionConfirmScreen} />
    <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    <Stack.Screen name="InvoiceViewer" component={InvoiceViewerScreen} />
    <Stack.Screen name="TenantRentPaymentsScreen" component={TenantRentPaymentsScreen} />
    <Stack.Screen name="TenantAdvancePaymentsScreen" component={TenantAdvancePaymentsScreen} />
    <Stack.Screen name="TenantRefundPaymentsScreen" component={TenantRefundPaymentsScreen} />
    <Stack.Screen name="NetworkLogger" component={NetworkLoggerScreen} />
    <Stack.Screen name="FaqWebView" component={FaqWebViewScreen} />
    <Stack.Screen name="PgTenantTickets" component={PgTenantTicketsScreen} />
    <Stack.Screen name="PgTenantTicketDetail" component={PgTenantTicketDetailScreen} />
    <Stack.Screen name="PaymentConfig" component={PaymentConfigScreen} />
    <Stack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
  </Stack.Navigator>
);
