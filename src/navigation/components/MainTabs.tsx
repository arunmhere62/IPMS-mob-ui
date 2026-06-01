import React from 'react';
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
import { TenantsScreen } from '@/features/owner/screens/tenants/TenantsScreen';
import { PaymentsScreen } from '@/features/owner/screens/payments/PaymentsScreen';
import { SettingsScreen } from '@/features/owner/screens/settings/SettingsScreen';

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
    name: 'Tenants',
    component: TenantsScreen,
    permission: Permission.VIEW_TENANTS,
  },
  {
    name: 'Payments',
    component: PaymentsScreen,
    permission: Permission.VIEW_PAYMENT,
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
        <BottomNav navigation={navigation} currentRoute={currentRoute} />
      </View>
    </BottomNavVisibilityProvider>
  );
};
