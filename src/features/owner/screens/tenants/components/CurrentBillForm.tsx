import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { DatePicker } from '../../../../../components/DatePicker';
import { Theme } from '../../../../../theme';
import { AnimatedPressableCard } from '../../../../../components/AnimatedPressableCard';

interface CurrentBillFormProps {
  visible: boolean;
  billAmount: string;
  billDate: string;
  billRemarks: string;
  loading: boolean;
  onBillAmountChange: (amount: string) => void;
  onBillDateChange: (date: string) => void;
  onBillRemarksChange: (remarks: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const AddCurrentBillForm: React.FC<CurrentBillFormProps> = ({
  visible,
  billAmount,
  billDate,
  billRemarks,
  loading,
  onBillAmountChange,
  onBillDateChange,
  onBillRemarksChange,
  onClose,
  onSave,
}) => {
  // Get month display from selected date
  const getMonthDisplay = () => {
    if (!billDate) return null;
    try {
      const date = new Date(billDate);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        onStartShouldSetResponder={() => { onClose(); return true; }}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.text.primary }}>
              Add Current Bill
            </Text>
            <AnimatedPressableCard onPress={onClose}>
              <Text style={{ fontSize: 24, color: Theme.colors.text.secondary }}>✕</Text>
            </AnimatedPressableCard>
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* Bill Amount */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Bill Amount (₹) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                value={billAmount}
                onChangeText={onBillAmountChange}
                placeholder="e.g., 1500"
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  lineHeight: 18,
                  backgroundColor: '#fff',
                  minHeight: 44,
                  textAlignVertical: 'center',
                }}
              />
            </View>

            {/* Bill Date */}
            <View style={{ marginBottom: 16 }}>
              <DatePicker
                label="Bill Date (Month)"
                value={billDate}
                onChange={onBillDateChange}
                required
              />
            </View>

            {/* Remarks */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Remarks (Optional)
              </Text>
              <TextInput
                value={billRemarks}
                onChangeText={onBillRemarksChange}
                placeholder="e.g., Electricity bill"
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  lineHeight: 18,
                  backgroundColor: '#fff',
                  textAlignVertical: 'top',
                  minHeight: 80,
                }}
              />
            </View>
            {/* Summary Cards Section */}
            <View style={{ marginTop: 20, gap: 12 }}>
              {/* Month Indicator */}
              <View
                style={{
                  padding: 12,
                  backgroundColor: '#ECFDF5',
                  borderLeftWidth: 3,
                  borderLeftColor: '#10B981',
                  borderRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>📅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600', marginBottom: 2 }}>
                      Bill For
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>
                      {getMonthDisplay() || 'Select a date'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bill Amount Summary */}
              <View
                style={{
                  padding: 12,
                  backgroundColor: '#FEF3C7',
                  borderLeftWidth: 3,
                  borderLeftColor: '#F59E0B',
                  borderRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600', marginBottom: 2 }}>
                      💰 Bill Amount
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#F59E0B' }}>
                    ₹{billAmount ? parseFloat(billAmount).toLocaleString('en-IN') : '0'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <AnimatedPressableCard
              onPress={onClose}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Theme.colors.text.secondary, fontWeight: '600' }}>Cancel</Text>
            </AnimatedPressableCard>

            <AnimatedPressableCard
              onPress={onSave}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#F59E0B',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Bill</Text>
              )}
            </AnimatedPressableCard>
          </View>
        </View>
      </View>
    </Modal>
  );
};
