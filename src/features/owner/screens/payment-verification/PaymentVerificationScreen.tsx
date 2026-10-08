import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { Theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { Button } from '@/components/Button';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import {
  useLazyGetSubmissionsQuery,
  useGetVerificationStatsQuery,
  useVerifySubmissionMutation,
  useRejectSubmissionMutation,
  type TenantPaymentSubmission,
  type SubmissionStatus,
} from '@/features/owner/api/paymentVerificationApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

const C = Theme.colors;

const STATUS_META: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  SUBMITTED: { label: 'Pending', color: C.warningDark, bg: '#FEF3C7', icon: 'time-outline' },
  VERIFIED: { label: 'Verified', color: C.secondaryDark, bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Rejected', color: C.danger, bg: '#FEE2E2', icon: 'close-circle-outline' },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAmount = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

interface PaymentVerificationScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

export const PaymentVerificationScreen: React.FC<PaymentVerificationScreenProps> = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { can } = usePermissions();
  const canVerifyPayment = can(Permission.EDIT_PAYMENT_VERIFICATION);
  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'ALL'>('SUBMITTED');
  const [submissions, setSubmissions] = useState<TenantPaymentSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; submissionId: number | null }>({ visible: false, submissionId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isFetchingRef = useRef(false);
  const isFirstFocusRef = useRef(true);
  const activeTabRef = useRef(activeTab);

  const { data: statsResponse } = useGetVerificationStatsQuery();
  const [fetchSubmissions] = useLazyGetSubmissionsQuery();
  const [verifySubmission] = useVerifySubmissionMutation();
  const [rejectSubmission] = useRejectSubmissionMutation();

  const stats = statsResponse?.data;

  const loadSubmissions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const response = await fetchSubmissions({
        status: activeTabRef.current === 'ALL' ? undefined : activeTabRef.current,
        page: pageNum,
        limit: 20,
      }).unwrap();

      if (response.success) {
        if (append) {
          setSubmissions(prev => [...prev, ...response.data]);
        } else {
          setSubmissions(response.data);
        }
        const pagination = response.pagination as { totalPages?: number; hasMore?: boolean } | undefined;
        const totalPages = pagination?.totalPages || 0;
        setHasMore(totalPages ? pageNum < totalPages : Boolean(pagination?.hasMore));
        setPage(pageNum);
      }
    } catch (error: any) {
      showErrorAlert(null, error?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [fetchSubmissions]);

  // Reload when active tab changes
  const handleTabChange = (tab: SubmissionStatus | 'ALL') => {
    if (tab === activeTab) return;
    activeTabRef.current = tab;
    setActiveTab(tab);
    setSubmissions([]);
    setHasMore(true);
    setPage(1);
    loadSubmissions(1, false);
  };

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        loadSubmissions(1, false);
        return;
      }
      loadSubmissions(1, false);
    }, [loadSubmissions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setSubmissions([]);
    setHasMore(true);
    setPage(1);
    loadSubmissions(1, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    loadSubmissions(page + 1, true);
  };

  const handleVerify = (submission: TenantPaymentSubmission) => {
    if (!canVerifyPayment) return;
    Alert.alert(
      'Verify Payment',
      `Are you sure you want to verify this payment of ${formatAmount(submission.paid_amount)} from ${submission.tenants?.name || 'tenant'}?\n\nThis will mark the rent payment as PAID.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await verifySubmission({ id: submission.s_no }).unwrap();
              showSuccessAlert(result?.message || 'Payment verified successfully');
              onRefresh();
            } catch (error: any) {
              showErrorAlert(null, error?.data?.message || 'Failed to verify payment');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectPress = (submission: TenantPaymentSubmission) => {
    if (!canVerifyPayment) return;
    setRejectReason('');
    setRejectModal({ visible: true, submissionId: submission.s_no });
  };

  const handleRejectConfirm = async () => {
    if (!canVerifyPayment) return;
    if (!rejectReason.trim()) {
      Alert.alert('Validation Error', 'Please provide a rejection reason');
      return;
    }
    if (!rejectModal.submissionId) return;

    setActionLoading(true);
    try {
      const result = await rejectSubmission({
        id: rejectModal.submissionId,
        rejection_reason: rejectReason.trim(),
      }).unwrap();
      showSuccessAlert(result?.message || 'Payment rejected. Tenant can resubmit.');
      setRejectModal({ visible: false, submissionId: null });
      onRefresh();
    } catch (error: any) {
      showErrorAlert(null, error?.data?.message || 'Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const renderDetailRow = (icon: string, label: string, value: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Ionicons name={icon as any} size={14} color={C.text.secondary} />
      <Text style={{ fontSize: 13, color: C.text.secondary, marginLeft: 6, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text.primary }} numberOfLines={1}>{value}</Text>
    </View>
  );

  const renderSubmission = (submission: TenantPaymentSubmission) => {
    const meta = STATUS_META[submission.status];
    const rentPayment = submission.rent_payments;
    return (
      <Card key={submission.s_no} style={{ marginBottom: 12, padding: 16, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.background.blueLight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>
                {(submission.tenants?.name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text.primary }} numberOfLines={1}>
                {submission.tenants?.name || 'Unknown Tenant'}
              </Text>
              <Text style={{ fontSize: 11, color: C.darkTertiary, marginTop: 2 }}>
                {submission.pg_locations?.location_name || 'PG'} · Room {rentPayment?.rooms?.room_no || '-'} / Bed {rentPayment?.beds?.bed_no || '-'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: meta.bg }}>
            <Ionicons name={meta.icon as any} size={12} color={meta.color} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
          </View>
        </View>

        {/* Payment Details — icon+text rows like other owner screens */}
        <View style={{ marginTop: 4 }}>
          {renderDetailRow('cash-outline', 'Paid Amount', formatAmount(submission.paid_amount))}
          {renderDetailRow('calendar-outline', 'Paid Date', formatDate(submission.paid_date))}
          {renderDetailRow('card-outline', 'Method', submission.payment_method)}
          {renderDetailRow('barcode-outline', 'Txn Ref', submission.transaction_ref || '-')}
        </View>

        {/* Rent Payment Context */}
        {rentPayment && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 4 }}>
            <Ionicons name="receipt-outline" size={14} color={C.darkTertiary} />
            <Text style={{ fontSize: 12, color: C.darkSecondary, fontWeight: '500' }}>
              Rent: {formatAmount(rentPayment.actual_rent_amount)} · Status: {rentPayment.status}
            </Text>
          </View>
        )}

        {/* Tenant Notes */}
        {submission.tenant_notes && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 8, backgroundColor: C.background.secondary, marginBottom: 8 }}>
            <Ionicons name="chatbubble-outline" size={14} color={C.darkTertiary} />
            <Text style={{ flex: 1, fontSize: 12, color: C.darkSecondary, fontStyle: 'italic' }}>"{submission.tenant_notes}"</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {submission.status === 'REJECTED' && submission.rejection_reason && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 8, backgroundColor: '#FEE2E2', marginBottom: 8 }}>
            <Ionicons name="close-circle-outline" size={14} color={C.danger} />
            <Text style={{ flex: 1, fontSize: 12, color: C.dangerDark }}>Rejected: {submission.rejection_reason}</Text>
          </View>
        )}

        {/* Verified By */}
        {submission.status === 'VERIFIED' && submission.users && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color={C.secondaryDark} />
            <Text style={{ fontSize: 12, color: C.secondaryDark, fontWeight: '500' }}>Verified by {submission.users.name} on {formatDate(submission.verified_at || '')}</Text>
          </View>
        )}

        {/* Actions */}
        {submission.status === 'SUBMITTED' && canVerifyPayment && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <Button
              title="Reject"
              onPress={() => handleRejectPress(submission)}
              variant="danger"
              size="sm"
              style={{ flex: 1 }}
              icon={<Ionicons name="close-outline" size={16} color="#FFF" />}
            />
            <Button
              title="Verify & Mark Paid"
              onPress={() => handleVerify(submission)}
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
              icon={<Ionicons name="checkmark-outline" size={16} color="#FFF" />}
            />
          </View>
        )}
      </Card>
    );
  };

  const tabs: { key: SubmissionStatus | 'ALL'; label: string; count: number }[] = [
    { key: 'SUBMITTED', label: 'Pending', count: stats?.pending_verification ?? 0 },
    { key: 'VERIFIED', label: 'Verified', count: stats?.verified ?? 0 },
    { key: 'REJECTED', label: 'Rejected', count: stats?.rejected ?? 0 },
    { key: 'ALL', label: 'All', count: stats?.total ?? 0 },
  ];

  return (
    <ScreenLayout>
      <ScreenHeader
        title="Payment Verification"
        subtitle="Verify tenant payment submissions"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Tab Filters — fixed horizontal scroll bar like RoomsScreen */}
      <View style={{ height: 48, backgroundColor: C.background.secondary, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' }}
          style={{ flex: 1 }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <AnimatedPressableCard
                key={tab.key}
                onPress={() => handleTabChange(tab.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: isActive ? C.primary : C.background.primary,
                  borderWidth: 1,
                  borderColor: isActive ? C.primary : C.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : C.text.secondary }}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : C.lightSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isActive ? '#fff' : C.darkTertiary }}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </AnimatedPressableCard>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <FlatList
        data={submissions}
        keyExtractor={(item) => String(item.s_no)}
        renderItem={({ item }) => renderSubmission(item)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={C.darkTertiary} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>No Submissions</Text>
              <Text style={{ fontSize: 13, color: C.darkTertiary, textAlign: 'center' }}>
                {activeTab === 'SUBMITTED'
                  ? 'No pending payment submissions to verify'
                  : `No ${activeTab.toLowerCase()} submissions found`}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: C.text.secondary }}>
                Loading more...
              </Text>
            </View>
          ) : null
        }
      />

      {/* Reject Modal — uses reusable SlideBottomModal + Input */}
      <SlideBottomModal
        visible={rejectModal.visible}
        onClose={() => setRejectModal({ visible: false, submissionId: null })}
        title="Reject Payment"
        subtitle="Provide a reason — the tenant will see this"
        submitLabel="Reject Payment"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        onSubmit={handleRejectConfirm}
        minHeightPercent={0.45}
        maxHeightPercent={0.6}
      >
        <Input
          label="Rejection Reason *"
          placeholder="e.g. Payment not received, please check and resubmit"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </SlideBottomModal>
    </ScreenLayout>
  );
};
