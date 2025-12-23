import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../store';
import { fetchPayments } from '../../store/slices/paymentSlice';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { Payment } from '../../types';
import { getAllRooms, Room } from '../../services/rooms/roomService';
import { getAllBeds, Bed } from '../../services/rooms/bedService';
import { paymentService } from '@/services/payments/paymentService';
import { SlideBottomModal } from '../../components/SlideBottomModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface RentPaymentsScreenProps {
  navigation: any;
}

export const RentPaymentsScreen: React.FC<RentPaymentsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, pagination, loading } = useSelector((state: RootState) => state.payments);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  
  const flatListRef = React.useRef<any>(null);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  useEffect(() => {
    if (selectedPGLocationId) {
      fetchRooms();
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchBeds(selectedRoomId);
    } else {
      setBeds([]);
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await getAllRooms({ page: 1, limit: 100 });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchBeds = async (roomId: number) => {
    try {
      setLoadingBeds(true);
      const response = await getAllBeds({ room_id: roomId, page: 1, limit: 100 });
      setBeds(response.data);
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setLoadingBeds(false);
    }
  };

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
    loadPayments(1, true);
  }, [selectedPGLocationId]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === 1) {
        loadPayments(1, true);
      }
    }, [selectedPGLocationId])
  );

  const loadPayments = async (page: number, reset: boolean = false) => {
    try {
      if (isPageLoading) return;
      if (!hasMore && !reset) return;
      if (lastFailedPage !== null && !reset && page <= lastFailedPage) return;
      
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
      
      params.append = !reset && page > 1;

      const result = await dispatch(fetchPayments(params)).unwrap();
      
      setCurrentPage(page);
      setHasMore(result.pagination ? page < result.pagination.totalPages : false);
      
      setFetchError(null);
      setLastFailedPage(null);
      setInitialLoadCompleted(true);
      
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load payments. Please try again.';
      setFetchError(errorMessage);
      setLastFailedPage(page);
      if (page === 1) {
        setHasMore(false);
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setLastFailedPage(null);
    setFetchError(null);
    setInitialLoadCompleted(false);
    await loadPayments(1, true);
    setRefreshing(false);
  };

  const loadMorePayments = () => {
    if (!hasMore || loading || isPageLoading || !initialLoadCompleted) return;
    const nextPage = currentPage + 1;
    loadPayments(nextPage, false);
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
    setLastFailedPage(null);
    setFetchError(null);
    setInitialLoadCompleted(false);
    loadPayments(1, true);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setCurrentPage(1);
    setHasMore(true);
    setLastFailedPage(null);
    setFetchError(null);
    setInitialLoadCompleted(false);
    loadPayments(1, true);
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
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  const handleMarkAsPaid = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowStatusModal(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!selectedPayment) return;

    try {
      setUpdatingStatus(true);
      const response = await paymentService.updatePaymentStatus(
        selectedPayment.s_no,
        'PAID',
        new Date().toISOString().split('T')[0]
      );

      if (response.success) {
        Alert.alert('Success', 'Payment marked as paid successfully');
        setShowStatusModal(false);
        setSelectedPayment(null);
        setCurrentPage(1);
        setHasMore(true);
        setLastFailedPage(null);
        setFetchError(null);
        setInitialLoadCompleted(false);
        loadPayments(1, true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return Theme.colors.secondary;
      case 'PARTIAL':
        return '#EF4444';
      case 'PENDING':
        return Theme.colors.warning;
      case 'FAILED':
        return Theme.colors.danger;
      case 'REFUNDED':
        return Theme.colors.info;
      default:
        return Theme.colors.text.secondary;
    }
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

  const renderRentPaymentItem = ({ item }: { item: Payment }) => {
    const isPartial = item.status === 'PARTIAL';
    
    return (
      <Card style={{ 
        marginHorizontal: 16, 
        marginBottom: 10, 
        padding: 12, 
        borderLeftWidth: 4, 
        borderLeftColor: isPartial ? '#EF4444' : Theme.colors.primary,
        backgroundColor: isPartial ? '#FEF2F2' : '#fff',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ 
                backgroundColor: isPartial ? '#FEE2E2' : Theme.withOpacity(Theme.colors.primary, 0.1), 
                paddingHorizontal: 8, 
                paddingVertical: 3, 
                borderRadius: 6,
                marginRight: 8
              }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isPartial ? '#EF4444' : Theme.colors.primary }}>
                  {isPartial ? '⚠️ PARTIAL PAYMENT' : 'RENT PAYMENT'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 2 }}>
              {item.tenants?.name || 'Unknown Tenant'}
            </Text>
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
                item.status === 'PARTIAL' ? '#FEF3C7' :
                item.status === 'PENDING' ? '#FEF3C7' :
                '#FEE2E2',
            }}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: 
                item.status === 'PAID' ? '#16A34A' :
                item.status === 'PARTIAL' ? '#CA8A04' :
                item.status === 'PENDING' ? '#CA8A04' :
                '#DC2626',
            }}>
              {item.status}
            </Text>
          </View>
                  </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 2 }}>Amount Paid</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.primary }}>
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

          {item.start_date && item.end_date && (
            <View>
              <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Payment Period</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                {formatDate(item.start_date)} - {formatDate(item.end_date)}
              </Text>
            </View>
          )}

          {item.remarks && (
            <View style={{ marginTop: 6, padding: 8, backgroundColor: Theme.colors.background.secondary, borderRadius: 6 }}>
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

            {item.status === 'PENDING' && (
              <TouchableOpacity
                onPress={() => handleMarkAsPaid(item)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: Theme.colors.secondary,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: 6 }}>
                  Mark as Paid
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Rent Payments"
        subtitle={`${pagination?.total || 0} payments`}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
        showPGSelector={true}
      />

      <View style={{ flex: 1, backgroundColor: Theme.colors.background.secondary }}>
        <ErrorBanner
          error={fetchError}
          title="Error Loading Payments"
          onRetry={() => {
            setFetchError(null);
            setLastFailedPage(null);
            setInitialLoadCompleted(false);
            loadPayments(1, true);
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
              {visibleItemsCount} of {pagination?.total || payments.length}
            </Text>
            <Text style={{ 
              fontSize: 10, 
              color: '#fff',
              opacity: 0.8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {(pagination?.total || payments.length) - visibleItemsCount} remaining
            </Text>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={payments}
          renderItem={renderRentPaymentItem}
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
                  No Rent Payments Found
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                  {getFilterCount() > 0 ? 'Try adjusting your filters' : 'No payment records available'}
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 16 }}>
                  Loading rent payments...
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
          onEndReached={loadMorePayments}
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

      <Modal visible={showStatusModal} animationType="fade" transparent={true} onRequestClose={() => setShowStatusModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: Theme.colors.canvas,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: Theme.withOpacity(Theme.colors.secondary, 0.1),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={32} color={Theme.colors.secondary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                Mark as Paid?
              </Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                Are you sure you want to mark this payment as paid?
              </Text>
            </View>

            {selectedPayment && (
              <View
                style={{
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Tenant</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {selectedPayment.tenants?.name}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Amount</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.primary }}>
                    ₹{selectedPayment.amount_paid?.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>Room/Bed</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {selectedPayment.rooms?.room_no} / {selectedPayment.beds?.bed_no}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowStatusModal(false);
                  setSelectedPayment(null);
                }}
                disabled={updatingStatus}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: Theme.colors.light,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmMarkAsPaid}
                disabled={updatingStatus}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: Theme.colors.secondary,
                  alignItems: 'center',
                }}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </ScreenLayout>
  );
};
