import React, { useState, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { DatePicker } from '@/components/DatePicker';
import { OptionSelector } from '@/components/OptionSelector';
import {
  useRecordElectricityBillPaymentMutation,
  type ElectricityBillItem,
} from '@/features/owner/api/electricityBillApi';

interface RecordPaymentModalProps {
  visible: boolean;
  item: ElectricityBillItem | null;
  billId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ['CASH', 'GPAY', 'PHONEPE', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'OTHER'];

const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  item,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [recordPayment] = useRecordElectricityBillPaymentMutation();

  const reset = () => {
    setPaymentMethod('CASH');
    setPaymentDate(formatDate(new Date()));
  };

  const handleClose = () => {
    reset();
    submittingRef.current = false;
    onClose();
  };

  const remaining = item ? Number(item.share_amount) - Number(item.paid_amount || 0) : 0;

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!item || remaining <= 0) {
      Alert.alert('Validation Error', 'No remaining balance to pay');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Validation Error', 'Please select a payment method');
      return;
    }

    setLoading(true);
    submittingRef.current = true;
    try {
      await recordPayment({
        bill_item_id: item.s_no,
        tenant_id: item.tenant_id,
        amount: remaining,
        payment_method: paymentMethod,
        payment_date: paymentDate || undefined,
      }).unwrap();
      showSuccessAlert('Payment recorded successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      showErrorAlert(error, 'Payment Error');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  if (!item) return null;

  const paymentMethodOptions = paymentMethods.map((method) => ({
    label: method.replace('_', ' '),
    value: method,
  }));

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title="Record Payment"
      subtitle={item.tenants?.name ?? 'Tenant'}
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel="Save Payment"
      cancelLabel="Cancel"
      isLoading={loading}
      minHeightPercent={0.75}
    >
      <View style={{ gap: 16 }}>
        {/* Summary card */}
        <View
          style={{
            padding: 14,
            backgroundColor: '#E0F2FE',
            borderLeftWidth: 4,
            borderLeftColor: '#0EA5E9',
            borderRadius: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: '#0369A1' }}>Total Share</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0369A1' }}>
              ₹{Number(item.share_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: '#0369A1' }}>Already Paid</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0369A1' }}>
              ₹{Number(item.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#BAE6FD',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0369A1' }}>Paying Now</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0369A1' }}>
              ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Payment method (mandatory) */}
        <OptionSelector
          label="Payment Method"
          options={paymentMethodOptions}
          selectedValue={paymentMethod}
          onSelect={(value) => setPaymentMethod(value || 'CASH')}
          required
        />

        {/* Payment date (optional) */}
        <DatePicker
          label="Payment Date"
          value={paymentDate}
          onChange={setPaymentDate}
          required={false}
        />
      </View>
    </SlideBottomModal>
  );
};
