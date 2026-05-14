import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../theme';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { CONTENT_COLOR } from '@/constant';
import {
  useGetPgTenantTicketsQuery,
  PgTenantTicket,
  PgTicketStatus,
} from '../../api/pgTicketsApi';

const C = Theme.colors;

const STATUS_FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed',
};

interface Props { navigation: any }

export function PgTenantTicketsScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching, refetch } = useGetPgTenantTicketsQuery(
    { status: activeFilter },
    { refetchOnMountOrArgChange: true },
  );

  const tickets: PgTenantTicket[] = data?.tickets ?? [];

  const renderItem = ({ item }: { item: PgTenantTicket }) => {
    const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.OPEN;
    const icon = CATEGORY_ICONS[item.category] ?? 'help-circle-outline';
    const commentCount = item._count?.tenant_ticket_comments ?? 0;
    const priorityColor = PRIORITY_COLORS[item.priority] ?? '#6b7280';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PgTenantTicketDetail', { ticketId: item.s_no, pgId: item.pg_id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: sc.bg }]}>
            <Ionicons name={icon as any} size={20} color={sc.text} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.tenantName} numberOfLines={1}>
              {item.tenants?.name ?? 'Unknown Tenant'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerChip}>
            <Ionicons name="pricetag-outline" size={11} color={C.darkTertiary} />
            <Text style={styles.footerText}>{item.category}</Text>
          </View>
          <View style={styles.footerChip}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={styles.footerText}>{item.priority}</Text>
          </View>
          {commentCount > 0 && (
            <View style={styles.footerChip}>
              <Ionicons name="chatbubble-outline" size={11} color={C.darkTertiary} />
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
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Tenant Tickets"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`}
        showBackButton
        onBackPress={() => navigation.goBack()}
        showPGSelector={false}
      />

      <View style={styles.container}>
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
          <ActivityIndicator style={{ marginTop: 48 }} color={C.primary} size="large" />
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(t) => String(t.s_no)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[C.primary]} tintColor={C.primary} />
            }
            contentContainerStyle={tickets.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="ticket-outline" size={52} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No tickets found</Text>
                <Text style={styles.emptySubtitle}>Tenant complaints will appear here</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONTENT_COLOR },
  filters: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 16, gap: 10, paddingBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  tenantName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  footerChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  footerText: { fontSize: 11, color: '#6b7280' },
  footerDate: { marginLeft: 'auto', fontSize: 11, color: '#9ca3af' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },
});
