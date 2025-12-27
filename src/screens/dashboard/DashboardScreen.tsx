import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { PGSummary } from '../../components/PGSummary';
import { FinancialAnalytics } from '../../components/FinancialAnalytics';
import { QuickActions } from '../../components/QuickActions';
import {
  useGetPGLocationsQuery,
  useLazyGetPGLocationSummaryQuery,
  useLazyGetPGLocationFinancialAnalyticsQuery,
} from '../../services/api/pgLocationsApi';
import { categorizeError, ErrorInfo } from '../../utils/errorHandler';

export const DashboardScreen: React.FC = () => {
  // All hooks must be called at the top level
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [isMounted, setIsMounted] = useState(false);

  const [triggerSummary] = useLazyGetPGLocationSummaryQuery();
  const [triggerFinancial] = useLazyGetPGLocationFinancialAnalyticsQuery();

  const {
    data: pgLocationsResponse,
    refetch: refetchPGLocations,
  } = useGetPGLocationsQuery(undefined, {
    skip: false,
  });

  const locations = Array.isArray((pgLocationsResponse as any)?.data) ? (pgLocationsResponse as any).data : [];
  
  // Error tracking
  const [errors, setErrors] = useState<{
    summary?: ErrorInfo;
    financial?: ErrorInfo;
  }>({});

  // Initialize dashboard only when screen comes into focus (lazy loading)
  useFocusEffect(
    useCallback(() => {
      setIsMounted(true);
    }, [])
  );

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
  }, [selectedPGLocationId, selectedMonths]);

  // Step 3: Load all dashboard data after PG location is selected
  const loadAllDashboardData = async () => {
    if (!selectedPGLocationId) {
      console.warn('⚠️ Cannot load dashboard data: No PG location selected');
      return;
    }

    try {
      console.log('📊 Loading dashboard data for PG:', selectedPGLocationId);

      await loadSummary(selectedPGLocationId);
      await loadFinancialAnalytics(selectedPGLocationId, selectedMonths);

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };

  const loadSummary = async (pgId: number) => {
    try {
      setLoadingSummary(true);
      setErrors(prev => ({ ...prev, summary: undefined }));

      const response = await triggerSummary(pgId).unwrap();
      
      if (response.success) {
        console.log('📊 PG Summary Data:', response.data);
        setSummary(response.data);
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      console.error(`❌ [${errorInfo.type.toUpperCase()}] Error loading summary:`, errorInfo.message);
      setErrors(prev => ({ ...prev, summary: errorInfo }));
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadFinancialAnalytics = async (pgId: number, months: number) => {
    try {
      setLoadingFinancial(true);
      setErrors(prev => ({ ...prev, financial: undefined }));

      const response = await triggerFinancial({ pgId, months }).unwrap();
      
      if (response.success) {
        console.log('💰 Financial Analytics Data:', response.data);
        setFinancialData(response.data);
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      console.error(`❌ [${errorInfo.type.toUpperCase()}] Error loading financial analytics:`, errorInfo.message);
      setErrors(prev => ({ ...prev, financial: errorInfo }));
      setFinancialData(null);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const handleMonthsChange = useCallback((months: number) => {
    setSelectedMonths(months);
  }, []);

  const handleNavigate = useCallback((screen: string) => {
    // With any type, we can directly navigate
    navigation.navigate(screen);
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


  const menuItems = [
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
    { title: 'Employee Salary', icon: 'wallet', screen: 'EmployeeSalary', color: '#8B5CF6' },
    { title: 'Settings', icon: 'settings', screen: 'Settings', color: '#6B7280' },
  ];

  

  // Show loading state while component is mounting
  if (!isMounted) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 10, color: Theme.colors.text.secondary }}>Loading Dashboard...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader 
        title="Dashboard" 
        showPGSelector={true}
      />
      <View style={{ flex: 1, backgroundColor: Theme.colors.background.secondary }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <QuickActions menuItems={menuItems} onNavigate={handleNavigate} />

          {selectedPGLocationId && (
            <>
              {errors.summary ? (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#9CA3AF' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                      No data found
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      Summary is not available right now.
                    </Text>
                  </View>
                </View>
              ) : (
                <PGSummary summary={summary} loading={loadingSummary} />
              )}

              {errors.financial ? (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#9CA3AF' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                      No data found
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      Financial analytics is not available right now.
                    </Text>
                  </View>
                </View>
              ) : (
                <FinancialAnalytics 
                  data={financialData} 
                  loading={loadingFinancial} 
                  selectedMonths={selectedMonths}
                  onMonthsChange={handleMonthsChange}
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
