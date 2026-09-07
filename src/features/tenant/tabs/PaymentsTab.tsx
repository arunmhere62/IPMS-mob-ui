import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { StatusBadge, SectionCard, EmptyState } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { useGetTenantPaymentSubmissionsQuery, type TenantProfileData } from '@/features/tenant/api/tenantPortalApi';
import {
  useGetTenantPaymentsSummaryQuery,
  useLazyDetectPaymentGapsQuery,
  type RentPaymentGap } from '@/features/tenant/api/tenantPaymentsApi';
import { useGetPendingElectricityBillItemsByTenantQuery } from '@/features/owner/api/electricityBillApi';
import { TenantReceiptModal } from '../components/TenantReceiptModal';
import { buildTenantReceiptData } from '../services/buildTenantReceiptData';
import type { ReceiptData, ReceiptType } from '@/services/receipt/receiptTypes';

const C = Theme.colors;

// Responsive helpers
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 600;
const CARD_GAP = IS_TABLET ? 14 : 10;

// Enable LayoutAnimation for smooth tab transitions
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PaymentsTabProps {
  tenantId: number;
  /** Profile data (for receipt generation — name, phone, email, address) */
  profileRaw?: TenantProfileData;
}

type PaymentKind = 'RENT' | 'ADVANCE' | 'REFUND' | 'SUBMISSION';
type TabKey = 'history' | 'electricity' | 'cycles';

// Theme-aligned colors: blue for rent, amber for advance (deposit), green for refund, indigo for submissions
const KIND_META: Record<PaymentKind, { label: string; color: string; bg: string; icon: string }> = {
  RENT: { label: 'Rent', color: C.primary, bg: C.background.blueLight, icon: 'cash-outline' },
  ADVANCE: { label: 'Advance', color: C.warningDark, bg: '#FEF3C7', icon: 'wallet-outline' },
  REFUND: { label: 'Refund', color: C.secondaryDark, bg: '#D1FAE5', icon: 'return-down-back-outline' },
  SUBMISSION: { label: 'Payment Submission', color: '#6366F1', bg: '#E0E7FF', icon: 'cloud-upload-outline' },
};

// Submission status meta for colored badges
const SUBMISSION_STATUS_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  SUBMITTED: { color: '#6366F1', bg: '#E0E7FF', icon: 'hourglass-outline', label: 'Pending Verification' },
  REJECTED: { color: C.dangerDark, bg: '#FEE2E2', icon: 'close-circle-outline', label: 'Rejected' },
};

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'cycles', label: 'Pay Rent', icon: 'card-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
  { key: 'electricity', label: 'Electricity', icon: 'flash-outline' },
];

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ tenantId, profileRaw }) => {
  const { formatDate, formatAmount } = useFormatters();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  // Fetch payments summary from dedicated endpoint
  const { data: paymentsResponse, isLoading: paymentsLoading, refetch: refetchPayments } = useGetTenantPaymentsSummaryQuery(undefined, {
    skip: !tenantId,
    refetchOnMountOrArgChange: true,
  });
  const raw = paymentsResponse?.data;

  const { data: pendingItemsResponse } = useGetPendingElectricityBillItemsByTenantQuery(tenantId ?? 0, {
    skip: !tenantId,
  });
  const { data: submissionsResponse } = useGetTenantPaymentSubmissionsQuery({ page: 1, limit: 50 });
  // Build a lookup from rent_payment s_no → { cycle_id, status } using the payments summary
  // so we can properly link submissions to cycles and detect stale submissions
  const rentPaymentLookup = useMemo(() => {
    const map = new Map<number, { cycle_id: number; status: string }>();
    for (const rp of (raw?.rent_payments ?? [])) {
      map.set(rp.s_no, { cycle_id: rp.cycle_id, status: rp.status });
    }
    return map;
  }, [raw]);

  // Normalize submissions — the API returns the rent_payment relation as `rent_payments`
  // (single object). Fall back to the long Prisma relation name in case the backend changes.
  // Also resolve cycle_id via the rent payment lookup.
  const rawSubmissions = (submissionsResponse as any)?.data?.data ?? [];
  const mySubmissions = rawSubmissions.map((s: any) => {
    const rentPayment = s.rent_payments
      ?? (Array.isArray(s.rent_payments_tenant_payment_submissions_rent_payment_idTorent_payments)
        ? s.rent_payments_tenant_payment_submissions_rent_payment_idTorent_payments[0]
        : s.rent_payments_tenant_payment_submissions_rent_payment_idTorent_payments)
      ?? null;
    // Look up cycle_id and rent payment status from the payments summary
    const lookup = s.rent_payment_id ? rentPaymentLookup.get(s.rent_payment_id) : null;
    return {
      ...s,
      rent_payment: rentPayment,
      cycle_id: lookup?.cycle_id ?? rentPayment?.cycle_id ?? null,
      rent_payment_status: lookup?.status ?? rentPayment?.status ?? null,
    };
  });
  const pendingItems = (pendingItemsResponse as any)?.data ?? [];
  const electricityTotal = pendingItems.reduce((sum: number, it: any) => sum + (Number(it.share_amount) - Number(it.paid_amount || 0)), 0);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabKey>('cycles');
  const [refreshing, setRefreshing] = useState(false);

  // ─── Missing rent periods detection (same API as owner app) ───
  const [triggerDetectPaymentGaps] = useLazyDetectPaymentGapsQuery();
  const [checkingGaps, setCheckingGaps] = useState(false);
  const [gaps, setGaps] = useState<RentPaymentGap[]>([]);

  const detectGaps = useCallback(async () => {
    if (!tenantId || tenantId <= 0) {
      console.log('[PaymentsTab] detectGaps skipped — no tenantId:', tenantId);
      return;
    }
    setCheckingGaps(true);
    try {
      const gapData = await triggerDetectPaymentGaps(tenantId).unwrap();
      console.log('[PaymentsTab] detectGaps response:', JSON.stringify(gapData));

      if (gapData?.hasGaps && Array.isArray(gapData.gaps) && gapData.gaps.length > 0) {
        setGaps(gapData.gaps);
      } else {
        setGaps([]);
      }
    } catch (e) {
      console.error('[PaymentsTab] detectGaps error:', e);
      setGaps([]);
    } finally {
      setCheckingGaps(false);
    }
  }, [tenantId, triggerDetectPaymentGaps]);

  // Detect gaps when the "Pay Rent" tab is active
  useEffect(() => {
    if (activeTab === 'cycles' && tenantId) {
      detectGaps();
    }
  }, [activeTab, tenantId, detectGaps]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchPayments();
    } finally {
      setRefreshing(false);
    }
  }, [refetchPayments]);

  // Refetch payments when the tab gains focus (e.g., returning from submit payment screen)
  useFocusEffect(
    useCallback(() => {
      refetchPayments();
    }, [refetchPayments]),
  );

  // Receipt modal state
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const handleViewReceipt = (payment: any, kind: ReceiptType) => {
    // Use profileRaw for tenant personal info (name, phone, email, address)
    // Fall back to payments data if profile not available
    const receiptSource = profileRaw || raw;
    const data = buildTenantReceiptData(receiptSource as any, payment, kind);
    setReceiptData(data);
    setReceiptVisible(true);
  };

  // Build a lookup from cycle_id → cycle_start for grouping by rent period
  const cycleStartById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of (raw?.tenant_rent_cycles ?? [])) {
      map.set(c.s_no, c.cycle_start);
    }
    return map;
  }, [raw]);

  // Merge all payment types into a single, de-duplicated, date-sorted history
  // Include payment submissions (SUBMITTED, VERIFIED, REJECTED) so the tenant
  // can see the full timeline of their payment activity
  const history = [
    ...(raw?.rent_payments ?? []).map((p: any) => ({ ...p, kind: 'RENT' as PaymentKind })),
    ...(raw?.advance_payments ?? []).map((p: any) => ({ ...p, kind: 'ADVANCE' as PaymentKind })),
    ...(raw?.refund_payments ?? []).map((p: any) => ({ ...p, kind: 'REFUND' as PaymentKind })),
    // Only show SUBMITTED and REJECTED submissions in history.
    // VERIFIED submissions are skipped — the rent_payment itself shows as PAID
    // once verified, so showing the submission too would be a duplicate.
    // Also skip stale SUBMITTED submissions whose linked rent_payment is already PAID
    // (e.g. owner marked rent paid manually without using the verification flow).
    ...mySubmissions
      .filter((s: any) => {
        if (s.status === 'VERIFIED') return false;
        if (s.status === 'SUBMITTED' && s.rent_payment_status === 'PAID') return false;
        return s.status === 'SUBMITTED' || s.status === 'REJECTED';
      })
      .map((s: any) => ({
        s_no: s.s_no,
        payment_date: s.submitted_at || s.paid_date,
        amount_paid: s.paid_amount,
        payment_method: s.payment_method,
        status: s.status,
        remarks: s.tenant_notes || s.rejection_reason,
        kind: 'SUBMISSION' as PaymentKind,
        submission_status: s.status,
        rejection_reason: s.rejection_reason,
        transaction_ref: s.transaction_ref,
        rent_payment: s.rent_payment,
        cycle_id: s.cycle_id ?? null,
      })),
  ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  // Group payments by the RENT CYCLE month (not payment_date)
  // - Rent payments & submissions: grouped by cycle_start month
  // - Advance/Refund: grouped by payment_date month (no cycle)
  const groupedHistory = useMemo(() => {
    const groups: { key: string; label: string; payments: any[]; total: number; sortTime: number }[] = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (const p of history) {
      // Determine which date to group by:
      // - RENT & SUBMISSION: use the cycle_start (the month the rent is FOR)
      // - ADVANCE & REFUND: use payment_date (no cycle association)
      let groupDate: Date;
      if ((p.kind === 'RENT' || p.kind === 'SUBMISSION') && p.cycle_id) {
        // Look up cycle_start from the cycle lookup, or fall back to tenant_rent_cycles on the payment
        const cycleStartStr = cycleStartById.get(p.cycle_id)
          ?? p.tenant_rent_cycles?.cycle_start
          ?? null;
        groupDate = cycleStartStr ? new Date(cycleStartStr) : new Date(p.payment_date);
      } else if (p.kind === 'RENT' && p.tenant_rent_cycles?.cycle_start) {
        groupDate = new Date(p.tenant_rent_cycles.cycle_start);
      } else {
        groupDate = new Date(p.payment_date);
      }

      const key = `${groupDate.getFullYear()}-${String(groupDate.getMonth()).padStart(2, '0')}`;
      const label = `${monthNames[groupDate.getMonth()]} ${groupDate.getFullYear()}`;
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label, payments: [], total: 0, sortTime: groupDate.getTime() };
        groups.push(group);
      }
      group.payments.push(p);
      group.total += Number(p.amount_paid || 0);
    }
    // Sort groups by cycle month descending (most recent rent period first)
    groups.sort((a, b) => b.sortTime - a.sortTime);
    return groups;
  }, [history, cycleStartById]);

  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const switchTab = (tab: TabKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // Loading state
  if (paymentsLoading && !raw) {
    return <ActivityIndicator color={C.primary} style={{ marginTop: 48 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* ── Tab Bar (sticky — doesn't scroll) ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => switchTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? C.primary : C.darkTertiary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Tab Content (scrollable) ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 12, paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
      {activeTab === 'history' && (
        <SectionCard style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
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
                  </TouchableOpacity>
                  {!isCollapsed && group.payments.map((p: any) => {
                    const meta = KIND_META[p.kind as PaymentKind];
                    const isSubmission = p.kind === 'SUBMISSION';

                    // ── Submission row ──
                    if (isSubmission) {
                      const subMeta = SUBMISSION_STATUS_META[p.submission_status] ?? SUBMISSION_STATUS_META.SUBMITTED;
                      const cycleInfo = p.rent_payment?.cycle_id
                        ? `Cycle #${p.rent_payment.cycle_id}`
                        : 'Payment submission';
                      return (
                        <View key={`${p.kind}-${p.s_no}`} style={styles.payRow}>
                          <View style={[styles.payMethodIcon, { backgroundColor: subMeta.bg }]}>
                            <Ionicons name={subMeta.icon as any} size={16} color={subMeta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.payTitle} numberOfLines={1}>{subMeta.label}</Text>
                            <Text style={styles.payMeta}>{cycleInfo} · {p.payment_method} · {formatDate(p.payment_date)}</Text>
                            {p.transaction_ref ? (
                              <Text style={styles.payMeta}>Ref: {p.transaction_ref}</Text>
                            ) : null}
                            {p.rejection_reason ? (
                              <Text style={styles.rejectionReasonText}>Rejected: {p.rejection_reason}</Text>
                            ) : null}
                            {p.submission_status === 'SUBMITTED' && (
                              <Text style={styles.submissionPendingText}>Awaiting owner verification</Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={[styles.payAmount, { color: subMeta.color }]}>{formatAmount(p.amount_paid)}</Text>
                            <View style={[styles.submissionBadge, { backgroundColor: subMeta.bg }]}>
                              <Text style={[styles.submissionBadgeText, { color: subMeta.color }]}>
                                {p.submission_status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    }

                    // ── Regular payment row (rent, advance, refund) ──
                    const subtitle = p.kind === 'RENT' && p.tenant_rent_cycles
                      ? `${formatDate(p.tenant_rent_cycles.cycle_start)} – ${formatDate(p.tenant_rent_cycles.cycle_end)}`
                      : meta.label;
                    const isPaid = p.status === 'PAID';
                    const isPartial = p.status === 'PARTIAL';

                    // For partial rent payments, check if the cycle is now fully settled
                    const cycleSummary = p.cycle_id && (raw as any)?.payment_cycle_summaries
                      ? ((raw as any).payment_cycle_summaries as any[]).find((s: any) => s.cycle_id === p.cycle_id)
                      : null;
                    const cycleSettled = cycleSummary?.status === 'PAID';
                    const paymentRemainingDue = isPartial
                      ? Math.max(0, Number(p.actual_rent_amount) - Number(p.amount_paid))
                      : 0;
                    // Only show remaining due if the cycle is still not fully paid
                    const showRemainingDue = isPartial && !cycleSettled && paymentRemainingDue > 0;

                    return (
                      <View key={`${p.kind}-${p.s_no}`} style={styles.payRow}>
                        <View style={[styles.payMethodIcon, { backgroundColor: meta.bg }]}>
                          <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.payTitle} numberOfLines={1}>{subtitle}</Text>
                          <Text style={styles.payMeta}>{meta.label} · {p.payment_method} · {formatDate(p.payment_date)}</Text>
                          {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
                          {/* Partial: show remaining due only if the cycle is still not settled */}
                          {showRemainingDue && (
                            <Text style={styles.partialDueText}>
                              Remaining due: {formatAmount(paymentRemainingDue)}
                            </Text>
                          )}
                          {isPartial && cycleSettled && (
                            <Text style={styles.partialSettledText}>
                              Settled with another payment
                            </Text>
                          )}
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
                          {isPartial && (
                            <Text style={styles.partialActualText}>
                              of {formatAmount(p.actual_rent_amount)}
                            </Text>
                          )}
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
      )}

      {activeTab === 'electricity' && (
        <SectionCard style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
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
      )}

      {activeTab === 'cycles' && (
        <>
          {checkingGaps ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} />
          ) : !gaps.length ? (
            <EmptyState icon="checkmark-circle-outline" message="All rent paid — no pending dues!" />
          ) : (
            gaps.map((gap: RentPaymentGap, i: number) => {
              const gapRemaining = typeof gap?.remainingDue === 'number'
                ? gap.remainingDue
                : typeof gap?.rentDue === 'number' && typeof gap?.totalPaid === 'number'
                  ? Number(gap.rentDue) - Number(gap.totalPaid)
                  : typeof gap?.due === 'number'
                    ? gap.due
                    : 0;
              const cycleDue = Math.max(0, gapRemaining);
              const cycleAmount = typeof gap?.rentDue === 'number' ? Number(gap.rentDue) : cycleDue;
              const cyclePaid = typeof gap?.totalPaid === 'number' ? Number(gap.totalPaid) : 0;
              const isPartial = cyclePaid > 0 && cycleDue > 0;
              const hasActiveSubmission = mySubmissions.some(
                (s: any) => s.cycle_id === gap.cycle_id && s.status === 'SUBMITTED',
              );

              // Find the latest rejected submission for this cycle
              const rejectedSubmission = gap.cycle_id
                ? mySubmissions
                    .filter((s: any) => s.cycle_id === gap.cycle_id && s.status === 'REJECTED')
                    .sort((a: any, b: any) => new Date(b.verified_at || b.submitted_at).getTime() - new Date(a.verified_at || a.submitted_at).getTime())[0]
                : null;

              // Determine display status
              let displayStatus = 'PENDING';
              let statusColor = C.warningDark;
              let statusBg = '#FEF3C7';
              if (hasActiveSubmission) {
                displayStatus = 'PENDING VERIFICATION';
                statusColor = '#6366F1';
                statusBg = '#E0E7FF';
              } else if (isPartial) {
                displayStatus = 'PARTIAL';
              }

              return (
                <View key={gap.gapId ?? `gap-${i}`} style={styles.cycleRow}>
                  <View style={styles.cycleRowTop}>
                    <View style={[styles.cycleNum, { backgroundColor: statusBg }]}>
                      <Text style={[styles.cycleNumText, { color: statusColor }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payTitle}>{formatDate(gap.gapStart)} – {formatDate(gap.gapEnd)}</Text>
                      <Text style={styles.payMeta}>{gap.daysMissing}d · Rent {formatAmount(cycleAmount)}</Text>
                      {isPartial && cyclePaid > 0 && cycleDue > 0 && (
                        <Text style={styles.cyclePartialInfo}>
                          Paid {formatAmount(cyclePaid)} · Due {formatAmount(cycleDue)}
                        </Text>
                      )}
                    </View>
                    <StatusBadge status={displayStatus} />
                  </View>
                  {/* Show Pay button only if due > 0 and no active submission */}
                  {!hasActiveSubmission && cycleDue > 0 && (
                    <AnimatedPressableCard
                      onPress={() =>
                        navigation.navigate('TenantSubmitPaymentProof', {
                          rent_payment_id: 0,
                          rent_amount: cycleDue,
                          rent_status: isPartial ? 'PARTIAL' : 'PENDING',
                          cycle_id: gap.cycle_id ?? 0,
                          cycle_start: gap.gapStart,
                          cycle_end: gap.gapEnd,
                        })
                      }
                      style={styles.payNowFullBtn}
                    >
                      <Ionicons name="card-outline" size={16} color="#FFF" />
                      <Text style={styles.payNowFullBtnText}>
                        {isPartial ? `Pay Remaining ${formatAmount(cycleDue)}` : `Pay ${formatAmount(cycleDue)}`}
                      </Text>
                    </AnimatedPressableCard>
                  )}
                  {/* Show "Pending Verification" banner if submission is awaiting owner action */}
                  {hasActiveSubmission && (
                    <View style={styles.pendingVerificationBanner}>
                      <Ionicons name="hourglass-outline" size={16} color={C.warningDark} />
                      <Text style={styles.pendingVerificationText}>
                        Payment submitted — waiting for owner verification
                      </Text>
                    </View>
                  )}
                  {/* Show "Rejected" banner with reason if owner rejected the payment */}
                  {rejectedSubmission && !hasActiveSubmission && (
                    <View style={styles.rejectedBanner}>
                      <Ionicons name="close-circle-outline" size={16} color={C.dangerDark} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rejectedBannerTitle}>
                          Payment of {formatAmount(Number(rejectedSubmission.paid_amount) || 0)} was rejected
                        </Text>
                        {rejectedSubmission.rejection_reason ? (
                          <Text style={styles.rejectedBannerReason}>
                            Reason: {rejectedSubmission.rejection_reason}
                          </Text>
                        ) : null}
                        <Text style={styles.rejectedBannerHint}>
                          You can pay again using the button above
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      </ScrollView>

      {/* Receipt Modal */}
      <TenantReceiptModal
        visible={receiptVisible}
        receiptData={receiptData}
        onClose={() => setReceiptVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Tab bar — compact, full-width underline style
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginTop: 8,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabItemActive: {
    borderBottomColor: C.primary,
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: C.darkTertiary },
  tabLabelActive: { color: C.primary, fontWeight: '700' },

  payNowInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.primary, alignSelf: 'flex-start' },
  payNowInlineBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  monthGroup: { marginTop: 8, marginBottom: 4 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  monthLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: C.dark },

  payRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: CARD_GAP },
  payMethodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  payTitle: { fontSize: IS_TABLET ? 14 : 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: IS_TABLET ? 12 : 11, color: C.darkTertiary, marginTop: 3 },
  payRemark: { fontSize: 11, color: C.darkTertiary, fontStyle: 'italic', marginTop: 3 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.background.blueLight, alignSelf: 'flex-start' },
  receiptBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },

  totalRow: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  totalText: { fontSize: 13, fontWeight: '700', color: C.dark },

  cycleRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cycleRowTop: { flexDirection: 'row', alignItems: 'center', gap: CARD_GAP },
  cycleNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleNumText: { fontSize: 13, fontWeight: '800' },

  payNowFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary },
  payNowFullBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  pendingVerificationBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#FEF3C7' },
  pendingVerificationText: { fontSize: 12, fontWeight: '600', color: C.warningDark, flex: 1 },
  rejectedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#FEE2E2' },
  rejectedBannerTitle: { fontSize: 12, fontWeight: '700', color: C.dangerDark },
  rejectedBannerReason: { fontSize: 11, color: C.dangerDark, marginTop: 2 },
  rejectedBannerHint: { fontSize: 11, color: C.darkTertiary, marginTop: 4 },

  // Partial payment info in history
  partialDueText: { fontSize: 11, fontWeight: '600', color: C.warningDark, marginTop: 4 },
  partialSettledText: { fontSize: 11, color: C.secondaryDark, marginTop: 4 },
  partialActualText: { fontSize: 10, color: C.darkTertiary },

  // Submission-specific styles
  rejectionReasonText: { fontSize: 11, fontWeight: '600', color: C.dangerDark, marginTop: 2 },
  submissionPendingText: { fontSize: 11, color: '#6366F1', marginTop: 2 },
  submissionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  submissionBadgeText: { fontSize: 9, fontWeight: '700' },

  // Partial payment info in rent cycles
  cyclePartialInfo: { fontSize: 11, fontWeight: '600', color: C.warningDark, marginTop: 2 },
});
