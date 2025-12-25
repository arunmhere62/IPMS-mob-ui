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
import { useDeleteAdvancePaymentMutation, useUpdateAdvancePaymentMutation } from '@/services/api/paymentsApi';
import { showErrorAlert } from '@/utils/errorHandler';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { ReceiptViewModal } from './components';
import AdvancePaymentForm from '@/screens/tenants/AdvancePaymentForm';

interface AdvancePayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount: number;
  payment_method: string;
  status: string;
  remarks?: string;
}

export const TenantAdvancePaymentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [deleteAdvancePayment] = useDeleteAdvancePaymentMutation();
  const [updateAdvancePayment] = useUpdateAdvancePaymentMutation();

  const payments: AdvancePayment[] = route.params?.payments || [];
  const tenantName = route.params?.tenantName || 'Tenant';
  const tenantId = route.params?.tenantId || 0;
  const pgId = route.params?.pgId || 0;
  const tenantJoinedDate = route.params?.tenantJoinedDate || undefined;
  const tenantPhone = route.params?.tenantPhone || '';
  const pgName = route.params?.pgName || 'PG';

  const [loading, setLoading] = useState(false);
  const [advancePaymentFormVisible, setAdvancePaymentFormVisible] = useState(false);
  const [advancePaymentFormMode, setAdvancePaymentFormMode] = useState<"add" | "edit">("add");
  const [editingAdvancePayment, setEditingAdvancePayment] = useState<any>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<any>(null);

  // Function to refresh tenant details (navigate back to tenant details)
  const refreshTenantDetails = () => {
    // Navigate back to tenant details screen with refresh parameter
    navigation.navigate('TenantDetails', { tenantId, refresh: true });
  };

  const handleDeletePayment = (payment: AdvancePayment) => {
    Alert.alert(
      'Delete Advance Payment',
      `Are you sure you want to delete this advance payment?\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
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
              await deleteAdvancePayment(payment.s_no).unwrap();
              Alert.alert('Success', 'Advance payment deleted successfully');
              
              // Navigate back to tenant details screen with refresh
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

  const handleEditAdvancePayment = (payment: AdvancePayment) => {
    setAdvancePaymentFormMode("edit");
    setEditingAdvancePayment(payment);
    setAdvancePaymentFormVisible(true);
  };

  const handleUpdateAdvancePayment = async (id: number, data: any) => {
    try {
      await updateAdvancePayment({ id, data }).unwrap();
    } catch (error: any) {
      throw error;
    }
  };

  const handleAdvancePaymentSuccess = () => {
    // Refresh tenant details and list after successful save/update
    refreshTenantDetails();
  };

  const prepareReceiptData = (payment: AdvancePayment) => {
    return {
      receiptNumber: `ADV-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
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
      receiptType: 'ADVANCE' as const,
    };
  };

  const handleViewReceipt = (payment: AdvancePayment) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleWhatsAppReceipt = async (payment: AdvancePayment) => {
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

  const handleShareReceipt = async (payment: AdvancePayment) => {
    try {
      const data = prepareReceiptData(payment);
      setReceiptData(data);
      
      setTimeout(async () => {
        await CompactReceiptGenerator.shareImage(receiptRef);
        setReceiptData(null);
      }, 100);
    } catch (error) {
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
                        showEdit={true}
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

    </ScreenLayout>
  );
};
