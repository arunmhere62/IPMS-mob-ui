import React from 'react';
import { AdvancePaymentScreen } from './AdvancePaymentScreen';

interface AdvancePaymentsScreenProps {
  navigation: any;
}

export const AdvancePaymentsScreen: React.FC<AdvancePaymentsScreenProps> = ({ navigation }) => {
  return <AdvancePaymentScreen navigation={navigation} />;
};
