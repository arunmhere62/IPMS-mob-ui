import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { AdvancePayment, useLazyGetAdvancePaymentsQuery } from '../../services/api/paymentsApi';
import { SlideBottomModal } from '../../components/SlideBottomModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ADVANCE_PAYMENTS_PAGE_LIMIT = 50;

interface AdvancePaymentScreenProps {
  navigation: any;
}

export const AdvancePaymentScreen: React.FC<AdvancePaymentScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [triggerGetAdvancePayments, advancePaymentsQuery] = useLazyGetAdvancePaymentsQuery();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'NONE' | 'LAST_WEEK' | 'LAST_MONTH'>('NONE');
  
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const flatListRef = React.useRef<any>(null);

  const errorText = React.useMemo(() => {
    const err: any = advancePaymentsQuery.error;
    return (
      err?.data?.message ||
      err?.error ||
      err?.message ||
      (typeof err === 'string' ? err : null)
    );
  }, [advancePaymentsQuery.error]);


  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const getTenantUnavailableMessage = (reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null) => {
    switch (reason) {
      case 'DELETED':
        return { text: '⚠️ Tenant has been deleted', color: '#DC2626' };
      case 'CHECKED_OUT':
        return { text: '📤 Tenant has checked out', color: '#F59E0B' };
      case 'INACTIVE':
        return { text: '⏸️ Tenant is inactive', color: '#6B7280' };
      case 'NOT_FOUND':
        return { text: '❌ Tenant not found', color: '#DC2626' };
      default:
        return { text: '⚠️ Tenant unavailable', color: '#DC2626' };
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setAdvancePayments([]);
    setPagination(null);
    loadAdvancePayments(1, true, {
      statusFilter: 'ALL',
      quickFilter: 'NONE',
      selectedMonth: null,
      selectedYear: null,
      startDate: '',
      endDate: '',
    });
  }, [selectedPGLocationId]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === 1) {
        loadAdvancePayments(1, true);
      }
    }, [selectedPGLocationId])
  );

  const handleBack = React.useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Payments');
  }, [navigation]);

  const loadAdvancePayments = async (
    page: number,
    reset: boolean = false,
    overrides?: Partial<{
      statusFilter: 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED';
      quickFilter: 'NONE' | 'LAST_WEEK' | 'LAST_MONTH';
      selectedMonth: string | null;
      selectedYear: number | null;
      startDate: string;
      endDate: string;
    }>
  ) => {
    try {
      if (advancePaymentsQuery.isFetching && !reset) return;
      if (!reset && pagination && page > pagination.totalPages) return;

      if (reset) {
        setAdvancePayments([]);
        setPagination(null);
      }
      
      const params: any = {
        page,
        limit: ADVANCE_PAYMENTS_PAGE_LIMIT,
      };

      if (selectedPGLocationId) {
        params.pg_id = selectedPGLocationId;
      }

      const effectiveStatusFilter = overrides && 'statusFilter' in overrides ? overrides.statusFilter : statusFilter;
      const effectiveQuickFilter = overrides && 'quickFilter' in overrides ? overrides.quickFilter : quickFilter;
      const effectiveSelectedMonth = overrides && 'selectedMonth' in overrides ? overrides.selectedMonth : selectedMonth;
      const effectiveSelectedYear = overrides && 'selectedYear' in overrides ? overrides.selectedYear : selectedYear;
      const effectiveStartDate = overrides && 'startDate' in overrides ? overrides.startDate : startDate;
      const effectiveEndDate = overrides && 'endDate' in overrides ? overrides.endDate : endDate;

      if (effectiveStatusFilter !== 'ALL') params.status = effectiveStatusFilter;
      
      if (effectiveQuickFilter !== 'NONE') {
        const toISODate = (date: Date) => date.toISOString().split('T')[0];
        const end = new Date();
        const start = new Date();
        if (effectiveQuickFilter === 'LAST_WEEK') {
          start.setDate(end.getDate() - 7);
        } else if (effectiveQuickFilter === 'LAST_MONTH') {
          start.setMonth(end.getMonth() - 1);
        }
        params.start_date = toISODate(start);
        params.end_date = toISODate(end);
      } else if (effectiveStartDate || effectiveEndDate) {
        if (effectiveStartDate) params.start_date = effectiveStartDate;
        if (effectiveEndDate) params.end_date = effectiveEndDate;
      } else if (effectiveSelectedMonth && effectiveSelectedYear) {
        params.month = effectiveSelectedMonth;
        params.year = effectiveSelectedYear;
      }
      
      params.append = !reset && page > 1;

      const response = await triggerGetAdvancePayments(params, false).unwrap();

      if (!params.append) {
        setAdvancePayments(response.data || []);
      } else {
        setAdvancePayments((prev: AdvancePayment[]) => [...prev, ...(response.data || [])]);
      }

      setPagination(response.pagination || null);
      setCurrentPage(page);
      
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading advance payments:', error);
    } finally {
    }
  };

  const onRefresh = async () => {
    setCurrentPage(1);
    setAdvancePayments([]);
    setPagination(null);
    await loadAdvancePayments(1, true);
  };

  const loadMore = () => {
    if (advancePaymentsQuery.isFetching) return;
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
    const nextPage = currentPage + 1;
    loadAdvancePayments(nextPage, false);
  };

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index || 0;
      setVisibleItemsCount(lastVisibleIndex + 1);
    }
  }, []);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const getFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (quickFilter !== 'NONE') count++;
    if (selectedMonth || selectedYear) count++;
    if (startDate || endDate) count++;
    return count;
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setQuickFilter('NONE');
    setSelectedMonth(null);
    setSelectedYear(null);
    setStartDate('');
    setEndDate('');
    setShowFilters(false);
    setCurrentPage(1);
    setAdvancePayments([]);
    setPagination(null);
    loadAdvancePayments(1, true, {
      statusFilter: 'ALL',
      quickFilter: 'NONE',
      selectedMonth: null,
      selectedYear: null,
      startDate: '',
      endDate: '',
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    setCurrentPage(1);
    setAdvancePayments([]);
    setPagination(null);
    loadAdvancePayments(1, true);
  };

  const applyQuickFilter = (filter: 'LAST_WEEK' | 'LAST_MONTH') => {
    const today = new Date();
    const start = new Date();
    
    if (filter === 'LAST_WEEK') {
      start.setDate(today.getDate() - 7);
    } else if (filter === 'LAST_MONTH') {
      start.setMonth(today.getMonth() - 1);
    }
    
    setQuickFilter(filter);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'GPAY':
        return '📱';
      case 'PHONEPE':
        return '📱';
      case 'CASH':
        return '💵';
      case 'BANK_TRANSFER':
        return '🏦';
      default:
        return '💰';
    }
  };

  const renderAdvancePaymentItem = ({ item }: { item: AdvancePayment }) => (
    <Card style={{ 
      marginHorizontal: 16, 
      marginBottom: 10, 
      padding: 12, 
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: Theme.withOpacity('#10B981', 0.35),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ 
              backgroundColor: Theme.withOpacity('#10B981', 0.1), 
              paddingHorizontal: 8, 
              paddingVertical: 3, 
              borderRadius: 6,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="flash" size={11} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
                ADVANCE PAYMENT
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 2 }}>
            {item.tenants?.name || 'Tenant Removed'}
          </Text>
          {!item.tenants && item.tenant_unavailable_reason && (
            <View style={{ 
              backgroundColor: item.tenant_unavailable_reason === 'CHECKED_OUT' ? '#FEF3C7' : '#FEE2E2', 
              paddingHorizontal: 8, 
              paddingVertical: 3, 
              borderRadius: 6, 
              marginBottom: 4,
              alignSelf: 'flex-start'
            }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: getTenantUnavailableMessage(item.tenant_unavailable_reason).color }}>
                {getTenantUnavailableMessage(item.tenant_unavailable_reason).text}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
            ID: {item.tenants?.tenant_id || 'N/A'}
          </Text>
        </View>
        <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: 
                item.status === 'PAID' ? '#DCFCE7' :
                item.status === 'PENDING' ? '#FEF3C7' :
                '#FEE2E2',
            }}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: 
                item.status === 'PAID' ? '#16A34A' :
                item.status === 'PENDING' ? '#CA8A04' :
                '#DC2626',
            }}>
              {item.status}
            </Text>
          </View>
      </View>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 8, 
        paddingBottom: 8, 
        borderBottomWidth: 1, 
        borderBottomColor: Theme.colors.border,
        backgroundColor: Theme.withOpacity('#10B981', 0.05),
        padding: 10,
        borderRadius: 8,
        marginHorizontal: -2
      }}>
        <View>
          <Text style={{ fontSize: 11, color: '#10B981', marginBottom: 2, fontWeight: '600' }}>Advance Amount</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#10B981' }}>
            ₹{item.amount_paid?.toLocaleString('en-IN')}
          </Text>
        </View>
        {item.actual_rent_amount !== item.amount_paid && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 2 }}>Actual Rent</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.secondary }}>
              ₹{item.actual_rent_amount?.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            Room {item.rooms?.room_no || 'N/A'} • Bed {item.beds?.bed_no || 'N/A'}
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {formatDate(item.payment_date || '')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {getPaymentMethodIcon(item.payment_method)} {item.payment_method}
          </Text>
          {!!item.tenants?.phone_no && (
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
              {item.tenants.phone_no}
            </Text>
          )}
        </View>

        {item.remarks && (
          <View style={{ marginTop: 6, padding: 8, backgroundColor: Theme.colors.background.secondary, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 2 }}>Remarks</Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
              {item.remarks}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {item.tenants && !item.tenant_unavailable_reason ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('TenantDetails', { tenantId: item.tenant_id })}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: Theme.colors.background.blueLight,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Theme.colors.primary,
            }}
          >
            <Ionicons name="information-circle-outline" size={14} color={Theme.colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary, marginLeft: 6 }}>
              View Details
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Ionicons name="alert-circle-outline" size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginLeft: 6 }}>
              Tenant Removed
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Advance Payments"
        subtitle={`${pagination?.total || 0} payments`}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
        showBackButton={true}
        onBackPress={handleBack}
      />

      <View style={{ flex: 1, backgroundColor: Theme.colors.background.secondary }}>
        <ErrorBanner
          error={errorText}
          title="Error Loading Advance Payments"
          onRetry={() => {
            loadAdvancePayments(1, true);
          }}
        />
        
        {visibleItemsCount > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 100,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '700', 
              color: '#fff',
              textAlign: 'center',
            }}>
              {visibleItemsCount} of {pagination?.total || advancePayments.length}
            </Text>
            <Text style={{ 
              fontSize: 10, 
              color: '#fff',
              opacity: 0.8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {(pagination?.total || advancePayments.length) - visibleItemsCount} remaining
            </Text>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={advancePayments}
          renderItem={renderAdvancePaymentItem}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={['transparent']}
              progressBackgroundColor="transparent"
            />
          }
          ListHeaderComponent={
            <View>
              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setShowFilters(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      backgroundColor: Theme.colors.canvas,
                    }}
                  >
                    <Ionicons name="options-outline" size={18} color={Theme.colors.text.secondary} />
                    <Text style={{ marginLeft: 8, fontSize: 13, color: Theme.colors.text.primary, fontWeight: '600' }}>
                      Filters
                    </Text>
                  </TouchableOpacity>

                  {getFilterCount() > 0 ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                        {getFilterCount()} active
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                      No filters
                    </Text>
                  )}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            advancePaymentsQuery.isFetching ? (
              <View style={{ paddingTop: 16 }}>
                {[...Array(6)].map((_, idx) => (
                  <View key={idx} style={{ marginHorizontal: 16, marginBottom: 10 }}>
                    <Card style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <SkeletonLoader width="50%" height={12} />
                        <SkeletonLoader width={70} height={18} borderRadius={8} />
                      </View>
                      <SkeletonLoader width="70%" height={16} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width="40%" height={10} style={{ marginBottom: 12 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <SkeletonLoader width={110} height={18} />
                        <SkeletonLoader width={110} height={18} />
                      </View>
                      <SkeletonLoader width="100%" height={1} style={{ marginVertical: 12 }} />
                      <SkeletonLoader width="60%" height={10} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width="45%" height={10} />
                    </Card>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 16 }}>
                  No Advance Payments Found
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                  {getFilterCount() > 0 ? 'Try adjusting your filters' : 'No payment records available'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            advancePaymentsQuery.isFetching && currentPage > 1 ? (
              <View style={{ paddingVertical: 20 }}>
                <View style={{ paddingHorizontal: 16 }}>
                  <Card style={{ padding: 12 }}>
                    <SkeletonLoader width="45%" height={12} style={{ marginBottom: 10 }} />
                    <SkeletonLoader width="75%" height={16} style={{ marginBottom: 6 }} />
                    <SkeletonLoader width="55%" height={10} />
                  </Card>
                </View>
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      <SlideBottomModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Payments"
        subtitle={getFilterCount() > 0 ? `${getFilterCount()} filter${getFilterCount() > 1 ? 's' : ''} active` : undefined}
        submitLabel="Apply Filters"
        cancelLabel={getFilterCount() > 0 ? 'Clear Filters' : 'Cancel'}
        onSubmit={applyFilters}
        onCancel={getFilterCount() > 0 ? clearFilters : undefined}
      >
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                  Quick Filters
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => applyQuickFilter('LAST_WEEK')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: quickFilter === 'LAST_WEEK' ? Theme.colors.primary : '#fff',
                      borderWidth: 1,
                      borderColor: quickFilter === 'LAST_WEEK' ? Theme.colors.primary : Theme.colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: quickFilter === 'LAST_WEEK' ? '#fff' : Theme.colors.text.secondary,
                      }}
                    >
                      📅 Last 1 Week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => applyQuickFilter('LAST_MONTH')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: quickFilter === 'LAST_MONTH' ? Theme.colors.primary : '#fff',
                      borderWidth: 1,
                      borderColor: quickFilter === 'LAST_MONTH' ? Theme.colors.primary : Theme.colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: quickFilter === 'LAST_MONTH' ? '#fff' : Theme.colors.text.secondary,
                      }}
                    >
                      📅 Last 1 Month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                  Payment Status
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['ALL', 'PAID', 'PARTIAL', 'PENDING', 'FAILED'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(status as any)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: statusFilter === status ? Theme.colors.primary : '#fff',
                        borderWidth: 1,
                        borderColor: statusFilter === status ? Theme.colors.primary : Theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: statusFilter === status ? '#fff' : Theme.colors.text.secondary,
                        }}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                  Filter by Month & Year
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedMonth(null)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: selectedMonth === null ? Theme.colors.primary : '#fff',
                        borderWidth: 1,
                        borderColor: selectedMonth === null ? Theme.colors.primary : Theme.colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: selectedMonth === null ? '#fff' : Theme.colors.text.secondary }}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {MONTHS.map((month) => (
                      <TouchableOpacity
                        key={month}
                        onPress={() => setSelectedMonth(month)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: selectedMonth === month ? Theme.colors.primary : '#fff',
                          borderWidth: 1,
                          borderColor: selectedMonth === month ? Theme.colors.primary : Theme.colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: selectedMonth === month ? '#fff' : Theme.colors.text.secondary }}>
                          {month.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedYear(null)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: selectedYear === null ? Theme.colors.primary : '#fff',
                      borderWidth: 1,
                      borderColor: selectedYear === null ? Theme.colors.primary : Theme.colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: selectedYear === null ? '#fff' : Theme.colors.text.secondary }}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: selectedYear === year ? Theme.colors.primary : '#fff',
                        borderWidth: 1,
                        borderColor: selectedYear === year ? Theme.colors.primary : Theme.colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selectedYear === year ? '#fff' : Theme.colors.text.secondary }}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

      </SlideBottomModal>
    </ScreenLayout>
  );
};
