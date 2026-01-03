import React from 'react';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Theme } from '../../theme';
import { CONTENT_COLOR } from '@/constant';

interface EmployeeSalaryScreenProps {
  navigation: unknown;
}

export const EmployeeSalaryScreen: React.FC<EmployeeSalaryScreenProps> = ({ navigation }) => {
  const nav = navigation as { goBack: () => void };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Payroll"
        showBackButton
        onBackPress={() => nav.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, padding: 16, paddingTop: 12 }}>
        <Text style={{ color: Theme.colors.text.secondary }}>Payroll feature has been removed.</Text>
      </View>
    </ScreenLayout>
  );
};
