import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav } from '@/components/BottomNav';
import Theme from '@/theme';
import { TenantTicket, TenantTicketStatus, useGetTenantTicketsQuery } from '@/features/tenant/api/tenantTicketsApi';
import { useFocusEffect } from '@react-navigation/native';

const C = Theme.colors;
const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

const tenantTabs = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'payments', label: 'Payments', icon: 'card' },
  { name: 'tickets', label: 'Tickets', icon: 'ticket-outline' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

const STATUS_FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const STATUS_COLORS: Record<TenantTicketStatus, { bg: string; text: string; dot: string }> = {
  OPEN:        { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  IN_PROGRESS: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  RESOLVED:    { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  CLOSED:      { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

const CATEGORY_ICONS: Record<string, string> = {
  MAINTENANCE: 'construct-outline',
  COMPLAINT:   'alert-circle-outline',
  REQUEST:     'hand-left-outline',
  OTHER:       'help-circle-outline',
};

interface Props { navigation: any }

export function TenantTicketsScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useGetTenantTicketsQuery(
    { status: activeFilter },
    { refetchOnMountOrArgChange: true },
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const tickets = data?.tickets ?? [];

  const renderTicket = ({ item }: { item: TenantTicket }) => {
    const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.OPEN;
    const icon = CATEGORY_ICONS[item.category] ?? 'help-circle-outline';
    const commentCount = item._count?.tenant_ticket_comments ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TenantTicketDetail', { ticketId: item.s_no })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: sc.bg }]}>
            <Ionicons name={icon as any} size={20} color={sc.text} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="flag-outline" size={13} color={C.text?.secondary ?? '#6b7280'} />
            <Text style={styles.footerText}>{item.priority}</Text>
          </View>
          {commentCount > 0 && (
            <View style={styles.footerLeft}>
              <Ionicons name="chatbubble-outline" size={13} color={C.text?.secondary ?? '#6b7280'} />
              <Text style={styles.footerText}>{commentCount}</Text>
            </View>
          )}
          <Text style={styles.footerDate}>
            {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Gradient header — same as TenantDashboardScreen */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tenant Portal</Text>
          <Text style={styles.headerSub}>My Tickets</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('TenantCreateTicket')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter chips */}
      <View style={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.chip, activeFilter === f.value && styles.chipActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.chipText, activeFilter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={C.primary} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => String(t.s_no)}
          renderItem={renderTicket}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} />}
          contentContainerStyle={tickets.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptySubtitle}>Tap + to raise a new ticket</Text>
            </View>
          }
        />
      )}

      <BottomNav tabs={tenantTabs} activeTab="tickets" onTabPress={(tab) => {
        if (tab === 'home') navigation.navigate('TenantDashboard');
        else if (tab === 'payments') navigation.navigate('TenantDashboard');
        else if (tab === 'profile') navigation.navigate('TenantDashboard');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background?.secondary ?? '#f3f4f6' },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardCategory: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#6b7280' },
  footerDate: { marginLeft: 'auto', fontSize: 12, color: '#9ca3af' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
