import React from 'react';
import { RefundPaymentScreen } from './RefundPaymentScreen';

interface RefundPaymentsScreenProps {
  navigation: any;
}

export const RefundPaymentsScreen: React.FC<RefundPaymentsScreenProps> = ({ navigation }) => {
  return <RefundPaymentScreen navigation={navigation} />;
};
