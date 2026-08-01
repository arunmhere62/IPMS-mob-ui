import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFormatters } from '../hooks/useFormatters';
import { TenantProfileData, TenantTicketStatsData } from '@/features/tenant/api/tenantPortalApi';
import { useUpdateExpectedVacateDateMutation } from '@/features/tenant/api/tenantPortalApi';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { DatePicker } from '@/components/DatePicker';
import { SectionCard, CardHeader, InfoRow } from '../components';
import Theme from '@/theme';

const C = Theme.colors;

interface HomeTabProps {
  raw: TenantProfileData;
  isPaid: boolean;
  isPending: boolean;
  ticketStats?: TenantTicketStatsData;
  refetchProfile?: () => void;
  onViewPayments?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ raw, isPaid, isPending, ticketStats, refetchProfile, onViewPayments }) => {
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
      {/* Hero: Due amount + status */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroAmountLabel}>Due Amount</Text>
            <Text style={styles.heroAmount}>{formatAmount(raw?.rent_due_amount ?? 0)}</Text>
          </View>
          <View style={[styles.heroBadge, isPaid ? styles.badgePaid : isPending ? styles.badgePending : styles.badgeOverdue]}>
            <Ionicons name={isPaid ? 'checkmark-circle' : 'time'} size={14} color={isPaid ? '#059669' : isPending ? '#ea580c' : '#dc2626'} />
            <Text style={[styles.heroBadgeText, isPaid ? styles.textPaid : isPending ? styles.textPending : styles.textOverdue]}>
              {raw?.payment_status ?? 'N/A'}
            </Text>
          </View>
        </View>

        {raw?.unpaid_months && raw.unpaid_months.length > 0 && (
          <>
            <View style={styles.heroDivider} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.heroUnpaidText} numberOfLines={1}>
                {raw.unpaid_months.length} unpaid month{raw.unpaid_months.length > 1 ? 's' : ''} pending
              </Text>
            </View>
          </>
        )}

        {onViewPayments && (
          <AnimatedPressableCard onPress={onViewPayments} style={styles.heroLink}>
            <Text style={styles.heroLinkText}>View Payments</Text>
            <Ionicons name="arrow-forward" size={14} color={C.primary} />
          </AnimatedPressableCard>
        )}
      </View>

      {/* Room / Bed / Rent — stacked for clear visibility */}
      <SectionCard>
        <InfoRow icon="bed-outline" label="Room" value={raw?.rooms?.room_no ?? 'N/A'} />
        <InfoRow icon="key-outline" label="Bed" value={raw?.beds?.bed_no ?? 'N/A'} />
        <InfoRow icon="cash-outline" label="Monthly Rent" value={formatAmount(raw?.beds?.bed_price)} />
      </SectionCard>

      {/* Expected Vacate Date */}
      <SectionCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="calendar-outline" size={16} color={C.darkTertiary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.darkTertiary }}>Expected Vacate Date</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: raw?.expected_vacate_date ? C.primary : C.dark, marginTop: 2 }}>
                {raw?.expected_vacate_date ? formatDate(raw.expected_vacate_date) : 'Not set'}
              </Text>
            </View>
          </View>
          <AnimatedPressableCard onPress={handleOpenVacateModal} style={styles.vacateEditBtn}>
            <Text style={styles.vacateEditBtnText}>{raw?.expected_vacate_date ? 'Edit' : 'Set'}</Text>
          </AnimatedPressableCard>
        </View>
      </SectionCard>

      {/* Ticket Stats */}
      {ticketStats?.overview && (
        <SectionCard>
          <CardHeader icon="ticket-outline" title="My Tickets" />
          <View style={styles.ticketStatsRow}>
            <View style={styles.ticketStatItem}>
              <Text style={styles.ticketStatValue}>{ticketStats.overview.total}</Text>
              <Text style={styles.ticketStatLabel}>Total</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#f59e0b' }]}>{ticketStats.overview.open}</Text>
              <Text style={styles.ticketStatLabel}>Open</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#3b82f6' }]}>{ticketStats.overview.inProgress}</Text>
              <Text style={styles.ticketStatLabel}>In Progress</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: '#10b981' }]}>{ticketStats.overview.resolved}</Text>
              <Text style={styles.ticketStatLabel}>Resolved</Text>
            </View>
          </View>
        </SectionCard>
      )}

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
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
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
  heroUnpaidText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  heroLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.background.blueLight },
  heroLinkText: { fontSize: 13, fontWeight: '700', color: C.primary },

  ticketStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  ticketStatItem: { alignItems: 'center' },
  ticketStatValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  ticketStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  vacateEditBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.background.blueLight },
  vacateEditBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },
});
