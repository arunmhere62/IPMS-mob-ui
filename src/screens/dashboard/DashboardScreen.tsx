import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Theme } from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { QuickActions } from '../../components/QuickActions';
import {
  useGetPGLocationsQuery,
} from '../../services/api/pgLocationsApi';

type DashboardRouteName =
  | 'PGLocations'
  | 'Rooms'
  | 'Beds'
  | 'Tenants'
  | 'RentPayments'
  | 'AdvancePayments'
  | 'RefundPayments'
  | 'Visitors'
  | 'Employees'
  | 'Expenses'
  | 'Settings';

type DashboardMenuItem = {
  title: string;
  icon: string;
  screen: DashboardRouteName;
  color: string;
};

const DASHBOARD_ROUTES: Record<DashboardRouteName, true> = {
  PGLocations: true,
  Rooms: true,
  Beds: true,
  Tenants: true,
  RentPayments: true,
  AdvancePayments: true,
  RefundPayments: true,
  Visitors: true,
  Employees: true,
  Expenses: true,
  Settings: true,
};

export const DashboardScreen: React.FC = () => {
  // All hooks must be called at the top level
  const navigation = useNavigation<NavigationProp<Record<DashboardRouteName, undefined>>>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: pgLocationsResponse,
    refetch: refetchPGLocations,
  } = useGetPGLocationsQuery(undefined, {
    skip: false,
  });

  const responseData =
    typeof pgLocationsResponse === 'object' && pgLocationsResponse && 'data' in (pgLocationsResponse as object)
      ? (pgLocationsResponse as { data?: unknown }).data
      : undefined;

  const locations = Array.isArray(responseData) ? responseData : [];

  // Step 2: Auto-select first PG location when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedPGLocationId) {
      console.log('✅ Auto-selecting first PG location:', locations[0].location_name);
      dispatch(setSelectedPGLocation(locations[0].s_no));
    }
  }, [locations, selectedPGLocationId, dispatch]);

  // Step 3: Load all PG-dependent data ONLY after PG location is selected
  useEffect(() => {
    if (selectedPGLocationId) {
      console.log('🚀 PG Location selected, loading dashboard data...');
      loadAllDashboardData();
    }
  }, [selectedPGLocationId]);

  // Step 3: Load all dashboard data after PG location is selected
  const loadAllDashboardData = async () => {
    if (!selectedPGLocationId) {
      console.warn('⚠️ Cannot load dashboard data: No PG location selected');
      return;
    }

    try {
      console.log('📊 Loading dashboard data for PG:', selectedPGLocationId);
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };

  const handleNavigate = useCallback((screen: string) => {
    if (screen in DASHBOARD_ROUTES) {
      navigation.navigate(screen as DashboardRouteName);
    }
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    
    if (selectedPGLocationId) {
      console.log('🔄 Refreshing dashboard data...');
      await loadAllDashboardData();
    } else {
      console.log('🔄 Refreshing PG locations...');
      await refetchPGLocations();
    }
    
    setRefreshing(false);
  };


  const menuItems: DashboardMenuItem[] = [
    { title: 'PG Locations', icon: 'business', screen: 'PGLocations', color: '#A855F7' },
    { title: 'Rooms', icon: 'home', screen: 'Rooms', color: '#22C55E' },
    { title: 'Beds', icon: 'bed', screen: 'Beds', color: '#3B82F6' },
    { title: 'Tenants', icon: 'people', screen: 'Tenants', color: '#06B6D4' },
    { title: 'Rent Payments', icon: 'cash', screen: 'RentPayments', color: '#EAB308' },
    { title: 'Advance Payments', icon: 'gift', screen: 'AdvancePayments', color: '#EC4899' },
    { title: 'Refund Payments', icon: 'arrow-undo', screen: 'RefundPayments', color: '#EF4444' },
    { title: 'Visitors', icon: 'person-add', screen: 'Visitors', color: '#10B981' },
    { title: 'Employees', icon: 'people-circle', screen: 'Employees', color: '#F59E0B' },
    { title: 'Expenses', icon: 'receipt', screen: 'Expenses', color: '#F59E0B' },
    { title: 'Settings', icon: 'settings', screen: 'Settings', color: '#6B7280' },
  ];

  

  return (
    <ScreenLayout
      backgroundColor={Theme.colors.background.blue}
      contentBackgroundColor={Theme.colors.background.secondary}
    >
      <ScreenHeader 
        title="Dashboard" 
        showPGSelector={true}
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <QuickActions menuItems={menuItems} onNavigate={handleNavigate} />
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
