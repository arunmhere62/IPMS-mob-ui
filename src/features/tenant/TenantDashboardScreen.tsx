import React, { useEffect, useState, useCallback } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { HomeTab, PaymentsTab, TicketsTab, ProfileTab } from './tabs';
import { HomeTabSkeleton, PaymentsTabSkeleton, TicketsTabSkeleton, ProfileTabSkeleton } from './components/TenantSkeletons';
import Theme from '@/theme';
import { setTenantData, tenantLogout } from '@/features/tenant/store/tenantAuthSlice';
import { setLastUserRole as setAdminLastUserRole } from '@/features/owner/store/slices/authSlice';
import { BottomNav } from '@/components/BottomNav';
import {
  useGetTenantProfileQuery,
  useGetTenantTicketStatsQuery,
  useTenantLogoutMutation,
} from '@/features/tenant/api/tenantPortalApi';
import { useGetTenantPaymentsSummaryQuery } from '@/features/tenant/api/tenantPaymentsApi';
import { useGetTenantTicketsQuery } from '@/features/tenant/api/tenantTicketsApi';
import { RootState } from '../owner/store';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

interface TenantDashboardScreenProps {
  navigation: any;
}

const C = Theme.colors;

const tenantTabs = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'payments', label: 'Payments', icon: 'card' },
  { name: 'tickets', label: 'Tickets', icon: 'ticket-outline' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

export const TenantDashboardScreen: React.FC<TenantDashboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { tenant, accessToken } = useSelector((state: RootState) => state.tenantAuth);
  const appStatus = useSelector((state: RootState) => (state as any).appSettings?.appSettings);
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);

  // Profile query (slim — no payment data)
  const { data: profileData, isLoading: profileLoading, error, refetch: refetchProfile } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true });
  const raw = profileData?.data;

  // Payments summary query (due amount, payment status, cycles)
  const { data: paymentsSummaryData, refetch: refetchPaymentsSummary } = useGetTenantPaymentsSummaryQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true });
  const paymentsSummary = paymentsSummaryData?.data;

  // Ticket stats query
  const { data: ticketStatsData, refetch: refetchTicketStats } = useGetTenantTicketStatsQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true });
  const ticketStats = ticketStatsData?.data;

  // Tickets query (only when tab active)
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useGetTenantTicketsQuery(
    {},
    { skip: activeTab !== 'tickets', refetchOnMountOrArgChange: true },
  );
  const tickets = ticketsData?.tickets ?? [];

  const [tenantLogoutApi] = useTenantLogoutMutation();

  // Refetch payments summary when dashboard gains focus
  // (e.g., returning from TenantSubmitPaymentProofScreen after submitting payment)
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      refetchPaymentsSummary();
    }, [accessToken, refetchPaymentsSummary]),
  );

  // Sync profile to Redux (slim — no payment data, that comes from payments-summary)
  useEffect(() => {
    if (raw) {
      dispatch(setTenantData({
        tenant: {
          tenant_id: raw.s_no,
          name: raw.name,
          phone: raw.phone_no,
          email: raw.email,
          status: raw.status,
          check_in_date: raw.check_in_date },
        pg: raw.pg_locations ? {
          pg_id: raw.pg_locations.s_no,
          location_name: raw.pg_locations.location_name,
          address: raw.pg_locations.address,
          city: raw.pg_locations.city?.name,
          state: raw.pg_locations.state?.name,
          rent_cycle_type: raw.pg_locations.rent_cycle_type } : null,
        room_no: raw.rooms?.room_no,
        bed_no: raw.beds?.bed_no,
        bed_price: raw.beds?.bed_price,
        payment_status: paymentsSummary?.payment_status ?? null,
        rent_due_amount: paymentsSummary?.rent_due_amount ?? 0,
        pending_months: paymentsSummary?.unpaid_months?.length ?? 0,
        rentCycles: paymentsSummary?.tenant_rent_cycles ?? [],
        recentPayments: paymentsSummary?.rent_payments ?? [] }));
    }
  }, [raw, paymentsSummary, dispatch]);

  // Refresh handler based on active tab
  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try {
      if (activeTab === 'tickets') await refetchTickets();
      else if (activeTab === 'home') {
        await Promise.all([refetchProfile(), refetchTicketStats(), refetchPaymentsSummary()]);
      }
      else await refetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, activeTab, refetchProfile, refetchTickets, refetchTicketStats, refetchPaymentsSummary]);

  const isPaid = paymentsSummary?.payment_status === 'PAID';
  const isPending = paymentsSummary?.payment_status === 'PENDING' || paymentsSummary?.payment_status === 'PENDING_VERIFICATION';

  const handleLogout = async () => {
    try {
      await tenantLogoutApi().unwrap();
    } catch {
      // Ignore server errors; still clear local state
    }
    // Clear owner's lastUserRole so next redirect goes to tenant login
    dispatch(setAdminLastUserRole(null));
    dispatch(tenantLogout());
  };

  const renderUnavailable = () => {
    const sessionMissing = !accessToken;
    return (
      <View style={{ margin: 16, padding: 24, alignItems: 'center', borderRadius: 16, backgroundColor: C.background.secondary }}>
        <Ionicons name={sessionMissing ? 'log-in-outline' : 'cloud-offline-outline'} size={36} color={C.primary} />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: C.text.primary, textAlign: 'center' }}>
          {sessionMissing ? 'Session unavailable' : 'Dashboard unavailable'}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: C.text.secondary, textAlign: 'center' }}>
          {sessionMissing
            ? 'Please sign in again to view your tenant dashboard.'
            : error
              ? 'We could not load your tenant details. Check your connection and retry.'
              : 'No tenant details were returned. Please retry.'}
        </Text>
        <AnimatedPressableCard
          onPress={() => {
            if (sessionMissing) void handleLogout();
            else void handleRefresh();
          }}
          style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primary }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            {sessionMissing ? 'Sign in again' : 'Retry'}
          </Text>
        </AnimatedPressableCard>
      </View>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (profileLoading && !raw) return <HomeTabSkeleton />;
        return raw ? <HomeTab raw={raw} paymentsSummary={paymentsSummary} isPaid={isPaid} isPending={isPending} ticketStats={ticketStats} refetchProfile={refetchProfile} onViewPayments={() => setActiveTab('payments')} /> : renderUnavailable();
      case 'tickets':
        if (ticketsLoading && tickets.length === 0) return <TicketsTabSkeleton />;
        return <TicketsTab tickets={tickets} isLoading={ticketsLoading} navigation={navigation} />;
      case 'profile':
        if (profileLoading && !raw) return <ProfileTabSkeleton />;
        return raw ? <ProfileTab raw={raw} onLogout={handleLogout} /> : renderUnavailable();
      default:
        return null;
    }
  };

  const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Announcement banner — shown on dashboard only */}
      {appStatus?.show_announcement && appStatus.announcement_title ? (
        <AnnouncementBanner
          title={appStatus.announcement_title}
          message={appStatus.announcement_message}
        />
      ) : null}

      {/* Modern Header - colored on all tabs */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{activeTab === 'home' ? `Hello, ${raw?.name?.split(' ')[0] ?? tenant?.name ?? 'Tenant'}` : tenantTabs.find(t => t.name === activeTab)?.label ?? 'Tenant'}</Text>
            {activeTab === 'home' && <Text style={styles.headerSub}>Welcome to your dashboard</Text>}
          </View>
          <AnimatedPressableCard style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
          </AnimatedPressableCard>
        </View>
      </LinearGradient>

      {/* Payments tab manages its own sticky tab bar + scrolling content */}
      {activeTab === 'payments' ? (
        <View style={{ flex: 1 }}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="wifi-outline" size={16} color={C.dangerDark} />
              <Text style={styles.errorText}>Could not load data. Pull down to retry.</Text>
            </View>
          )}
          {raw ? <PaymentsTab tenantId={raw.s_no} profileRaw={raw} /> : <PaymentsTabSkeleton />}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 90, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="wifi-outline" size={16} color={C.dangerDark} />
              <Text style={styles.errorText}>Could not load data. Pull down to retry.</Text>
            </View>
          )}
          {renderContent()}
        </ScrollView>
      )}

      <BottomNav tabs={tenantTabs} activeTab={activeTab} onTabPress={setActiveTab} />

    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1, fontWeight: '500' },

});
