import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Theme } from "../../../../theme";
import { DatePicker } from "../../../../components/DatePicker";
import { SlideBottomModal } from "../../../../components/SlideBottomModal";
import { OptionSelector, Option } from "../../../../components/OptionSelector";
import { AmountInput } from "../../../../components/AmountInput";
import { useCreateAdvancePaymentMutation, type CreateAdvancePaymentDto } from "@/features/owner/api/paymentsApi";
import { useLazyGetBedByIdQuery } from "@/features/owner/api/roomsApi";
import { showErrorAlert, showSuccessAlert } from "@/utils/errorHandler";

interface AdvancePaymentFormProps {
  visible: boolean;
  mode: "add" | "edit";
  tenantId: number;
  tenantName: string;
  tenantJoinedDate?: string;
  pgId: number;
  roomId: number;
  bedId: number;
  roomNo?: string;
  bedNo?: string;
  paymentId?: number;
  existingPayment?: unknown;
  onClose: () => void;
  onSuccess: () => void;
  onSave?: (id: number, data: Partial<CreateAdvancePaymentDto>) => Promise<void>;
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

const AdvancePaymentForm: React.FC<AdvancePaymentFormProps> = ({
  visible,
  mode,
  tenantId,
  tenantName,
  tenantJoinedDate,
  pgId,
  roomId,
  bedId,
  roomNo,
  bedNo,
  paymentId,
  existingPayment,
  onClose,
  onSuccess,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingBedPrice, setFetchingBedPrice] = useState(false);
  const [bedRentAmount, setBedRentAmount] = useState<number>(0);
  const [createAdvancePayment] = useCreateAdvancePaymentMutation();
  const [triggerGetBedById] = useLazyGetBedByIdQuery();
  const [formData, setFormData] = useState({
    amount_paid: "",
    payment_date: "",
    payment_method: "" as string,
    status: "PAID",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing payment data for edit mode
  useEffect(() => {
    if (mode === "edit" && existingPayment) {
      const payment = existingPayment as {
        amount_paid?: unknown;
        payment_date?: unknown;
        payment_method?: unknown;
        remarks?: unknown;
      };
      
      // Safely parse payment date
      let parsedDate = "";
      if (payment.payment_date) {
        try {
          const dateObj = new Date(String(payment.payment_date));
          if (!isNaN(dateObj.getTime())) {
            // Use local date formatting to avoid timezone issues
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            parsedDate = `${year}-${month}-${day}`;
          }
        } catch {
          // If date parsing fails, leave empty
          parsedDate = "";
        }
      }

      setFormData({
        amount_paid: payment.amount_paid?.toString() || "",
        payment_date: parsedDate,
        payment_method: String(payment.payment_method || ""),
        status: "PAID",
        remarks: String(payment.remarks || ""),
      });
    } else if (mode === "add") {
      // Reset form for add mode
      setFormData({
        amount_paid: "",
        payment_date: "",
        payment_method: "",
        status: "PAID",
        remarks: "",
      });
    }
    setErrors({});
  }, [mode, existingPayment, visible]);

  // Fetch bed details to get rent amount
  useEffect(() => {
    const fetchDetails = async () => {
      if (visible && bedId > 0) {
        try {
          setFetchingBedPrice(true);

          // Fetch bed price
          const bedResponse = await triggerGetBedById(bedId).unwrap();

          // Safely extract bed price from response
          let priceValue: unknown = undefined;
          if (bedResponse && typeof bedResponse === 'object') {
            if ('data' in bedResponse && bedResponse.data && typeof bedResponse.data === 'object') {
              priceValue = (bedResponse.data as { bed_price?: unknown }).bed_price;
            }
          }

          if (priceValue !== undefined && priceValue !== null) {
            const bedPriceNum = typeof priceValue === 'number' ? priceValue : parseFloat(String(priceValue));
            if (!isNaN(bedPriceNum) && Number.isFinite(bedPriceNum) && bedPriceNum >= 0) {
              setBedRentAmount(bedPriceNum);
            }
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

    fetchDetails();
  }, [visible, bedId, triggerGetBedById]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const trimmedAmount = formData.amount_paid.trim();
    if (!trimmedAmount) {
      newErrors.amount_paid = "Amount paid is required";
    } else {
      // Check for multiple decimal points (invalid format)
      const decimalPoints = (trimmedAmount.match(/\./g) || []).length;
      if (decimalPoints > 1) {
        newErrors.amount_paid = "Please enter a valid amount (invalid format)";
      } else {
        const amountPaid = parseFloat(trimmedAmount);
        if (isNaN(amountPaid) || amountPaid <= 0) {
          newErrors.amount_paid = "Amount paid is required";
        } else if (amountPaid < 10) {
          newErrors.amount_paid = "Minimum amount is ₹10";
        } else if (amountPaid > 100000) {
          newErrors.amount_paid = "Maximum amount is ₹1,00,000";
        } else {
          // Check decimal precision
          const decimalPart = trimmedAmount.split('.')[1];
          if (decimalPart && decimalPart.length > 2) {
            newErrors.amount_paid = "Amount can have maximum 2 decimal places";
          }
        }
      }
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    } else {
      // Date validation - cannot be in future
      const selectedDate = new Date(formData.payment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Normalize selectedDate to midnight for comparison
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.payment_date = "Payment date cannot be in the future";
      }

      // Date validation - not too far in past (e.g., max 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (selectedDate < oneYearAgo) {
        newErrors.payment_date = "Payment date cannot be more than 1 year in the past";
      }
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required";
    } else {
      // Validate payment method is valid
      const validMethods = PAYMENT_METHODS.map(m => m.value);
      if (!validMethods.includes(formData.payment_method)) {
        newErrors.payment_method = "Please select a valid payment method";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = useCallback(() => {
    setFormData({
      amount_paid: "",
      payment_date: "",
      payment_method: "",
      status: "PAID",
      remarks: "",
    });
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submission
    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Validate required IDs
    if (!pgId || !roomId || !bedId) {
      Alert.alert("Error", "Required information is missing. Please try again.");
      return;
    }

    // Sanitize remarks
    const sanitizedRemarks = formData.remarks.trim().replace(/[<>]/g, '');

    // Confirmation dialog
    const amount = parseFloat(formData.amount_paid);
    Alert.alert(
      "Confirm Payment",
      `Are you sure you want to process an advance payment of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: () => proceedWithSubmission(sanitizedRemarks),
        },
      ]
    );
  }, [loading, formData, pgId, roomId, bedId, validateForm]);

  const proceedWithSubmission = useCallback(async (sanitizedRemarks: string) => {
    try {
      setLoading(true);

      if (mode === "add") {
        const paymentData: CreateAdvancePaymentDto = {
          tenant_id: tenantId,
          pg_id: pgId,
          room_id: roomId,
          bed_id: bedId,
          amount_paid: parseFloat(formData.amount_paid),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method as
            | "GPAY"
            | "PHONEPE"
            | "CASH"
            | "BANK_TRANSFER",
          status: "PAID" as const,
          remarks: sanitizedRemarks || undefined,
        };

        const res = await createAdvancePayment(paymentData).unwrap();
        showSuccessAlert(res);
      } else if (mode === "edit" && paymentId && onSave) {
        const updateData = {
          amount_paid: parseFloat(formData.amount_paid),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          status: "PAID" as const,
          remarks: sanitizedRemarks || undefined,
        };

        const res = await onSave(paymentId, updateData);
        showSuccessAlert(res);
      }

      onSuccess();
      resetForm();
      onClose();
    } catch (error: unknown) {
      showErrorAlert(error, "Error saving advance payment");
    } finally {
      setLoading(false);
    }
  }, [mode, paymentId, onSave, tenantId, pgId, roomId, bedId, formData, createAdvancePayment, onSuccess, resetForm, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={mode === "add" ? "Add Advance Payment" : "Edit Advance Payment"}
      subtitle={`${tenantName} • ${formatRoomNo(roomNo)} • ${formatBedNo(bedNo)}`}
      onSubmit={handleSubmit}
      submitLabel={mode === "add" ? "Add Payment" : "Update Payment"}
      cancelLabel="Cancel"
      isLoading={loading}
    >
      {/* Tenant Info Card */}
      {tenantJoinedDate && (
        <View
          style={{
            marginHorizontal: 0,
            marginBottom: 16,
            padding: 12,
            backgroundColor: Theme.colors.background.blueLight,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: Theme.colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: Theme.colors.primary,
              marginBottom: 8,
            }}
          >
            📋 Tenant Information
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 12,
                color: Theme.colors.text.tertiary,
                width: 100,
              }}
            >
              Joined Date:
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Theme.colors.text.primary,
              }}
            >
              {new Date(tenantJoinedDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>

          </View>
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: Theme.colors.text.tertiary,
                  width: 100,
                }}
              >
                Bed Rent Amount:
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: Theme.colors.primary,
                }}
              >
                {fetchingBedPrice ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                ) : (
                  `₹${bedRentAmount.toLocaleString("en-IN")}`
                )}
              </Text>
            </View>
        </View>
      )}

      {/* Form */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Amount Paid */}
        <AmountInput
          label="Amount Paid"
          value={formData.amount_paid}
          onChangeText={(text) =>
            setFormData({ ...formData, amount_paid: text })
          }
          error={errors.amount_paid}
          required
          containerStyle={{ marginBottom: 16 }}
        />

        

        {/* Payment Date */}
        <View style={{ marginBottom: 16 }}>
          <DatePicker
            label="Payment Date"
            value={formData.payment_date}
            onChange={(date: string) =>
              setFormData({ ...formData, payment_date: date })
            }
            required
            error={errors.payment_date}
          />
        </View>

        {/* Payment Method */}
        <OptionSelector
          label="Payment Method"
          options={PAYMENT_METHODS}
          selectedValue={formData.payment_method}
          onSelect={(value) =>
            setFormData({ ...formData, payment_method: value as string })
          }
          required
          error={errors.payment_method}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Remarks */}
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
            value={formData.remarks}
            onChangeText={(text) => setFormData({ ...formData, remarks: text })}
            maxLength={500}
            accessibilityLabel="Remarks input"
            accessibilityHint="Enter any notes about this payment (optional)"
          />
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};

export default AdvancePaymentForm;
