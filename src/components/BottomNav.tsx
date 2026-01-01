import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../config/rbac.config';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
  navigation: any;
  currentRoute: string;
}

interface TabConfig {
  name: string;
  label: string;
  icon: string;
  permission: Permission;
}

// User tabs (Admin/Employee) - Super Admin will use separate web app
const userTabs: TabConfig[] = [
  { name: 'Dashboard', label: 'Home', icon: 'home', permission: Permission.VIEW_DASHBOARD },
  { name: 'Tenants', label: 'Tenants', icon: 'people', permission: Permission.VIEW_TENANTS },
  { name: 'Payments', label: 'Payments', icon: 'card', permission: Permission.VIEW_PAYMENTS },
  { name: 'Settings', label: 'Settings', icon: 'settings', permission: Permission.VIEW_SETTINGS },
];

export const BottomNav: React.FC<BottomNavProps> = React.memo(({ navigation, currentRoute }) => {
  const insets = useSafeAreaInsets();
  const accessibleTabs = userTabs;

  const handleTabPress = (tab: TabConfig, event?: any) => {
    navigation.navigate(tab.name);
  };

  return (
    <>
      <BlurView
        intensity={100}
        tint="light"
        style={[styles.container, { paddingBottom: Math.max(insets.bottom + -2, 10) }]}
      >
        {accessibleTabs.map((tab) => {
          const isActive = currentRoute === tab.name;
          return (
            <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={(event) => handleTabPress(tab, event)}
            activeOpacity={0.8}
          >
              <View style={styles.tabContainer}>
                <View style={styles.tabContent}>
                  <Ionicons 
                    name={tab.icon as any} 
                    size={20} 
                    color={isActive ? Theme.colors.primary : Theme.colors.text.tertiary}
                  />
                  <Text style={[
                    styles.label,
                    { color: isActive ? Theme.colors.primary : Theme.colors.text.tertiary }
                  ]}>
                    {tab.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
      </>
  );
});

BottomNav.displayName = 'BottomNav';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 0,
    minHeight: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    position: 'relative',
  },
  icon: {
    marginBottom: 1,
    textAlign: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    left: -12,
    right: -12,
    bottom: -4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    zIndex: -1,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
