import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { DatePicker } from './DatePicker';
import { AdvancePayment } from '@/services/api/paymentsApi';

interface EditAdvancePaymentModalProps {
  visible: boolean;
  payment: AdvancePayment | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<AdvancePayment>) => Promise<void>;
}

const PAYMENT_METHODS = [
  { label: 'GPay', value: 'GPAY', icon: 'logo-google' },
  { label: 'PhonePe', value: 'PHONEPE', icon: 'phone-portrait-outline' },
  { label: 'Cash', value: 'CASH', icon: 'cash-outline' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: 'card-outline' },
];

const ADVANCE_PAYMENT_STATUSES = [
  { label: 'Paid', value: 'PAID', color: Theme.colors.secondary },
  { label: 'Pending', value: 'PENDING', color: Theme.colors.warning },
  { label: 'Failed', value: 'FAILED', color: Theme.colors.danger },
  { label: 'Refunded', value: 'REFUNDED', color: Theme.colors.primary },
];

export const EditAdvancePaymentModal: React.FC<EditAdvancePaymentModalProps> = ({
  visible,
  payment,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [status, setStatus] = useState('PENDING');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount_paid?.toString() || '');
      setPaymentDate(payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : '');
      setPaymentMethod((payment.payment_method as string) || 'CASH');
      setStatus((payment.status as string) || 'PENDING');
      setRemarks(payment.remarks || '');
    }
  }, [payment]);

  const validate = () => {
    const newErrors: any = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !payment) return;

    try {
      setLoading(true);
      await onSave(payment.s_no, {
        amount_paid: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod as any,
        status: status as any,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error updating advance payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!payment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableOpacity
            style={{ flex: 0.1 }}
            activeOpacity={1}
            onPress={handleClose}
          />
          
          <View
            style={{
              flex: 0.9,
              backgroundColor: Theme.colors.canvas,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: Theme.colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '600',
                    color: Theme.colors.text.primary,
                  }}
                >
                  Edit Advance Payment
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: Theme.colors.text.secondary,
                    marginTop: 4,
                  }}
                >
                  {payment.tenants?.name} • {payment.rooms?.room_no || 'N/A'}/{payment.beds?.bed_no || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={Theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Amount <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: Theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: errors.amount ? Theme.colors.danger : Theme.colors.input.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: Theme.colors.text.primary,
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor={Theme.colors.input.placeholder}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                {errors.amount && (
                  <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.amount}
                  </Text>
                )}
              </View>

              {/* Payment Date */}
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={(date: string) => setPaymentDate(date)}
                required
                error={errors.paymentDate}
              />

              {/* Payment Method */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Payment Method <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() => setPaymentMethod(method.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor:
                          paymentMethod === method.value
                            ? Theme.colors.primary
                            : Theme.colors.border,
                        backgroundColor:
                          paymentMethod === method.value
                            ? Theme.colors.background.blueLight
                            : Theme.colors.canvas,
                      }}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={18}
                        color={
                          paymentMethod === method.value
                            ? Theme.colors.primary
                            : Theme.colors.text.secondary
                        }
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 14,
                          fontWeight: paymentMethod === method.value ? '600' : '400',
                          color:
                            paymentMethod === method.value
                              ? Theme.colors.primary
                              : Theme.colors.text.primary,
                        }}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Status <Text style={{ color: Theme.colors.danger }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ADVANCE_PAYMENT_STATUSES.map((statusOption) => (
                    <TouchableOpacity
                      key={statusOption.value}
                      onPress={() => setStatus(statusOption.value)}
                      style={{
                        flex: 1,
                        minWidth: '45%',
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor:
                          status === statusOption.value ? statusOption.color : Theme.colors.border,
                        backgroundColor:
                          status === statusOption.value
                            ? Theme.withOpacity(statusOption.color, 0.1)
                            : Theme.colors.canvas,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: status === statusOption.value ? '600' : '400',
                          color:
                            status === statusOption.value
                              ? statusOption.color
                              : Theme.colors.text.primary,
                        }}
                      >
                        {statusOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Remarks */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Remarks (Optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: Theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: Theme.colors.input.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: Theme.colors.text.primary,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Add any notes..."
                  placeholderTextColor={Theme.colors.input.placeholder}
                  multiline
                  numberOfLines={3}
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border,
              }}
            >
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={{
                  backgroundColor: loading ? Theme.colors.button.disabled : Theme.colors.primary,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color={Theme.colors.canvas} />
                ) : (
                  <Text
                    style={{
                      color: Theme.colors.canvas,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
