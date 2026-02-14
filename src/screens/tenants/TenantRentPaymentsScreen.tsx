import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { ActionButtons } from '../../components/ActionButtons';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { CONTENT_COLOR } from '@/constant';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { ReceiptViewModal } from './components';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';
import { useVoidTenantPaymentMutation } from '@/services/api/paymentsApi';
import type { RootState } from '@/store';
import { useGetPGLocationDetailsQuery } from '@/services/api/pgLocationsApi';
import type { ReceiptData } from '@/services/receipt/receiptTypes';

interface RentPayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount: number;
  cycle_id?: number;
  start_date?: string;
  end_date?: string;
  tenant_rent_cycles?: {
    cycle_start?: string;
    cycle_end?: string;
  };
  payment_method: string;
  status: string;
  remarks?: string;

  cycle_status?: string | null;
  cycle_due?: number | null;
  cycle_total_paid?: number | null;
  cycle_remaining_due?: number | null;
  is_cycle_settled?: boolean | null;
}

export const TenantRentPaymentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { can } = usePermissions();
  const { width } = useWindowDimensions();

  // Responsive scaling helpers
  const baseWidth = 375; // iPhone X width as baseline
  const scale = Math.min(1.25, Math.max(0.9, width / baseWidth));
  const s = (n: number) => Math.round(n * scale);
  const maxContentWidth = Math.min(780, width - s(24));

  can(Permission.EDIT_PAYMENT);
  const canDeleteRent = can(Permission.DELETE_PAYMENT);
  const [voidTenantPayment] = useVoidTenantPaymentMutation();

  const payments: RentPayment[] = route.params?.payments || [];
  const visiblePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []).filter((p) => String(p?.status || '').toUpperCase() !== 'VOIDED'),
    [payments],
  );
  const tenantName = route.params?.tenantName || 'Tenant';
  const tenantId = route.params?.tenantId || 0;
  const tenantPhone = route.params?.tenantPhone || '';
  const tenantStatus = String(route.params?.tenantStatus || '').toUpperCase();
  const isCheckedOutTenant = tenantStatus === 'CHECKED_OUT';
  const pgName = route.params?.pgName || 'PG';
  const roomNumber = route.params?.roomNumber || '';
  const bedNumber = route.params?.bedNumber || '';
  const accommodationLabel = `${pgName}${roomNumber ? ` | Room ${roomNumber}` : ''}${bedNumber ? ` | Bed ${bedNumber}` : ''}`;

  const canVoidRentPayment = canDeleteRent && !isCheckedOutTenant;

  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const routePgIdRaw = (route.params as any)?.pgId;
  const effectivePgId =
    typeof routePgIdRaw === 'number'
      ? routePgIdRaw
      : selectedPGLocationId != null
        ? Number(selectedPGLocationId)
        : undefined;

  const { data: pgDetailsResponse } = useGetPGLocationDetailsQuery(effectivePgId as number, {
    skip: !effectivePgId,
  });

  const [loading, setLoading] = useState(false);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidTargetPayment, setVoidTargetPayment] = useState<RentPayment | null>(null);

  const refreshTenantDetails = () => {
    navigation.navigate('TenantDetails', { tenantId, refresh: true });
  };

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const receiptRef = useRef<View>(null);

  const handleVoidPayment = (payment: RentPayment) => {
    if (!canDeleteRent) {
      Alert.alert('Access Denied', "You don't have permission to delete rent payments");
      return;
    }

    if (isCheckedOutTenant) {
      Alert.alert('Not Allowed', 'Cannot delete rent payments for a checked-out tenant');
      return;
    }

    Alert.alert(
      'Delete Payment',
      `Deleting this payment will reopen dues for its cycle. This affects reports and balances.\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVoidTargetPayment(payment);
            setVoidReason('');
            setVoidModalVisible(true);
          },
        },
      ],
    );
  };

  const prepareReceiptData = (payment: RentPayment) => {
    const periodStart = (payment as any)?.tenant_rent_cycles?.cycle_start || (payment as any)?.start_date;
    const periodEnd = (payment as any)?.tenant_rent_cycles?.cycle_end || (payment as any)?.end_date;

    const pgDetails = pgDetailsResponse?.data;

    return {
      receiptNumber: `RCP-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: new Date(payment.payment_date),
      tenantName: tenantName,
      tenantPhone: tenantPhone,
      pgName: pgName,
      pgDetails: pgDetails
        ? {
            pgId: effectivePgId,
            pgName: pgDetails.location_name,
            address: pgDetails.address,
            pincode: pgDetails.pincode ?? undefined,
            city: pgDetails.city ?? undefined,
            state: pgDetails.state ?? undefined,
          }
        : undefined,
      roomNumber: route.params?.roomNumber || '',
      bedNumber: route.params?.bedNumber || '',
      rentPeriod: {
        startDate: periodStart ? new Date(periodStart) : new Date(payment.payment_date),
        endDate: periodEnd ? new Date(periodEnd) : new Date(payment.payment_date),
      },
      actualRent: Number(payment.actual_rent_amount || 0),
      amountPaid: Number(payment.amount_paid || 0),
      paymentMethod: payment.payment_method || 'CASH',
      remarks: payment.remarks,
      receiptType: 'RENT' as const,
    };
  };

  const handleViewReceipt = (payment: RentPayment) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setShowReceiptModal(true);
  };

  const submitVoidPayment = async () => {
    if (!voidTargetPayment) return;
    const reason = String(voidReason || '').trim();
    if (!reason) {
      Alert.alert('Reason Required', 'Please enter a reason for deleting this payment.');
      return;
    }

    try {
      setLoading(true);
      await voidTenantPayment({ id: voidTargetPayment.s_no, voided_reason: reason }).unwrap();
      Alert.alert('Success', 'Payment deleted successfully');
      setVoidModalVisible(false);
      setVoidTargetPayment(null);
      setVoidReason('');
      refreshTenantDetails();
    } catch (error: any) {
      Alert.alert('Delete Error', error?.data?.message || error?.message || 'Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: '#10B98120', text: '#10B981', icon: '✅' };
      case 'PARTIAL':
        return { bg: '#F9731620', text: '#F97316', icon: '⏳' };
      case 'PENDING':
        return { bg: '#F59E0B20', text: '#F59E0B', icon: '📅' };
      case 'FAILED':
        return { bg: '#EF444420', text: '#EF4444', icon: '❌' };
      default:
        return { bg: '#9CA3AF20', text: '#6B7280', icon: '📋' };
    }
  };

  const groupedPayments = useMemo(() => {
    const dateRangeKey = (start?: string, end?: string) => {
      const s = start ? String(start).slice(0, 10) : '';
      const e = end ? String(end).slice(0, 10) : '';
      return `${s}|${e}`;
    };

    const getPeriod = (p: RentPayment) => {
      const periodStart = (p as any)?.tenant_rent_cycles?.cycle_start || (p as any)?.start_date;
      const periodEnd = (p as any)?.tenant_rent_cycles?.cycle_end || (p as any)?.end_date;
      return { periodStart, periodEnd };
    };

    const groups = new Map<string, {
      key: string;
      cycleId?: number;
      periodStart?: string;
      periodEnd?: string;
      payments: RentPayment[];
    }>();

    (visiblePayments || []).forEach((p) => {
      const { periodStart, periodEnd } = getPeriod(p);
      const cycleId = (p as any)?.cycle_id;
      const key = cycleId ? `cycle:${cycleId}` : `range:${dateRangeKey(periodStart, periodEnd)}`;

      if (!groups.has(key)) {
        groups.set(key, { key, cycleId: cycleId ? Number(cycleId) : undefined, periodStart, periodEnd, payments: [] });
      }
      groups.get(key)!.payments.push(p);
    });

    const toDate = (d?: string) => (d ? new Date(String(d)) : null);

    return Array.from(groups.values())
      .map((g) => {
        const totalPaid = g.payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

        // Prefer cycle-level due if API provides it
        const cycleDueFromApi = g.payments.find((p) => p.cycle_due !== undefined && p.cycle_due !== null)?.cycle_due;
        const expectedFromPayments = g.payments.reduce((max, p) => Math.max(max, Number(p.actual_rent_amount || 0)), 0);
        const due = Number(cycleDueFromApi ?? expectedFromPayments ?? 0);

        const remainingFromApi = g.payments.find((p) => p.cycle_remaining_due !== undefined && p.cycle_remaining_due !== null)?.cycle_remaining_due;
        const remainingDue = remainingFromApi !== undefined && remainingFromApi !== null
          ? Number(remainingFromApi)
          : Math.max(0, due - totalPaid);

        const cycleStatusFromApi = g.payments.find((p) => p.cycle_status)?.cycle_status;
        const status = cycleStatusFromApi
          ? String(cycleStatusFromApi)
          : (due > 0 ? (remainingDue <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'NO_PAYMENT') : (totalPaid > 0 ? 'PARTIAL' : 'NO_PAYMENT'));

        const start = toDate(g.periodStart);
        const title = start
          ? start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          : 'Rent Cycle';

        const paymentsSorted = [...g.payments].sort(
          (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
        );

        return {
          ...g,
          title,
          totalPaid,
          due,
          remainingDue,
          status,
          payments: paymentsSorted,
        };
      })
      .sort((a, b) => {
        const aT = a.periodStart ? new Date(a.periodStart).getTime() : 0;
        const bT = b.periodStart ? new Date(b.periodStart).getTime() : 0;
        return bT - aT;
      });
  }, [visiblePayments]);

  const renderPaymentActions = (payment: RentPayment) => (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
      <TouchableOpacity
        onPress={() => handleViewReceipt(payment)}
        style={{
          paddingVertical: s(8),
          paddingHorizontal: s(12),
          backgroundColor: '#3B82F6',
          borderRadius: s(8),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: s(12), fontWeight: '600', color: '#FFF' }}>
          View/Share
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Rent Payments"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {/* Tenant Info Header */}
        <View style={{
          paddingHorizontal: s(16),
          paddingVertical: s(12),
          backgroundColor: Theme.colors.background.blueLight,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <Text style={{ fontSize: s(14), fontWeight: '600', color: Theme.colors.text.primary }}>
            {tenantName}
          </Text>
          <Text style={{ fontSize: s(12), color: Theme.colors.text.secondary, marginTop: s(4) }}>
            {payments.length} payment(s)
          </Text>
          <Text style={{ fontSize: s(12), color: Theme.colors.text.secondary, marginTop: s(4) }}>
            {accommodationLabel}
          </Text>
        </View>

        {loading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        )}

        {!loading && payments && payments.length > 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: s(16), paddingBottom: s(24), alignItems: 'center' }}
          >
            <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            {groupedPayments.map((group) => {
              const statusColor = getStatusColor(group.status);

              const startLabel = group.periodStart
                ? new Date(group.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '';
              const endLabel = group.periodEnd
                ? new Date(group.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '';

              const isSettled = group.remainingDue <= 0 && group.due > 0;

              return (
                <AnimatedPressableCard
                  key={group.key}
                  scaleValue={0.97}
                  duration={120}
                  style={{ marginBottom: s(12) }}
                >
                  <Card style={{ padding: s(12) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: s(10) }}>
                        <Text style={{ fontSize: s(14), fontWeight: '700', color: Theme.colors.text.primary }}>
                          {group.title}
                        </Text>
                        {!!startLabel && !!endLabel && (
                          <Text style={{ fontSize: s(11), color: Theme.colors.text.secondary, marginTop: s(4) }}>
                            {startLabel} - {endLabel}
                          </Text>
                        )}
                        <Text style={{ fontSize: s(11), color: Theme.colors.text.secondary, marginTop: s(4) }}>
                          {group.payments.length} payment(s)
                          {'  '}|{'  '}Total ₹{Math.round(group.totalPaid)}
                        </Text>
                        {group.due > 0 && (
                          <Text style={{ fontSize: s(11), color: isSettled ? '#10B981' : '#F97316', marginTop: s(4), fontWeight: '700' }}>
                            {isSettled ? 'No pending for this month' : `Pending ₹${group.remainingDue.toFixed(2)}`}
                          </Text>
                        )}
                      </View>

                      <View style={{
                        paddingHorizontal: s(10),
                        paddingVertical: s(6),
                        borderRadius: s(10),
                        backgroundColor: statusColor.bg,
                        alignSelf: 'flex-start',
                      }}>
                        <Text style={{ fontSize: s(10), fontWeight: '800', color: statusColor.text }}>
                          {statusColor.icon} {group.status}
                        </Text>
                      </View>
                    </View>

                    <View style={{ height: s(10) }} />

                    {group.payments.map((payment) => {
                      const paymentPg = (payment as any)?.pg_id ?? '';
                      const paymentRoom = (payment as any)?.room_id ?? '';
                      const paymentBed = (payment as any)?.bed_id ?? '';
                      const paymentPgName = (payment as any)?.pg_locations?.location_name;
                      const paymentRoomNo = (payment as any)?.rooms?.room_no;
                      const paymentBedNo = (payment as any)?.beds?.bed_no;
                      const paymentAccommodationLabel =
                        paymentPgName || paymentRoomNo || paymentBedNo || paymentPg || paymentRoom || paymentBed
                          ? `${paymentPgName || (paymentPg ? `PG ${paymentPg}` : pgName)}${(paymentRoomNo || paymentRoom) ? ` | Room ${paymentRoomNo || paymentRoom}` : ''}${(paymentBedNo || paymentBed) ? ` | Bed ${paymentBedNo || paymentBed}` : ''}`
                          : accommodationLabel;

                      const installmentSettled = payment.is_cycle_settled;

                      return (
                        <View
                          key={payment.s_no}
                          style={{
                            backgroundColor: '#F9FAFB',
                            padding: s(10),
                            borderRadius: s(10),
                            marginBottom: s(10),
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1, paddingRight: s(10) }}>
                              <Text style={{ fontSize: s(12), color: Theme.colors.text.tertiary }}>
                                {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                              <Text style={{ fontSize: s(11), color: Theme.colors.text.secondary, marginTop: s(4) }}>
                                {paymentAccommodationLabel}
                              </Text>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: s(13), fontWeight: '800', color: Theme.colors.text.primary }}>
                                ₹{Number(payment.amount_paid || 0).toLocaleString('en-IN')}
                              </Text>
                              <Text style={{ fontSize: s(10), fontWeight: '700', color: Theme.colors.text.secondary, marginTop: s(2) }}>
                                Bed Rent ₹{Number((payment as any)?.bed_rent_amount_snapshot ?? (payment as any)?.beds?.bed_price ?? 0).toLocaleString('en-IN')}
                              </Text>
                              {payment.status === 'PARTIAL' && installmentSettled !== undefined && installmentSettled !== null && (
                                <Text
                                  style={{
                                    fontSize: s(10),
                                    fontWeight: '800',
                                    color: installmentSettled ? '#10B981' : '#F97316',
                                    marginTop: s(2),
                                  }}
                                >
                                  {installmentSettled ? 'Cleared' : 'Not cleared'}
                                </Text>
                              )}
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: s(8) }}>
                            <Text style={{ fontSize: s(11), color: Theme.colors.text.secondary }}>
                              {payment.payment_method || 'N/A'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: s(8), flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <ActionButtons
                                onDelete={() => handleVoidPayment(payment)}
                                showView={false}
                                showEdit={false}
                                showDelete={canVoidRentPayment}
                                disableDelete={!canVoidRentPayment}
                              />
                              {renderPaymentActions(payment)}
                            </View>
                          </View>

                          {!!payment.remarks && (
                            <Text style={{ fontSize: s(10), color: Theme.colors.text.tertiary, fontStyle: 'italic', marginTop: s(6) }}>
                              {payment.remarks}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </Card>
                </AnimatedPressableCard>
              );
            })}
            <View style={{ height: s(20) }} />
            </View>
          </ScrollView>
        ) : (
          !loading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: s(16) }}>
              <View style={{
                width: s(80),
                height: s(80),
                borderRadius: s(40),
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: s(16),
              }}>
                <Ionicons name="document-outline" size={s(48)} color={Theme.colors.text.tertiary} />
              </View>
              <Text style={{ fontSize: s(16), fontWeight: '600', color: Theme.colors.text.primary, marginBottom: s(8) }}>
                No Rent Payments
              </Text>
              <Text style={{ fontSize: s(13), color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No rent payments have been recorded for this tenant yet.
              </Text>
            </View>
          )
        )}
      </View>

      {/* Receipt View Modal */}
      <ReceiptViewModal
        visible={showReceiptModal}
        receiptData={receiptData}
        receiptRef={receiptRef}
        onClose={() => {
          setShowReceiptModal(false);
          // Only clear receipt data after a small delay to ensure sharing is complete
          setTimeout(() => setReceiptData(null), 1000);
        }}
      />

      {/* Hidden receipt for capture (off-screen) */}
      {receiptData && !showReceiptModal && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <View ref={receiptRef} collapsable={false}>
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          </View>
        </View>
      )}

      <SlideBottomModal
        visible={voidModalVisible}
        onClose={() => {
          if (loading) return;
          setVoidModalVisible(false);
          setVoidTargetPayment(null);
          setVoidReason('');
        }}
        title="Delete Payment"
        subtitle={voidTargetPayment ? `Payment #${voidTargetPayment.s_no}` : ''}
        onSubmit={submitVoidPayment}
        submitLabel={loading ? 'Deleting...' : 'Delete Payment'}
        cancelLabel="Cancel"
        isLoading={loading}
        enableFullHeightDrag={false}
        enableFlexibleHeightDrag={true}
      >
        <View style={{ paddingHorizontal: s(16), paddingBottom: s(12) }}>
          <Text style={{ fontSize: s(12), color: Theme.colors.text.secondary, marginBottom: s(8) }}>
            Provide a reason. Deleting reopens dues for that cycle and affects reports.
          </Text>
          <TextInput
            value={voidReason}
            onChangeText={setVoidReason}
            placeholder="Reason for deletion"
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: s(10),
              padding: s(12),
              minHeight: s(90),
              textAlignVertical: 'top',
              backgroundColor: '#FFFFFF',
              color: Theme.colors.text.primary,
            }}
          />
        </View>
      </SlideBottomModal>

      {/* Payments are immutable: editing is disabled */}
    </ScreenLayout>
  );
};
