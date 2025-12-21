import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import expenseService, { Expense, PaymentMethod } from '../../services/expenses/expenseService';
import { DatePicker } from '../../components/DatePicker';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { OptionSelector } from '../../components/OptionSelector';
import { AmountInput } from '../../components/AmountInput';

interface AddEditExpenseModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: () => void;
}

const PAYMENT_METHODS = [
  { label: 'GPay', value: PaymentMethod.GPAY, icon: 'logo-google', color: '#4285F4' },
  { label: 'PhonePe', value: PaymentMethod.PHONEPE, icon: 'phone-portrait-outline', color: '#5F259F' },
  { label: 'Cash', value: PaymentMethod.CASH, icon: 'cash-outline', color: '#10B981' },
  { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER, icon: 'card-outline', color: '#F59E0B' },
];

const EXPENSE_TYPES = [
  'Electricity Bill',
  'Water Bill',
  'Internet Bill',
  'Maintenance',
  'Repairs',
  'Groceries',
  'Cleaning',
  'Security',
  'Salary',
];

export const AddEditExpenseModal: React.FC<AddEditExpenseModalProps> = ({
  visible,
  expense,
  onClose,
  onSave,
}) => {
  const [expenseType, setExpenseType] = useState('');
  const [customExpenseType, setCustomExpenseType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (visible) {
      if (expense) {
        // Edit mode
        const isCustomType = !EXPENSE_TYPES.includes(expense.expense_type);
        setExpenseType(isCustomType ? '' : expense.expense_type);
        setCustomExpenseType(isCustomType ? expense.expense_type : '');
        setShowCustomType(isCustomType);
        setAmount(expense.amount.toString());
        setPaidTo(expense.paid_to);
        setPaidDate(expense.paid_date.split('T')[0]);
        setPaymentMethod(expense.payment_method);
        setRemarks(expense.remarks || '');
      } else {
        // Add mode - set default date to today
        const today = new Date().toISOString().split('T')[0];
        setPaidDate(today);
        setShowCustomType(false);
      }
    }
  }, [visible, expense]);

  const validate = () => {
    const newErrors: any = {};

    const finalExpenseType = showCustomType ? customExpenseType : expenseType;
    if (!finalExpenseType.trim()) {
      newErrors.expenseType = 'Expense type is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!paidTo.trim()) {
      newErrors.paidTo = 'Paid to is required';
    }

    if (!paidDate.trim()) {
      newErrors.paidDate = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const finalExpenseType = showCustomType ? customExpenseType : expenseType;

      const data = {
        expense_type: finalExpenseType.trim(),
        amount: Number(amount),
        paid_to: paidTo.trim(),
        paid_date: paidDate,
        payment_method: paymentMethod,
        remarks: remarks.trim() || undefined,
      };


      if (expense) {
        // Update existing expense
        await expenseService.updateExpense(expense.s_no, data);
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        // Create new expense
        const response = await expenseService.createExpense(data);
        Alert.alert('Success', 'Expense added successfully');
      }

      handleClose();
      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExpenseType('');
    setCustomExpenseType('');
    setShowCustomType(false);
    setAmount('');
    setPaidTo('');
    setPaidDate('');
    setPaymentMethod(PaymentMethod.CASH);
    setRemarks('');
    setErrors({});
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={expense ? 'Edit Expense' : 'Add Expense'}
      subtitle={expense ? 'Update expense details' : 'Record a new expense'}
      onSubmit={handleSave}
      onCancel={handleClose}
      submitLabel={expense ? 'Update Expense' : 'Add Expense'}
      cancelLabel="Cancel"
      isLoading={loading}
    >
      {/* Expense Type */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Expense Type <Text style={{ color: Theme.colors.danger }}>*</Text>
        </Text>

        {/* Toggle between predefined and custom */}
        <View style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setShowCustomType(false);
              setCustomExpenseType('');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: !showCustomType ? Theme.colors.primary : Theme.colors.border,
              backgroundColor: !showCustomType ? Theme.colors.background.blueLight : Theme.colors.canvas,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: !showCustomType ? '600' : '400',
                color: !showCustomType ? Theme.colors.primary : Theme.colors.text.secondary,
              }}
            >
              Predefined Types
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowCustomType(true);
              setExpenseType('');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: showCustomType ? Theme.colors.primary : Theme.colors.border,
              backgroundColor: showCustomType ? Theme.colors.background.blueLight : Theme.colors.canvas,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: showCustomType ? '600' : '400',
                color: showCustomType ? Theme.colors.primary : Theme.colors.text.secondary,
              }}
            >
              Custom Type
            </Text>
          </TouchableOpacity>
        </View>

        {!showCustomType ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXPENSE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setExpenseType(type)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: expenseType === type ? Theme.colors.primary : Theme.colors.border,
                  backgroundColor: expenseType === type ? Theme.colors.background.blueLight : Theme.colors.canvas,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: expenseType === type ? '600' : '400',
                    color: expenseType === type ? Theme.colors.primary : Theme.colors.text.primary,
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              fontSize: 16,
              color: Theme.colors.text.primary,
              backgroundColor: Theme.colors.input.background,
              borderWidth: 1,
              borderColor: errors.expenseType ? Theme.colors.danger : Theme.colors.input.border,
              borderRadius: 8,
            }}
            placeholder="Enter custom expense type (e.g., Gas Bill, Pest Control)"
            placeholderTextColor={Theme.colors.input.placeholder}
            value={customExpenseType}
            onChangeText={setCustomExpenseType}
            autoFocus
          />
        )}
        {errors.expenseType && (
          <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
            {errors.expenseType}
          </Text>
        )}
      </View>

      {/* Amount */}
      <AmountInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        error={errors.amount}
        required={true}
        containerStyle={{ marginBottom: 24 }}
        maxLength={10}
      />

      {/* Paid To */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Paid To <Text style={{ color: Theme.colors.danger }}>*</Text>
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Theme.colors.input.background,
            borderWidth: 1,
            borderColor: errors.paidTo ? Theme.colors.danger : Theme.colors.input.border,
            borderRadius: 8,
            paddingHorizontal: 16,
          }}
        >
          <Ionicons name="person-outline" size={20} color={Theme.colors.text.tertiary} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 12,
              fontSize: 16,
              color: Theme.colors.text.primary,
            }}
            placeholder="Enter person or company name"
            placeholderTextColor={Theme.colors.input.placeholder}
            value={paidTo}
            onChangeText={setPaidTo}
          />
        </View>
        {errors.paidTo && (
          <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
            {errors.paidTo}
          </Text>
        )}
      </View>

      {/* Date */}
      <View style={{ marginBottom: 24 }}>
        <DatePicker
          label="Date"
          value={paidDate}
          onChange={setPaidDate}
          error={errors.paidDate}
          required
          maximumDate={new Date()}
        />
      </View>

      {/* Payment Method */}
      <View style={{ marginBottom: 24 }}>
        <OptionSelector
          label="Payment Method"
          description="Select how the expense was paid"
          options={PAYMENT_METHODS.map((method) => {
            const iconMap: { [key: string]: string } = {
              'GPay': '💰',
              'PhonePe': '📱',
              'Cash': '💵',
              'Bank Transfer': '🏦',
            };
            return {
              label: method.label,
              value: method.value,
              icon: iconMap[method.label] || '💳',
            };
          })}
          selectedValue={paymentMethod}
          onSelect={(value) => setPaymentMethod(value as PaymentMethod)}
          required={true}
          disabled={loading}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Remarks */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Remarks (Optional)
        </Text>
        <TextInput
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            color: Theme.colors.text.primary,
            backgroundColor: Theme.colors.input.background,
            borderWidth: 1,
            borderColor: Theme.colors.input.border,
            borderRadius: 8,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder="Add any additional notes"
          placeholderTextColor={Theme.colors.input.placeholder}
          multiline
          numberOfLines={3}
          value={remarks}
          onChangeText={setRemarks}
        />
      </View>
    </SlideBottomModal>
  );
};
