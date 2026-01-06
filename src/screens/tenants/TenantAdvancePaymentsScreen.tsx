import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
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
import {
  useUpdateAdvancePaymentMutation,
  useVoidAdvancePaymentMutation,
  type CreateAdvancePaymentDto,
} from '@/services/api/paymentsApi';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { ReceiptViewModal } from './components';
import AdvancePaymentForm from '@/screens/tenants/AdvancePaymentForm';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';
import type { RootState } from '@/store';
import { useGetPGLocationDetailsQuery } from '@/services/api/pgLocationsApi';
import type { ReceiptData } from '@/services/receipt/receiptTypes';

interface AdvancePayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount: number;
  payment_method: string;
  status: string;
  remarks?: string;

  pg_id?: number;
  room_id?: number;
  bed_id?: number;
  pg_locations?: { location_name?: string };
  rooms?: { room_no?: string };
  beds?: { bed_no?: string };
}

type TenantAdvancePaymentsParams = {
  payments?: AdvancePayment[];
  tenantName?: string;
  tenantId?: number;
  pgId?: number;
  tenantJoinedDate?: string;
  tenantPhone?: string;
  pgName?: string;
  roomNumber?: string;
  bedNumber?: string;
  roomId?: number;
  bedId?: number;
};

type TenantAdvancePaymentsRouteProp = RouteProp<Record<string, TenantAdvancePaymentsParams>, string>;

type BasicNavigation = {
  goBack: () => void;
  navigate: (screen: string, params?: unknown) => void;
};

export const TenantAdvancePaymentsScreen: React.FC = () => {
  const navigation = useNavigation<BasicNavigation>();
  const route = useRoute<TenantAdvancePaymentsRouteProp>();
  const { can } = usePermissions();

  const canEditAdvance = can(Permission.EDIT_PAYMENT);
  const canDeleteAdvance = can(Permission.DELETE_PAYMENT);

  const [updateAdvancePayment] = useUpdateAdvancePaymentMutation();
  const [voidAdvancePayment] = useVoidAdvancePaymentMutation();

  const payments: AdvancePayment[] = route.params?.payments || [];
  const visiblePayments = (Array.isArray(payments) ? payments : []).filter(
    (p) => String(p?.status || '').toUpperCase() !== 'VOIDED'
  );
  const tenantName = route.params?.tenantName || 'Tenant';
  const tenantId = route.params?.tenantId || 0;
  const pgId = route.params?.pgId || 0;
  const tenantJoinedDate = route.params?.tenantJoinedDate || undefined;
  const tenantPhone = route.params?.tenantPhone || '';
  const pgName = route.params?.pgName || 'PG';
  const roomNumber = route.params?.roomNumber || '';
  const bedNumber = route.params?.bedNumber || '';
  const accommodationLabel = `${pgName}${roomNumber ? ` | Room ${roomNumber}` : ''}${bedNumber ? ` | Bed ${bedNumber}` : ''}`;

  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const effectivePgId = pgId || selectedPGLocationId || undefined;
  const { data: pgDetailsResponse } = useGetPGLocationDetailsQuery(Number(effectivePgId), {
    skip: !effectivePgId,
  });

  const [loading, setLoading] = useState(false);
  const [advancePaymentFormVisible, setAdvancePaymentFormVisible] = useState(false);
  const [advancePaymentFormMode, setAdvancePaymentFormMode] = useState<"add" | "edit">("add");
  const [editingAdvancePayment, setEditingAdvancePayment] = useState<AdvancePayment | null>(null);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidTargetPayment, setVoidTargetPayment] = useState<AdvancePayment | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<View | null>(null);

  // Function to refresh tenant details (navigate back to tenant details)
  const refreshTenantDetails = () => {
    // Navigate back to tenant details screen with refresh parameter
    navigation.navigate('TenantDetails', { tenantId, refresh: true });
  };

  const submitVoidPayment = async () => {
    if (!voidTargetPayment) return;
    const reason = String(voidReason || '').trim();
    if (!reason) {
      Alert.alert('Reason Required', 'Please enter a reason for voiding this payment.');
      return;
    }

    try {
      setLoading(true);
      await voidAdvancePayment({ id: voidTargetPayment.s_no, voided_reason: reason }).unwrap();
      Alert.alert('Success', 'Advance payment voided successfully');
      setVoidModalVisible(false);
      setVoidTargetPayment(null);
      setVoidReason('');
      refreshTenantDetails();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      Alert.alert('Void Error', err?.data?.message || err?.message || 'Failed to void payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = (payment: AdvancePayment) => {
    if (!canDeleteAdvance) {
      Alert.alert('Access Denied', "You don't have permission to void advance payments");
      return;
    }

    Alert.alert(
      'Void Advance Payment',
      `Voiding this payment will reopen advance due (audit trail kept).\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setVoidTargetPayment(payment);
            setVoidReason('');
            setVoidModalVisible(true);
          },
        },
      ]
    );
  };

  const handleEditAdvancePayment = (payment: AdvancePayment) => {
    if (!canEditAdvance) {
      Alert.alert('Access Denied', "You don't have permission to edit advance payments");
      return;
    }
    setAdvancePaymentFormMode("edit");
    setEditingAdvancePayment(payment);
    setAdvancePaymentFormVisible(true);
  };

  const handleUpdateAdvancePayment = async (id: number, data: Partial<CreateAdvancePaymentDto>) => {
    if (!canEditAdvance) {
      Alert.alert('Access Denied', "You don't have permission to edit advance payments");
      throw new Error('ACCESS_DENIED');
    }
    try {
      await updateAdvancePayment({ id, data }).unwrap();
    } catch (error: unknown) {
      throw error;
    }
  };

  const handleAdvancePaymentSuccess = () => {
    // Refresh tenant details and list after successful save/update
    refreshTenantDetails();
  };

  const prepareReceiptData = (payment: AdvancePayment) => {
    const pgDetails = pgDetailsResponse?.data;
    const data: ReceiptData = {
      receiptNumber: `ADV-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: new Date(payment.payment_date),
      tenantName: tenantName,
      tenantPhone: tenantPhone,
      pgName: pgName,
      pgDetails: pgDetails
        ? {
            pgId: Number(effectivePgId),
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
        startDate: new Date(payment.payment_date),
        endDate: new Date(payment.payment_date),
      },
      actualRent: Number(payment.amount_paid || 0),
      amountPaid: Number(payment.amount_paid || 0),
      paymentMethod: payment.payment_method || 'CASH',
      remarks: payment.remarks,
      receiptType: 'ADVANCE' as const,
    };

    return data;
  };

  const handleViewReceipt = (payment: AdvancePayment) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleShareReceipt = async (payment: AdvancePayment) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);
      
      setTimeout(async () => {
        await CompactReceiptGenerator.shareImage(receiptRef);
        setReceiptData(null);
      }, 100);
    } catch (_error) {
      Alert.alert('Error', 'Failed to share receipt');
      setReceiptData(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: '#10B98120', text: '#10B981', icon: '✅' };
      case 'PARTIAL':
        return { bg: '#DC262620', text: '#DC2626', icon: '⏳' };
      case 'PENDING':
        return { bg: '#F59E0B20', text: '#F59E0B', icon: '📅' };
      case 'FAILED':
        return { bg: '#EF444420', text: '#EF4444', icon: '❌' };
      default:
        return { bg: '#9CA3AF20', text: '#6B7280', icon: '📋' };
    }
  };


  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Advance Payments"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, position: 'relative' }}>
        {/* Tenant Info Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: Theme.colors.background.blueLight,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
            {tenantName}
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 4 }}>
            {payments.length} payment(s)
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 4 }}>
            {accommodationLabel}
          </Text>
        </View>

        {loading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        )}

        {!loading && visiblePayments && visiblePayments.length > 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {visiblePayments.map((payment) => {
              const statusColor = getStatusColor(payment.status);

              const paymentPg = payment?.pg_id ?? '';
              const paymentRoom = payment?.room_id ?? '';
              const paymentBed = payment?.bed_id ?? '';
              const paymentPgName = payment?.pg_locations?.location_name;
              const paymentRoomNo = payment?.rooms?.room_no;
              const paymentBedNo = payment?.beds?.bed_no;
              const paymentAccommodationLabel =
                paymentPgName || paymentRoomNo || paymentBedNo || paymentPg || paymentRoom || paymentBed
                  ? `${paymentPgName || (paymentPg ? `PG ${paymentPg}` : pgName)}${(paymentRoomNo || paymentRoom) ? ` | Room ${paymentRoomNo || paymentRoom}` : ''}${(paymentBedNo || paymentBed) ? ` | Bed ${paymentBedNo || paymentBed}` : ''}`
                  : accommodationLabel;

              return (
                <AnimatedPressableCard
                  key={payment.s_no}
                  scaleValue={0.97}
                  duration={120}
                  style={{ marginBottom: 12 }}
                >
                  <Card style={{
                    padding: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: '#10B981',
                  }}>
                    {/* Header Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginBottom: 4 }}>
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                          {paymentAccommodationLabel}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: statusColor.bg,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor.text }}>
                          {statusColor.icon} {payment.status}
                        </Text>
                      </View>
                    </View>

                    {/* Amount Details */}
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                          Rent Amount
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary }}>
                          ₹{payment.actual_rent_amount}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                          Amount Paid
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                    </View>

                    {/* Payment Method */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                      marginBottom: 10,
                    }}>
                      <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                        {payment.payment_method || 'N/A'}
                      </Text>
                      {payment.remarks && (
                        <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, fontStyle: 'italic' }}>
                          {payment.remarks}
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <ActionButtons
                        onEdit={() => handleEditAdvancePayment(payment)}
                        onDelete={() => handleDeletePayment(payment)}
                        showView={false}
                        disableEdit={!canEditAdvance}
                        disableDelete={!canDeleteAdvance}
                        blockPressWhenDisabled
                      />
                      <TouchableOpacity
                        onPress={() => handleViewReceipt(payment)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: '#DBEAFE',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1D4ED8' }}>
                          View Invoice
                        </Text>
                      </TouchableOpacity>
                      {/* <TouchableOpacity
                        onPress={() => handleWhatsAppReceipt(payment)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: '#DCFCE7',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A' }}>
                          💬 WhatsApp
                        </Text>
                      </TouchableOpacity> */}
                      <TouchableOpacity
                        onPress={() => handleShareReceipt(payment)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: '#FEF3C7',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }}>
                          Share Invoice
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </AnimatedPressableCard>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        ) : (
          !loading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F0FDF4',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="wallet-outline" size={48} color="#10B981" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                No Advance Payments
              </Text>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No advance payments have been recorded for this tenant yet.
              </Text>
            </View>
          )
        )}
      </View>

      {/* Receipt View Modal */}
      <ReceiptViewModal
        visible={receiptModalVisible}
        receiptData={receiptData}
        receiptRef={receiptRef}
        onClose={() => setReceiptModalVisible(false)}
      />

      {/* Hidden receipt for capture (off-screen) */}
      {receiptData && !receiptModalVisible && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <View ref={receiptRef} collapsable={false}>
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          </View>
        </View>
      )}

      {/* Advance Payment Form Modal */}
      <AdvancePaymentForm
        visible={advancePaymentFormVisible}
        mode={advancePaymentFormMode}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantJoinedDate={tenantJoinedDate}
        pgId={pgId}
        roomId={route.params?.roomId || 0}
        bedId={route.params?.bedId || 0}
        paymentId={editingAdvancePayment?.s_no}
        existingPayment={editingAdvancePayment}
        onClose={() => {
          setAdvancePaymentFormVisible(false);
          setEditingAdvancePayment(null);
          setAdvancePaymentFormMode("add");
        }}
        onSuccess={handleAdvancePaymentSuccess}
        onSave={handleUpdateAdvancePayment}
      />

      <SlideBottomModal
        visible={voidModalVisible}
        onClose={() => {
          if (loading) return;
          setVoidModalVisible(false);
          setVoidTargetPayment(null);
          setVoidReason('');
        }}
        title="Void Advance Payment"
        subtitle={voidTargetPayment ? `Payment #${voidTargetPayment.s_no}` : ''}
        onSubmit={submitVoidPayment}
        submitLabel={loading ? 'Voiding...' : 'Void Payment'}
        cancelLabel="Cancel"
        isLoading={loading}
        enableFullHeightDrag={false}
        enableFlexibleHeightDrag={true}
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 8 }}>
            Provide a reason. Voiding reopens advance due and affects reports.
          </Text>
          <TextInput
            value={voidReason}
            onChangeText={setVoidReason}
            placeholder="Reason for voiding"
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              padding: 12,
              minHeight: 90,
              textAlignVertical: 'top',
              backgroundColor: '#FFFFFF',
              color: Theme.colors.text.primary,
            }}
          />
        </View>
      </SlideBottomModal>

    </ScreenLayout>
  );
};
