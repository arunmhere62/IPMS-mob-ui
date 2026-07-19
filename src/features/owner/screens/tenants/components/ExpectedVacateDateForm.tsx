import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { SlideBottomModal } from '../../../../../components/SlideBottomModal';
import { DatePicker } from '../../../../../components/DatePicker';
import { AnimatedPressableCard } from '../../../../../components/AnimatedPressableCard';
import { Theme } from '../../../../../theme';

interface ExpectedVacateDateFormProps {
  visible: boolean;
  tenantName: string;
  currentVacateDate?: string | null;
  onClose: () => void;
  onSave: (date: string | null) => Promise<void>;
}

export const ExpectedVacateDateForm: React.FC<ExpectedVacateDateFormProps> = ({
  visible,
  tenantName,
  currentVacateDate,
  onClose,
  onSave,
}) => {
  const [vacateDate, setVacateDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setVacateDate(
        currentVacateDate
          ? new Date(currentVacateDate).toISOString().split('T')[0]
          : ''
      );
    }
  }, [visible, currentVacateDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSave = async () => {
    if (!vacateDate) {
      try {
        setLoading(true);
        await onSave(null);
        onClose();
      } catch (error) {
        console.error('Error clearing vacate date:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const selectedDate = new Date(vacateDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Invalid Date', 'Expected vacate date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      setLoading(true);
      await onSave(vacateDate);
      onClose();
    } catch (error) {
      console.error('Error saving vacate date:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideBottomModal
      visible={visible}
      title="Expected Vacate Date"
      subtitle={tenantName ? `Tenant: ${tenantName}` : 'Tenant'}
      isLoading={loading}
      submitLabel="Save"
      cancelLabel="Cancel"
      onClose={onClose}
      onSubmit={handleSave}
    >
      <View style={{ marginBottom: 10, padding: 10, backgroundColor: Theme.colors.background.blueLight, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border }}>
        <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
          Set this if the tenant plans to leave on a specific date. This is different from the actual checkout date — it's for planning purposes only. Only today or future dates are allowed.
        </Text>
      </View>
      <DatePicker
        label="Expected Vacate Date"
        value={vacateDate}
        onChange={setVacateDate}
        required={false}
        minimumDate={today}
      />
      {vacateDate && (
        <AnimatedPressableCard
          onPress={() => setVacateDate('')}
          style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Clear Date</Text>
        </AnimatedPressableCard>
      )}
    </SlideBottomModal>
  );
};
