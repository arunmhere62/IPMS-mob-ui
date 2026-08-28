import React from 'react';
import { AdvancePaymentScreen } from './AdvancePaymentScreen';

interface AdvancePaymentsScreenProps {
  navigation: any;
  embedded?: boolean;
}

export const AdvancePaymentsScreen: React.FC<AdvancePaymentsScreenProps> = ({ navigation, embedded }) => {
  return <AdvancePaymentScreen navigation={navigation} embedded={embedded} />;
};
