import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TenantDashboardScreen } from '@/features/tenant/TenantDashboardScreen';
import { TenantTicketsScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketsScreen';
import { TenantCreateTicketScreen } from '@/features/tenant/screens/tenant-tickets/TenantCreateTicketScreen';
import { TenantTicketDetailScreen } from '@/features/tenant/screens/tenant-tickets/TenantTicketDetailScreen';
import { TenantSubmitPaymentProofScreen } from '@/features/tenant/screens/payment/TenantSubmitPaymentProofScreen';

import { stackScreenOptions } from './navigationTheme';

const Stack = createNativeStackNavigator();

export type TenantStackParamList = {
  TenantDashboard: undefined;
  TenantTickets: undefined;
  TenantCreateTicket: undefined;
  TenantTicketDetail: { ticketId: number } | undefined;
  TenantSubmitPaymentProof: {
    rent_payment_id: number;
    rent_amount: number;
    rent_status: string;
    cycle_id: number;
    cycle_start: string;
    cycle_end: string;
  } | undefined;
};

export const TenantScreens: React.FC = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="TenantDashboard" component={TenantDashboardScreen} />
    <Stack.Screen name="TenantTickets" component={TenantTicketsScreen} />
    <Stack.Screen name="TenantCreateTicket" component={TenantCreateTicketScreen} />
    <Stack.Screen name="TenantTicketDetail" component={TenantTicketDetailScreen as any} />
    <Stack.Screen name="TenantSubmitPaymentProof" component={TenantSubmitPaymentProofScreen} />
  </Stack.Navigator>
);
