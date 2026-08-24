import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { StatusBadge, SectionCard, CardHeader, EmptyState } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { TenantProfileData } from '@/features/tenant/api/tenantPortalApi';
import { useGetPendingElectricityBillItemsByTenantQuery } from '@/features/owner/api/electricityBillApi';
import { TenantReceiptModal } from '../components/TenantReceiptModal';
import { buildTenantReceiptData } from '../services/buildTenantReceiptData';
import type { ReceiptData, ReceiptType } from '@/services/receipt/receiptTypes';

const C = Theme.colors;

interface PaymentsTabProps {
  raw: TenantProfileData;
}

type PaymentKind = 'RENT' | 'ADVANCE' | 'REFUND';

// Theme-aligned colors: blue for rent, amber for advance (deposit), green for refund
const KIND_META: Record<PaymentKind, { label: string; color: string; bg: string; icon: string }> = {
  RENT: { label: 'Rent', color: C.primary, bg: C.background.blueLight, icon: 'cash-outline' },
  ADVANCE: { label: 'Advance', color: C.warningDark, bg: '#FEF3C7', icon: 'wallet-outline' },
  REFUND: { label: 'Refund', color: C.secondaryDark, bg: '#D1FAE5', icon: 'return-down-back-outline' },
};

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ raw }) => {
  const { formatDate, formatAmount } = useFormatters();
  const tenantId = raw?.s_no;
  const { data: pendingItemsResponse } = useGetPendingElectricityBillItemsByTenantQuery(tenantId ?? 0, {
    skip: !tenantId,
  });
  const pendingItems = (pendingItemsResponse as any)?.data ?? [];
  const electricityTotal = pendingItems.reduce((sum: number, it: any) => sum + (Number(it.share_amount) - Number(it.paid_amount || 0)), 0);

  // Receipt modal state
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const handleViewReceipt = (payment: any, kind: ReceiptType) => {
    const data = buildTenantReceiptData(raw, payment, kind);
    setReceiptData(data);
    setReceiptVisible(true);
  };

  // Merge all payment types into a single, de-duplicated, date-sorted history
  const history = [
    ...(raw?.rent_payments ?? []).map((p: any) => ({ ...p, kind: 'RENT' as PaymentKind })),
    ...(raw?.advance_payments ?? []).map((p: any) => ({ ...p, kind: 'ADVANCE' as PaymentKind })),
    ...(raw?.refund_payments ?? []).map((p: any) => ({ ...p, kind: 'REFUND' as PaymentKind })),
  ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  // Group payments by month (e.g., "August 2025") — handles multi-year tenants
  const groupedHistory = useMemo(() => {
    const groups: { key: string; label: string; payments: any[]; total: number }[] = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (const p of history) {
      const d = new Date(p.payment_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label, payments: [], total: 0 };
        groups.push(group);
      }
      group.payments.push(p);
      group.total += Number(p.amount_paid || 0);
    }
    return groups; // already sorted desc because history is sorted desc
  }, [history]);

  // Collapsible month sections — latest month open by default
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rentCount = raw?.rent_payments?.length ?? 0;
  const advanceCount = raw?.advance_payments?.length ?? 0;
  const refundCount = raw?.refund_payments?.length ?? 0;

  const hasDues =
    !raw?.is_rent_paid ||
    !raw?.is_advance_paid ||
    (raw?.partial_due_amount ?? 0) > 0;

  return (
    <>
      {/* Summary — compact row with colored dots */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: C.primary }]} />
          <Text style={styles.summaryCount}>{rentCount}</Text>
          <Text style={styles.summaryLabel}>Rent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: C.warning }]} />
          <Text style={styles.summaryCount}>{advanceCount}</Text>
          <Text style={styles.summaryLabel}>Advance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: C.secondary }]} />
          <Text style={styles.summaryCount}>{refundCount}</Text>
          <Text style={styles.summaryLabel}>Refunds</Text>
        </View>
      </View>

      {/* Outstanding dues — only shown when relevant */}
      {hasDues && (
        <SectionCard style={styles.duesCard}>
          <CardHeader icon="alert-circle-outline" title="Outstanding Dues" color={C.danger} />
          {!raw?.is_rent_paid && (
            <View style={styles.dueRow}>
              <View style={[styles.dueDot, { backgroundColor: C.danger }]} />
              <Text style={styles.dueLine}>Rent payment pending</Text>
            </View>
          )}
          {!raw?.is_advance_paid && (
            <View style={styles.dueRow}>
              <View style={[styles.dueDot, { backgroundColor: C.warning }]} />
              <Text style={styles.dueLine}>Advance payment pending</Text>
            </View>
          )}
          {(raw?.partial_due_amount ?? 0) > 0 && (
            <View style={styles.dueRow}>
              <View style={[styles.dueDot, { backgroundColor: C.warningDark }]} />
              <Text style={styles.dueLine}>Partial due: {formatAmount(raw?.partial_due_amount ?? 0)}</Text>
            </View>
          )}
        </SectionCard>
      )}

      {/* Payment History — grouped by month */}
      <SectionCard>
        <CardHeader icon="time-outline" title="Payment History" />
        {!history.length ? <EmptyState icon="receipt-outline" message="No payments found yet" /> :
          groupedHistory.map((group) => {
            const isCollapsed = collapsedMonths.has(group.key);
            return (
              <View key={group.key} style={styles.monthGroup}>
                <TouchableOpacity
                  style={styles.monthHeader}
                  onPress={() => toggleMonth(group.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={14} color={C.darkTertiary} />
                  <Text style={styles.monthLabel}>{group.label}</Text>
                  <Text style={styles.monthCount}>{group.payments.length}</Text>
                  <Text style={styles.monthTotal}>{formatAmount(group.total)}</Text>
                </TouchableOpacity>
                {!isCollapsed && group.payments.map((p: any) => {
                  const meta = KIND_META[p.kind as PaymentKind];
                  const subtitle = p.kind === 'RENT' && p.tenant_rent_cycles
                    ? `${formatDate(p.tenant_rent_cycles.cycle_start)} – ${formatDate(p.tenant_rent_cycles.cycle_end)}`
                    : meta.label;
                  const isPaid = p.status === 'PAID';
                  return (
                    <View key={`${p.kind}-${p.s_no}`} style={styles.payRow}>
                      <View style={[styles.payMethodIcon, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.payTitle} numberOfLines={1}>{subtitle}</Text>
                        <Text style={styles.payMeta}>{meta.label} · {p.payment_method} · {formatDate(p.payment_date)}</Text>
                        {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
                        {isPaid && (
                          <AnimatedPressableCard
                            onPress={() => handleViewReceipt(p, p.kind as ReceiptType)}
                            style={styles.receiptBtn}
                          >
                            <Ionicons name="receipt-outline" size={12} color={C.primary} />
                            <Text style={styles.receiptBtnText}>View Receipt</Text>
                          </AnimatedPressableCard>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.payAmount, { color: meta.color }]}>{formatAmount(p.amount_paid)}</Text>
                        <StatusBadge status={p.status} />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        }
      </SectionCard>

      {/* Electricity bills */}
      <SectionCard>
        <CardHeader icon="flash-outline" title="Electricity Bills" color={C.warning} />
        {!pendingItems?.length ? <EmptyState icon="flash-outline" message="No pending electricity bills" /> : (
          <>
            {pendingItems.map((it: any) => (
              <View key={it.s_no} style={styles.payRow}>
                <View style={[styles.payMethodIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="flash-outline" size={16} color={C.warningDark} />
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
                  <Text style={[styles.payAmount, { color: C.warningDark }]}>
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
                <View style={[styles.cycleNum, { backgroundColor: paid ? C.background.blueLight : '#FEF3C7' }]}>
                  <Text style={[styles.cycleNumText, { color: paid ? C.primary : C.warningDark }]}>{i + 1}</Text>
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

      {/* Receipt Modal */}
      <TenantReceiptModal
        visible={receiptVisible}
        receiptData={receiptData}
        onClose={() => setReceiptVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12 },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  summaryCount: { fontSize: 20, fontWeight: '800', color: C.dark },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: C.darkTertiary },
  summaryDivider: { width: 1, height: 28, backgroundColor: C.border },

  duesCard: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dueDot: { width: 6, height: 6, borderRadius: 3 },
  dueLine: { fontSize: 13, color: C.dangerDark, fontWeight: '500' },

  monthGroup: { marginTop: 4 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  monthLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: C.dark },
  monthCount: { fontSize: 11, fontWeight: '600', color: C.darkTertiary, backgroundColor: C.lightSecondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  monthTotal: { fontSize: 13, fontWeight: '800', color: C.primary },

  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  payMethodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  payRemark: { fontSize: 11, color: C.darkTertiary, fontStyle: 'italic', marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.background.blueLight, alignSelf: 'flex-start' },
  receiptBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },

  totalRow: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  totalText: { fontSize: 13, fontWeight: '700', color: C.dark },

  cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  cycleNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleNumText: { fontSize: 13, fontWeight: '800' },
});
