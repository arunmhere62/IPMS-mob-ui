import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { RefundPayment, useLazyGetRefundPaymentsQuery } from '../../services/api/paymentsApi';
import { Bed, Room, useGetAllBedsQuery, useGetAllRoomsQuery } from '../../services/api/roomsApi';
import { SlideBottomModal } from '../../components/SlideBottomModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface RefundPaymentScreenProps {
  navigation: any;
}

export const RefundPaymentScreen: React.FC<RefundPaymentScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [triggerGetRefundPayments] = useLazyGetRefundPaymentsQuery();
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [refundPayments, setRefundPayments] = useState<RefundPayment[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFailedPage, setLastFailedPage] = useState<number | null>(null);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [quickFilter, setQuickFilter] = useState<'NONE' | 'LAST_WEEK' | 'LAST_MONTH'>('NONE');
  
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const flatListRef = React.useRef<any>(null);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const {
    data: roomsResponse,
    isFetching: isRoomsFetching,
    refetch: refetchRooms,
  } = useGetAllRoomsQuery(
    selectedPGLocationId ? { page: 1, limit: 100, pg_id: selectedPGLocationId } : (undefined as any),
    { skip: !selectedPGLocationId }
  );

  const {
    data: bedsResponse,
    isFetching: isBedsFetching,
    refetch: refetchBeds,
  } = useGetAllBedsQuery(
    selectedRoomId && selectedPGLocationId
      ? { room_id: selectedRoomId, page: 1, limit: 100, pg_id: selectedPGLocationId }
      : (undefined as any),
    { skip: !selectedRoomId || !selectedPGLocationId }
  );

  useEffect(() => {
    if (selectedPGLocationId) {
      refetchRooms();
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    if (selectedRoomId) {
      refetchBeds();
    } else {
      setBeds([]);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    setLoadingRooms(isRoomsFetching);
  }, [isRoomsFetching]);

  useEffect(() => {
    setLoadingBeds(isBedsFetching);
  }, [isBedsFetching]);

  useEffect(() => {
    setRooms(((roomsResponse as any)?.data || []) as Room[]);
  }, [roomsResponse]);

  useEffect(() => {
    if (!selectedRoomId) return;
    setBeds(((bedsResponse as any)?.data || []) as Bed[]);
  }, [bedsResponse, selectedRoomId]);

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
    setHasMore(true);
    setLastFailedPage(null);
    setInitialLoadCompleted(false);
    loadRefundPayments(1, true);
  }, [selectedPGLocationId]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === 1) {
        setInitialLoadCompleted(false);
        loadRefundPayments(1, true);
      }
    }, [selectedPGLocationId])
  );

  const loadRefundPayments = async (page: number, reset: boolean = false) => {
    try {
      if (isPageLoading) return;
      if (!hasMore && !reset) return;
      if (lastFailedPage !== null && !reset && page <= lastFailedPage) return;
      
      setLoading(true);
      setIsPageLoading(true);
      
      const params: any = {
        page,
        limit: 20,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;

      if (selectedMonth && selectedYear) {
        params.month = selectedMonth;
        params.year = selectedYear;
      }
      
      if (selectedRoomId) params.room_id = selectedRoomId;
      if (selectedBedId) params.bed_id = selectedBedId;

      const response = await triggerGetRefundPayments(params).unwrap();
      const refundPaymentsData = Array.isArray(response.data) ? response.data : [];
      const refundPaymentsPagination = response.pagination || null;
      
      if (reset || page === 1) {
        setRefundPayments(refundPaymentsData);
      } else {
        setRefundPayments((prev: RefundPayment[]) => [...prev, ...refundPaymentsData]);
      }
      
      setPagination(refundPaymentsPagination);
      setCurrentPage(page);
      setHasMore(refundPaymentsPagination ? page < refundPaymentsPagination.totalPages : false);
      setFetchError(null);
      setLastFailedPage(null);
      setInitialLoadCompleted(true);
      
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading refund payments:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load refund payments. Please try again.';
      setFetchError(errorMessage);
      setLastFailedPage(page);
      if (page === 1) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setLastFailedPage(null);
    setInitialLoadCompleted(false);
    await loadRefundPayments(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!hasMore || loading || isPageLoading || !initialLoadCompleted) return;
    const nextPage = currentPage + 1;
    if (lastFailedPage !== null && nextPage <= lastFailedPage) return;
    loadRefundPayments(nextPage, false);
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
    if (selectedMonth && selectedYear) count++;
    if (selectedRoomId) count++;
    if (selectedBedId) count++;
    return count;
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setQuickFilter('NONE');
    setSelectedMonth(null);
    setSelectedYear(null);
    setSelectedRoomId(null);
    setSelectedBedId(null);
    setCurrentPage(1);
    setHasMore(true);
    loadRefundPayments(1, true);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setCurrentPage(1);
    setHasMore(true);
    loadRefundPayments(1, true);
  };

  const applyQuickFilter = (filter: 'LAST_WEEK' | 'LAST_MONTH') => {
    setQuickFilter(filter);
    setSelectedMonth(null);
    setSelectedYear(null);
    setLastFailedPage(null);
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

  const renderRefundPaymentItem = ({ item }: { item: RefundPayment }) => (
    <Card style={{ 
      marginHorizontal: 16, 
      marginBottom: 10, 
      padding: 12, 
      borderLeftWidth: 4, 
      borderLeftColor: '#EF4444',
      backgroundColor: Theme.colors.canvas
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ 
              paddingHorizontal: 8, 
              paddingVertical: 3, 
              borderRadius: 6, 
              backgroundColor: '#FEE2E2' 
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>
                💸 REFUND
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
            Room {item.rooms?.room_no || 'N/A'} • Bed {item.beds?.bed_no || 'N/A'}
          </Text>
        </View>

        <View style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: 
              item.status === 'PAID' ? '#DCFCE7' :
              item.status === 'PENDING' ? '#FEF3C7' :
              '#FEE2E2',
          }}>
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
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        gap: 6,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
            Refund
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626' }}>
            ₹{item.amount_paid}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {getPaymentMethodIcon(item.payment_method)} {item.payment_method}
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {formatDate(item.payment_date)}
          </Text>
        </View>
      </View>

      {item.remarks && (
        <View style={{ marginTop: 8, padding: 8, backgroundColor: Theme.colors.background.secondary, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 2 }}>Remarks</Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {item.remarks}
          </Text>
        </View>
      )}

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
        title="Refund Payments"
        subtitle={`${pagination?.total || 0} refunds`}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
        showPGSelector={true}
         showBackButton={true}
        onBackPress={() => navigation.goBack(-1)}
      />

      <View style={{ flex: 1, backgroundColor: Theme.colors.background.secondary }}>
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
              {visibleItemsCount} of {pagination?.total || refundPayments.length}
            </Text>
            <Text style={{ 
              fontSize: 10, 
              color: '#fff',
              opacity: 0.8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {(pagination?.total || refundPayments.length) - visibleItemsCount} remaining
            </Text>
          </View>
        )}
        
        <>
        <ErrorBanner
          error={fetchError}
          title="Error Loading Refund Payments"
          onRetry={() => {
            setFetchError(null);
            setLastFailedPage(null);
            setInitialLoadCompleted(false);
            loadRefundPayments(1, true);
          }}
        />
        <FlatList
          ref={flatListRef}
          data={refundPayments}
          renderItem={renderRefundPaymentItem}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            !loading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 16 }}>
                  No Refund Payments Found
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                  {getFilterCount() > 0 ? 'Try adjusting your filters' : 'No refund records available'}
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 16 }}>
                  Loading refund payments...
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loading && currentPage > 1 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: Theme.colors.text.secondary }}>
                  Loading more...
                </Text>
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        </>
      </View>

      <SlideBottomModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Refunds"
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
            {['ALL', 'PAID', 'PENDING', 'FAILED'].map((status) => (
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

        {rooms.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
              Filter by Room
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedRoomId(null);
                  setSelectedBedId(null);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: selectedRoomId === null ? Theme.colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: selectedRoomId === null ? Theme.colors.primary : Theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: selectedRoomId === null ? '#fff' : Theme.colors.text.secondary,
                  }}
                >
                  All Rooms
                </Text>
              </TouchableOpacity>
              {rooms.map((room: any) => (
                <TouchableOpacity
                  key={room.s_no}
                  onPress={() => {
                    setSelectedRoomId(room.s_no);
                    setSelectedBedId(null);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: selectedRoomId === room.s_no ? Theme.colors.primary : '#fff',
                    borderWidth: 1,
                    borderColor: selectedRoomId === room.s_no ? Theme.colors.primary : Theme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: selectedRoomId === room.s_no ? '#fff' : Theme.colors.text.secondary,
                    }}
                  >
                    {room.room_no}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {beds.length > 0 && selectedRoomId && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
              Filter by Bed
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedBedId(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: selectedBedId === null ? Theme.colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: selectedBedId === null ? Theme.colors.primary : Theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: selectedBedId === null ? '#fff' : Theme.colors.text.secondary,
                  }}
                >
                  All Beds
                </Text>
              </TouchableOpacity>
              {beds.map((bed: any) => (
                <TouchableOpacity
                  key={bed.s_no}
                  onPress={() => setSelectedBedId(bed.s_no)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: selectedBedId === bed.s_no ? Theme.colors.primary : '#fff',
                    borderWidth: 1,
                    borderColor: selectedBedId === bed.s_no ? Theme.colors.primary : Theme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: selectedBedId === bed.s_no ? '#fff' : Theme.colors.text.secondary,
                    }}
                  >
                    {bed.bed_no}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </SlideBottomModal>

      </ScreenLayout>
  );
};
