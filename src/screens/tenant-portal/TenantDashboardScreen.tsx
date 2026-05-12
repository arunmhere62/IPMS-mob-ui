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
import { RootState } from '../../store';
import { tenantLogout, setTenantData } from '../../store/slices/tenantAuthSlice';
import { Theme } from '../../theme';
import { useGetTenantProfileQuery } from '../../services/api/tenantPortalApi';
import { BottomNav } from '../../components/BottomNav';
import { useGetTenantTicketsQuery } from '../../services/api/tenantTicketsApi';
import { HomeTab, PaymentsTab, TicketsTab, ProfileTab } from './tabs';

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

  // Profile query
  const { data: profileData, isLoading: profileLoading, error, refetch: refetchProfile } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });
  const raw = profileData?.data;

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
      else await refetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchProfile, refetchTickets]);

  const isPaid = raw?.payment_status === 'PAID';
  const isPending = raw?.payment_status === 'PENDING';

  // Render content based on active tab
  const renderContent = () => {
    // Show loading spinner for profile-based tabs when loading and no data
    if ((activeTab === 'home' || activeTab === 'payments' || activeTab === 'profile') && profileLoading && !raw) {
      return <ActivityIndicator color={C.primary} style={{ marginTop: 48 }} />;
    }

    switch (activeTab) {
      case 'home':
        return raw ? <HomeTab raw={raw} isPaid={isPaid} isPending={isPending} /> : null;
      case 'payments':
        return raw ? <PaymentsTab raw={raw} /> : null;
      case 'tickets':
        return <TicketsTab tickets={tickets} isLoading={ticketsLoading} navigation={navigation} />;
      case 'profile':
        return raw ? <ProfileTab raw={raw} onLogout={() => dispatch(tenantLogout())} /> : null;
      default:
        return null;
    }
  };

  const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Custom Header */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={styles.headerTitle}>Tenant Portal</Text>
          <Text style={styles.headerSub}>Welcome back, {raw?.name?.split(' ')[0] ?? tenant?.name ?? 'Tenant'}</Text>
        </View>
        <TouchableOpacity style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
        </TouchableOpacity>
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
  root: { flex: 1, backgroundColor: C.background.secondary },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  errorText: { fontSize: 12, color: C.dangerDark, flex: 1, fontWeight: '500' },
});
