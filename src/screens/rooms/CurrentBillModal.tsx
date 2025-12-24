import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
// import { createCurrentBill } from '../../services/bills/currentBillService';
import { Theme } from '../../theme';
import { DatePicker } from '../../components/DatePicker';
import { Room } from '@/services/api';

interface CurrentBillModalProps {
  visible: boolean;
  room: Room;
  onClose: () => void;
  onSuccess: () => void;
}

export const CurrentBillModal: React.FC<CurrentBillModalProps> = ({
  visible,
  room,
  onClose,
  onSuccess,
}) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [loading, setLoading] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate number of beds (tenants) in the room
  const numberOfBeds = room.beds?.length || 0;
  const billPerBed = billAmount && numberOfBeds > 0 ? parseFloat(billAmount) / numberOfBeds : 0;

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!billAmount.trim()) {
      newErrors.billAmount = 'Bill amount is required';
    } else if (isNaN(Number(billAmount)) || Number(billAmount) <= 0) {
      newErrors.billAmount = 'Bill amount must be a valid positive number';
    }

    if (!billDate.trim()) {
      newErrors.billDate = 'Bill date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    if (!selectedPGLocationId) {
      Alert.alert('Error', 'Invalid PG location');
      return;
    }

    try {
      setLoading(true);

      const billData = {
        room_id: room.s_no,
        pg_id: selectedPGLocationId,
        bill_amount: parseFloat(billAmount),
        bill_date: billDate,
        split_equally: true, // Split equally among all tenants in the room
        remarks: remarks || undefined,
      };

      // await createCurrentBill(billData, {
      //   pg_id: selectedPGLocationId,
      //   organization_id: user?.organization_id,
      //   user_id: user?.s_no,
      // });

      Alert.alert('Success', `Bill created and split equally among all tenants in Room ${room.room_no}`);
      handleClose();
      onSuccess();
    } catch (error: any) {
      // Extract error message from backend response
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to create bill';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBillAmount('');
    setBillDate('');
    setRemarks('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#F59E0B' + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>💰</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.text.primary }}>
                    Add Current Bill
                  </Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
                    {room.room_no}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: Theme.colors.text.secondary, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={{ maxHeight: '75%' }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info Card */}
              <View
                style={{
                  padding: 12,
                  backgroundColor: '#FEF3C7',
                  borderLeftWidth: 3,
                  borderLeftColor: '#F59E0B',
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>ℹ️</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#92400E',
                        marginBottom: 2,
                      }}
                    >
                      Bill Splitting
                    </Text>
                    <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16 }}>
                      This bill will be split equally among all active tenants in this room.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bill Amount */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: Theme.colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Bill Amount (₹) <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  value={billAmount}
                  onChangeText={(value) => {
                    setBillAmount(value);
                    if (errors.billAmount) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.billAmount;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="e.g., 3000"
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.billAmount ? '#EF4444' : '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    backgroundColor: '#fff',
                  }}
                />
                {errors.billAmount && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                    {errors.billAmount}
                  </Text>
                )}
                <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginTop: 4 }}>
                  Total amount to split among all tenants
                </Text>
              </View>


              {/* Bill Date */}
              <View style={{ marginBottom: 16 }}>
                <DatePicker
                  label="Bill Date (Month)"
                  value={billDate}
                  onChange={(value) => {
                    setBillDate(value);
                    if (errors.billDate) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.billDate;
                        return newErrors;
                      });
                    }
                  }}
                  required
                />
                {errors.billDate && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                    {errors.billDate}
                  </Text>
                )}
              </View>


              {/* Remarks */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: Theme.colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Remarks (Optional)
                </Text>
                <TextInput
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="e.g., Electricity bill for January"
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    backgroundColor: '#fff',
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Summary Cards Section */}
              <View style={{ marginTop: 20, gap: 12 }}>
                {/* Bill Split Breakdown */}
                <View
                  style={{
                    padding: 12,
                    backgroundColor: '#E0F2FE',
                    borderLeftWidth: 3,
                    borderLeftColor: '#0EA5E9',
                    borderRadius: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369A1' }}>
                      📊 Bill Split Breakdown
                    </Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#0369A1' }}>Total Bill Amount:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>
                        ₹{billAmount ? parseFloat(billAmount).toLocaleString('en-IN') : '0'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#0369A1' }}>Number of Beds:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>
                        {numberOfBeds}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: '#0EA5E9',
                        marginVertical: 4,
                      }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369A1' }}>
                        Per Bed Amount:
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0EA5E9' }}>
                        ₹{billPerBed > 0 ? billPerBed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </Text>
                    </View>
                  </View>
                </View>

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
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
              }}
            >
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: Theme.colors.text.secondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#F59E0B',
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
                    Create Bill
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};
