import React from 'react';
import { RefundPaymentScreen } from './RefundPaymentScreen';

interface RefundPaymentsScreenProps {
  navigation: any;
  embedded?: boolean;
}

export const RefundPaymentsScreen: React.FC<RefundPaymentsScreenProps> = ({ navigation, embedded }) => {
  return <RefundPaymentScreen navigation={navigation} embedded={embedded} />;
};
