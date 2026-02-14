import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Theme } from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useBottomNavScrollHandler } from '../../components/BottomNavVisibility';
import { Card } from '../../components/Card';
import { QuickActions } from '../../components/QuickActions';
import { MonthlyMetricsCard } from './MonthlyMetricsCard';
import { Ionicons } from '@expo/vector-icons';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import {
  useGetPGLocationsQuery,
} from '../../services/api/pgLocationsApi';
import type { DashboardSummaryResponse, DashboardMonthlyMetricsResponse } from '../../services/api/dashboardApi';
import { useGetDashboardSummaryQuery, useLazyGetDashboardMonthlyMetricsQuery } from '../../services/api/dashboardApi';
import type { Tenant } from '../../services/api/tenantsApi';
import { usePermissions } from '../../hooks/usePermissions';

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

export const DashboardScreen: React.FC = () => {
  // All hooks must be called at the top level
  const navigation = useNavigation<NavigationProp<Record<DashboardRouteName, undefined>>>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [attentionTab, setAttentionTab] = useState<'pending_rent' | 'partial_rent' | 'without_advance'>('pending_rent');
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);
  const {
    onScroll: bottomNavOnScroll,
    scrollEventThrottle: bottomNavThrottle,
    onScrollEndDrag: bottomNavOnScrollEndDrag,
    onMomentumScrollEnd: bottomNavOnMomentumScrollEnd,
  } = useBottomNavScrollHandler();

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
  const selectedLocationName =
    (locations as Array<{ s_no?: number; location_name?: string }>).find((l) => l?.s_no === selectedPGLocationId)
      ?.location_name ?? 'our PG';

  const {
    data: dashboardSummaryResponse,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
    error: dashboardError,
  } = useGetDashboardSummaryQuery(undefined, {
    skip: !selectedPGLocationId,
  });

  const dashboardSummary = (dashboardSummaryResponse as DashboardSummaryResponse<Tenant> | undefined)?.data;
  const bedMetrics = dashboardSummary?.bed_metrics;
  const tenantStatus = dashboardSummary?.tenant_status;

  const [getMonthlyMetrics, { data: monthlyMetricsResponse, isFetching: monthlyMetricsFetching }] = useLazyGetDashboardMonthlyMetricsQuery();

  const monthlyMetrics = (monthlyMetricsResponse as DashboardMonthlyMetricsResponse | undefined)?.data;

  // Load initial monthly metrics
  useEffect(() => {
    if (selectedPGLocationId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
      const monthEnd = new Date(year, month + 1, 1).toISOString().split('T')[0];
      getMonthlyMetrics({ monthStart, monthEnd });
    }
  }, [selectedPGLocationId, getMonthlyMetrics]);

  const handleDateRangeChange = useCallback((monthStart?: string, monthEnd?: string) => {
    getMonthlyMetrics({ monthStart, monthEnd });
  }, [getMonthlyMetrics]);

  const dashboardQuickActions = useMemo(
    () => [
      { title: 'PG Locations', icon: 'business', screen: 'PGLocations', color: '#06B6D4' },
      { title: 'Tenants', icon: 'people', screen: 'Tenants', color: '#06B6D4' },
      { title: 'Employees', icon: 'people', screen: 'Employees', color: '#A855F7' },
      { title: 'Rooms', icon: 'home', screen: 'Rooms', color: '#22C55E' },
      { title: 'Beds', icon: 'bed', screen: 'Beds', color: '#3B82F6' },
      { title: 'Rent', icon: 'cash', screen: 'RentPayments', color: '#0EA5E9' },
      { title: 'Advance', icon: 'card', screen: 'AdvancePayments', color: '#F97316' },
      { title: 'Refund', icon: 'return-down-back', screen: 'RefundPayments', color: '#EF4444' },
      { title: 'Expenses', icon: 'receipt', screen: 'Expenses', color: '#EAB308' },
    ],
    [],
  );

  const handleQuickActionNavigate = useCallback(
    (screen: string) => {
      navigation.navigate(screen as never);
    },
    [navigation],
  );

  const getGapSnapshotForTab = useCallback(
    (
      tab: 'pending_rent' | 'partial_rent' | 'without_advance',
      tenant?: Tenant,
    ): {
      gapCount: number;
      gapDueAmount?: number;
      gaps: Array<{ gapStart?: unknown; gapEnd?: unknown }>;
    } => {
      if (!tenant) return { gapCount: 0, gapDueAmount: undefined, gaps: [] };

      const readNum = (v: unknown): number | undefined => {
        const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
        return Number.isFinite(n) ? n : undefined;
      };

      const readCount = (v: unknown): number => {
        const n = readNum(v);
        return typeof n === 'number' ? n : 0;
      };

      if (tab === 'pending_rent') {
        return {
          gapCount: readCount((tenant as unknown as { pending_gap_count?: unknown })?.pending_gap_count),
          gapDueAmount: readNum((tenant as unknown as { pending_gap_due_amount?: unknown })?.pending_gap_due_amount),
          gaps:
            (tenant as unknown as { pending_gaps?: Array<{ gapStart?: unknown; gapEnd?: unknown }> })?.pending_gaps ??
            [],
        };
      }

      if (tab === 'partial_rent') {
        return {
          gapCount: readCount((tenant as unknown as { partial_gap_count?: unknown })?.partial_gap_count),
          gapDueAmount: readNum((tenant as unknown as { partial_gap_due_amount?: unknown })?.partial_gap_due_amount),
          gaps:
            (tenant as unknown as { partial_gaps?: Array<{ gapStart?: unknown; gapEnd?: unknown }> })?.partial_gaps ??
            [],
        };
      }

      // Fallback for without advance: keep legacy gap fields (if present)
      return {
        gapCount: readCount((tenant as unknown as { gap_count?: unknown })?.gap_count),
        gapDueAmount: readNum((tenant as unknown as { gap_due_amount?: unknown })?.gap_due_amount),
        gaps: (tenant as unknown as { gaps?: Array<{ gapStart?: unknown; gapEnd?: unknown }> })?.gaps ?? [],
      };
    },
    [],
  );

  const normalizePhone = (raw?: string) => {
    if (!raw) return '';
    const digits = String(raw).replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  const buildWhatsAppTemplate = (
    type: 'pending_rent' | 'partial_rent' | 'without_advance',
    tenant?: Tenant,
  ): string | null => {
    const name = tenant?.name?.trim() ? tenant.name.trim() : 'there';

    const { gapCount, gapDueAmount, gaps } = getGapSnapshotForTab(type, tenant);

    const gapPeriodsLine = (() => {
      if (!Array.isArray(gaps) || gaps.length === 0) return '';
      const first = gaps
        .slice(0, 2)
        .map((g) => {
          const s = String(g?.gapStart ?? '').trim();
          const e = String(g?.gapEnd ?? '').trim();
          if (!s || !e) return '';
          return `${s} to ${e}`;
        })
        .filter(Boolean);
      if (first.length === 0) return '';
      return `\n🗓️ Due period(s): ${first.join(', ')}`;
    })();

    const pendingAmount =
      typeof gapDueAmount === 'number'
        ? gapDueAmount
        : typeof tenant?.pending_due_amount === 'number'
        ? tenant.pending_due_amount
        : typeof tenant?.rent_due_amount === 'number'
          ? tenant.rent_due_amount
          : typeof tenant?.pending_payment?.total_pending === 'number'
            ? tenant.pending_payment.total_pending
            : undefined;

    const remainingPartial =
      typeof gapDueAmount === 'number'
        ? gapDueAmount
        : typeof tenant?.partial_due_amount === 'number'
        ? tenant.partial_due_amount
        : typeof tenant?.pending_payment?.current_month_pending === 'number'
          ? tenant.pending_payment.current_month_pending
          : undefined;

    const amountLine = (amount?: number) => {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return '';
      return `\n📌 Amount due: ${formatCurrency(amount)}`;
    };

    const monthsLine = (months?: number) => {
      if (typeof months !== 'number' || !Number.isFinite(months) || months <= 0) return '';
      return `\n🗓️ Pending months: ${months}`;
    };

    if (type === 'pending_rent') {
      if (typeof pendingAmount !== 'number' || !Number.isFinite(pendingAmount) || pendingAmount <= 0) {
        return null;
      }
      return (
        `Hi ${name},\n\n` +
        `💰 This is ${selectedLocationName} management. Friendly reminder that your rent is pending.` +
        amountLine(pendingAmount) +
        (gapCount > 0 ? `\n📍 Missed cycles: ${gapCount}` : '') +
        gapPeriodsLine +
        monthsLine(tenant?.pending_months) +
        `\n\n✅ Kindly make the payment at your earliest convenience.\n` +
        `If you have already paid, please share the confirmation.\n\n` +
        `🙏 Thank you.`
      );
    }

    if (type === 'partial_rent') {
      if (typeof remainingPartial !== 'number' || !Number.isFinite(remainingPartial) || remainingPartial <= 0) {
        return null;
      }
      return (
        `Hi ${name},\n\n` +
        `💰 This is ${selectedLocationName} management. We have received a partial rent payment.` +
        amountLine(remainingPartial) +
        (gapCount > 0 ? `\n📍 Missed cycles: ${gapCount}` : '') +
        gapPeriodsLine +
        `\n\n✅ Kindly pay the remaining amount at your earliest convenience.\n` +
        `If there is any issue, please message us—we will help.\n\n` +
        `🙏 Thank you.`
      );
    }

    return (
      `Hi ${name},\n\n` +
      `🧾 This is ${selectedLocationName} management. Gentle reminder regarding your advance/security deposit.` +
      `\n\n✅ Kindly pay it at your earliest convenience to complete the onboarding formalities.` +
      `\n📎 If you have already paid, please share the receipt/confirmation.` +
      `\n\n🙏 Thank you.`
    );
  };

  const openCall = async (raw?: string) => {
    const digits = normalizePhone(raw);
    if (!digits) {
      Alert.alert('No phone number', 'This tenant does not have a phone number.');
      return;
    }

    try {
      const url = `tel:${digits}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Cannot place call', 'Calling is not supported on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Call failed', 'Unable to open phone dialer.');
    }
  };

  const openWhatsApp = async (raw?: string, message?: string) => {
    const digits = normalizePhone(raw);
    if (!digits) {
      Alert.alert('No WhatsApp number', 'This tenant does not have a WhatsApp number.');
      return;
    }

    try {
      const encodedText = message ? encodeURIComponent(message) : '';
      const appUrl = encodedText
        ? `whatsapp://send?phone=${digits}&text=${encodedText}`
        : `whatsapp://send?phone=${digits}`;
      const webUrl = encodedText ? `https://wa.me/${digits}?text=${encodedText}` : `https://wa.me/${digits}`;

      const canApp = await Linking.canOpenURL(appUrl);
      const urlToOpen = canApp ? appUrl : webUrl;
      const can = await Linking.canOpenURL(urlToOpen);

      if (!can) {
        Alert.alert('WhatsApp not available', 'WhatsApp is not installed or cannot be opened on this device.');
        return;
      }

      await Linking.openURL(urlToOpen);
    } catch {
      Alert.alert('WhatsApp failed', 'Unable to open WhatsApp for this tenant.');
    }
  };

  const formatCurrency = (amount?: number) => {
    const n = Number(amount ?? 0);
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `₹${Math.round(n)}`;
    }
  };

  const getInitials = (name?: string) => {
    const n = String(name ?? '').trim();
    if (!n) return 'T';
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'T';
    const b = parts.length > 1 ? (parts[1]?.[0] ?? '') : '';
    return (a + b).toUpperCase();
  };

  const widgetItems = useMemo(
    () =>
      [
        {
          key: 'pending_rent' as const,
          title: 'Pending Rent',
          subtitle: 'Collect dues quickly',
          tint: '#EF4444',
          icon: 'alert-circle' as const,
          count: (() => {
            const list = (tenantStatus?.pending_rent?.tenants ?? []) as Tenant[];
            const fallback = (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[];
            const union = [...list, ...fallback].filter((t) => {
              const snap = getGapSnapshotForTab('pending_rent', t);
              return snap.gapCount > 0 || (typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0);
            });
            const uniq = new Set<string>();
            union.forEach((t) => {
              const id = typeof t?.s_no === 'number' ? String(t.s_no) : '';
              if (id) uniq.add(id);
            });
            return uniq.size;
          })(),
          tenants: (() => {
            const list = (tenantStatus?.pending_rent?.tenants ?? []) as Tenant[];
            const fallback = (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[];
            const union = [...list, ...fallback].filter((t) => {
              const snap = getGapSnapshotForTab('pending_rent', t);
              return snap.gapCount > 0 || (typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0);
            });
            const seen = new Set<number>();
            return union.filter((t) => {
              const id = typeof t?.s_no === 'number' ? t.s_no : NaN;
              if (!Number.isFinite(id)) return false;
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          })(),
        },
        {
          key: 'partial_rent' as const,
          title: 'Partial Rent',
          subtitle: 'Follow-up needed',
          tint: '#F59E0B',
          icon: 'warning' as const,
          count: (() => {
            const list = (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[];
            const uniq = new Set<string>();
            list.forEach((t) => {
              const snap = getGapSnapshotForTab('partial_rent', t);
              if (snap.gapCount <= 0 && !(typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0)) return;
              const id = typeof t?.s_no === 'number' ? String(t.s_no) : '';
              if (id) uniq.add(id);
            });
            return uniq.size;
          })(),
          tenants: (() => {
            const list = (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[];
            return list.filter((t) => {
              const snap = getGapSnapshotForTab('partial_rent', t);
              return snap.gapCount > 0 || (typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0);
            });
          })(),
        },
        {
          key: 'without_advance' as const,
          title: 'No Advance',
          subtitle: 'Request security deposit',
          tint: '#3B82F6',
          icon: 'wallet' as const,
          count: tenantStatus?.without_advance?.count ?? 0,
          tenants: tenantStatus?.without_advance?.tenants ?? [],
        },
      ] as const,
    [getGapSnapshotForTab, tenantStatus],
  );

  const selectedAttention = widgetItems.find((w) => w.key === attentionTab) ?? widgetItems[0];

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
      await refetchDashboard();
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    if (selectedPGLocationId) {
      console.log('🔄 Refreshing dashboard data...');
      await loadAllDashboardData();
      console.log('🔄 Refreshing monthly metrics...');
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
      const monthEnd = new Date(year, month + 1, 1).toISOString().split('T')[0];
      getMonthlyMetrics({ monthStart, monthEnd });
    } else {
      console.log('🔄 Refreshing PG locations...');
      await refetchPGLocations();
    }
    
    setRefreshing(false);
  };
  return (
    <ScreenLayout
      backgroundColor={Theme.colors.background.blue}
      contentBackgroundColor={Theme.colors.background.secondary}
    >
      <ScreenHeader
        title="Dashboard"
        showPGSelector={true}
      />
      <View style={{ flex: 1, }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          onScroll={bottomNavOnScroll}
          scrollEventThrottle={bottomNavThrottle}
          onScrollEndDrag={bottomNavOnScrollEndDrag}
          onMomentumScrollEnd={bottomNavOnMomentumScrollEnd}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <View
              style={{
                backgroundColor: Theme.colors.background.blueMedium,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 18, fontWeight: '900' }}>
                    Owner Dashboard
                  </Text>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                    Track occupancy, revenue & follow-ups
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowOwnerInfo(true)}
                    activeOpacity={0.9}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Theme.colors.light,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="help-circle-outline" size={18} color={Theme.colors.text.secondary} />
                  </TouchableOpacity>

                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: Theme.colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#fff" />
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '800' }}>OCCUPANCY</Text>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 18, fontWeight: '900', marginTop: 4 }}>
                    {typeof bedMetrics?.occupancy_rate === 'number'
                      ? `${bedMetrics.occupancy_rate.toFixed(0)}%`
                      : dashboardFetching
                        ? '—'
                        : '0%'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 11, fontWeight: '800' }}>PG VALUE</Text>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '900', marginTop: 4 }}>
                    {bedMetrics ? formatCurrency(bedMetrics.total_pg_value) : dashboardFetching ? '—' : formatCurrency(0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <SlideBottomModal
            visible={showOwnerInfo}
            onClose={() => setShowOwnerInfo(false)}
            title="Dashboard explained"
            subtitle={selectedLocationName ? `For ${selectedLocationName}` : undefined}
            submitLabel="Got it"
            onSubmit={() => setShowOwnerInfo(false)}
          >
            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>Occupancy</Text>
                <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                  How many beds are currently occupied out of total beds.
                </Text>
              </View>

              <View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>PG Value</Text>
                <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                  Total monthly rent value of beds (overall capacity).
                </Text>
              </View>

            </View>
          </SlideBottomModal>

          <QuickActions
            menuItems={dashboardQuickActions}
            onNavigate={handleQuickActionNavigate}
            variant="horizontal"
            horizontalRows={2}
          />

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Card
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.10),
                  borderWidth: 1,
                  borderColor: Theme.withOpacity(Theme.colors.primary, 0.18),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '900' }}>Total Beds</Text>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Theme.colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="bed" size={14} color="#fff" />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 24, fontWeight: '900', marginTop: 10 }}>
                  {bedMetrics?.total_beds ?? (dashboardFetching ? '—' : 0)}
                </Text>
              </Card>

              <Card
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: Theme.withOpacity(Theme.colors.secondary, 0.10),
                  borderWidth: 1,
                  borderColor: Theme.withOpacity(Theme.colors.secondary, 0.18),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '900' }}>Occupied</Text>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Theme.colors.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                </View>
                <Text style={{ color: Theme.colors.text.primary, fontSize: 24, fontWeight: '900', marginTop: 10 }}>
                  {bedMetrics?.occupied_beds ?? (dashboardFetching ? '—' : 0)}
                </Text>
              </Card>
            </View>

            {!!dashboardError && (
              <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>
                Failed to load dashboard summary. Pull to refresh.
              </Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '800' }}>
              Attention Required
            </Text>
            <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Quick follow-ups for pending rent and advance
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Card
              shadowColor="shadow-none"
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: Theme.colors.border,
                backgroundColor: Theme.colors.background.secondary,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  backgroundColor: Theme.colors.light,
                  borderRadius: 14,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingRight: 6 }}
                >
                  {widgetItems.map((w) => {
                    const active = w.key === attentionTab;
                    return (
                      <TouchableOpacity
                        key={w.key}
                        onPress={() => setAttentionTab(w.key)}
                        style={{
                          minWidth: 120,
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          borderRadius: 12,
                          backgroundColor: active ? Theme.withOpacity(w.tint, 0.14) : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: active ? 1 : 0,
                          borderColor: active ? Theme.withOpacity(w.tint, 0.22) : 'transparent',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons
                            name={w.icon}
                            size={14}
                            color={active ? w.tint : Theme.colors.text.secondary}
                          />
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                              color: Theme.colors.text.primary,
                              fontSize: 12,
                              fontWeight: '800',
                              maxWidth: 90,
                            }}
                          >
                            {w.title}
                          </Text>
                        </View>
                        <View
                          style={{
                            marginTop: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 2,
                            borderRadius: 999,
                            backgroundColor: Theme.withOpacity(w.tint, active ? 0.18 : 0.10),
                            borderWidth: 1,
                            borderColor: Theme.withOpacity(w.tint, active ? 0.22 : 0.16),
                          }}
                        >
                          <Text style={{ color: w.tint, fontSize: 11, fontWeight: '900' }}>{w.count}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: Theme.withOpacity(selectedAttention?.tint ?? Theme.colors.primary, 0.14),
                        borderWidth: 1,
                        borderColor: Theme.withOpacity(selectedAttention?.tint ?? Theme.colors.primary, 0.22),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={(selectedAttention?.icon ?? 'alert-circle') as never}
                        size={16}
                        color={selectedAttention?.tint ?? Theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={{ color: Theme.colors.text.primary, fontSize: 14, fontWeight: '800' }}>
                        {selectedAttention?.title ?? 'Attention'}
                      </Text>
                      <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                        {selectedAttention?.subtitle ?? ''}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => navigation.navigate('Tenants')}>
                    <Text style={{ color: Theme.colors.primary, fontSize: 12, fontWeight: '800' }}>See all</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12 }}>
                  <View
                    style={{
                      minHeight: 320,
                      borderRadius: 14,
                      backgroundColor: Theme.colors.light,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    {!selectedAttention || selectedAttention.tenants.length === 0 ? (
                      <View style={{ flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle" size={22} color={'#10B981'} />
                        <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900', marginTop: 10 }}>
                          All good
                        </Text>
                        <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                          No tenants need attention in this section right now.
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 320 }}
                        contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
                      >
                        {selectedAttention.tenants.map((t: Tenant) => {
                        const phone = t.phone_no;
                        const whatsapp = t.whatsapp_number ?? t.phone_no;
                        const roomNo = t.rooms?.room_no;
                        const bedNo = t.beds?.bed_no;

                        const { gapCount, gapDueAmount, gaps } = getGapSnapshotForTab(attentionTab, t);

                        const duePeriodText = (() => {
                          if (attentionTab === 'without_advance') return null;
                          if (!Array.isArray(gaps) || gaps.length === 0) return 'Due period not available';
                          const first = gaps[0] as { gapStart?: unknown; gapEnd?: unknown };
                          const s = String(first?.gapStart ?? '').trim();
                          const e = String(first?.gapEnd ?? '').trim();
                          if (!s || !e) return 'Due period not available';
                          return `${s} to ${e}`;
                        })();

                        const openTenantDetails = () => {
                          if (typeof t?.s_no !== 'number') return;
                          (navigation as unknown as { navigate: (screen: string, params?: unknown) => void }).navigate(
                            'TenantDetails',
                            { tenantId: t.s_no },
                          );
                        };

                        const onPressWhatsApp = () => {
                          const msg = buildWhatsAppTemplate(attentionTab, t);
                          if (!msg) {
                            Alert.alert(
                              'Amount not available',
                              'Due amount is not available for this tenant. Please open tenant details and verify the pending amount.',
                            );
                            return;
                          }
                          openWhatsApp(whatsapp, msg);
                        };

                        return (
                          <TouchableOpacity
                            key={String(t.s_no)}
                            onPress={openTenantDetails}
                            activeOpacity={0.85}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: Theme.colors.border,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 12 }}>
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  backgroundColor: Theme.withOpacity(selectedAttention?.tint ?? Theme.colors.primary, 0.14),
                                  borderWidth: 1,
                                  borderColor: Theme.withOpacity(selectedAttention?.tint ?? Theme.colors.primary, 0.22),
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '900' }}>
                                  {getInitials(t.name)}
                                </Text>
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={{ color: Theme.colors.text.primary, fontSize: 13, fontWeight: '900' }}>
                                  {t.name ?? 'Tenant'}
                                </Text>
                                <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                                  {roomNo ? `Room ${roomNo}` : 'Room —'}
                                  {bedNo ? `  •  Bed ${bedNo}` : ''}
                                </Text>

                                {(gapCount > 0 || typeof gapDueAmount === 'number') && (
                                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                                    {typeof gapDueAmount === 'number' ? `Due ${formatCurrency(gapDueAmount)}` : ''}
                                    {gapCount > 0 ? `${typeof gapDueAmount === 'number' ? '  •  ' : ''}Gaps ${gapCount}` : ''}
                                  </Text>
                                )}

                                {!!duePeriodText && (
                                  <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                                    {duePeriodText}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <TouchableOpacity
                                onPress={() => openCall(phone)}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  backgroundColor: Theme.colors.light,
                                  borderWidth: 1,
                                  borderColor: Theme.colors.border,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons name="call" size={16} color={Theme.colors.primary} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={onPressWhatsApp}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  backgroundColor: Theme.colors.light,
                                  borderWidth: 1,
                                  borderColor: Theme.colors.border,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons name="logo-whatsapp" size={16} color={'#22C55E'} />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        );
                        })}
                      </ScrollView>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </View>

          <MonthlyMetricsCard
            monthlyMetrics={monthlyMetrics}
            isFetching={monthlyMetricsFetching}
            onDateRangeChange={handleDateRangeChange}
            formatCurrency={formatCurrency}
          />
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
