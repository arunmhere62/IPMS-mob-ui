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
import { useDispatch, useSelector } from 'react-redux';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { AnimatedPressableCard } from '../../components/AnimatedPressableCard';
import { ActionButtons } from '../../components/ActionButtons';
import { CONTENT_COLOR } from '@/constant';
import { paymentService } from '@/services/payments/paymentService';
import { showErrorAlert } from '@/utils/errorHandler';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import { ReceiptViewModal } from './components';
import { RootState, AppDispatch } from '../../store';
import { fetchTenants } from '../../store/slices/tenantSlice';
import RentPaymentForm from './RentPaymentForm';

interface RentPayment {
  s_no: number;
  payment_date: string;
  amount_paid: number;
  actual_rent_amount: number;
  start_date: string;
  end_date: string;
  payment_method: string;
  status: string;
  remarks?: string;
}

export const TenantRentPaymentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const payments: RentPayment[] = route.params?.payments || [];
  const tenantName = route.params?.tenantName || 'Tenant';
  const tenantId = route.params?.tenantId || 0;
  const tenantPhone = route.params?.tenantPhone || '';
  const pgName = route.params?.pgName || 'PG';

  const [loading, setLoading] = useState(false);

  // Function to refresh tenant list
  const refreshTenantList = async () => {
    try {
      await dispatch(
        fetchTenants({
          page: 1,
          limit: 20,
          pg_id: selectedPGLocationId || undefined,
          organization_id: user?.organization_id || undefined,
          user_id: user?.s_no || undefined,
        })
      ).unwrap();
    } catch (error) {
      console.error('Error refreshing tenant list:', error);
    }
  };

  // Function to refresh tenant details (navigate back to tenant details)
  const refreshTenantDetails = () => {
    // Navigate back to tenant details screen with refresh parameter
    navigation.navigate('TenantDetails', { tenantId, refresh: true });
  };
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [editingPayment, setEditingPayment] = useState<RentPayment | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const receiptRef = useRef<any>(null);

  const handleDeletePayment = (payment: RentPayment) => {
    Alert.alert(
      'Delete Payment',
      `Are you sure you want to delete this payment?\n\nAmount: ₹${payment.amount_paid}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
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
              await paymentService.deleteTenantPayment(payment.s_no);
              Alert.alert('Success', 'Payment deleted successfully');
              
              // Navigate back to tenant details screen with refresh
              refreshTenantDetails();
              refreshTenantList();
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

  const handleEditPayment = (payment: RentPayment) => {
    setEditingPayment(payment);
    setIsEditModalVisible(true);
  };

  const handleSavePayment = async (id: number, data: any) => {
    try {
      setLoading(true);
      await paymentService.updateTenantPayment(id, data);
      setIsEditModalVisible(false);
      setEditingPayment(null);
      
      // Navigate back to tenant details screen
      refreshTenantDetails();
    } catch (error: any) {
      showErrorAlert(error, 'Update Error');
    } finally {
      setLoading(false);
    }
  };

  const prepareReceiptData = (payment: RentPayment) => {
    return {
      receiptNumber: `RCP-${payment.s_no}-${new Date(payment.payment_date).getFullYear()}`,
      paymentDate: new Date(payment.payment_date),
      tenantName: tenantName,
      tenantPhone: tenantPhone,
      pgName: pgName,
      roomNumber: route.params?.roomNumber || '',
      bedNumber: route.params?.bedNumber || '',
      rentPeriod: {
        startDate: new Date(payment.start_date),
        endDate: new Date(payment.end_date),
      },
      actualRent: Number(payment.actual_rent_amount || 0),
      amountPaid: Number(payment.amount_paid || 0),
      paymentMethod: payment.payment_method || 'CASH',
      remarks: payment.remarks,
    };
  };

  const handleViewReceipt = (payment: RentPayment) => {
    const data = prepareReceiptData(payment);
    setReceiptData(data);
    setReceiptModalVisible(true);
  };

  const handleWhatsAppReceipt = async (payment: RentPayment) => {
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

  const handleShareReceipt = async (payment: RentPayment) => {
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
        title="Rent Payments"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
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
            {payments.map((payment, index) => {
              const statusColor = getStatusColor(payment.status);
              const dueAmount = payment.actual_rent_amount - payment.amount_paid;

              return (
                <AnimatedPressableCard
                  key={payment.s_no}
                  scaleValue={0.97}
                  duration={120}
                  style={{ marginBottom: 12 }}
                >
                  <Card style={{
                    padding: 12,
                    borderLeftWidth: dueAmount > 0 ? 3 : 0,
                    borderLeftColor: dueAmount > 0 ? '#F97316' : 'transparent',
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

                    {/* Rent Period */}
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 10,
                    }}>
                      <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginBottom: 4 }}>
                        Rent Period
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary }}>
                          {new Date(payment.start_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })} - {new Date(payment.end_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
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
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                          Amount Paid
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981' }}>
                          ₹{payment.amount_paid}
                        </Text>
                      </View>
                      {dueAmount > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
                            Due Amount
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316' }}>
                            ₹{dueAmount}
                          </Text>
                        </View>
                      )}
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
                        onEdit={() => handleEditPayment(payment)}
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
                      <TouchableOpacity
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
                      </TouchableOpacity>
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
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="document-outline" size={48} color={Theme.colors.text.tertiary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                No Rent Payments
              </Text>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No rent payments have been recorded for this tenant yet.
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

      {/* Edit Payment Modal */}
      {editingPayment && (
        <RentPaymentForm
          visible={isEditModalVisible}
          mode="edit"
          tenantId={tenantId}
          tenantName={tenantName}
          roomId={route.params?.roomId || 0}
          bedId={route.params?.bedId || 0}
          pgId={route.params?.pgId || 0}
          rentAmount={editingPayment.actual_rent_amount}
          joiningDate={route.params?.joiningDate}
          lastPaymentStartDate={editingPayment.start_date}
          lastPaymentEndDate={editingPayment.end_date}
          previousPayments={payments.filter(p => p.s_no !== editingPayment.s_no)}
          paymentId={editingPayment.s_no}
          existingPayment={editingPayment}
          onClose={() => {
            setIsEditModalVisible(false);
            setEditingPayment(null);
          }}
          onSuccess={() => {
            setIsEditModalVisible(false);
            setEditingPayment(null);
            
            // Navigate back to tenant details screen
            refreshTenantDetails();
          }}
          onSave={handleSavePayment}
        />
      )}
    </ScreenLayout>
  );
};
