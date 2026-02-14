import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Theme } from "../../theme";
import { DatePicker } from "../../components/DatePicker";
import { SlideBottomModal } from "../../components/SlideBottomModal";
import { OptionSelector, Option } from "../../components/OptionSelector";
import { AmountInput } from "../../components/AmountInput";
import { MissingRentPeriods } from "./components/MissingRentPeriods";
import { PaymentReference } from "./components/PaymentReference";
import { useLazyGetBedByIdQuery } from "@/services/api/roomsApi";
import { pgLocationsApi } from "../../services/api/pgLocationsApi";
import type { PGLocationDetails } from "../../services/api/pgLocationsApi";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import {
  useCreateTenantPaymentMutation,
  useLazyDetectPaymentGapsQuery,
  useLazyGetNextPaymentDatesQuery,
} from "@/services/api/paymentsApi";
import type { CreateTenantPaymentDto, DetectPaymentGapsResponse, NextPaymentDatesResponse, RentPaymentGap } from "@/services/api/paymentsApi";
import { showErrorAlert, showSuccessAlert } from "@/utils/errorHandler";
import type { Payment } from "@/types";
import type { BedResponse } from "@/services/api/roomsApi";

interface RentPaymentFormProps {
  visible: boolean;
  tenantId: number;
  tenantName: string;
  roomId: number;
  bedId: number;
  pgId: number;
  rentAmount?: number;
  joiningDate?: string;
  lastPaymentStartDate?: string;
  lastPaymentEndDate?: string;
  previousPayments?: PaymentWithCycle[];
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentWithCycle = Payment & {
  tenant_rent_cycles?: {
    cycle_start?: string;
    cycle_end?: string;
  };
};

const PAYMENT_METHODS: Option[] = [
  { label: "GPay", value: "GPAY", icon: "📱" },
  { label: "PhonePe", value: "PHONEPE", icon: "📱" },
  { label: "Cash", value: "CASH", icon: "💵" },
  { label: "Bank Transfer", value: "BANK_TRANSFER", icon: "🏦" },
];

// Helper function to parse date string safely (handles multiple formats)
const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();

  // Try ISO format first (YYYY-MM-DDTHH:mm:ss.sssZ or similar)
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try YYYY-MM-DD format
  if (dateString.includes('-') && !dateString.includes('T')) {
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  // Try DD MMM YYYY format (e.g., "08 Dec 2025")
  if (dateString.includes(' ')) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback: try parsing as is
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

const RentPaymentForm: React.FC<RentPaymentFormProps> = ({
  visible,
  tenantId,
  tenantName,
  roomId,
  bedId,
  pgId,
  rentAmount = 0,
  joiningDate,
  lastPaymentStartDate,
  lastPaymentEndDate,
  previousPayments = [],
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const wasVisibleRef = useRef(false);
  const [triggerDetectPaymentGaps] = useLazyDetectPaymentGapsQuery();
  const [triggerGetNextPaymentDates] = useLazyGetNextPaymentDatesQuery();
  const [createTenantPayment] = useCreateTenantPaymentMutation();
  const [triggerGetBedById] = useLazyGetBedByIdQuery();
  const [loading, setLoading] = useState(false);
  const [fetchingBedPrice, setFetchingBedPrice] = useState(false);
  const [bedRentAmount, setBedRentAmount] = useState<number>(0);
  const [rentCycleData, setRentCycleData] = useState<{
    type: 'CALENDAR' | 'MIDMONTH';
  } | null>(null);
  const [formData, setFormData] = useState({
    amount_paid: "",
    actual_rent_amount: "",
    payment_date: "",
    payment_method: null as string | null,
    status: "",
    cycle_id: null as number | null,
    start_date: "",
    end_date: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gapWarning, setGapWarning] = useState<{
    visible: boolean;
    gaps: RentPaymentGap[];
    earliestGap: RentPaymentGap | null;
    skipGaps: boolean;
  }>({
    visible: false,
    gaps: [],
    earliestGap: null,
    skipGaps: false,
  });
  const [checkingGaps, setCheckingGaps] = useState(false);

  

  // Function to detect payment gaps
  const detectPaymentGaps = async () => {
    if (tenantId <= 0) return;
    
    try {
      setCheckingGaps(true);
      const gapData: DetectPaymentGapsResponse = await triggerDetectPaymentGaps(tenantId).unwrap();

      if (gapData.hasGaps && gapData.gaps.length > 0) {
          setGapWarning({
            visible: true,
            gaps: gapData.gaps,
            earliestGap: null, // Don't auto-select
            skipGaps: false,
          });
          
          // Don't auto-fill form - let user select first
      } else {
        setGapWarning({
          visible: false,
          gaps: [],
          earliestGap: null,
          skipGaps: false,
        });

        // No gaps: ask backend for the next suggested cycle window and cycle_id.
        try {
          const cycleType = rentCycleData?.type || 'CALENDAR';
          const nextDatesData: NextPaymentDatesResponse = await triggerGetNextPaymentDates({
            tenant_id: tenantId,
            rentCycleType: cycleType,
            skipGaps: true,
          }).unwrap();

          setFormData((prev) => ({
            ...prev,
            cycle_id: nextDatesData.suggestedCycleId ?? null,
            start_date: nextDatesData.suggestedStartDate || "",
            end_date: nextDatesData.suggestedEndDate || "",
          }));
        } catch (nextDatesError) {
          console.error('Error getting next payment dates (auto):', nextDatesError);
        }
      }
    } catch (error) {
      console.error("Error detecting gaps:", error);
    } finally {
      setCheckingGaps(false);
    }
  };

  // Function to handle gap button click
  const handleGapButtonClick = (gap: RentPaymentGap) => {
    // Toggle off if the same gap is clicked again
    if (gapWarning.earliestGap?.gapId === gap.gapId) {
      setFormData((prev) => ({
        ...prev,
        cycle_id: null,
        start_date: "",
        end_date: "",
        actual_rent_amount: (bedRentAmount > 0 ? bedRentAmount.toString() : prev.actual_rent_amount),
        status: "",
      }));
      setGapWarning((prev) => ({
        ...prev,
        earliestGap: null,
        skipGaps: false,
      }));
      return;
    }

    const remaining = Number(
      (gap?.remainingDue ?? (gap?.rentDue != null && gap?.totalPaid != null ? Number(gap.rentDue) - Number(gap.totalPaid) : undefined)) ??
        gap?.rentDue ??
        0
    );

    setFormData((prev) => ({
      ...prev,
      cycle_id: gap.cycle_id ?? null,
      start_date: gap.gapStart,
      end_date: gap.gapEnd,
      actual_rent_amount: (Number.isFinite(remaining) ? Math.max(0, remaining) : 0).toString(),
      status: "PENDING",
    }));
    
    // Update warning to show this gap is selected
    setGapWarning((prev) => ({
      ...prev,
      earliestGap: gap,
      skipGaps: false,
    }));
  };

  // ============================================================================
  // CALENDAR CYCLE - CONTINUE TO NEXT PAYMENT
  // ============================================================================

  // Handle "Continue to Next Payment" for CALENDAR cycle
  const handleContinueToNextPaymentCalendar = async () => {
    try {
      const nextDates: NextPaymentDatesResponse = await triggerGetNextPaymentDates({ tenant_id: tenantId, rentCycleType: 'CALENDAR', skipGaps: true }).unwrap();
      const suggestedCycleId = nextDates.suggestedCycleId ?? null;
      const suggestedStartDate = nextDates.suggestedStartDate || '';
      const suggestedEndDate = nextDates.suggestedEndDate || '';

      if (suggestedStartDate) {
        // Auto-fill form with next payment dates
        setFormData((prev) => ({
          ...prev,
          cycle_id: suggestedCycleId,
          start_date: suggestedStartDate,
          end_date: suggestedEndDate || suggestedStartDate,
          status: "PENDING",
        }));

        // Hide gap warning and mark as skipped
        setGapWarning((prev) => ({
          ...prev,
          skipGaps: true,
          visible: false,
        }));
      }
    } catch (error) {
      console.error("Error getting next payment dates (CALENDAR):", error);
      showErrorAlert(error, "Failed to calculate next payment dates");
    }
  };

  // ============================================================================
  // MIDMONTH CYCLE - CONTINUE TO NEXT PAYMENT
  // ============================================================================

  // Handle "Continue to Next Payment" for MIDMONTH cycle
  const handleContinueToNextPaymentMidmonth = async () => {
    try {
      const nextDates: NextPaymentDatesResponse = await triggerGetNextPaymentDates({ tenant_id: tenantId, rentCycleType: 'MIDMONTH', skipGaps: true }).unwrap();
      const suggestedCycleId = nextDates.suggestedCycleId ?? null;
      const suggestedStartDate = nextDates.suggestedStartDate || '';
      const suggestedEndDate = nextDates.suggestedEndDate || '';

      if (suggestedStartDate) {
        // Auto-fill form with next payment dates
        setFormData((prev) => ({
          ...prev,
          cycle_id: suggestedCycleId,
          start_date: suggestedStartDate,
          end_date: suggestedEndDate || suggestedStartDate,
          status: "PENDING",
        }));

        // Hide gap warning and mark as skipped
        setGapWarning((prev) => ({
          ...prev,
          skipGaps: true,
          visible: false,
        }));
      }
    } catch (error) {
      console.error("Error getting next payment dates (MIDMONTH):", error);
      showErrorAlert(error, "Failed to calculate next payment dates");
    }
  };

  // ============================================================================
  // UNIFIED CONTINUE TO NEXT PAYMENT HANDLER
  // ============================================================================

  // Function to handle "Continue to Next Payment" (skip gaps) - routes to appropriate cycle handler
  const handleContinueToNextPayment = async () => {
    if (!rentCycleData) {
      Alert.alert("Error", "Rent cycle data not available");
      return;
    }

    if (rentCycleData.type === 'CALENDAR') {
      await handleContinueToNextPaymentCalendar();
    } else {
      await handleContinueToNextPaymentMidmonth();
    }
  };

  // ============================================================================
  // CALENDAR CYCLE HELPERS
  // ============================================================================
  
  // Format gap display for CALENDAR cycle (month-based)
  const formatCalendarGapDisplay = (gapStart: string, gapEnd: string): string => {
    try {
      const startDate = new Date(gapStart);
      const endDate = new Date(gapEnd);
      const startMonth = startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const endMonth = endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      if (startMonth === endMonth) {
        return startMonth;
      }
      return `${startMonth} - ${endMonth}`;
    } catch {
      return `${gapStart} to ${gapEnd}`;
    }
  };

  // ============================================================================
  // MIDMONTH CYCLE HELPERS
  // ============================================================================
  
  // Format gap display for MIDMONTH cycle (day-based)
  const formatMidmonthGapDisplay = (gapStart: string, gapEnd: string): string => {
    try {
      const startDate = new Date(gapStart);
      const endDate = new Date(gapEnd);
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const startMonth = startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const endMonth = endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      // For midmonth, show the day range (e.g., "15 Nov 2025 - 14 Dec 2025")
      return `${startDay} ${startMonth.split(' ')[0]} - ${endDay} ${endMonth}`;
    } catch {
      return `${gapStart} to ${gapEnd}`;
    }
  };

  // ============================================================================
  // UNIFIED GAP DISPLAY FORMATTER
  // ============================================================================
  
  // Format gap month display based on rent cycle type
  const formatGapMonthDisplay = (gapStart: string, gapEnd: string): string => {
    if (!rentCycleData) {
      return `${gapStart} to ${gapEnd}`;
    }

    if (rentCycleData.type === 'CALENDAR') {
      return formatCalendarGapDisplay(gapStart, gapEnd);
    } else {
      return formatMidmonthGapDisplay(gapStart, gapEnd);
    }
  };

  // ============================================================================
  // Payment reference rendering moved to component PaymentReference

  // Fetch bed details and PG location rent cycle data
  useEffect(() => {
    const fetchDetails = async () => {
      if (visible && bedId > 0) {
        try {
          setFetchingBedPrice(true);

          // Fetch bed price
          const bedResponse: BedResponse = await triggerGetBedById(bedId).unwrap();

          const priceValue = bedResponse.data?.bed_price;
          if (priceValue) {
            const bedPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
            setBedRentAmount(bedPrice);
            setFormData((prev) => ({
              ...prev,
              actual_rent_amount: bedPrice.toString(),
            }));
          }

          // Fetch PG location details for rent cycle data
          if (pgId > 0) {
            try {
              const pgResponse = await dispatch(
                pgLocationsApi.endpoints.getPGLocationDetails.initiate(pgId)
              ).unwrap();
              if (pgResponse.success && pgResponse.data) {
                const pgData = pgResponse.data as PGLocationDetails & {
                  rent_cycle_type?: 'CALENDAR' | 'MIDMONTH';
                };
                if (pgData.rent_cycle_type) {
                  setRentCycleData({
                    type: pgData.rent_cycle_type as 'CALENDAR' | 'MIDMONTH',
                  });
                }
              }
            } catch (pgError) {
              console.error("Error fetching PG location details:", pgError);
            }
          }
        } catch (error) {
          console.error("Error fetching details:", error);
          if (rentAmount > 0) {
            setBedRentAmount(rentAmount);
            setFormData((prev) => ({
              ...prev,
              actual_rent_amount: rentAmount.toString(),
            }));
          }
        } finally {
          setFetchingBedPrice(false);
        }
      }
    };

    fetchDetails();
  }, [visible, bedId, pgId, rentAmount]);

  // Keep expected rent amount consistent with backend rule for CALENDAR join-month proration.
  useEffect(() => {
    if (!visible) return;
    if (gapWarning.earliestGap && !gapWarning.skipGaps) return;
    if (!rentCycleData || rentCycleData.type !== 'CALENDAR') return;
    if (!joiningDate) return;
    if (!formData.start_date || !formData.end_date) return;
    if (!(bedRentAmount > 0)) return;

    const start = parseDate(formData.start_date);
    const end = parseDate(formData.end_date);
    const join = parseDate(joiningDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(join.getTime())) return;

    const isJoinMonth =
      start.getFullYear() === join.getFullYear() && start.getMonth() === join.getMonth();
    const isProratedJoinMonth = isJoinMonth && join.getDate() > 1;

    let expected = bedRentAmount;
    if (isProratedJoinMonth) {
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
      const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
      const daysStayed = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
      expected = (bedRentAmount / daysInMonth) * Math.max(0, daysStayed);
    }

    const expectedRounded = Math.round((expected + Number.EPSILON) * 100) / 100;
    const current = parseFloat(formData.actual_rent_amount || '0');
    if (Math.abs(current - expectedRounded) > 0.009) {
      setFormData((prev) => ({
        ...prev,
        actual_rent_amount: expectedRounded.toString(),
      }));
    }
  }, [visible, rentCycleData, joiningDate, formData.start_date, formData.end_date, bedRentAmount, gapWarning.earliestGap, gapWarning.skipGaps]);

  // Detect payment gaps when form opens
  useEffect(() => {
    if (visible && tenantId > 0) {
      detectPaymentGaps();
    }
  }, [visible, tenantId]);

  // Reset form values when opening
  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = visible;
    if (!visible || wasVisible) return;

    // Rent period selection is backend-driven via /gaps or /next-dates.
    // Keep money fields reset and let detectPaymentGaps() fill cycle/dates.
    setFormData((prev) => ({
      ...prev,
      amount_paid: "",
      actual_rent_amount: bedRentAmount.toString(),
      payment_date: "",
      payment_method: null,
      status: "",
      cycle_id: prev.cycle_id ?? null,
      start_date: prev.start_date ?? "",
      end_date: prev.end_date ?? "",
      remarks: "",
    }));
  }, [visible, previousPayments, bedRentAmount]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      newErrors.amount_paid = "Amount paid is required";
    }

    // Check if amount paid exceeds actual rent amount
    if (formData.amount_paid && formData.actual_rent_amount) {
      const amountPaid = parseFloat(formData.amount_paid);
      const actualAmount = parseFloat(formData.actual_rent_amount);

      if (amountPaid > actualAmount) {
        newErrors.amount_paid = `Amount paid cannot exceed ₹${actualAmount.toLocaleString("en-IN")}`;
      }
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    }

    if (!formData.cycle_id) {
      newErrors.cycle_id = 'Please select a rent period (gap) or tap Skip All Gaps to get the next suggested period.';
    }

    // Validate start and end dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      // Inclusive period: allow same day start/end
      if (startDate > endDate) {
        newErrors.end_date = "End date must be on or after start date";
      }
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const amountPaid = parseFloat(formData.amount_paid);
    const actualAmount = parseFloat(formData.actual_rent_amount);

    let autoStatus: string;
    let autoStatusLabel: string;

    if (amountPaid >= actualAmount) {
      autoStatus = "PAID";
      autoStatusLabel = "✅ Paid";
    } else if (amountPaid > 0) {
      autoStatus = "PARTIAL";
      autoStatusLabel = "🔵 Partial";
    } else {
      autoStatus = "PENDING";
      autoStatusLabel = "⏳ Pending";
    }

    Alert.alert(
      "Confirm Payment Status",
      `Based on the amounts:\n\nAmount Paid: ₹${amountPaid.toLocaleString("en-IN")}\nRent Amount: ₹${actualAmount.toLocaleString("en-IN")}\n\nSuggested Status: ${autoStatusLabel}\n\nIs this correct?`,
      [
        {
          text: "Confirm",
          onPress: () => savePayment(autoStatus as Payment['status']),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const savePayment = async (status: Payment['status']) => {
    try {
      setLoading(true);

      const amountPaid = parseFloat(formData.amount_paid);
      const actualAmount = parseFloat(formData.actual_rent_amount);

      const derivedStatus: Payment['status'] =
        amountPaid >= actualAmount ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING";

      const paymentData: CreateTenantPaymentDto = {
        tenant_id: tenantId,
        pg_id: pgId,
        room_id: roomId,
        bed_id: bedId,
        amount_paid: amountPaid,
        actual_rent_amount: actualAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method as Payment['payment_method'],
        status: status || derivedStatus,
        cycle_id: formData.cycle_id as number,
        remarks: formData.remarks || undefined,
      };

      const res = await createTenantPayment(paymentData).unwrap();
      showSuccessAlert(res);

      onSuccess();
      handleClose();
    } catch (error: unknown) {
      showErrorAlert(error, 'Error saving payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount_paid: "",
      actual_rent_amount: "",
      payment_date: "",
      payment_method: null,
      status: "",
      cycle_id: null,
      start_date: "",
      end_date: "",
      remarks: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title="Add Payment"
      subtitle={tenantName}
      onSubmit={handleSubmit}
      submitLabel="Add Payment"
      cancelLabel="Cancel"
      isLoading={loading}
      enableFullHeightDrag={false}
      enableFlexibleHeightDrag={true}
    >
      {/* Gap Warning Alert - Modular */}
      <MissingRentPeriods
        checkingGaps={checkingGaps}
        gaps={gapWarning.gaps}
        selectedGap={gapWarning.earliestGap}
        onSelectGap={handleGapButtonClick}
        onSkipAllGaps={handleContinueToNextPayment}
        formatGapMonthDisplay={formatGapMonthDisplay}
      />

      {errors.general ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{errors.general}</Text>
        </View>
      ) : null}

      {errors.cycle_id ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{errors.cycle_id}</Text>
        </View>
      ) : null}

      {/* Payment Info Card - Modular */}
      <PaymentReference
        checkingGaps={checkingGaps}
        joiningDate={joiningDate}
        lastPaymentStartDate={lastPaymentStartDate}
        lastPaymentEndDate={lastPaymentEndDate}
        previousPayments={previousPayments}
        bedRentAmount={bedRentAmount}
        fetchingBedPrice={fetchingBedPrice}
        rentCycleType={rentCycleData?.type ?? null}
        amountToPay={Number(formData.actual_rent_amount || 0)}
        amountPaid={Number(formData.amount_paid || 0)}
        showAmountToPay={Boolean(formData.cycle_id && formData.start_date && formData.end_date)}
      />

      {/* Form */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        <View style={{ gap: 20, paddingBottom: 24, paddingHorizontal: 4 }}>

        {/* Amount to Pay moved into PaymentReference */}
        
        <AmountInput
          label="Amount Paid"
          value={formData.amount_paid}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, amount_paid: text }))}
          error={errors.amount_paid}
          required
        />

        <DatePicker
          label="Payment Date"
          value={formData.payment_date}
          onChange={(date: string) => setFormData((prev) => ({ ...prev, payment_date: date }))}
          required={true}
          error={errors.payment_date}
        />

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <DatePicker
              label="Start Date"
              value={formData.start_date}
              onChange={(date: string) => setFormData((prev) => ({ ...prev, start_date: date }))}
              disabled
              required={true}
              error={errors.start_date}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DatePicker
              label="End Date"
              value={formData.end_date}
              onChange={(date: string) => setFormData((prev) => ({ ...prev, end_date: date }))}
              disabled
              required={true}
              error={errors.end_date}
            />
          </View>
        </View>

        <OptionSelector
          label="Payment Method"
          options={PAYMENT_METHODS}
          selectedValue={formData.payment_method}
          onSelect={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
          required
          error={errors.payment_method}
        />

        <View
          style={{
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
              marginBottom: 4,
            }}
          >
            ℹ️ Payment Status
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.text.secondary,
            }}
          >
            Payment status will be automatically calculated based on the amount paid vs rent amount.
          </Text>
        </View>

        {/* Remarks */}
        <View style={{ marginTop: 8 }}>
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
            onChangeText={(text) => setFormData((prev) => ({ ...prev, remarks: text }))}
          />
        </View>

        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};

export default RentPaymentForm;
