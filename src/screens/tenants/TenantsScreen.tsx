import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../store';
import { fetchTenants, checkoutTenant } from '../../store/slices/tenantSlice';
import { Card } from '../../components/Card';
import { AnimatedButton } from '../../components/AnimatedButton';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../services/core/axiosInstance';
import { DatePicker } from '../../components/DatePicker';
import { showErrorAlert } from '../../utils/errorHandler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TenantsScreenProps {
  navigation: any;
}

export const TenantsScreen: React.FC<TenantsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { tenants, pagination, loading } = useSelector((state: RootState) => state?.tenants);
  const { selectedPGLocationId } = useSelector((state: RootState) => state?.pgLocations);
  const { user } = useSelector((state: RootState) => state?.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingRentFilter, setPendingRentFilter] = useState(false);
  const [pendingAdvanceFilter, setPendingAdvanceFilter] = useState(false);
  const [partialRentFilter, setPartialRentFilter] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const [expandedPaymentCards, setExpandedPaymentCards] = useState<Set<number>>(new Set());
  const flatListRef = React.useRef<any>(null);
  const scrollPositionRef = React.useRef(0);
  
  // Checkout modal state
  
  // Toggle payment details for a tenant
  const togglePaymentDetails = (tenantId: number) => {
    setExpandedPaymentCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };
  
  // Get unique rooms from tenants
  const rooms = React.useMemo(() => {
    const uniqueRooms = tenants
      .filter(t => t.rooms)
      .map(t => t.rooms)
      .filter((room, index, self) => 
        room && self.findIndex(r => r?.s_no === room.s_no) === index
      );
    return uniqueRooms;
  }, [tenants]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true);
    setShouldReloadOnFocus(true); // Mark that we need to reload on next focus
  }, [selectedPGLocationId]); // Only reload when PG location changes, not on filter changes

  // Track if we need to reload data (only when filters change, not on navigation return)
  const [shouldReloadOnFocus, setShouldReloadOnFocus] = useState(false);

  // Reload tenants when screen comes into focus (only if needed)
  useFocusEffect(
    React.useCallback(() => {
      // Check if refresh parameter was passed
      const route = navigation.getState();
      const currentRoute = route.routes[route.index];
      const shouldRefresh = currentRoute?.params?.refresh;
      
      if (shouldRefresh) {
        console.log('Refresh parameter detected, refreshing tenant list');
        setCurrentPage(1);
        setHasMore(true);
        loadTenants(1, true);
        // Clear the refresh parameter
        navigation.setParams({ refresh: undefined });
      } else if (shouldReloadOnFocus || tenants.length === 0) {
        setCurrentPage(1);
        setHasMore(true);
        loadTenants(1, true);
        setShouldReloadOnFocus(false);
      } else {
        // Restore scroll position when returning from navigation
        setTimeout(() => {
          if (flatListRef.current && scrollPositionRef.current > 0) {
            flatListRef.current.scrollToOffset({ 
              offset: scrollPositionRef.current, 
              animated: false 
            });
          }
        }, 100); // Small delay to ensure list is rendered
      }
    }, [shouldReloadOnFocus, tenants.length, navigation])
  );

  const loadTenants = async (page: number, reset: boolean = false) => {
    try {
      if (isPageLoading) return;
      if (!hasMore && !reset) return;
      
      setIsPageLoading(true);
      
      // When room filter is active, fetch all tenants from that room
      const isRoomFiltered = selectedRoomId !== null;
      
      const params = {
        page: isRoomFiltered ? 1 : page,
        limit: isRoomFiltered ? 1000 : 20, // Increased from 10 to 20 for better infinite scroll
        pg_id: selectedPGLocationId || undefined,
        organization_id: user?.organization_id || undefined,
        user_id: user?.s_no || undefined,
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        room_id: selectedRoomId !== null ? selectedRoomId : undefined,
        pending_rent: pendingRentFilter ? true : undefined,
        pending_advance: pendingAdvanceFilter ? true : undefined,
        partial_rent: partialRentFilter ? true : undefined,
      };
      
      console.log('Loading tenants with params:', params);
      const result = await dispatch(fetchTenants({ ...params, append: !reset && page > 1 })).unwrap();
      setFetchError(null);
      
      // Debug: Log tenant statuses when using pending filter
      if (pendingRentFilter && result.data) {
        console.log('Pending filter active - tenant statuses:', result.data.map(t => ({
          name: t.name,
          is_rent_paid: t.is_rent_paid,
          is_rent_partial: t.is_rent_partial,
          pending_months: t.pending_months,
          rent_due_amount: t.rent_due_amount,
          partial_due_amount: t.partial_due_amount,
          pending_due_amount: t.pending_due_amount,
          tenant_payments: t.tenant_payments?.map(p => ({ status: p.status, amount: p.amount_paid }))
        })));
      }
      
      setHasMore(result.pagination ? page < result.pagination.totalPages : false);
      setCurrentPage(reset ? 1 : page);
      
      // Scroll to top when resetting
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load tenants. Please try again.';
      setFetchError(errorMessage);
    } finally {
      setIsPageLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadTenants(1, true);
    setRefreshing(false);
  };

  const applyFilters = () => {
    console.log('Applying filters:', {
      statusFilter,
      selectedRoomId,
      pendingRentFilter,
      pendingAdvanceFilter,
      partialRentFilter
    });
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true);
  };

  const handleSearch = () => {
    loadTenants(1);
  };

  const loadMoreTenants = () => {
    if (!hasMore || loading || selectedRoomId !== null || isPageLoading) return;
    
    const nextPage = currentPage + 1;
    loadTenants(nextPage, false);
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


  const clearFilters = () => {
    setStatusFilter('ALL');
    setSelectedRoomId(null);
    setPendingRentFilter(false);
    setPendingAdvanceFilter(false);
    setPartialRentFilter(false);
    // Apply the cleared filters
    setTimeout(() => {
      applyFilters();
    }, 100);
  };

  const getFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (selectedRoomId !== null) count++;
    if (pendingRentFilter) count++;
    if (pendingAdvanceFilter) count++;
    if (partialRentFilter) count++;
    return count;
  };

  const renderTenantCard = ({ item }: any) => {
    // Get tenant image
    const tenantImage = item.images && Array.isArray(item.images) && item.images.length > 0 
      ? item.images[0] 
      : null;

    const showPaymentDetails = expandedPaymentCards.has(item.s_no);
    
    // Use new API enriched status fields
    const isRentPaid = item.is_rent_paid || false;
    const isRentPartial = item.is_rent_partial || false;
    const rentDueAmount = item.rent_due_amount || 0;
    const partialDueAmount = item.partial_due_amount || 0;
    const pendingDueAmount = item.pending_due_amount || 0;
    const isAdvancePaid = item.is_advance_paid || false;
    const pendingMonths = item.pending_months || 0;
    
    // Get new rent cycle information
    const rentCycle = item.rent_cycle;
    const paymentStatus = item.payment_status || 'NO_PAYMENT';
    const unpaidMonths = item.unpaid_months || [];
    
    // Get partial payments information
    const partialPayments = item.partial_payments || [];
    const totalPartialDue = item.total_partial_due || 0;
    
    // Determine payment status for display
    const hasOutstandingAmount = rentDueAmount > 0;
    const hasBothPartialAndPending = partialDueAmount > 0 && pendingDueAmount > 0;

    return (
      <AnimatedPressableCard
        onPress={() => navigation.navigate('TenantDetails', { tenantId: item.s_no })}
        scaleValue={0.97}
        duration={120}
        style={{ marginBottom: 12 }}
      >
        <Card style={{ 
          padding: 12,
          borderLeftWidth: hasOutstandingAmount ? 4 : 0,
          borderLeftColor: isRentPartial ? '#F97316' : '#F59E0B',
        }}>
        {/* Header with Image */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          {/* Tenant Image/Avatar */}
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: Theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            overflow: 'hidden',
          }}>
            {tenantImage ? (
              <Image 
                source={{ uri: tenantImage }} 
                style={{ width: 60, height: 60 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name and ID */}
          <View style={{ flex: 1 }}>
            {/* Name Row */}
            <Text 
              style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: Theme.colors.text.primary,
                marginBottom: 4
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            
            {/* Room & Bed Info Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {item.rooms && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>🏠</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontWeight: '500' }}>
                    {item.rooms.room_no}
                  </Text>
                </View>
              )}
              {item.beds && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>🛏️</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontWeight: '500' }}>
                    {item.beds.bed_no}
                  </Text>
                </View>
              )}
              {item.rooms?.rent_price && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>💰</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.primary, fontWeight: '600' }}>
                    ₹{item.rooms.rent_price}/mo
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tenant Status Badge (ACTIVE/INACTIVE) */}
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: item.status === 'ACTIVE' ? '#10B98120' : '#EF444420',
            alignSelf: 'flex-start',
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '600',
              color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444',
            }}>
              {item.status}
            </Text>
          </View>
        </View>

      {/* Contact Info */}
      <View style={{ marginBottom: 12 }}>
        {item.occupation && (
          <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>
            💼 {item.occupation}
          </Text>
        )}
      </View>

      {/* Payment Status Section - Medium Badges */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.secondary, marginBottom: 6 }}>
          Payment Status
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
          {/* Paid Status Badge */}
          {isRentPaid && (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: '#10B981',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                ✅ PAID
              </Text>
            </View>
          )}
          {isAdvancePaid && (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: '#10B981',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                ✅ Advance Paid
              </Text>
            </View>
          )}
          {/* Partial Status Badge */}
          {isRentPartial && (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: '#F97316',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                ⏳ PARTIAL
              </Text>
            </View>
          )}
          
          {/* Pending Status Badge */}
          {!isRentPaid && (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: '#F59E0B',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                📅 PENDING
              </Text>
            </View>
          )}
          
          {/* Due Amount Badge */}
          {hasOutstandingAmount && (
            <View style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 11,
              backgroundColor: '#EF4444',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                ₹{rentDueAmount} DUE
              </Text>
            </View>
          )}
          
          {/* No Advance Badge */}
          {!isAdvancePaid && (
            <View style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 11,
              backgroundColor: '#F59E0B',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
              }}>
                💰 NO ADVANCE
              </Text>
            </View>
          )}
        </View>
      </View>


      {/* Pending Payment Alert - Using enriched API fields */}
      {hasOutstandingAmount && (
        <View style={{
          backgroundColor: isRentPartial ? '#FFF7ED' : '#FEF3C7',
          borderLeftWidth: 4,
          borderLeftColor: isRentPartial ? '#F97316' : '#F59E0B',
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '700', 
              color: isRentPartial ? '#EA580C' : '#D97706'
            }}>
              {hasBothPartialAndPending ? '⏳ PARTIAL + PENDING' :
               isRentPartial ? '⏳ PARTIAL PAYMENT' : '📅 PENDING PAYMENT'}
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '700', 
                color: isRentPartial ? '#EA580C' : '#D97706'
              }}>
                ₹{rentDueAmount}
              </Text>
              <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>
                Due Amount
              </Text>
            </View>
          </View>
          
          {/* Show breakdown if both partial and pending amounts exist */}
          {partialDueAmount > 0 && pendingDueAmount > 0 && (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 10, color: Theme.colors.text.secondary }}>
                Partial: ₹{partialDueAmount} • Pending: ₹{pendingDueAmount}
              </Text>
            </View>
          )}
          
          {/* Show unpaid months info if available */}
          {unpaidMonths.length > 0 && (
            <View>
              <Text style={{ fontSize: 11, color: '#D97706', marginBottom: 4 }}>
                📅 {unpaidMonths.length} unpaid month(s):
              </Text>
              {unpaidMonths.slice(0, 2).map((month: any, index: number) => (
                <Text key={index} style={{ fontSize: 10, color: '#D97706', marginBottom: 2 }}>
                  • {month.month_name} ({month.cycle_start} to {month.cycle_end})
                </Text>
              ))}
              {unpaidMonths.length > 2 && (
                <Text style={{ fontSize: 10, color: '#D97706' }}>
                  +{unpaidMonths.length - 2} more
                </Text>
              )}
            </View>
          )}
          
          {!isAdvancePaid && (
            <Text style={{ fontSize: 11, color: '#F59E0B' }}>
              💰 No advance payment
            </Text>
          )}
        </View>
      )}

      {/* Payment Summary - Collapsible */}
      {(item.tenant_payments?.length > 0 || item.advance_payments?.length > 0 || item.refund_payments?.length > 0) && (
        <View style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 8,
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          {/* Header - Always Visible */}
          <TouchableOpacity
            onPress={() => togglePaymentDetails(item.s_no)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
              💰 Payment History
            </Text>
            <Text style={{ fontSize: 16, color: Theme.colors.text.secondary }}>
              {showPaymentDetails ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Collapsible Content */}
          {showPaymentDetails && (
            <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
              {/* Regular Payments */}
              {item.tenant_payments && item.tenant_payments.length > 0 && (
                <View style={{ marginBottom: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
                    Rent Payments ({item.tenant_payments.length})
                  </Text>
                  {item.tenant_payments.slice(0, 3).map((payment: any, index: number) => (
                    <View key={index} style={{ 
                      backgroundColor: '#fff',
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: '#F1F5F9'
                    }}>
                      {/* Payment Header Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '500' }}>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </Text>
                          {payment.status && (
                            <View style={{
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: 
                                payment.status === 'PAID' ? '#10B98120' :
                                payment.status === 'PARTIAL' ? '#DC262620' :
                                payment.status === 'PENDING' ? '#F59E0B20' :
                                payment.status === 'FAILED' ? '#EF444420' : '#9CA3AF20',
                            }}>
                              <Text style={{
                                fontSize: 8,
                                fontWeight: '700',
                                color: 
                                  payment.status === 'PAID' ? '#10B981' :
                                  payment.status === 'PARTIAL' ? '#DC2626' :
                                  payment.status === 'PENDING' ? '#F59E0B' :
                                  payment.status === 'FAILED' ? '#EF4444' : '#6B7280',
                              }}>
                                {payment.status}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.primary, fontWeight: '700' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                      
                      {/* Rent Period Row */}
                      {payment.start_date && payment.end_date && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 9, color: Theme.colors.text.tertiary }}>
                            Period: {new Date(payment.start_date).toLocaleDateString()} - {new Date(payment.end_date).toLocaleDateString()}
                          </Text>
                          {payment.actual_rent_amount && (
                            <Text style={{ fontSize: 9, color: Theme.colors.text.tertiary }}>
                              Rent: ₹{payment.actual_rent_amount}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                  {item.tenant_payments.length > 3 && (
                    <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, fontStyle: 'italic' }}>
                      +{item.tenant_payments.length - 3} more
                    </Text>
                  )}
                </View>
              )}
              
              {/* Advance Payments */}
              {item.advance_payments && item.advance_payments.length > 0 && (
                <View style={{ marginBottom: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981', marginBottom: 4 }}>
                    Advance Payments ({item.advance_payments.length})
                  </Text>
                  {item.advance_payments.map((payment: any, index: number) => (
                    <View key={index} style={{ 
                      backgroundColor: '#F0FDF4',
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: '#BBF7D0'
                    }}>
                      {/* Payment Header Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 10, color: '#15803D', fontWeight: '500' }}>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </Text>
                          {payment.status && (
                            <View style={{
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: 
                                payment.status === 'PAID' ? '#10B98130' :
                                payment.status === 'PARTIAL' ? '#DC262630' :
                                payment.status === 'PENDING' ? '#F59E0B30' :
                                payment.status === 'FAILED' ? '#EF444430' : '#9CA3AF30',
                            }}>
                              <Text style={{
                                fontSize: 8,
                                fontWeight: '700',
                                color: 
                                  payment.status === 'PAID' ? '#10B981' :
                                  payment.status === 'PARTIAL' ? '#DC2626' :
                                  payment.status === 'PENDING' ? '#F59E0B' :
                                  payment.status === 'FAILED' ? '#EF4444' : '#6B7280',
                              }}>
                                {payment.status}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                      
                      {/* Advance Details Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: '#15803D', opacity: 0.8 }}>
                          💰 Advance Payment
                        </Text>
                        {payment.actual_rent_amount && (
                          <Text style={{ fontSize: 9, color: '#15803D', opacity: 0.8 }}>
                            Monthly Rent: ₹{payment.actual_rent_amount}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                  <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 2 }}>
                    Total: ₹{item.advance_payments.reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0)}
                  </Text>
                </View>
              )}
              
              {/* Refund Payments */}
              {item.refund_payments && item.refund_payments.length > 0 && (
                <View style={{ paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B', marginBottom: 4 }}>
                    Refunds ({item.refund_payments.length})
                  </Text>
                  {item.refund_payments.map((payment: any, index: number) => (
                    <View key={index} style={{ 
                      backgroundColor: '#FFFBEB',
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: '#FED7AA'
                    }}>
                      {/* Payment Header Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '500' }}>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </Text>
                          {payment.status && (
                            <View style={{
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: 
                                payment.status === 'PAID' ? '#10B98130' :
                                payment.status === 'PENDING' ? '#F59E0B30' : '#9CA3AF30',
                            }}>
                              <Text style={{
                                fontSize: 8,
                                fontWeight: '700',
                                color: 
                                  payment.status === 'PAID' ? '#10B981' :
                                  payment.status === 'PENDING' ? '#F59E0B' : '#6B7280',
                              }}>
                                {payment.status}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '700' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                      
                      {/* Refund Details Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: '#D97706', opacity: 0.8 }}>
                          🔄 Refund Payment
                        </Text>
                        {payment.actual_rent_amount && (
                          <Text style={{ fontSize: 9, color: '#D97706', opacity: 0.8 }}>
                            Original Rent: ₹{payment.actual_rent_amount}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                  <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '600', marginTop: 2 }}>
                    Total: ₹{item.refund_payments.reduce((sum: number, p: any) => sum + p.amount_paid, 0)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Check-in Date */}
      <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 12 }}>
        Check-in: {new Date(item.check_in_date).toLocaleDateString()}
      </Text>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <AnimatedButton
          onPress={() => navigation.navigate('TenantDetails', { tenantId: item.s_no })}
          scaleValue={0.94}
          duration={120}
          style={{
            flex: 1,
            minWidth: 100,
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: Theme.colors.primary,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>View Details</Text>
        </AnimatedButton>
      </View>
        </Card>
      </AnimatedPressableCard>
    );
  };


  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} >
      <ScreenHeader title="Tenants" subtitle={`${pagination?.total || 0} total`} />
    {/* Search & Filter Bar */}
      <View style={{  padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Theme.colors.background.secondary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
            }}
            placeholder="Search by name, phone, ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={handleSearch}
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: getFilterCount() > 0 ? Theme.colors.primary : Theme.colors.light,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="filter" size={18} color={getFilterCount() > 0 ? '#fff' : Theme.colors.text.primary} />
            {getFilterCount() > 0 && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary }}>
                  {getFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      
     
      {/* Filter Modal Overlay */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: SCREEN_HEIGHT * 0.7,
              }}
            >
              {/* Handle Bar */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: Theme.colors.border,
                    borderRadius: 2,
                  }}
                />
              </View>

              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: Theme.colors.border,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary }}>
                    Filter Tenants
                  </Text>
                  {getFilterCount() > 0 && (
                    <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 2 }}>
                      {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} active
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Theme.colors.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Filter Content */}
              <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }} contentContainerStyle={{ padding: 20 }}>
                {/* Status Filter */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                    Filter by Status
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => setStatusFilter(status as any)}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 8,
                          backgroundColor: statusFilter === status ? Theme.colors.primary : '#fff',
                          borderWidth: 1,
                          borderColor: statusFilter === status ? Theme.colors.primary : Theme.colors.border,
                          alignItems: 'center',
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

                {/* Room Filter */}
                {rooms.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                      Filter by Room
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setSelectedRoomId(null)}
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
                          onPress={() => setSelectedRoomId(room.s_no)}
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

                {/* Payment Filters */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                    Payment Filters
                  </Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 12 }}>
                    Select one payment filter (mutually exclusive)
                  </Text>
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (pendingRentFilter) {
                          // If already selected, deselect it
                          setPendingRentFilter(false);
                        } else {
                          // Select this one and deselect others
                          setPendingRentFilter(true);
                          setPendingAdvanceFilter(false);
                          setPartialRentFilter(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: pendingRentFilter ? '#EF4444' : '#fff',
                        borderWidth: 1,
                        borderColor: pendingRentFilter ? '#EF4444' : Theme.colors.border,
                        gap: 8,
                      }}
                    >
                      <Ionicons 
                        name={pendingRentFilter ? "radio-button-on" : "radio-button-off"} 
                        size={20} 
                        color={pendingRentFilter ? '#fff' : Theme.colors.text.secondary} 
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: pendingRentFilter ? '#fff' : Theme.colors.text.secondary,
                        }}
                      >
                        ⚠️ Pending Rent
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (pendingAdvanceFilter) {
                          // If already selected, deselect it
                          setPendingAdvanceFilter(false);
                        } else {
                          // Select this one and deselect others
                          setPendingAdvanceFilter(true);
                          setPendingRentFilter(false);
                          setPartialRentFilter(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: pendingAdvanceFilter ? '#F59E0B' : '#fff',
                        borderWidth: 1,
                        borderColor: pendingAdvanceFilter ? '#F59E0B' : Theme.colors.border,
                        gap: 8,
                      }}
                    >
                      <Ionicons 
                        name={pendingAdvanceFilter ? "radio-button-on" : "radio-button-off"} 
                        size={20} 
                        color={pendingAdvanceFilter ? '#fff' : Theme.colors.text.secondary} 
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: pendingAdvanceFilter ? '#fff' : Theme.colors.text.secondary,
                        }}
                      >
                        💰 No Advance
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (partialRentFilter) {
                          // If already selected, deselect it
                          setPartialRentFilter(false);
                        } else {
                          // Select this one and deselect others
                          setPartialRentFilter(true);
                          setPendingRentFilter(false);
                          setPendingAdvanceFilter(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: partialRentFilter ? '#F97316' : '#fff',
                        borderWidth: 1,
                        borderColor: partialRentFilter ? '#F97316' : Theme.colors.border,
                        gap: 8,
                      }}
                    >
                      <Ionicons 
                        name={partialRentFilter ? "radio-button-on" : "radio-button-off"} 
                        size={20} 
                        color={partialRentFilter ? '#fff' : Theme.colors.text.secondary} 
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: partialRentFilter ? '#fff' : Theme.colors.text.secondary,
                        }}
                      >
                        ⏳ Partial Rent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Footer Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 20,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: Theme.colors.border,
                }}
              >
                {getFilterCount() > 0 && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: Theme.colors.light,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: Theme.colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Room Filter Active Indicator */}
      {selectedRoomId !== null && (
        <View style={{
          backgroundColor: '#EFF6FF',
          borderLeftWidth: 4,
          borderLeftColor: Theme.colors.primary,
          padding: 12,
          marginHorizontal: 16,
          marginTop: 8,
          borderRadius: 8,
        }}>
          <Text style={{ 
            color: Theme.colors.primary, 
            fontWeight: '600',
            fontSize: 13,
          }}>
            🏠 Showing all tenants from selected room ({tenants.length} total)
          </Text>
        </View>
      )}

      {/* Scroll Position Indicator */}
      {visibleItemsCount > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 160,
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
            {visibleItemsCount} of {pagination?.total || tenants.length}
          </Text>
          <Text style={{ 
            fontSize: 10, 
            color: '#fff',
            opacity: 0.8,
            textAlign: 'center',
            marginTop: 2,
          }}>
            {(pagination?.total || tenants.length) - visibleItemsCount} remaining
          </Text>
        </View>
      )}

      {/* Tenants List */}
      {loading && tenants.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading tenants...</Text>
        </View>
      ) : (
        <>
          {fetchError && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                backgroundColor: '#FEF3C7',
                borderWidth: 1,
                borderColor: '#FCD34D',
              }}
            >
              <Text style={{ color: '#92400E', fontWeight: '600', marginBottom: 4 }}>
                Unable to refresh tenant list
              </Text>
              <Text style={{ color: '#B45309', fontSize: 13, marginBottom: 8 }}>
                {fetchError}
              </Text>
              <TouchableOpacity
                onPress={() => loadTenants(currentPage, tenants.length === 0)}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: '#F59E0B',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <FlatList
          ref={flatListRef}
          data={tenants}
          renderItem={renderTenantCard}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>No Tenants Found</Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                {selectedRoomId ? 'No tenants in this room' : 'Add your first tenant to get started'}
              </Text>
            </View>
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
          onEndReached={loadMoreTenants}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={(event) => {
            scrollPositionRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        />
        </>
      )}


    </View>
    </ScreenLayout>
  );
};
