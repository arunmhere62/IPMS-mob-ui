import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Theme } from "../../../../theme";
import { DatePicker } from "../../../../components/DatePicker";
import { SlideBottomModal } from "../../../../components/SlideBottomModal";
import { OptionSelector, Option } from "../../../../components/OptionSelector";
import { AmountInput } from "../../../../components/AmountInput";
import { useLazyGetBedByIdQuery } from "@/features/owner/api/roomsApi";
import { showErrorAlert } from "@/utils/errorHandler";

interface AddRefundPaymentModalProps {
  visible: boolean;
  mode?: 'add' | 'edit';
  tenant: {
    s_no: number;
    name: string;
    room_id?: number;
    bed_id?: number;
    pg_id?: number;
    rooms?: {
      room_no: string;
      rent_price?: number;
    };
    beds?: {
      bed_no: string;
    };
  } | null;
  totalAdvancePaid?: number;
  existingPayment?: {
    amount_paid: number;
    payment_date: string;
    payment_method: string;
    status: string;
    remarks?: string;
  } | null;
  onClose: () => void;
  onSave: (data: {
    tenant_id: number;
    room_id: number;
    bed_id: number;
    amount_paid: number;
    actual_rent_amount?: number;
    payment_date: string;
    payment_method: string;
    status: string;
    remarks?: string;
  }) => Promise<void>;
}

const PAYMENT_METHODS: Option[] = [
  { label: "GPay", value: "GPAY", icon: "📱" },
  { label: "PhonePe", value: "PHONEPE", icon: "📱" },
  { label: "Cash", value: "CASH", icon: "💵" },
  { label: "Bank Transfer", value: "BANK_TRANSFER", icon: "🏦" },
];

// Helper to add BED/RM prefix if not present
const formatBedNo = (bedNo?: string): string => {
  if (!bedNo) return '';
  return bedNo.toUpperCase().startsWith('BED') ? bedNo : `BED${bedNo}`;
};

const formatRoomNo = (roomNo?: string): string => {
  if (!roomNo) return '';
  return roomNo.toUpperCase().startsWith('RM') ? roomNo : `RM${roomNo}`;
};

const PAYMENT_STATUS: Option[] = [
  { label: "Paid", value: "PAID", icon: "✅" },
  { label: "Pending", value: "PENDING", icon: "⏳" },
  { label: "Failed", value: "FAILED", icon: "❌" },
];

export const AddRefundPaymentModal: React.FC<AddRefundPaymentModalProps> = ({
  visible,
  mode = 'add',
  tenant,
  totalAdvancePaid = 0,
  existingPayment,
  onClose,
  onSave,
}) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBedPrice, setFetchingBedPrice] = useState(false);
  const [bedRentAmount, setBedRentAmount] = useState<number>(0);
  const [triggerGetBedById] = useLazyGetBedByIdQuery();

  // Fetch bed details to get rent amount
  useEffect(() => {
    const fetchBedDetails = async () => {
      if (visible && tenant?.bed_id && tenant?.room_id) {
        try {
          setFetchingBedPrice(true);

          // Fetch bed price
          const bedResponse = await triggerGetBedById(tenant.bed_id).unwrap();

          const priceValue = (bedResponse as any)?.data?.bed_price;
          if (priceValue) {
            const bedPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
            setBedRentAmount(bedPrice);
          }
        } catch (error) {
          // Show user-friendly error instead of console.error
          Alert.alert('Error', 'Failed to fetch bed rent information. Please try again.');
          setBedRentAmount(0);
        } finally {
          setFetchingBedPrice(false);
        }
      }
    };

    fetchBedDetails();
  }, [visible, tenant?.bed_id, tenant?.room_id, triggerGetBedById]);

  useEffect(() => {
    // Reset form when modal opens
    if (visible) {
      if (mode === 'edit' && existingPayment) {
        setAmountPaid(existingPayment.amount_paid ? String(existingPayment.amount_paid) : '');
        setPaymentDate(existingPayment.payment_date || '');
        setPaymentMethod(existingPayment.payment_method || '');
        setRemarks(existingPayment.remarks || '');
      } else {
        setAmountPaid('');
        setPaymentDate('');
        setPaymentMethod('');
        setRemarks('');
      }
    }
  }, [visible, tenant, mode, existingPayment]);

  const resetForm = useCallback(() => {
    setAmountPaid('');
    setPaymentDate('');
    setPaymentMethod('');
    setRemarks('');
  }, []);

  const handleSave = useCallback(async () => {
    // Prevent duplicate submission
    if (loading) {
      return;
    }

    // Validation
    const trimmedAmount = amountPaid.trim();
    if (!trimmedAmount) {
      Alert.alert('Validation Error', 'Please enter a refund amount');
      return;
    }

    const refundAmount = parseFloat(trimmedAmount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid refund amount');
      return;
    }

    // Minimum refund amount
    if (refundAmount < 10) {
      Alert.alert('Validation Error', 'Minimum refund amount is ₹10');
      return;
    }

    // Maximum refund amount
    if (refundAmount > 100000) {
      Alert.alert('Validation Error', 'Maximum refund amount is ₹1,00,000');
      return;
    }

    // Decimal precision check
    const decimalPart = trimmedAmount.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      Alert.alert('Validation Error', 'Amount can have maximum 2 decimal places');
      return;
    }

    if (!paymentDate) {
      Alert.alert('Validation Error', 'Please select refund date');
      return;
    }

    // Date validation - cannot be in future
    const selectedDate = new Date(paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Normalize selectedDate to midnight for comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      Alert.alert('Validation Error', 'Refund date cannot be in the future');
      return;
    }

    // Date validation - not too far in past (e.g., max 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (selectedDate < oneYearAgo) {
      Alert.alert('Validation Error', 'Refund date cannot be more than 1 year in the past');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Validation Error', 'Please select a payment method');
      return;
    }

    // Validate payment method is valid
    const validMethods = PAYMENT_METHODS.map(m => m.value);
    if (!validMethods.includes(paymentMethod)) {
      Alert.alert('Validation Error', 'Please select a valid payment method');
      return;
    }

    // Validate refund amount doesn't exceed total advance paid
    if (totalAdvancePaid > 0 && refundAmount > totalAdvancePaid) {
      Alert.alert('Validation Error', `Refund amount (₹${refundAmount}) cannot exceed total advance paid (₹${totalAdvancePaid})`);
      return;
    }

    if (!tenant?.room_id || !tenant?.bed_id) {
      Alert.alert('Error', 'Tenant room/bed information is missing');
      return;
    }

    if (!tenant?.pg_id) {
      Alert.alert('Error', 'PG information is missing. Please try again.');
      return;
    }

    if (bedRentAmount === 0 && !fetchingBedPrice) {
      Alert.alert('Error', 'Unable to fetch bed rent information. Please try again.');
      return;
    }

    // Sanitize remarks
    const sanitizedRemarks = remarks.trim().replace(/[<>]/g, '');

    // Confirmation dialog
    Alert.alert(
      'Confirm Refund',
      `Are you sure you want to process a refund of ₹${refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => proceedWithSave(refundAmount, sanitizedRemarks),
        },
      ]
    );
  }, [loading, amountPaid, paymentDate, paymentMethod, totalAdvancePaid, tenant, bedRentAmount, fetchingBedPrice, remarks]);

  const proceedWithSave = useCallback(async (refundAmount: number, sanitizedRemarks: string) => {
    if (!tenant) {
      Alert.alert('Error', 'Tenant information is missing');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        tenant_id: tenant.s_no,
        room_id: tenant.room_id!,
        bed_id: tenant.bed_id!,
        amount_paid: refundAmount,
        actual_rent_amount: bedRentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod!,
        status: 'PAID',
        remarks: sanitizedRemarks || undefined,
      });

      resetForm();
      onClose();
    } catch (error: unknown) {
      showErrorAlert(error as any, 'Create Error');
    } finally {
      setLoading(false);
    }
  }, [tenant, bedRentAmount, paymentDate, paymentMethod, onSave, onClose, resetForm]);

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

  if (!tenant) return null;

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={mode === 'edit' ? 'Edit Refund Payment' : 'Add Refund Payment'}
      subtitle={`${tenant.name} • ${formatRoomNo(tenant.rooms?.room_no)} • ${formatBedNo(tenant.beds?.bed_no)}`}
      onSubmit={handleSave}
      submitLabel={mode === 'edit' ? 'Update Refund' : 'Save Refund'}
      cancelLabel="Cancel"
      isLoading={loading}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Advance Amount Info */}
        {totalAdvancePaid > 0 ? (
          <View
            style={{
              padding: 12,
              backgroundColor: Theme.colors.background.blueLight,
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: Theme.colors.primary,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Theme.colors.primary,
                marginBottom: 4,
              }}
            >
              💰 Advance Payment Info
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Total Advance Paid:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Theme.colors.primary,
                }}
              >
                ₹{totalAdvancePaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              padding: 12,
              backgroundColor: "#FEF2F2",
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: "#EF4444",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#DC2626",
                marginBottom: 4,
              }}
            >
              ⚠️ No Advance Payment
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
              This tenant has not paid any advance amount yet.
            </Text>
          </View>
        )}

        <AmountInput
          label="Refund Amount"
          value={amountPaid}
          onChangeText={setAmountPaid}
          error={""}
          required
          containerStyle={{ marginBottom: 16 }}
        />


        <View style={{ marginBottom: 16 }}>
          <DatePicker
            label="Refund Date"
            value={paymentDate}
            onChange={(date: string) => setPaymentDate(date)}
            required
          />
        </View>

        <OptionSelector
          label="Payment Method"
          options={PAYMENT_METHODS}
          selectedValue={paymentMethod}
          onSelect={setPaymentMethod}
          required
          containerStyle={{ marginBottom: 16 }}
        />

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: Theme.colors.text.primary,
              marginBottom: 6,
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
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 14,
              color: Theme.colors.text.primary,
              minHeight: 80,
              textAlignVertical: "top",
            }}
            placeholder="Add any notes..."
            placeholderTextColor={Theme.colors.input.placeholder}
            multiline
            numberOfLines={3}
            value={remarks}
            onChangeText={setRemarks}
            maxLength={500}
            accessibilityLabel="Remarks input"
            accessibilityHint="Enter any notes about this refund (optional)"
          />
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};
