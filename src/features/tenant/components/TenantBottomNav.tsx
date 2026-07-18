import React from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

interface TenantBottomNavProps {
  navigation: any;
  currentRoute: string;
}

interface TabConfig {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const tenantTabs: TabConfig[] = [
  { name: 'TenantDashboard', label: 'Home', icon: 'home' },
  { name: 'TenantPayments', label: 'Payments', icon: 'card' },
  { name: 'TenantProfile', label: 'Profile', icon: 'person' },
];

export const TenantBottomNav: React.FC<TenantBottomNavProps> = ({
  navigation,
  currentRoute }) => {
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => currentRoute === route;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tenantTabs.map((tab) => (
        <AnimatedPressableCard
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate(tab.name)}
        >
          <View
            style={[
              styles.iconContainer,
              isActive(tab.name) && styles.activeIconContainer,
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={
                isActive(tab.name)
                  ? Theme.colors.primary
                  : Theme.colors.text.secondary
              }
            />
          </View>
          <Text
            style={[
              styles.label,
              isActive(tab.name) && styles.activeLabel,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {tab.label}
          </Text>
        </AnimatedPressableCard>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4 },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 2 },
  activeIconContainer: {
    backgroundColor: '#EFF6FF' },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: Theme.colors.text.secondary,
    marginTop: 2 },
  activeLabel: {
    color: Theme.colors.primary,
    fontWeight: '600' } });
