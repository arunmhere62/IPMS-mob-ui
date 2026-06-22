import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeTab, PaymentsTab, TicketsTab, ProfileTab } from './tabs';
import Theme from '@/theme';
import { setTenantData, tenantLogout } from '@/features/tenant/store/tenantAuthSlice';
import { setLastUserRole as setAdminLastUserRole } from '@/features/owner/store/slices/authSlice';
import { BottomNav } from '@/components/BottomNav';
import { useGetTenantProfileQuery, useGetTenantTicketStatsQuery } from '@/features/tenant/api/tenantPortalApi';
import { useGetTenantTicketsQuery } from '@/features/tenant/api/tenantTicketsApi';
import { RootState } from '../owner/store';
import { useGetPublicAppStatusQuery } from '@/features/owner/api/appSettingsApi';
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
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  const { data: appStatus } = useGetPublicAppStatusQuery();

  // Profile query
  const { data: profileData, isLoading: profileLoading, error, refetch: refetchProfile } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });
  const raw = profileData?.data;

  // Ticket stats query
  const { data: ticketStatsData, refetch: refetchTicketStats } = useGetTenantTicketStatsQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });
  const ticketStats = ticketStatsData?.data;

  // Tickets query (only when tab active)
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useGetTenantTicketsQuery(
    {},
    { skip: activeTab !== 'tickets', refetchOnMountOrArgChange: true },
  );
  const tickets = ticketsData?.tickets ?? [];

  // Sync profile to Redux
  useEffect(() => {
    if (raw) {
      dispatch(setTenantData({
        tenant: {
          tenant_id: raw.s_no,
          name: raw.name,
          phone: raw.phone_no,
          email: raw.email,
          status: raw.status,
          check_in_date: raw.check_in_date,
        },
        pg: raw.pg_locations ? {
          pg_id: raw.pg_locations.s_no,
          location_name: raw.pg_locations.location_name,
          address: raw.pg_locations.address,
          city: raw.pg_locations.city?.name,
          state: raw.pg_locations.state?.name,
          rent_cycle_type: raw.pg_locations.rent_cycle_type,
        } : null,
        room_no: raw.rooms?.room_no,
        bed_no: raw.beds?.bed_no,
        bed_price: raw.beds?.bed_price,
        payment_status: raw.payment_status,
        rent_due_amount: raw.rent_due_amount,
        pending_months: raw.pending_months,
        rentCycles: raw.tenant_rent_cycles,
        recentPayments: raw.rent_payments,
      }));
    }
  }, [raw, dispatch]);

  // Refresh handler based on active tab
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'tickets') await refetchTickets();
      else if (activeTab === 'home') {
        await refetchProfile();
        await refetchTicketStats();
      }
      else await refetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchProfile, refetchTickets, refetchTicketStats]);

  const isPaid = raw?.payment_status === 'PAID';
  const isPending = raw?.payment_status === 'PENDING';

  const handleLogout = () => {
    // Clear owner's lastUserRole so next redirect goes to tenant login
    dispatch(setAdminLastUserRole(null));
    dispatch(tenantLogout());
  };

  // Render content based on active tab
  const renderContent = () => {
    // Show loading spinner for profile-based tabs when loading and no data
    if ((activeTab === 'home' || activeTab === 'payments' || activeTab === 'profile') && profileLoading && !raw) {
      return <ActivityIndicator color={C.primary} style={{ marginTop: 48 }} />;
    }

    switch (activeTab) {
      case 'home':
        return raw ? <HomeTab raw={raw} isPaid={isPaid} isPending={isPending} ticketStats={ticketStats} /> : null;
      case 'payments':
        return raw ? <PaymentsTab raw={raw} /> : null;
      case 'tickets':
        return <TicketsTab tickets={tickets} isLoading={ticketsLoading} navigation={navigation} />;
      case 'profile':
        return raw ? <ProfileTab raw={raw} onLogout={handleLogout} /> : null;
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
          <View>
            <Text style={styles.headerTitle}>{activeTab === 'home' ? `Hello, ${raw?.name?.split(' ')[0] ?? tenant?.name ?? 'Tenant'}` : tenantTabs.find(t => t.name === activeTab)?.label ?? 'Tenant'}</Text>
            {activeTab === 'home' && <Text style={styles.headerSub}>Welcome to your dashboard</Text>}
          </View>
          <TouchableOpacity style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90, paddingTop: 16 }}
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
