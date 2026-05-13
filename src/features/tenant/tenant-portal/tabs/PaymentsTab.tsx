import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBadge, SectionCard, CardHeader, EmptyState } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { TenantProfileData } from '@/services/api/tenantPortalApi';

const C = Theme.colors;

interface PaymentsTabProps {
  raw: TenantProfileData;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ raw }) => {
  const { formatDate, formatAmount } = useFormatters();

  return (
    <>
      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: C.background.blueLight }]}>
          <Text style={styles.summaryChipVal}>{raw?.rent_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: C.primary }]}>Rent</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#fdf4ff' }]}>
          <Text style={styles.summaryChipVal}>{raw?.advance_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: '#9333ea' }]}>Advance</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.summaryChipVal}>{raw?.refund_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: C.secondary }]}>Refunds</Text>
        </View>
      </View>

      <SectionCard>
        <CardHeader icon="cash-outline" title="Rent Payments" color={C.primary} />
        {!raw?.rent_payments?.length ? <EmptyState icon="cash-outline" message="No rent payments found" /> :
          raw.rent_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: p.payment_method === 'GPAY' ? '#e0f2fe' : '#f0fdf4' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: p.payment_method === 'GPAY' ? '#0284c7' : '#16a34a' }}>
                  {p.payment_method === 'GPAY' ? 'GPay' : 'Cash'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}</Text>
                <Text style={styles.payMeta}>{p.payment_method} · {formatDate(p.payment_date)}</Text>
                {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.payAmount}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard>
        <CardHeader icon="wallet-outline" title="Advance Payments" color="#9333ea" />
        {!raw?.advance_payments?.length ? <EmptyState icon="wallet-outline" message="No advance payments" /> :
          raw.advance_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: '#fdf4ff' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9333ea' }}>Adv</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.payment_date)}</Text>
                <Text style={styles.payMeta}>{p.payment_method}</Text>
                {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.payAmount, { color: '#9333ea' }]}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard>
        <CardHeader icon="return-down-back-outline" title="Refunds" color={C.secondary} />
        {!raw?.refund_payments?.length ? <EmptyState icon="return-down-back-outline" message="No refunds found" /> :
          raw.refund_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: '#f0fdf4' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.secondary }}>Ref</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.payment_date)}</Text>
                <Text style={styles.payMeta}>{p.payment_method}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.payAmount, { color: C.secondary }]}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>

      {/* Dues Section */}
      <SectionCard>
        <CardHeader icon="information-circle-outline" title="Payment Flags" />
        <Text style={{ fontSize: 13, color: raw?.is_rent_paid ? C.secondary : C.danger, marginBottom: 8 }}>
          Rent Paid: {raw?.is_rent_paid ? '✓ Yes' : '✗ No'}
        </Text>
        <Text style={{ fontSize: 13, color: raw?.is_advance_paid ? C.secondary : C.danger, marginBottom: 8 }}>
          Advance Paid: {raw?.is_advance_paid ? '✓ Yes' : '✗ No'}
        </Text>
        <Text style={{ fontSize: 13, color: raw?.is_rent_partial ? C.warning : C.secondary, marginBottom: 8 }}>
          Partial Rent: {raw?.is_rent_partial ? 'Yes' : 'No'}
        </Text>
        <Text style={{ fontSize: 13, color: (raw?.partial_due_amount ?? 0) > 0 ? C.warning : C.secondary }}>
          Partial Due: {formatAmount(raw?.partial_due_amount ?? 0)}
        </Text>
      </SectionCard>

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

  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  payMethodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  payRemark: { fontSize: 11, color: C.darkTertiary, fontStyle: 'italic', marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  cycleNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleNumText: { fontSize: 13, fontWeight: '800' },
});
