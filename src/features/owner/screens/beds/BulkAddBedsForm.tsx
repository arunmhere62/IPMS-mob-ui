import React, { useState, useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, TextInput, Alert, ScrollView } from 'react-native';
import { Theme } from '../../../../theme';
import { SlideBottomModal } from '../../../../components/SlideBottomModal';
import { Ionicons } from '@expo/vector-icons';
import {
  useBulkCreateBedMutation,
  type BulkBedItem } from '../../api/roomsApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface BulkAddBedsFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: number;
  roomNo: string;
  existingBedCount: number;
}

interface BedRow {
  bed_no: string;
  bed_price: string;
}

const sanitizeNumeric = (text: string): string => {
  return text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
};

export const BulkAddBedsForm: React.FC<BulkAddBedsFormProps> = ({
  visible,
  onClose,
  onSuccess,
  roomId,
  roomNo,
  existingBedCount }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [bulkCreateBed, { isLoading }] = useBulkCreateBedMutation();
  const [beds, setBeds] = useState<BedRow[]>([
    { bed_no: '', bed_price: '' },
  ]);
  const [errors, setErrors] = useState<Record<number, { bed_no?: string; bed_price?: string }>>({});
  const submittingRef = useRef(false);
  // Refs to chain focus across dynamic rows
  const bedNoRefs = useRef<Array<TextInput | null>>([]);
  const priceRefs = useRef<Array<TextInput | null>>([]);

  const reset = () => {
    setBeds([{ bed_no: '', bed_price: '' }]);
    setErrors({});
    submittingRef.current = false;
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const addRow = () => {
    if (beds.length >= 20) {
      Alert.alert('Limit', 'Maximum 20 beds can be created at once');
      return;
    }
    setBeds([...beds, { bed_no: '', bed_price: '' }]);
  };

  const removeRow = (index: number) => {
    if (beds.length === 1) return;
    const newBeds = beds.filter((_, i) => i !== index);
    setBeds(newBeds);
    setErrors((prev) => {
      const newErrors: Record<number, { bed_no?: string; bed_price?: string }> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (idx < index) newErrors[idx] = prev[idx];
        else if (idx > index) newErrors[idx - 1] = prev[idx];
      });
      return newErrors;
    });
  };

  const updateBed = (index: number, field: 'bed_no' | 'bed_price', value: string) => {
    const processed = field === 'bed_no'
      ? sanitizeNumeric(value)
      : sanitizeNumeric(value);
    setBeds((prev) => prev.map((b, i) => i === index ? { ...b, [field]: processed } : b));
    if (errors[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: undefined } }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<number, { bed_no?: string; bed_price?: string }> = {};
    const bedNos: string[] = [];

    beds.forEach((bed, index) => {
      const bedNo = bed.bed_no.trim();
      if (!bedNo) {
        newErrors[index] = { ...newErrors[index], bed_no: 'Required' };
      } else if (!/^\d+$/.test(bedNo)) {
        newErrors[index] = { ...newErrors[index], bed_no: 'Numbers only' };
      } else if (bedNo.length > 3) {
        newErrors[index] = { ...newErrors[index], bed_no: 'Max 3 digits' };
      } else {
        const fullBedNo = `BED${bedNo}`;
        if (bedNos.includes(fullBedNo)) {
          newErrors[index] = { ...newErrors[index], bed_no: 'Duplicate in list' };
        } else {
          bedNos.push(fullBedNo);
        }
      }

      const price = bed.bed_price.trim();
      if (!price) {
        newErrors[index] = { ...newErrors[index], bed_price: 'Required' };
      } else {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice <= 0) {
          newErrors[index] = { ...newErrors[index], bed_price: 'Invalid price' };
        } else if (numPrice < 100) {
          newErrors[index] = { ...newErrors[index], bed_price: 'Min ₹100' };
        } else if (numPrice > 100000) {
          newErrors[index] = { ...newErrors[index], bed_price: 'Max ₹100,000' };
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submittingRef.current || isLoading) return;
    if (!selectedPGLocationId) {
      Alert.alert('Error', 'Please select a PG location first');
      return;
    }
    if (!roomId) {
      Alert.alert('Error', 'Room ID is required');
      return;
    }

    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    submittingRef.current = true;

    const payload = {
      room_id: roomId,
      pg_id: selectedPGLocationId,
      beds: beds.map((bed) => ({
        bed_no: `BED${bed.bed_no.trim()}`,
        bed_price: parseFloat(bed.bed_price) })) as BulkBedItem[] };

    try {
      await bulkCreateBed(payload).unwrap();
      showSuccessAlert(`${beds.length} bed${beds.length > 1 ? 's' : ''} created successfully`);
      reset();
      onSuccess();
    } catch (error: any) {
      showErrorAlert(error, 'Bulk Create Error');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={`Add Multiple Beds — Room ${roomNo}`}
      subtitle={`${existingBedCount} existing bed${existingBedCount !== 1 ? 's' : ''}`}
      submitLabel={`Create ${beds.length} Bed${beds.length !== 1 ? 's' : ''}`}
      cancelLabel="Cancel"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onCancel={handleClose}
      minHeightPercent={0.85}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {beds.map((bed, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 12,
              alignItems: 'flex-start' }}
          >
            {/* Bed Number */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Bed {index + 1} Number
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: Theme.colors.primary + '15',
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    borderWidth: 1,
                    borderColor: errors[index]?.bed_no ? Theme.colors.danger : Theme.colors.border,
                    borderRightWidth: 0 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
                    BED
                  </Text>
                </View>
                <TextInput
                  value={bed.bed_no}
                  onChangeText={(v) => updateBed(index, 'bed_no', v)}
                  placeholder="1"
                  keyboardType="numeric"
                  ref={(el) => { bedNoRefs.current[index] = el; }}
                  returnKeyType={'next'}
                  onSubmitEditing={() => priceRefs.current[index]?.focus()}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: errors[index]?.bed_no ? Theme.colors.danger : Theme.colors.border,
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                    borderLeftWidth: 0,
                    padding: 12,
                    fontSize: 14,
                    lineHeight: 18,
                    backgroundColor: '#fff',
                    minHeight: 44,
                    textAlignVertical: 'center' }}
                />
              </View>
              {errors[index]?.bed_no && (
                <Text style={{ fontSize: 10, color: Theme.colors.danger, marginTop: 2 }}>
                  {errors[index]?.bed_no}
                </Text>
              )}
            </View>

            {/* Bed Price */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Price (₹/mo)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: Theme.colors.primary + '15',
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    borderWidth: 1,
                    borderColor: errors[index]?.bed_price ? Theme.colors.danger : Theme.colors.border,
                    borderRightWidth: 0 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
                    ₹
                  </Text>
                </View>
                <TextInput
                  value={bed.bed_price}
                  onChangeText={(v) => updateBed(index, 'bed_price', v)}
                  placeholder="5000"
                  keyboardType="numeric"
                  ref={(el) => { priceRefs.current[index] = el; }}
                  returnKeyType={index < beds.length - 1 ? 'next' : 'done'}
                  blurOnSubmit={index === beds.length - 1}
                  onSubmitEditing={() => {
                    if (index < beds.length - 1) {
                      bedNoRefs.current[index + 1]?.focus();
                    }
                  }}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: errors[index]?.bed_price ? Theme.colors.danger : Theme.colors.border,
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                    borderLeftWidth: 0,
                    padding: 12,
                    fontSize: 14,
                    lineHeight: 18,
                    backgroundColor: '#fff',
                    minHeight: 44,
                    textAlignVertical: 'center' }}
                />
              </View>
              {errors[index]?.bed_price && (
                <Text style={{ fontSize: 10, color: Theme.colors.danger, marginTop: 2 }}>
                  {errors[index]?.bed_price}
                </Text>
              )}
            </View>

            {/* Remove button */}
            {beds.length > 1 && (
              <AnimatedPressableCard
                onPress={() => removeRow(index)}
                style={{
                  marginTop: 22,
                  padding: 8,
                  backgroundColor: '#FEE2E2',
                  borderRadius: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </AnimatedPressableCard>
            )}
          </View>
        ))}

        {/* Add more button */}
        <AnimatedPressableCard
          onPress={addRow}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: Theme.colors.primary,
            borderStyle: 'dashed',
            borderRadius: 10,
            marginBottom: 16 }}
        >
          <Ionicons name="add-circle-outline" size={18} color={Theme.colors.primary} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
            Add Another Bed
          </Text>
        </AnimatedPressableCard>

        {/* Summary */}
        <View
          style={{
            backgroundColor: Theme.colors.primary + '08',
            borderRadius: 10,
            padding: 12 }}
        >
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            {beds.length} bed{beds.length !== 1 ? 's' : ''} will be created in Room {roomNo}
          </Text>
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};
