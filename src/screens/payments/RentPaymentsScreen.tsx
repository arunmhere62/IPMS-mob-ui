import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, Alert } from 'react-native';
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
import { Payment } from '../../types';
import { Bed, Room, useGetAllBedsQuery, useGetAllRoomsQuery } from '../../services/api/roomsApi';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { useLazyGetTenantPaymentsQuery, useUpdatePaymentStatusMutation } from '@/services/api/paymentsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENTS_PAGE_LIMIT = 50;

interface RentPaymentsScreenProps {
  navigation: any;
}

export const RentPaymentsScreen: React.FC<RentPaymentsScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [triggerGetPayments, paymentsQuery] = useLazyGetTenantPaymentsQuery();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
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

  const errorText = React.useMemo(() => {
    const err: any = paymentsQuery.error;
    return (
      err?.data?.message ||
      err?.error ||
      err?.message ||
      (typeof err === 'string' ? err : null)
    );
  }, [paymentsQuery.error]);

  const {
    data: roomsResponse,
    refetch: refetchRooms,
  } = useGetAllRoomsQuery(
    selectedPGLocationId ? { page: 1, limit: 100, pg_id: selectedPGLocationId } : (undefined as any),
    { skip: !selectedPGLocationId, refetchOnMountOrArgChange: true }
  );

  const {
    data: bedsResponse,
    refetch: refetchBeds,
  } = useGetAllBedsQuery(
    selectedRoomId && selectedPGLocationId
      ? { room_id: selectedRoomId, page: 1, limit: 100, pg_id: selectedPGLocationId }
      : (undefined as any),
    { skip: !selectedRoomId || !selectedPGLocationId, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (selectedPGLocationId) {
      refetchRooms();
    }
  }, [selectedPGLocationId, refetchRooms]);

  useEffect(() => {
    setSelectedBedId(null);
    if (selectedRoomId) {
      refetchBeds();
    }
  }, [selectedRoomId, refetchBeds]);

  const rooms = React.useMemo(() => (((roomsResponse as any)?.data || []) as Room[]), [roomsResponse]);
  const beds = React.useMemo(() => {
    if (!selectedRoomId) return [] as Bed[];
    return (((bedsResponse as any)?.data || []) as Bed[]);
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
    setSelectedRoomId(null);
    setSelectedBedId(null);
    setPayments([]);
    setPagination(null);
    loadPayments(1, true, {
      selectedRoomId: null,
      selectedBedId: null,
    });
  }, [selectedPGLocationId]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === 1) {
        loadPayments(1, true);
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

  const loadPayments = async (
    page: number,
    reset: boolean = false,
    overrides?: Partial<{
      statusFilter: 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED';
      quickFilter: 'NONE' | 'LAST_WEEK' | 'LAST_MONTH';
      selectedMonth: string | null;
      selectedYear: number | null;
      selectedRoomId: number | null;
      selectedBedId: number | null;
    }>
  ) => {
    try {
      if (paymentsQuery.isFetching && !reset) return;
      if (!reset && pagination && page > pagination.totalPages) return;

      if (reset) {
        setPayments([]);
        setPagination(null);
      }

      const effectiveStatusFilter = overrides && 'statusFilter' in overrides ? overrides.statusFilter : statusFilter;
      const effectiveQuickFilter = overrides && 'quickFilter' in overrides ? overrides.quickFilter : quickFilter;
      const effectiveSelectedMonth = overrides && 'selectedMonth' in overrides ? overrides.selectedMonth : selectedMonth;
      const effectiveSelectedYear = overrides && 'selectedYear' in overrides ? overrides.selectedYear : selectedYear;
      const effectiveSelectedRoomId = overrides && 'selectedRoomId' in overrides ? overrides.selectedRoomId : selectedRoomId;
      const effectiveSelectedBedId = overrides && 'selectedBedId' in overrides ? overrides.selectedBedId : selectedBedId;
      
      const params: any = {
        page,
        limit: PAYMENTS_PAGE_LIMIT,
      };

      if (selectedPGLocationId) {
        params.pg_id = selectedPGLocationId;
      }

      const toISODate = (date: Date) => date.toISOString().split('T')[0];

      if (effectiveQuickFilter !== 'NONE') {
        const end = new Date();
        const start = new Date();
        if (effectiveQuickFilter === 'LAST_WEEK') {
          start.setDate(end.getDate() - 7);
        } else if (effectiveQuickFilter === 'LAST_MONTH') {
          start.setMonth(end.getMonth() - 1);
        }
        params.start_date = toISODate(start);
        params.end_date = toISODate(end);
      }

      if (effectiveStatusFilter !== 'ALL') params.status = effectiveStatusFilter;
      
      if (effectiveSelectedMonth && effectiveSelectedYear) {
        params.month = effectiveSelectedMonth;
        params.year = effectiveSelectedYear;
      }
      
      if (effectiveSelectedRoomId) params.room_id = effectiveSelectedRoomId;
      if (effectiveSelectedBedId) params.bed_id = effectiveSelectedBedId;
      
      params.append = !reset && page > 1;

      const result = await triggerGetPayments(params, false).unwrap();

      if (!params.append) {
        setPayments(result?.data || []);
      } else {
        setPayments((prev) => [...prev, ...(result?.data || [])]);
      }
      setPagination(result?.pagination || null);
      setCurrentPage(page);
      
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
    } finally {
    }
  };

  const onRefresh = async () => {
    setCurrentPage(1);
    setPayments([]);
    setPagination(null);
    await loadPayments(1, true);
  };

  const loadMorePayments = () => {
    if (paymentsQuery.isFetching) return;
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
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
    if (selectedMonth || selectedYear) count++;
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
    setShowFilters(false);
    setCurrentPage(1);
    setPayments([]);
    setPagination(null);
    loadPayments(1, true, {
      statusFilter: 'ALL',
      quickFilter: 'NONE',
      selectedMonth: null,
      selectedYear: null,
      selectedRoomId: null,
      selectedBedId: null,
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    setCurrentPage(1);
    setPayments([]);
    setPagination(null);
    loadPayments(1, true);
  };

  const applyQuickFilter = (filter: 'LAST_WEEK' | 'LAST_MONTH') => {
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
      await updatePaymentStatus({
        id: selectedPayment.s_no,
        status: 'PAID',
        payment_date: new Date().toISOString().split('T')[0],
      }).unwrap();

      showSuccessAlert('Payment marked as paid successfully');
      setShowStatusModal(false);
      setSelectedPayment(null);
      setCurrentPage(1);
      loadPayments(1, true);
    } catch (error: any) {
      showErrorAlert(error, 'Payment Error');
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
    <ScreenLayout
      backgroundColor={Theme.colors.background.blue}
      contentBackgroundColor={Theme.colors.background.secondary}
    >
      <ScreenHeader
        title="Rent Payments"
        subtitle={`${pagination?.total || 0} payments`}
        syncMobileHeaderBg={true}
        showBackButton={true}
        onBackPress={handleBack}
      />

      <View style={{ flex: 1 }}>
        <ErrorBanner
          error={errorText}
          title="Error Loading Payments"
          onRetry={() => {
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
            paymentsQuery.isFetching ? (
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
                  No Rent Payments Found
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                  {getFilterCount() > 0 ? 'Try adjusting your filters' : 'No payment records available'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            paymentsQuery.isFetching && currentPage > 1 ? (
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
                  <SkeletonLoader width={90} height={14} borderRadius={7} style={{ alignSelf: 'center' }} />
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
