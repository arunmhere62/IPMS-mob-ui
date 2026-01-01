import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { ActionButtons } from '../../components/ActionButtons';
import { CONTENT_COLOR } from '@/constant';
import { useDeleteRefundPaymentMutation, useUpdateRefundPaymentMutation } from '@/services/api/paymentsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { ReceiptViewModal } from './components';
import { AddRefundPaymentModal } from './AddRefundPaymentModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface RefundPayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount: number;
  payment_method: string;
  status: string;
  remarks?: string;
}

export const TenantRefundPaymentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { can } = usePermissions();

  const canEditRefund = can(Permission.EDIT_REFUND);
  const canDeleteRefund = can(Permission.DELETE_REFUND);

  const [deleteRefundPayment] = useDeleteRefundPaymentMutation();
  const [updateRefundPayment] = useUpdateRefundPaymentMutation();

  const payments: RefundPayment[] = route.params?.payments || [];
  const tenantName = route.params?.tenantName || 'Tenant';
  const tenantId = route.params?.tenantId || 0;
  const tenantPhone = route.params?.tenantPhone || '';
  const pgName = route.params?.pgName || 'PG';
  const roomNumber = route.params?.roomNumber || '';
  const bedNumber = route.params?.bedNumber || '';
  const accommodationLabel = `${pgName}${roomNumber ? ` | Room ${roomNumber}` : ''}${bedNumber ? ` | Bed ${bedNumber}` : ''}`;

  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<any>(null);

  const [refundFormVisible, setRefundFormVisible] = useState(false);
  const [refundFormMode, setRefundFormMode] = useState<'add' | 'edit'>('add');
  const [editingRefundPayment, setEditingRefundPayment] = useState<RefundPayment | null>(null);

  const [loading, setLoading] = useState(false);

  // Function to refresh tenant details (navigate back to tenant details)
  const refreshTenantDetails = () => {
    navigation.navigate('TenantDetails', { tenantId, refresh: true });
  };

  const handleDeletePayment = (payment: RefundPayment) => {
    if (!canDeleteRefund) {
      Alert.alert('Access Denied', "You don't have permission to delete refund payments");
      return;
    }
    Alert.alert(
      'Delete Refund Payment',
      `Are you sure you want to delete this refund?\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteRefundPayment(payment.s_no).unwrap();
              showSuccessAlert('Refund payment deleted successfully');

              refreshTenantDetails();
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditRefundPayment = (payment: RefundPayment) => {
    if (!canEditRefund) {
      Alert.alert('Access Denied', "You don't have permission to edit refund payments");
      return;
    }
    setRefundFormMode('edit');
    setEditingRefundPayment(payment);
    setRefundFormVisible(true);
  };

  const handleUpdateRefundPayment = async (id: number, data: any) => {
    if (!canEditRefund) {
      Alert.alert('Access Denied', "You don't have permission to edit refund payments");
      throw new Error('ACCESS_DENIED');
    }
    await updateRefundPayment({ id, data }).unwrap();
  };

  const handleRefundPaymentSuccess = () => {
    refreshTenantDetails();
  };

  const prepareReceiptData = (payment: RefundPayment) => {
    return {
      receiptNumber: `REF-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: new Date(payment.payment_date),
      tenantName: tenantName,
      tenantPhone: tenantPhone,
      pgName: pgName,
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
      receiptType: 'REFUND' as const,
    };
  };

  const handleViewReceipt = (payment: RefundPayment) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleWhatsAppReceipt = async (payment: RefundPayment) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);

      setTimeout(async () => {
        await CompactReceiptGenerator.shareViaWhatsApp(
          receiptRef,
          data,
          tenantPhone || ''
        );
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send via WhatsApp');
      setReceiptData(null);
    }
  };

  const handleShareReceipt = async (payment: RefundPayment) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);

      setTimeout(async () => {
        await CompactReceiptGenerator.shareImage(receiptRef);
        setReceiptData(null);
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
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
        title="Refund Payments"
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

        {!loading && payments && payments.length > 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {payments.map((payment) => {
              const statusColor = getStatusColor(payment.status);

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
                    borderLeftColor: '#F59E0B',
                  }}>
                    {/* Header Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1, flexShrink: 1, paddingRight: 10 }}>
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
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#D97706' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>

                      <View style={{
                        minWidth: 90,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: statusColor.bg,
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor.text }}>
                          {statusColor.icon} {payment.status}
                        </Text>
                      </View>
                    </View>

                    {/* Amount Details */}
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                          Refund Amount
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary }}>
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
                        onEdit={() => handleEditRefundPayment(payment)}
                        onDelete={() => handleDeletePayment(payment)}
                        showView={false}
                        disableEdit={!canEditRefund}
                        disableDelete={!canDeleteRefund}
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
                backgroundColor: '#FEF3C7',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="cash-outline" size={48} color="#D97706" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                No Refund Payments
              </Text>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No refund payments have been recorded for this tenant yet.
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

      {/* Refund Payment Form Modal */}
      <AddRefundPaymentModal
        visible={refundFormVisible}
        mode={refundFormMode}
        tenant={{
          s_no: tenantId,
          name: tenantName,
          room_id: route.params?.roomId,
          bed_id: route.params?.bedId,
          pg_id: route.params?.pgId,
          rooms: { room_no: route.params?.roomNumber || '' },
          beds: { bed_no: route.params?.bedNumber || '' },
        }}
        existingPayment={editingRefundPayment ? {
          amount_paid: editingRefundPayment.amount_paid,
          payment_date: editingRefundPayment.payment_date,
          payment_method: editingRefundPayment.payment_method,
          status: editingRefundPayment.status,
          remarks: editingRefundPayment.remarks,
        } : null}
        onClose={() => {
          setRefundFormVisible(false);
          setEditingRefundPayment(null);
          setRefundFormMode('add');
        }}
        onSave={async (data) => {
          if (refundFormMode === 'edit' && editingRefundPayment) {
            await handleUpdateRefundPayment(editingRefundPayment.s_no, data);
            setRefundFormVisible(false);
            setEditingRefundPayment(null);
            setRefundFormMode('add');
            handleRefundPaymentSuccess();
          }
        }}
      />
    </ScreenLayout>
  );
};
