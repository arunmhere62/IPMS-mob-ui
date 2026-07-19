import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFormatters } from '../hooks/useFormatters';
import { TenantProfileData, TenantTicketStatsData } from '@/features/tenant/api/tenantPortalApi';
import { useUpdateExpectedVacateDateMutation } from '@/features/tenant/api/tenantPortalApi';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { DatePicker } from '@/components/DatePicker';
import Theme from '@/theme';

interface HomeTabProps {
  raw: TenantProfileData;
  isPaid: boolean;
  isPending: boolean;
  ticketStats?: TenantTicketStatsData;
  refetchProfile?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ raw, isPaid, isPending, ticketStats, refetchProfile }) => {
  const { formatDate, formatAmount } = useFormatters();

  // Expected vacate date modal state
  const [vacateDateModalVisible, setVacateDateModalVisible] = useState(false);
  const [newVacateDate, setNewVacateDate] = useState('');
  const [vacateLoading, setVacateLoading] = useState(false);
  const [updateExpectedVacateDate] = useUpdateExpectedVacateDateMutation();

  const handleOpenVacateModal = () => {
    setNewVacateDate(raw?.expected_vacate_date
      ? new Date(raw.expected_vacate_date).toISOString().split('T')[0]
      : '');
    setVacateDateModalVisible(true);
  };

  const handleSaveVacateDate = async () => {
    try {
      setVacateLoading(true);
      await updateExpectedVacateDate({
        expected_vacate_date: newVacateDate || null }).unwrap();
      Alert.alert('Success', newVacateDate ? 'Expected vacate date saved' : 'Expected vacate date cleared');
      setVacateDateModalVisible(false);
      refetchProfile?.();
    } catch (error: unknown) {
      Alert.alert('Error', 'Failed to update expected vacate date');
    } finally {
      setVacateLoading(false);
    }
  };

  return (
    <>
      {/* Hero Status Card */}
      <View style={[styles.heroCard, isPaid ? styles.heroPaid : isPending ? styles.heroPending : styles.heroOverdue]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Hello, {raw?.name?.split(' ')[0] ?? 'Tenant'} 👋</Text>
            <Text style={styles.heroSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.pg_locations?.location_name ?? 'My PG'}</Text>
          </View>
          <View style={[styles.heroAvatarWrap, isPaid ? styles.avatarPaid : isPending ? styles.avatarPending : styles.avatarOverdue]}>
            <Text style={styles.heroAvatar}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View>
            <Text style={styles.heroAmountLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Due Amount</Text>
            <Text style={styles.heroAmount}>{formatAmount(raw?.rent_due_amount ?? 0)}</Text>
          </View>
          <View style={[styles.heroBadge, isPaid ? styles.badgePaid : isPending ? styles.badgePending : styles.badgeOverdue]}>
            <Ionicons name={isPaid ? 'checkmark-circle' : 'time'} size={14} color={isPaid ? '#059669' : isPending ? '#ea580c' : '#dc2626'} />
            <Text style={[styles.heroBadgeText, isPaid ? styles.textPaid : isPending ? styles.textPending : styles.textOverdue]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.payment_status ?? 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#e0e7ff' }]}>
            <Ionicons name="bed-outline" size={18} color="#4f46e5" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Room</Text>
            <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.rooms?.room_no ?? 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="key-outline" size={18} color="#16a34a" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Bed</Text>
            <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.beds?.bed_no ?? 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="cash-outline" size={18} color="#d97706" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Rent</Text>
            <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.85}>{formatAmount(raw?.beds?.bed_price)}/mo</Text>
          </View>
        </View>
      </View>

      {/* Expected Vacate Date */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF',
              alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                Expected Vacate Date
              </Text>
              <Text style={{ fontSize: 12, color: raw?.expected_vacate_date ? '#8B5CF6' : Theme.colors.text.secondary, marginTop: 2, fontWeight: raw?.expected_vacate_date ? '700' : '400' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {raw?.expected_vacate_date
                  ? new Date(raw.expected_vacate_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Not set'}
              </Text>
            </View>
          </View>
          <AnimatedPressableCard
            onPress={handleOpenVacateModal}
            style={{
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 8, backgroundColor: '#F3E8FF',
              borderWidth: 1, borderColor: '#DDD6FE' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8B5CF6' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {raw?.expected_vacate_date ? 'Edit' : 'Set'}
            </Text>
          </AnimatedPressableCard>
        </View>
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, lineHeight: 14 }}>
            <Ionicons name="information-circle-outline" size={12} color="#8B5CF6" /> This helps your PG owner plan for new tenants. The date will be visible to your PG owner.
          </Text>
        </View>
      </View>

      {/* Ticket Stats */}
      {ticketStats?.overview && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ticket-outline" size={18} color="#4f46e5" />
            <Text style={styles.sectionTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>My Tickets</Text>
          </View>
          <View style={styles.ticketStatsRow}>
            <View style={styles.ticketStatItem}>
              <Text style={styles.ticketStatValue}>{ticketStats.overview.total}</Text>
              <Text style={styles.ticketStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Total</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#f59e0b' }]}>{ticketStats.overview.open}</Text>
              <Text style={styles.ticketStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Open</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#3b82f6' }]}>{ticketStats.overview.inProgress}</Text>
              <Text style={styles.ticketStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>In Progress</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#10b981' }]}>{ticketStats.overview.resolved}</Text>
              <Text style={styles.ticketStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Resolved</Text>
            </View>
          </View>
        </View>
      )}

      {/* Unpaid Alert */}
      {raw?.unpaid_months && raw.unpaid_months.length > 0 ? (
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Ionicons name="warning" size={22} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Unpaid Month{raw.unpaid_months.length > 1 ? 's' : ''}</Text>
            {raw.unpaid_months.map((m: { cycle_start: string; cycle_end: string }, i: number) => (
              <Text key={i} style={styles.alertSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {formatDate(m.cycle_start)} – {formatDate(m.cycle_end)}
              </Text>
            ))}
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw.unpaid_months.length}</Text>
          </View>
        </View>
      ) : null}

      {/* PG Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={18} color="#4f46e5" />
          <Text style={styles.sectionTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>My PG</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Address</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.pg_locations?.address ?? 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="map-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>City</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.pg_locations?.city?.name ?? 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="refresh-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Cycle Type</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.pg_locations?.rent_cycle_type ?? 'N/A'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="log-in-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Check-in</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{formatDate(raw?.check_in_date)}</Text>
        </View>
      </View>

      {/* Recent Payments */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={18} color="#4f46e5" />
          <Text style={styles.sectionTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Recent Payments</Text>
        </View>
        {!raw?.rent_payments?.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color="#cbd5e1" />
            <Text style={styles.emptyText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>No payments yet</Text>
          </View>
        ) : (
          raw.rent_payments.slice(0, 3).map((p, index: number) => (
            <View key={p.s_no} style={[styles.payRow, index === raw.rent_payments.slice(0, 3).length - 1 ? { borderBottomWidth: 0 } : null]}>
              <View style={[styles.payMethodIcon, p.payment_method === 'GPAY' ? styles.payGpay : styles.payCash]}>
                <Ionicons name={p.payment_method === 'GPAY' ? 'phone-portrait-outline' : 'cash-outline'} size={16} color={p.payment_method === 'GPAY' ? '#0284c7' : '#16a34a'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}</Text>
                <Text style={styles.payMeta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{p.payment_method} · {formatDate(p.payment_date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={styles.payAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{formatAmount(p.amount_paid)}</Text>
                <View style={[styles.statusBadge, p.status === 'PAID' ? styles.statusPaid : p.status === 'PARTIAL' ? styles.statusPartial : styles.statusPending]}>
                  <Text style={[styles.statusText, p.status === 'PAID' ? styles.textStatusPaid : p.status === 'PARTIAL' ? styles.textStatusPartial : styles.textStatusPending]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{p.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Expected Vacate Date Modal */}
      <SlideBottomModal
        visible={vacateDateModalVisible}
        title="Expected Vacate Date"
        subtitle={raw?.name ? `Tenant: ${raw.name}` : 'Tenant'}
        isLoading={vacateLoading}
        submitLabel="Save"
        cancelLabel="Cancel"
        onClose={() => setVacateDateModalVisible(false)}
        onSubmit={handleSaveVacateDate}
      >
        <View style={{ marginBottom: 10, padding: 10, backgroundColor: Theme.colors.background.blueLight, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
            Select the date you plan to leave. This is different from the actual checkout date — it's for planning purposes only.
          </Text>
        </View>
        <DatePicker
          label="Expected Vacate Date"
          value={newVacateDate}
          onChange={setNewVacateDate}
          required={false}
        />
        {newVacateDate && (
          <AnimatedPressableCard
            onPress={() => setNewVacateDate('')}
            style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Clear Date</Text>
          </AnimatedPressableCard>
        )}
      </SlideBottomModal>
    </>
  );
};

const styles = StyleSheet.create({
  heroCard: { borderRadius: 16, padding: 20, marginBottom: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  heroPaid: { borderTopWidth: 4, borderTopColor: '#10b981' },
  heroPending: { borderTopWidth: 4, borderTopColor: '#f59e0b' },
  heroOverdue: { borderTopWidth: 4, borderTopColor: '#ef4444' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  heroSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  heroAvatarWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarPaid: { backgroundColor: '#d1fae5' },
  avatarPending: { backgroundColor: '#fef3c7' },
  avatarOverdue: { backgroundColor: '#fee2e2' },
  heroAvatar: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  heroDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroAmountLabel: { fontSize: 12, color: '#64748b', marginBottom: 3 },
  heroAmount: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 5 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeOverdue: { backgroundColor: '#fee2e2' },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },
  textPaid: { color: '#059669' },
  textPending: { color: '#d97706' },
  textOverdue: { color: '#dc2626' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0', width: '48%' },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statContent: { flex: 1 },
  statLabel: { fontSize: 10, color: '#64748b', marginBottom: 1 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

  ticketStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  ticketStatItem: { alignItems: 'center' },
  ticketStatValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  ticketStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10, borderWidth: 1, borderColor: '#fecaca', borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  alertIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  alertSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  alertBadge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  alertBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  infoLabel: { fontSize: 11, color: '#64748b', width: 70 },
  infoValue: { fontSize: 12, fontWeight: '500', color: '#1e293b', flex: 1 },

  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  payMethodIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  payGpay: { backgroundColor: '#e0f2fe' },
  payCash: { backgroundColor: '#f0fdf4' },
  payTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  payMeta: { fontSize: 10, color: '#64748b', marginTop: 1 },
  payAmount: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusPaid: { backgroundColor: '#d1fae5' },
  statusPartial: { backgroundColor: '#fef3c7' },
  statusPending: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 9, fontWeight: '600' },
  textStatusPaid: { color: '#059669' },
  textStatusPartial: { color: '#d97706' },
  textStatusPending: { color: '#dc2626' },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' } });
