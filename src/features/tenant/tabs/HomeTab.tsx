import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFormatters } from '../hooks/useFormatters';
import { TenantProfileData, TenantTicketStatsData } from '@/features/tenant/api/tenantPortalApi';
import { TenantPaymentsSummaryData } from '@/features/tenant/api/tenantPaymentsApi';
import { useUpdateExpectedVacateDateMutation } from '@/features/tenant/api/tenantPortalApi';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { DatePicker } from '@/components/DatePicker';
import { SectionCard, CardHeader } from '../components';
import Theme from '@/theme';

const C = Theme.colors;

interface HomeTabProps {
  raw: TenantProfileData;
  paymentsSummary?: TenantPaymentsSummaryData;
  isPaid: boolean;
  isPending: boolean;
  ticketStats?: TenantTicketStatsData;
  refetchProfile?: () => void;
  onViewPayments?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ raw, paymentsSummary, isPaid, isPending, ticketStats, refetchProfile, onViewPayments }) => {
  const { formatDate, formatAmount } = useFormatters();

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
      await updateExpectedVacateDate({ expected_vacate_date: newVacateDate || null }).unwrap();
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
            <Text style={styles.heroAmount}>{formatAmount(paymentsSummary?.rent_due_amount ?? 0)}</Text>
          </View>
          <View style={[styles.heroBadge, isPaid ? styles.badgePaid : isPending ? styles.badgePending : styles.badgeOverdue]}>
            <Ionicons
              name={isPaid ? 'checkmark-circle' : paymentsSummary?.payment_status === 'PENDING_VERIFICATION' ? 'hourglass' : 'time'}
              size={14}
              color={isPaid ? C.secondaryDark : isPending ? C.warningDark : C.dangerDark}
            />
            <Text style={[styles.heroBadgeText, isPaid ? styles.textPaid : isPending ? styles.textPending : styles.textOverdue]}>
              {paymentsSummary?.payment_status === 'PENDING_VERIFICATION'
                ? 'PENDING VERIFICATION'
                : paymentsSummary?.payment_status ?? 'N/A'}
            </Text>
          </View>
        </View>

        {/* Pending verification alert */}
        {paymentsSummary?.has_pending_verification && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Ionicons name="hourglass-outline" size={14} color={C.warningDark} />
            <Text style={styles.heroPartialText} numberOfLines={2}>
              Payment submitted — waiting for owner verification
            </Text>
          </View>
        )}

        {/* Unpaid months alert */}
        {paymentsSummary?.unpaid_months && paymentsSummary.unpaid_months.length > 0 && (
          <>
            <View style={styles.heroDivider} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.heroUnpaidText} numberOfLines={1}>
                {paymentsSummary.unpaid_months.length} unpaid month{paymentsSummary.unpaid_months.length > 1 ? 's' : ''} pending
              </Text>
            </View>
          </>
        )}

        {/* Partial payment alert */}
        {paymentsSummary?.is_rent_partial && paymentsSummary.partial_due_amount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: paymentsSummary?.unpaid_months?.length ? 8 : 0 }}>
            <Ionicons name="wallet-outline" size={14} color={C.warningDark} />
            <Text style={styles.heroPartialText} numberOfLines={1}>
              Partial payment due: {formatAmount(paymentsSummary.partial_due_amount)}
            </Text>
          </View>
        )}

        {onViewPayments && (
          <AnimatedPressableCard onPress={onViewPayments} style={styles.heroLink}>
            <Text style={styles.heroLinkText}>View Payments</Text>
            <Ionicons name="arrow-forward" size={14} color={C.primary} />
          </AnimatedPressableCard>
        )}
      </View>

      {/* Expected Vacate Date — full-width prominent card */}
      <View style={styles.vacateCard}>
        <View style={styles.vacateIconWrap}>
          <Ionicons name="calendar-outline" size={24} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vacateLabel}>Expected Vacate Date</Text>
          <Text style={[styles.vacateValue, { color: raw?.expected_vacate_date ? C.primary : C.dark }]}>
            {raw?.expected_vacate_date ? formatDate(raw.expected_vacate_date) : 'Not set yet'}
          </Text>
          <Text style={styles.vacateHint}>
            {raw?.expected_vacate_date ? 'Tap below to update your planned move-out date' : 'Let your PG owner know when you plan to leave'}
          </Text>
        </View>
        <AnimatedPressableCard onPress={handleOpenVacateModal} style={styles.vacateBtn}>
          <Ionicons name={raw?.expected_vacate_date ? 'create-outline' : 'add-circle-outline'} size={16} color="#fff" />
          <Text style={styles.vacateBtnText}>{raw?.expected_vacate_date ? 'Update Date' : 'Set Date'}</Text>
        </AnimatedPressableCard>
      </View>

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
              <Text style={[styles.ticketStatValue, { color: C.warning }]}>{ticketStats.overview.open}</Text>
              <Text style={styles.ticketStatLabel}>Open</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: C.primary }]}>{ticketStats.overview.inProgress}</Text>
              <Text style={styles.ticketStatLabel}>In Progress</Text>
            </View>
            <View style={styles.ticketStatItem}>
              <Text style={[styles.ticketStatValue, { color: C.secondary }]}>{ticketStats.overview.resolved}</Text>
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
        <View style={{ marginBottom: 10, padding: 10, backgroundColor: C.background.blueLight, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 12, color: C.text.secondary, lineHeight: 16 }}>
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
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.dangerDark }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Clear Date</Text>
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
  heroAmountLabel: { fontSize: 12, color: C.darkTertiary, marginBottom: 3 },
  heroAmount: { fontSize: 28, fontWeight: '800', color: C.dark },
  heroBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 5 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeOverdue: { backgroundColor: '#fee2e2' },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },
  textPaid: { color: C.secondaryDark },
  textPending: { color: C.warningDark },
  textOverdue: { color: C.dangerDark },
  heroUnpaidText: { fontSize: 12, fontWeight: '600', color: C.danger },
  heroPartialText: { fontSize: 12, fontWeight: '600', color: C.warningDark },
  heroLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.background.blueLight },
  heroLinkText: { fontSize: 13, fontWeight: '700', color: C.primary },

  ticketStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  ticketStatItem: { alignItems: 'center' },
  ticketStatValue: { fontSize: 20, fontWeight: '800', color: C.dark },
  ticketStatLabel: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },

  vacateCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  vacateIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.background.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  vacateLabel: { fontSize: 12, color: C.darkTertiary, fontWeight: '600', letterSpacing: 0.3 },
  vacateValue: { fontSize: 20, fontWeight: '800', color: C.dark, marginTop: 4 },
  vacateHint: { fontSize: 12, color: C.darkTertiary, marginTop: 6, lineHeight: 16 },
  vacateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary },
  vacateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
