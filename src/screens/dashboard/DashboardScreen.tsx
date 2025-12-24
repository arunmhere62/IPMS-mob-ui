import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { fetchPayments } from '../../store/slices/paymentSlice';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { PGSummary } from '../../components/PGSummary';
import { FinancialAnalytics } from '../../components/FinancialAnalytics';
import { QuickActions } from '../../components/QuickActions';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import {
  useGetPGLocationsQuery,
  useLazyGetPGLocationSummaryQuery,
  useLazyGetPGLocationFinancialAnalyticsQuery,
} from '../../services/api/pgLocationsApi';
import { Tenant, useLazyGetTenantsQuery } from '../../services/api/tenantsApi';
import { categorizeError, ErrorInfo } from '../../utils/errorHandler';

export const DashboardScreen: React.FC = () => {
  // All hooks must be called at the top level
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { payments } = useSelector((state: RootState) => state.payments);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'summary' | 'rentStatus'>('summary');
  const [pendingTenants, setPendingTenants] = useState<Tenant[]>([]);
  const [partialTenants, setPartialTenants] = useState<Tenant[]>([]);
  const [noAdvanceTenants, setNoAdvanceTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'pending' | 'partial' | 'noAdvance'>('pending');

  const [triggerSummary] = useLazyGetPGLocationSummaryQuery();
  const [triggerFinancial] = useLazyGetPGLocationFinancialAnalyticsQuery();
  const [triggerTenants] = useLazyGetTenantsQuery();

  const {
    data: pgLocationsResponse,
    refetch: refetchPGLocations,
    isUninitialized: isPGLocationsUninitialized,
  } = useGetPGLocationsQuery(undefined, {
    skip: false,
  });

  const canFetchPGLocations = true;
  const locations = Array.isArray((pgLocationsResponse as any)?.data) ? (pgLocationsResponse as any).data : [];
  
  // Error tracking
  const [errors, setErrors] = useState<{
    summary?: ErrorInfo;
    financial?: ErrorInfo;
    tenants?: ErrorInfo;
  }>({});

  // Initialize dashboard only when screen comes into focus (lazy loading)
  useFocusEffect(
    useCallback(() => {
      setIsMounted(true);
      refetchPGLocations();
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
      await loadTenantData(selectedPGLocationId);
      await dispatch(fetchPayments({})).unwrap();

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
  
  const loadTenantData = async (pgId: number) => {
    try {
      setLoadingTenants(true);
      setErrors(prev => ({ ...prev, tenants: undefined }));
      
      // Use single API with different filters
      const [pendingResponse, partialResponse, noAdvanceResponse] = await Promise.all([
        triggerTenants({ pending_rent: true, limit: 20 }).unwrap(),
        triggerTenants({ partial_rent: true, limit: 20 }).unwrap(),
        triggerTenants({ pending_advance: true, limit: 20 }).unwrap(),
      ]);
      
      // Debug logging to compare API responses
      console.log('🔍 API Response Comparison (using tenantsApi.getTenants):');
      const pendingData = Array.isArray(pendingResponse.data) ? pendingResponse.data : [];
      const partialData = Array.isArray(partialResponse.data) ? partialResponse.data : [];
      const noAdvanceData = Array.isArray(noAdvanceResponse.data) ? noAdvanceResponse.data : [];
      
      console.log('📍 Pending Rent Filter (/tenants?pending_rent=true):', {
        success: pendingResponse.success,
        count: pendingData.length,
        tenants: pendingData.map((t: Tenant) => ({ id: t.s_no, name: t.name, tenant_id: t.tenant_id })) || []
      });
      console.log('📍 Partial Rent Filter (/tenants?partial_rent=true):', {
        success: partialResponse.success,
        count: partialData.length,
        tenants: partialData.map((t: Tenant) => ({ id: t.s_no, name: t.name, tenant_id: t.tenant_id })) || []
      });
      console.log('📍 No Advance Filter (/tenants?pending_advance=true):', {
        success: noAdvanceResponse.success,
        count: noAdvanceData.length,
        tenants: noAdvanceData.map((t: Tenant) => ({ id: t.s_no, name: t.name, tenant_id: t.tenant_id })) || []
      });
      
      if (pendingResponse.success) {
        setPendingTenants(pendingData);
      }
      if (partialResponse.success) {
        setPartialTenants(partialData);
      }
      if (noAdvanceResponse.success) {
        setNoAdvanceTenants(noAdvanceData);
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      console.error(`❌ [${errorInfo.type.toUpperCase()}] Error loading tenant data:`, errorInfo.message);
      setErrors(prev => ({ ...prev, tenants: errorInfo }));
      setPendingTenants([]);
      setPartialTenants([]);
      setNoAdvanceTenants([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleMonthsChange = useCallback((months: number) => {
    setSelectedMonths(months);
  }, []);

  const handleNavigate = useCallback((screen: string) => {
    // With any type, we can directly navigate
    navigation.navigate(screen);
  }, [navigation]);

  // Get filtered tenants based on selected category
  const getFilteredTenants = useCallback(() => {
    switch (selectedCategory) {
      case 'pending':
        return Array.isArray(pendingTenants) ? pendingTenants : [];
      case 'partial':
        return Array.isArray(partialTenants) ? partialTenants : [];
      case 'noAdvance':
        return Array.isArray(noAdvanceTenants) ? noAdvanceTenants : [];
      default:
        return Array.isArray(pendingTenants) ? pendingTenants : [];
    }
  }, [selectedCategory, pendingTenants, partialTenants, noAdvanceTenants]);

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


  const activeTenants = Number(summary?.tenants?.active ?? 0);
  const totalRevenue = payments && Array.isArray(payments)
    ? payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
    : 0;
  const pendingPayments = payments && Array.isArray(payments)
    ? payments.filter(p => p.status === 'PENDING').length
    : 0;

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
        {/* Horizontal Tabs */}
        <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{
                  marginRight: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 9999,
                  backgroundColor: activeSection === 'summary' ? Theme.colors.primary + '20' : '#F3F4F6',
                }}
                onPress={() => setActiveSection('summary')}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: activeSection === 'summary' ? Theme.colors.primary : Theme.colors.text.secondary }}>Summary</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  marginRight: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 9999,
                  backgroundColor: activeSection === 'rentStatus' ? Theme.colors.primary + '20' : '#F3F4F6',
                }}
                onPress={() => setActiveSection('rentStatus')}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: activeSection === 'rentStatus' ? Theme.colors.primary : Theme.colors.text.secondary }}>Rent Status</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {activeSection === 'summary' ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Quick Actions - Moved to top */}
            <QuickActions menuItems={menuItems} onNavigate={handleNavigate} />

            {/* PG Summary Section */}
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
              </>
            )}

            {/* Financial Analytics Section */}
            {selectedPGLocationId && (
              <>
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

            {/* Summary content ends here */}
          </ScrollView>
        ) : (
          // Rent Status tab content
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {selectedPGLocationId && (
              <>
                {errors.tenants ? (
                  <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#9CA3AF' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                        No data found
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        Tenant data is not available right now.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                    {/* Categories */}
                    <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>Categories</Text>
                    
                    <View style={{ flexDirection: 'row', marginBottom: 20, gap: 6 }}>
                      <TouchableOpacity 
                        style={{ 
                          flex: 1,
                          backgroundColor: selectedCategory === 'pending' ? '#3B82F6' : '#F3F4F6', 
                          paddingVertical: 8, 
                          paddingHorizontal: 8, 
                          borderRadius: 12, 
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 36
                        }}
                        onPress={() => setSelectedCategory('pending')}
                      >
                        <Text style={{ 
                          color: selectedCategory === 'pending' ? 'white' : Theme.colors.text.secondary, 
                          fontWeight: '700', 
                          fontSize: 10, 
                          marginRight: 4,
                          textAlign: 'center'
                        }}>Pending</Text>
                        <View style={{ 
                          backgroundColor: selectedCategory === 'pending' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', 
                          paddingHorizontal: 4, 
                          paddingVertical: 1, 
                          borderRadius: 6,
                          minWidth: 16,
                          alignItems: 'center'
                        }}>
                          <Text style={{ 
                            color: selectedCategory === 'pending' ? 'white' : Theme.colors.text.secondary, 
                            fontWeight: '700', 
                            fontSize: 8 
                          }}>{Array.isArray(pendingTenants) ? pendingTenants.length : 0}</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={{ 
                          flex: 1,
                          backgroundColor: selectedCategory === 'partial' ? '#3B82F6' : '#F3F4F6', 
                          paddingVertical: 8, 
                          paddingHorizontal: 8, 
                          borderRadius: 12, 
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 36
                        }}
                        onPress={() => setSelectedCategory('partial')}
                      >
                        <Text style={{ 
                          color: selectedCategory === 'partial' ? 'white' : Theme.colors.text.secondary, 
                          fontWeight: '700', 
                          fontSize: 10, 
                          marginRight: 4,
                          textAlign: 'center'
                        }}>Partial</Text>
                        <View style={{ 
                          backgroundColor: selectedCategory === 'partial' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', 
                          paddingHorizontal: 4, 
                          paddingVertical: 1, 
                          borderRadius: 6,
                          minWidth: 16,
                          alignItems: 'center'
                        }}>
                          <Text style={{ 
                            color: selectedCategory === 'partial' ? 'white' : Theme.colors.text.secondary, 
                            fontWeight: '700', 
                            fontSize: 8 
                          }}>{partialTenants.length}</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={{ 
                          flex: 1,
                          backgroundColor: selectedCategory === 'noAdvance' ? '#3B82F6' : '#F3F4F6', 
                          paddingVertical: 8, 
                          paddingHorizontal: 8, 
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 36
                        }}
                        onPress={() => setSelectedCategory('noAdvance')}
                      >
                        <Text style={{ 
                          color: selectedCategory === 'noAdvance' ? 'white' : Theme.colors.text.secondary, 
                          fontWeight: '700', 
                          fontSize: 10, 
                          marginRight: 4,
                          textAlign: 'center'
                        }}>No Advance</Text>
                        <View style={{ 
                          backgroundColor: selectedCategory === 'noAdvance' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', 
                          paddingHorizontal: 4, 
                          paddingVertical: 1, 
                          borderRadius: 6,
                          minWidth: 16,
                          alignItems: 'center'
                        }}>
                          <Text style={{ 
                            color: selectedCategory === 'noAdvance' ? 'white' : Theme.colors.text.secondary, 
                            fontWeight: '700', 
                            fontSize: 8 
                          }}>{Array.isArray(noAdvanceTenants) ? noAdvanceTenants.length : 0}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Tenants List */}
                    <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                      Tenants ({getFilteredTenants().length})
                    </Text>

                    {loadingTenants ? (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={{ marginTop: 10, color: Theme.colors.text.secondary }}>Loading tenants...</Text>
                      </View>
                    ) : (
                      <>
                        {/* Filtered Tenants */}
                        {getFilteredTenants().map((tenant, index) => (
                          <AnimatedPressableCard
                            key={tenant.s_no}
                            onPress={() => {
                              navigation.navigate('TenantDetails', { tenantId: tenant.s_no });
                            }}
                            scaleValue={0.97}
                            duration={120}
                            style={{ marginBottom: 12 }}
                          >
                            <View style={{ 
                              backgroundColor: 'white', 
                              borderRadius: 12, 
                              padding: 12,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                              elevation: 2
                            }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ 
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: 20, 
                                  backgroundColor: Theme.colors.primary, 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  marginRight: 10
                                }}>
                                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                                    {tenant.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
                                    {tenant.name}
                                  </Text>
                                  {tenant.rooms && (
                                    <View style={{ 
                                      backgroundColor: '#F3F4F6', 
                                      paddingHorizontal: 6, 
                                      paddingVertical: 2, 
                                      borderRadius: 4,
                                      alignSelf: 'flex-start'
                                    }}>
                                      <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.secondary }}>
                                        {tenant.rooms.room_no}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <View style={{ 
                                  backgroundColor: '#E0E7FF', 
                                  paddingHorizontal: 8, 
                                  paddingVertical: 4, 
                                  borderRadius: 12 
                                }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: Theme.colors.primary }}>
                                    {tenant.pending_months || 1}M Due
                                  </Text>
                                </View>
                              </View>
                              
                              <View style={{ 
                                backgroundColor: '#F8FAFC', 
                                borderRadius: 8, 
                                padding: 10,
                                borderLeftWidth: 3,
                                borderLeftColor: Theme.colors.primary
                              }}>
                                <View style={{ 
                                  flexDirection: 'row', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  marginBottom: 8
                                }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>💰 Due Amount</Text>
                                  <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.primary }}>
                                    ₹{(tenant.rent_due_amount || tenant.rooms?.rent_price || 0).toLocaleString()}
                                  </Text>
                                </View>
                                
                                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 }} />
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Partial Payment</Text>
                                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#F59E0B' }}>
                                    ₹{(tenant.partial_due_amount || 0).toLocaleString()}
                                  </Text>
                                </View>
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Pending Amount</Text>
                                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>
                                    ₹{(tenant.pending_due_amount || 0).toLocaleString()}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </AnimatedPressableCard>
                        ))}

                        {/* Show message if no tenants */}
                        {getFilteredTenants().length === 0 && (
                          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={{ fontSize: 16, color: Theme.colors.text.secondary }}>
                              No {selectedCategory} tenants
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
};
