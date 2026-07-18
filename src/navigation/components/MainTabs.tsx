import React, { useCallback } from 'react';
import { View } from 'react-native';
import {
  type ParamListBase,
  type NavigationState,
  useNavigation,
  type NavigationProp,
  useNavigationState,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { BottomNavVisibilityProvider } from '@/components/BottomNavVisibility';
import { BottomNav } from '@/components/BottomNav';
import { Theme } from '@/theme';
import { Permission } from '@/config/rbac.config';

// Tab Screens
import { DashboardScreen } from '@/features/owner/screens/dashboard/DashboardScreen';
import { RoomsScreen } from '@/features/owner/screens/rooms/RoomsScreen';
import { TenantsScreen } from '@/features/owner/screens/tenants/TenantsScreen';
import { SettingsScreen } from '@/features/owner/screens/settings/SettingsScreen';
import { UpcomingVacanciesScreen } from '@/features/owner/screens/tenants/UpcomingVacanciesScreen';

const Tab = createBottomTabNavigator<ParamListBase>();

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  permission?: Permission;
}

// Define screen configurations with permissions
// Super Admin will use separate web app
const SCREENS: ScreenConfig[] = [
  {
    name: 'Dashboard',
    component: DashboardScreen,
    permission: Permission.VIEW_DASHBOARD,
  },
  {
    name: 'Rooms',
    component: RoomsScreen,
    permission: Permission.VIEW_ROOM,
  },
  {
    name: 'Tenants',
    component: TenantsScreen,
    permission: Permission.VIEW_TENANTS,
  },
  {
    name: 'UpcomingVacancies',
    component: UpcomingVacanciesScreen,
  },
  {
    name: 'Settings',
    component: SettingsScreen,
  },
];

/**
 * MainTabs - Bottom tab navigator for Owner/Admin users
 *
 * Features:
 * - Custom bottom navigation (BottomNav component)
 * - Lazy loading of tab screens
 * - Permission-based screen access
 * - Screens stay mounted for better UX
 */
export const MainTabs: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const currentRoute = useNavigationState((state) => {
    const s = state as unknown as NavigationState;
    if (!s || !s.routes || s.index === undefined) {
      console.log('BottomNav currentRoute = Dashboard (fallback)');
      return 'Dashboard';
    }

    const route = s.routes[s.index] as unknown as {
      name?: string;
      state?: {
        index: number;
        routes: Array<{ name: string }>;
      };
    };

    if (route?.state?.routes?.[route.state.index]) {
      const tabRoute = route.state.routes[route.state.index].name;
      console.log('BottomNav currentRoute =', tabRoute, '(from nested state)');
      return tabRoute;
    }

    // If we get 'MainTabs' (stack route), force Dashboard as default
    if (route?.name === 'MainTabs') {
      console.log('BottomNav currentRoute = Dashboard (MainTabs fallback)');
      return 'Dashboard';
    }

    console.log('BottomNav currentRoute =', route?.name || 'Dashboard', '(direct route)');
    return route?.name || 'Dashboard';
  });

  // Tab screen names that should navigate within the tab navigator
  const tabScreenNames = SCREENS.map(s => s.name);

  const handleTabPress = useCallback((tabName: string) => {
    if (tabScreenNames.includes(tabName)) {
      // Navigate within the tab navigator (keeps bottom nav visible)
      navigation.navigate('MainTabs', { screen: tabName });
    } else {
      // For non-tab screens, push onto the stack
      navigation.navigate(tabName as never);
    }
  }, [navigation, tabScreenNames]);

  return (
    <BottomNavVisibilityProvider>
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              lazy: true,
            }}
            sceneContainerStyle={{ backgroundColor: Theme.colors.background.primary }}
            initialRouteName="Dashboard"
          >
            {SCREENS.map((screen) => (
              <Tab.Screen
                key={screen.name}
                name={screen.name}
                component={screen.component}
              />
            ))}
          </Tab.Navigator>
        </View>
        <BottomNav navigation={navigation} currentRoute={currentRoute} onTabPress={handleTabPress} />
      </View>
    </BottomNavVisibilityProvider>
  );
};
