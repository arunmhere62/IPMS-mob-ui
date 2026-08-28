import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { AnimatedPressableCard } from '../../../../components/AnimatedPressableCard';
import { Theme } from '../../../../theme';
import { RentPaymentsScreen } from './RentPaymentsScreen';
import { AdvancePaymentsScreen } from './AdvancePaymentsScreen';
import { RefundPaymentsScreen } from './RefundPaymentsScreen';

interface PaymentsScreenProps {
  navigation: any;
}

const TABS = [
  { key: 'rent', label: 'Rent', icon: 'card-outline' as const },
  { key: 'advance', label: 'Advance', icon: 'arrow-up-circle-outline' as const },
  { key: 'refund', label: 'Refund', icon: 'return-down-back-outline' as const },
];

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('rent');

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title="Payments"
        subtitle="Rent, Advance & Refunds"
        syncMobileHeaderBg
      />

      {/* Compact tab bar */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <AnimatedPressableCard
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#fff' : Theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? '#fff' : Theme.colors.text.secondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </AnimatedPressableCard>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'rent' && (
          <RentPaymentsScreen navigation={navigation} embedded />
        )}
        {activeTab === 'advance' && (
          <AdvancePaymentsScreen navigation={navigation} embedded />
        )}
        {activeTab === 'refund' && (
          <RefundPaymentsScreen navigation={navigation} embedded />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Theme.colors.background.primary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tabActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
