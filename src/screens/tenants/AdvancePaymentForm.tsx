import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Theme } from "../../theme";
import { DatePicker } from "../../components/DatePicker";
import { SlideBottomModal } from "../../components/SlideBottomModal";
import { OptionSelector, Option } from "../../components/OptionSelector";
import { AmountInput } from "../../components/AmountInput";
import { useCreateAdvancePaymentMutation } from "@/services/api/paymentsApi";
import { useLazyGetBedByIdQuery } from "@/services/api/roomsApi";
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
  paymentId?: number;
  existingPayment?: any;
  onClose: () => void;
  onSuccess: () => void;
  onSave?: (id: number, data: any) => Promise<void>;
}

const PAYMENT_METHODS: Option[] = [
  { label: "GPay", value: "GPAY", icon: "📱" },
  { label: "PhonePe", value: "PHONEPE", icon: "📱" },
  { label: "Cash", value: "CASH", icon: "💵" },
  { label: "Bank Transfer", value: "BANK_TRANSFER", icon: "🏦" },
];

const PAYMENT_STATUS: Option[] = [
  { label: "✅ Paid", value: "PAID", icon: "" },
  { label: "⏳ Pending", value: "PENDING", icon: "" },
  { label: "❌ Failed", value: "FAILED", icon: "" },
];

const AdvancePaymentForm: React.FC<AdvancePaymentFormProps> = ({
  visible,
  mode,
  tenantId,
  tenantName,
  tenantJoinedDate,
  pgId,
  roomId,
  bedId,
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
    status: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing payment data for edit mode
  useEffect(() => {
    if (mode === "edit" && existingPayment) {
      setFormData({
        amount_paid: existingPayment.amount_paid?.toString() || "",
        payment_date: existingPayment.payment_date
          ? new Date(existingPayment.payment_date).toISOString().split("T")[0]
          : "",
        payment_method: existingPayment.payment_method || "",
        status: existingPayment.status || "",
        remarks: existingPayment.remarks || "",
      });
    } else if (mode === "add") {
      // Reset form for add mode
      setFormData({
        amount_paid: "",
        payment_date: "",
        payment_method: "",
        status: "",
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

          const priceValue = (bedResponse as any)?.data?.bed_price;
          if (priceValue) {
            const bedPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
            setBedRentAmount(bedPrice);
          }
        } catch (error) {
          console.error("Error fetching bed details:", error);
        } finally {
          setFetchingBedPrice(false);
        }
      }
    };

    fetchDetails();
  }, [visible, bedId, pgId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      newErrors.amount_paid = "Amount paid is required";
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required";
    }

    if (!formData.status) {
      newErrors.status = "Payment status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (mode === "add") {
        const paymentData = {
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
          status: formData.status as "PAID" | "PENDING" | "FAILED",
          remarks: formData.remarks || undefined,
        };

        const res = await createAdvancePayment(paymentData as any).unwrap();
        showSuccessAlert(res);
      } else if (mode === "edit" && paymentId && onSave) {
        const updateData = {
          amount_paid: parseFloat(formData.amount_paid),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          status: formData.status,
          remarks: formData.remarks || undefined,
        };

        const res = await onSave(paymentId, updateData);
        showSuccessAlert(res);
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      showErrorAlert(error, "Error saving advance payment");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount_paid: "",
      payment_date: "",
      payment_method: "",
      status: "",
      remarks: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={mode === "add" ? "Add Advance Payment" : "Edit Advance Payment"}
      subtitle={tenantName}
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

        {/* Payment Status */}
        <OptionSelector
          label="Payment Status"
          options={PAYMENT_STATUS}
          selectedValue={formData.status}
          onSelect={(value) => setFormData({ ...formData, status: value as string })}
          required
          error={errors.status}
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
          />
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};

export default AdvancePaymentForm;
