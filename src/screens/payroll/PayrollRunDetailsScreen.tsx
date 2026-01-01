import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/theme';
import { CONTENT_COLOR } from '@/constant';
import { Card } from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { AmountInput } from '@/components/AmountInput';
import { DatePicker } from '@/components/DatePicker';
import { OptionSelector, type Option } from '@/components/OptionSelector';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import {
  PaymentMethod,
  useAddPayrollItemPaymentMutation,
  useGetPayrollRunByIdQuery,
  type PayrollRunItem,
} from '@/services/api/payrollApi';

interface PayrollRunDetailsScreenProps {
  navigation: any;
  route: any;
}

const PAYMENT_METHODS: Option[] = [
  { label: 'GPay', value: 'GPAY', icon: '📱' },
  { label: 'PhonePe', value: 'PHONEPE', icon: '📱' },
  { label: 'Cash', value: 'CASH', icon: '💵' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: '🏦' },
];

export const PayrollRunDetailsScreen: React.FC<PayrollRunDetailsScreenProps> = ({ navigation, route }) => {
  const runId = Number(route?.params?.runId);

  const { data, isLoading, refetch } = useGetPayrollRunByIdQuery(runId, { skip: !runId });
  const run = (data as any)?.data ?? data;

  const [addPayment, { isLoading: isPaying }] = useAddPayrollItemPaymentMutation();

  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState<PayrollRunItem | null>(null);

  const [formData, setFormData] = React.useState({
    paid_amount: '',
    paid_date: '',
    payment_method: null as string | null,
    remarks: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPaymentMethodLabel = (m?: string | null) => {
    if (!m) return 'N/A';
    if (m === 'GPAY') return 'GPay';
    if (m === 'PHONEPE') return 'PhonePe';
    if (m === 'CASH') return 'Cash';
    if (m === 'BANK_TRANSFER') return 'Bank Transfer';
    return m;
  };

  const getStatusColor = (status: string) => {
    if (status === 'LOCKED') return '#10B981';
    if (status === 'CANCELLED') return '#EF4444';
    return '#3B82F6';
  };

  const openPayModal = (item: PayrollRunItem) => {
    setActiveItem(item);
    setFormData({ paid_amount: '', paid_date: '', payment_method: null, remarks: '' });
    setErrors({});
    setPaymentModalVisible(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};

    const amt = Number(formData.paid_amount);
    if (!formData.paid_amount || !Number.isFinite(amt) || amt <= 0) {
      next.paid_amount = 'Paid amount is required';
    }

    if (!formData.paid_date) {
      next.paid_date = 'Payment date is required';
    }

    if (!formData.payment_method) {
      next.payment_method = 'Payment method is required';
    }

    if (activeItem) {
      const balance = Number(activeItem.balance_amount ?? 0);
      if (Number.isFinite(amt) && amt > balance + 0.0001) {
        next.paid_amount = `Paid amount cannot exceed balance (${formatAmount(balance)})`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitPayment = async () => {
    if (!activeItem) return;
    if (!validate()) return;

    try {
      await addPayment({
        runId,
        itemId: activeItem.s_no,
        data: {
          paid_amount: Number(formData.paid_amount),
          paid_date: formData.paid_date,
          payment_method: formData.payment_method as PaymentMethod,
          remarks: formData.remarks || undefined,
        },
      }).unwrap();

      setPaymentModalVisible(false);
      setActiveItem(null);
      showSuccessAlert('Payment recorded successfully');
      refetch();
    } catch (error: any) {
      showErrorAlert(error, 'Payment Error');
    }
  };

  const items: PayrollRunItem[] = run?.payroll_run_items || [];

  const renderItem = ({ item }: { item: PayrollRunItem }) => {
    const balance = Number(item.balance_amount ?? Number(item.net_amount));
    const paid = Number(item.total_paid ?? 0);
    const payments = Array.isArray(item.payroll_item_payments) ? item.payroll_item_payments : [];

    return (
      <Card style={{ marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
              {item.users?.name || `Employee #${item.user_id}`}
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
              Status: {item.status}
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.primary }}>
            {formatAmount(Number(item.net_amount))}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            Paid: {formatAmount(paid)}
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            Balance: {formatAmount(balance)}
          </Text>
        </View>

        {payments.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 6 }}>
              Payments
            </Text>
            <View style={{ gap: 6 }}>
              {payments.slice(0, 3).map((p) => (
                <View
                  key={p.s_no}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: Theme.colors.border,
                    backgroundColor: '#fff',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.primary }}>
                      {formatAmount(Number(p.paid_amount))}
                    </Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 2 }}>
                      {formatDate(p.paid_date)} • {getPaymentMethodLabel(p.payment_method as any)}
                    </Text>
                  </View>
                  <Ionicons name="receipt-outline" size={18} color={Theme.colors.text.tertiary} />
                </View>
              ))}

              {payments.length > 3 && (
                <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                  +{payments.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}

        {balance > 0.0001 && run?.status === 'GENERATED' && (
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => openPayModal(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Theme.colors.primary,
              }}
            >
              <Ionicons name="cash-outline" size={16} color="#fff" />
              <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#fff' }}>
                Add Payment
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (!runId) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Payroll"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, padding: 16, paddingTop: 12 }}>
          <Text style={{ color: Theme.colors.text.secondary }}>Invalid run</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (isLoading) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Payroll"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, padding: 16, paddingTop: 12 }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={run?.month ? formatMonth(run.month) : 'Payroll'}
        subtitle={run?.status ? `Status: ${run.status}` : undefined}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>Run</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary }}>
                  #{run?.s_no}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: Theme.withOpacity(getStatusColor(run?.status), 0.12),
                  borderWidth: 1,
                  borderColor: Theme.withOpacity(getStatusColor(run?.status), 0.25),
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: getStatusColor(run?.status) }}>
                  {run?.status}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={64} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
                No employees found in this run
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      </View>

      <SlideBottomModal
        visible={paymentModalVisible}
        onClose={() => {
          if (!isPaying) {
            setPaymentModalVisible(false);
            setActiveItem(null);
          }
        }}
        title="Add Payment"
        subtitle={activeItem?.users?.name}
        onSubmit={submitPayment}
        submitLabel="Save Payment"
        cancelLabel="Cancel"
        isLoading={isPaying}
      >
        <View style={{ marginBottom: 12 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 6 }}>Balance</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary }}>
              {formatAmount(Number(activeItem?.balance_amount ?? 0))}
            </Text>
          </Card>
        </View>

        <AmountInput
          label="Paid Amount"
          value={formData.paid_amount}
          onChangeText={(text) => setFormData((p) => ({ ...p, paid_amount: text }))}
          required
          error={errors.paid_amount}
          containerStyle={{ marginBottom: 16 }}
        />

        <View style={{ marginBottom: 16 }}>
          <DatePicker
            label="Payment Date"
            value={formData.paid_date}
            onChange={(date: string) => setFormData((p) => ({ ...p, paid_date: date }))}
            required
            error={errors.paid_date}
          />
        </View>

        <OptionSelector
          label="Payment Method"
          options={PAYMENT_METHODS}
          selectedValue={formData.payment_method}
          onSelect={(value) => setFormData((p) => ({ ...p, payment_method: value }))}
          required
          error={errors.payment_method}
          containerStyle={{ marginBottom: 16 }}
        />

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Remarks (Optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: Theme.colors.input.background,
              borderWidth: 1,
              borderColor: Theme.colors.input.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 14,
              color: Theme.colors.text.primary,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Add any notes..."
            placeholderTextColor={Theme.colors.input.placeholder}
            multiline
            numberOfLines={3}
            value={formData.remarks}
            onChangeText={(text) => setFormData((p) => ({ ...p, remarks: text }))}
          />
        </View>
      </SlideBottomModal>
    </ScreenLayout>
  );
};
