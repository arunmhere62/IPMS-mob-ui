import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  Clipboard,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { UpiAppPicker } from '@/components/UpiAppPicker';
import {
  useGetTenantPaymentConfigQuery,
  useSubmitPaymentProofMutation,
} from '@/features/tenant/api/tenantPortalApi';
import { tenantPaymentsApi } from '@/features/tenant/api/tenantPaymentsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { SubmitPaymentSkeleton } from '@/features/tenant/components/TenantSkeletons';
import { useFocusEffect } from '@react-navigation/native';

const C = Theme.colors;

const formatAmount = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const TenantSubmitPaymentProofScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<any>();
  const dispatch = useDispatch();

  // Navigation params
  const rentPaymentId = route?.params?.rent_payment_id;
  const rentAmount = route?.params?.rent_amount;
  const rentStatus = route?.params?.rent_status;
  const cycleId = route?.params?.cycle_id;
  const cycleStart = route?.params?.cycle_start;
  const cycleEnd = route?.params?.cycle_end;

  const { data: configResponse, isLoading: configLoading } = useGetTenantPaymentConfigQuery();
  const [submitProof, { isLoading: submitting }] = useSubmitPaymentProofMutation();

  const config = configResponse?.data;

  // Track whether user left the app to pay via UPI
  const [upiAppOpened, setUpiAppOpened] = useState(false);
  const [hasAskedConfirmation, setHasAskedConfirmation] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [upiPickerVisible, setUpiPickerVisible] = useState(false);
  const [selectedAppLabel, setSelectedAppLabel] = useState('');
  const appState = useRef(AppState.currentState);

  // ─── Refetch payments summary on screen focus ───
  // Ensures we detect if the owner already marked this cycle as paid
  // while the tenant was away (race condition: owner adds payment manually)
  useFocusEffect(
    React.useCallback(() => {
      dispatch(tenantPaymentsApi.util.invalidateTags(['TenantPayments']));
    }, [dispatch]),
  );

  // ─── Detect when user returns from UPI app ───
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // User was in UPI app (inactive/background) and came back to our app (active)
      if (
        upiAppOpened &&
        !hasAskedConfirmation &&
        (appState.current === 'inactive' || appState.current === 'background') &&
        nextState === 'active'
      ) {
        setHasAskedConfirmation(true);
        // Small delay so the app is fully active before showing the alert
        setTimeout(() => askPaymentConfirmation(), 300);
      }
      appState.current = nextState;
    });

    return () => subscription?.remove();
  }, [upiAppOpened, hasAskedConfirmation]);

  const handleCopyUpi = async () => {
    if (config?.config?.upi_id) {
      await Clipboard.setString(config.config.upi_id);
      showSuccessAlert('UPI ID copied to clipboard');
    }
  };

  // ─── Open UPI app picker (checks which apps are installed) ───
  const handleOpenUpiPicker = () => {
    if (!config?.config?.upi_id) {
      Alert.alert('Error', 'No UPI ID configured. Please contact your PG owner.');
      return;
    }
    setUpiPickerVisible(true);
  };

  // ─── Called when user selects an app from the picker ───
  const handleAppSelected = (appId: string, appLabel: string) => {
    setUpiAppOpened(true);
    setHasAskedConfirmation(false);
    setSelectedAppLabel(appLabel);
  };

  // ─── Auto-submit payment proof when user confirms they paid ───
  const doSubmit = async (method: string = selectedAppLabel || 'UPI') => {
    if (paymentSubmitted) return;

    const amount = Number(rentAmount);
    if (!amount || amount <= 0) {
      showErrorAlert(null, 'Invalid payment amount');
      return;
    }

    const payload: any = {
      paid_amount: amount,
      paid_date: todayStr(),
      payment_method: method,
    };

    if (rentPaymentId && rentPaymentId > 0) {
      payload.rent_payment_id = rentPaymentId;
    } else if (cycleId) {
      payload.cycle_id = cycleId;
      if (cycleStart) payload.cycle_start = cycleStart;
      if (cycleEnd) payload.cycle_end = cycleEnd;
    } else {
      showErrorAlert(null, 'Missing rent payment reference');
      return;
    }

    try {
      const result = await submitProof(payload).unwrap();
      setPaymentSubmitted(true);
      // Invalidate payments summary so dashboard/payments tab refresh on return
      dispatch(tenantPaymentsApi.util.invalidateTags(['TenantPayments', 'TenantDues']));
      Alert.alert(
        'Payment Submitted',
        result?.message || 'Your payment has been marked as paid. Your PG owner will verify it shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      const msg = error?.data?.message || error?.data?.error?.details || 'Failed to submit payment proof';

      // Detect race condition: owner already marked this cycle as PAID
      // (NOT REJECTED or VOIDED — those mean the tenant can pay again)
      const isAlreadyPaid = /status PAID/i.test(msg)
        || /already.*paid/i.test(msg);

      // Detect "pending submission" — tenant already has a submission awaiting verification
      const isPendingSubmission = /pending submission/i.test(msg)
        || /wait for the PG owner/i.test(msg);

      if (isAlreadyPaid) {
        // Refresh payments data so the tenant sees the updated status
        dispatch(tenantPaymentsApi.util.invalidateTags(['TenantPayments', 'TenantDues']));
        Alert.alert(
          'Payment Already Recorded',
          'This rent cycle has already been paid by your PG owner. Please pull down to refresh your payments list to see the latest status.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else if (isPendingSubmission) {
        Alert.alert(
          'Submission Pending',
          'You already have a payment submission waiting for owner verification. Please wait for it to be verified before submitting again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        showErrorAlert(null, msg);
      }
    }
  };

  // ─── Ask user if they completed the payment after returning from UPI app ───
  const askPaymentConfirmation = () => {
    Alert.alert(
      'Did you complete the payment?',
      `Did you successfully pay ${formatAmount(rentAmount || 0)} via your UPI app?`,
      [
        { text: 'No, not yet', style: 'cancel', onPress: () => setHasAskedConfirmation(false) },
        { text: 'Yes, I paid', onPress: () => doSubmit('UPI') },
      ],
    );
  };

  // ─── Manual confirm (if AppState detection didn't trigger) ───
  const handleManualConfirm = () => {
    Alert.alert(
      'Confirm Payment',
      `Did you pay ${formatAmount(rentAmount || 0)} to ${config?.config?.upi_id || 'the PG owner'}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, I paid', onPress: () => doSubmit('UPI') },
      ],
    );
  };

  if (configLoading) {
    return (
      <ScreenLayout>
        <ScreenHeader title="Pay Rent" showBackButton onBackPress={() => navigation.goBack()} />
        <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 16 }}>
          <SubmitPaymentSkeleton />
        </ScrollView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenHeader
        title="Pay Rent"
        subtitle={rentStatus === 'PENDING' ? 'Pending payment' : 'Submit payment'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Amount to Pay ── */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>{formatAmount(rentAmount || 0)}</Text>
          {rentStatus && (
            <View style={[styles.statusBadge, { backgroundColor: rentStatus === 'PENDING' ? '#FEF3C7' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: rentStatus === 'PENDING' ? C.warningDark : C.danger }]}>{rentStatus}</Text>
            </View>
          )}
        </Card>

        {/* ── Already submitted state ── */}
        {paymentSubmitted && (
          <Card style={styles.submittedCard}>
            <Ionicons name="checkmark-circle" size={48} color={C.secondary} />
            <Text style={styles.submittedTitle}>Payment Submitted</Text>
            <Text style={styles.submittedSubtitle}>
              Your payment is waiting for PG owner verification. You'll be notified once verified.
            </Text>
          </Card>
        )}

        {/* ── Payment Details ── */}
        {!paymentSubmitted && config?.has_payment_config && config?.config ? (
          <>
            <Card style={styles.upiCard}>
              <View style={styles.upiCardHeader}>
                <Ionicons name="card-outline" size={20} color={C.primary} />
                <Text style={styles.upiCardTitle}>Payment Details</Text>
              </View>

              {/* UPI ID */}
              <View style={styles.upiIdRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiIdLabel}>UPI ID</Text>
                  <Text style={styles.upiIdValue}>{config.config.upi_id}</Text>
                </View>
                <TouchableOpacity onPress={handleCopyUpi} style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={18} color={C.primary} />
                </TouchableOpacity>
              </View>

              {/* Account Holder */}
              {config.config.account_holder_name ? (
                <View style={styles.upiDetailRow}>
                  <Text style={styles.upiDetailLabel}>Account Holder</Text>
                  <Text style={styles.upiDetailValue}>{config.config.account_holder_name}</Text>
                </View>
              ) : null}

              {/* Bank Details */}
              {config.config.bank_name ? (
                <View style={styles.upiDetailRow}>
                  <Text style={styles.upiDetailLabel}>Bank</Text>
                  <Text style={styles.upiDetailValue}>{config.config.bank_name}</Text>
                </View>
              ) : null}
              {config.config.account_number ? (
                <View style={styles.upiDetailRow}>
                  <Text style={styles.upiDetailLabel}>Account No.</Text>
                  <Text style={styles.upiDetailValue}>{config.config.account_number}</Text>
                </View>
              ) : null}
              {config.config.ifsc_code ? (
                <View style={styles.upiDetailRow}>
                  <Text style={styles.upiDetailLabel}>IFSC</Text>
                  <Text style={styles.upiDetailValue}>{config.config.ifsc_code}</Text>
                </View>
              ) : null}

              {/* Instructions */}
              {config.config.payment_instructions ? (
                <View style={styles.instructionsBox}>
                  <Ionicons name="information-circle-outline" size={16} color={C.primary} />
                  <Text style={styles.instructionsText}>{config.config.payment_instructions}</Text>
                </View>
              ) : null}
            </Card>

            {/* ── Step 1: Pay via UPI ── */}
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepText}>Open your UPI app and pay {formatAmount(rentAmount || 0)}</Text>
            </View>

            <Button
              title="Pay via UPI App"
              onPress={handleOpenUpiPicker}
              icon={<Ionicons name="open-outline" size={18} color={C.button.primaryText} />}
              style={{ marginBottom: 20 }}
            />

            {/* ── Step 2: Confirm ── */}
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepText}>Come back and confirm your payment</Text>
            </View>

            <Button
              title="I've Paid — Confirm"
              onPress={handleManualConfirm}
              loading={submitting}
              variant="secondary"
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={C.primary} />}
              style={{ marginBottom: 40 }}
            />
          </>
        ) : !paymentSubmitted ? (
          <Card style={styles.noConfigCard}>
            <Ionicons name="alert-circle-outline" size={32} color={C.warning} />
            <Text style={styles.noConfigTitle}>No Payment Config</Text>
            <Text style={styles.noConfigSubtitle}>
              Your PG owner hasn't set up payment details yet. Please contact them directly for payment instructions.
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      {/* ── UPI App Picker — shows only installed apps ── */}
      <UpiAppPicker
        visible={upiPickerVisible}
        onClose={() => setUpiPickerVisible(false)}
        upiId={config?.config?.upi_id || ''}
        amount={Number(rentAmount) || 0}
        payeeName={config?.config?.account_holder_name || 'PG Owner'}
        note="Rent Payment"
        onSelectApp={handleAppSelected}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 40 },

  // Amount card
  amountCard: { alignItems: 'center', padding: 24, marginBottom: 16, gap: 8 },
  amountLabel: { fontSize: 13, color: C.darkTertiary, fontWeight: '600' },
  amountValue: { fontSize: 32, fontWeight: '800', color: C.dark },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Submitted state
  submittedCard: { alignItems: 'center', padding: 24, gap: 8, marginBottom: 16 },
  submittedTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  submittedSubtitle: { fontSize: 12, color: C.darkTertiary, textAlign: 'center', lineHeight: 18 },

  // UPI Card
  upiCard: { padding: 16, marginBottom: 16 },
  upiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  upiCardTitle: { fontSize: 15, fontWeight: '700', color: C.dark },
  upiIdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.background.blueLight, borderRadius: 10, padding: 12, marginBottom: 10 },
  upiIdLabel: { fontSize: 11, color: C.darkTertiary, fontWeight: '600' },
  upiIdValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  copyBtn: { padding: 8 },

  // QR
  upiDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  upiDetailLabel: { fontSize: 12, color: C.darkTertiary, fontWeight: '600' },
  upiDetailValue: { fontSize: 13, color: C.dark, fontWeight: '500' },
  instructionsBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.background.secondary, borderRadius: 8, padding: 10, marginTop: 8 },
  instructionsText: { flex: 1, fontSize: 12, color: C.darkSecondary, lineHeight: 18 },

  // No config
  noConfigCard: { alignItems: 'center', padding: 24, gap: 8, marginBottom: 16 },
  noConfigTitle: { fontSize: 15, fontWeight: '700', color: C.dark },
  noConfigSubtitle: { fontSize: 12, color: C.darkTertiary, textAlign: 'center', lineHeight: 18 },

  // Steps
  stepContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 4 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 13, color: C.darkSecondary, fontWeight: '500' },
});
