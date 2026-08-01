import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, SectionCard, CardHeader, EmptyState } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { TenantProfileData } from '@/features/tenant/api/tenantPortalApi';
import { useGetPendingElectricityBillItemsByTenantQuery } from '@/features/owner/api/electricityBillApi';

const C = Theme.colors;

interface PaymentsTabProps {
  raw: TenantProfileData;
}

type PaymentKind = 'RENT' | 'ADVANCE' | 'REFUND';

const KIND_META: Record<PaymentKind, { label: string; color: string; bg: string; icon: string }> = {
  RENT: { label: 'Rent', color: C.primary, bg: C.background.blueLight, icon: 'cash-outline' },
  ADVANCE: { label: 'Advance', color: '#9333ea', bg: '#fdf4ff', icon: 'wallet-outline' },
  REFUND: { label: 'Refund', color: C.secondary, bg: '#f0fdf4', icon: 'return-down-back-outline' },
};

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ raw }) => {
  const { formatDate, formatAmount } = useFormatters();
  const tenantId = raw?.s_no;
  const { data: pendingItemsResponse } = useGetPendingElectricityBillItemsByTenantQuery(tenantId ?? 0, {
    skip: !tenantId,
  });
  const pendingItems = (pendingItemsResponse as any)?.data ?? [];
  const electricityTotal = pendingItems.reduce((sum: number, it: any) => sum + (Number(it.share_amount) - Number(it.paid_amount || 0)), 0);

  // Merge all payment types into a single, de-duplicated, date-sorted history
  const history = [
    ...(raw?.rent_payments ?? []).map((p: any) => ({ ...p, kind: 'RENT' as PaymentKind })),
    ...(raw?.advance_payments ?? []).map((p: any) => ({ ...p, kind: 'ADVANCE' as PaymentKind })),
    ...(raw?.refund_payments ?? []).map((p: any) => ({ ...p, kind: 'REFUND' as PaymentKind })),
  ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const rentCount = raw?.rent_payments?.length ?? 0;
  const advanceCount = raw?.advance_payments?.length ?? 0;
  const refundCount = raw?.refund_payments?.length ?? 0;

  const hasDues =
    !raw?.is_rent_paid ||
    !raw?.is_advance_paid ||
    (raw?.partial_due_amount ?? 0) > 0;

  return (
    <>
      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: KIND_META.RENT.bg }]}>
          <Text style={styles.summaryChipVal}>{rentCount}</Text>
          <Text style={[styles.summaryChipLabel, { color: KIND_META.RENT.color }]}>Rent</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: KIND_META.ADVANCE.bg }]}>
          <Text style={styles.summaryChipVal}>{advanceCount}</Text>
          <Text style={[styles.summaryChipLabel, { color: KIND_META.ADVANCE.color }]}>Advance</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: KIND_META.REFUND.bg }]}>
          <Text style={styles.summaryChipVal}>{refundCount}</Text>
          <Text style={[styles.summaryChipLabel, { color: KIND_META.REFUND.color }]}>Refunds</Text>
        </View>
      </View>

      {/* Outstanding dues — only shown when relevant */}
      {hasDues && (
        <SectionCard style={styles.duesCard}>
          <CardHeader icon="alert-circle-outline" title="Outstanding Dues" color={C.danger} />
          {!raw?.is_rent_paid && <Text style={styles.dueLine}>Rent payment pending</Text>}
          {!raw?.is_advance_paid && <Text style={styles.dueLine}>Advance payment pending</Text>}
          {(raw?.partial_due_amount ?? 0) > 0 && (
            <Text style={[styles.dueLine, styles.dueAmount]}>
              Partial due: {formatAmount(raw?.partial_due_amount ?? 0)}
            </Text>
          )}
        </SectionCard>
      )}

      {/* Unified payment history */}
      <SectionCard>
        <CardHeader icon="time-outline" title="Payment History" />
        {!history.length ? <EmptyState icon="receipt-outline" message="No payments found yet" /> :
          history.map((p: any) => {
            const meta = KIND_META[p.kind as PaymentKind];
            const subtitle = p.kind === 'RENT' && p.tenant_rent_cycles
              ? `${formatDate(p.tenant_rent_cycles.cycle_start)} – ${formatDate(p.tenant_rent_cycles.cycle_end)}`
              : meta.label;
            return (
              <View key={`${p.kind}-${p.s_no}`} style={styles.payRow}>
                <View style={[styles.payMethodIcon, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle} numberOfLines={1}>{subtitle}</Text>
                  <Text style={styles.payMeta}>{meta.label} · {p.payment_method} · {formatDate(p.payment_date)}</Text>
                  {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.payAmount, { color: meta.color }]}>{formatAmount(p.amount_paid)}</Text>
                  <StatusBadge status={p.status} />
                </View>
              </View>
            );
          })}
      </SectionCard>

      {/* Electricity bills */}
      <SectionCard>
        <CardHeader icon="flash-outline" title="Electricity Bills" color="#F59E0B" />
        {!pendingItems?.length ? <EmptyState icon="flash-outline" message="No pending electricity bills" /> : (
          <>
            {pendingItems.map((it: any) => (
              <View key={it.s_no} style={styles.payRow}>
                <View style={[styles.payMethodIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="flash-outline" size={16} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle} numberOfLines={1}>
                    {it.electricity_bills?.rooms?.room_no ? `Room ${it.electricity_bills.rooms.room_no}` : 'Room'} · {formatDate(it.electricity_bills?.bill_period_end)}
                  </Text>
                  <Text style={styles.payMeta}>
                    Share {formatAmount(it.share_amount)} · {it.billing_days ? `${it.billing_days} days` : it.allocation_basis}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.payAmount, { color: '#B45309' }]}>
                    {formatAmount(Number(it.share_amount) - Number(it.paid_amount || 0))}
                  </Text>
                  <StatusBadge status={it.status} />
                </View>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total Pending: {formatAmount(electricityTotal)}</Text>
            </View>
          </>
        )}
      </SectionCard>

      {/* Rent cycles */}
      <SectionCard>
        <CardHeader icon="calendar-outline" title="Rent Cycles" />
        {!raw?.tenant_rent_cycles?.length ? <EmptyState icon="calendar-outline" message="No rent cycles" /> :
          raw.tenant_rent_cycles.map((c: any, i: number) => {
            const paid = raw.rent_payments?.some((p: any) => p.cycle_id === c.s_no && p.status === 'PAID');
            return (
              <View key={c.s_no} style={styles.cycleRow}>
                <View style={[styles.cycleNum, { backgroundColor: paid ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={[styles.cycleNumText, { color: paid ? '#065f46' : '#991b1b' }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle}>{formatDate(c.cycle_start)} – {formatDate(c.cycle_end)}</Text>
                  <Text style={styles.payMeta}>{c.cycle_type}</Text>
                </View>
                <StatusBadge status={paid ? 'PAID' : 'PENDING'} />
              </View>
            );
          })}
      </SectionCard>
    </>
  );
};

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  summaryChipVal: { fontSize: 22, fontWeight: '800', color: C.dark },
  summaryChipLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  duesCard: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  dueLine: { fontSize: 13, color: C.dangerDark, marginBottom: 6 },
  dueAmount: { fontWeight: '700', color: C.warningDark },

  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  payMethodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  payRemark: { fontSize: 11, color: C.darkTertiary, fontStyle: 'italic', marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  totalRow: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  totalText: { fontSize: 13, fontWeight: '700', color: C.dark },

  cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  cycleNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleNumText: { fontSize: 13, fontWeight: '800' },
});
