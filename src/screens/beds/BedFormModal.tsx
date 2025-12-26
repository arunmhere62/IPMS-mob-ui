import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import { Theme } from '../../theme';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { getFolderConfig } from '../../config/aws.config';
import { Bed, useCreateBedMutation, useUpdateBedMutation } from '../../services/api/roomsApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface BedFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: number;
  roomNo: string;
  bed?: Bed | null;
  pgId?: number;
  organizationId?: number;
  userId?: number;
}

export const BedFormModal: React.FC<BedFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roomId,
  roomNo,
  bed,
  pgId,
  organizationId,
  userId,
}) => {
  const [createBedMutation] = useCreateBedMutation();
  const [updateBedMutation] = useUpdateBedMutation();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bed_no: 'BED',
    bed_price: '',
    images: [] as string[],
  });
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!bed;

  useEffect(() => {
    if (visible) {
      if (bed) {
        const bedImages = bed.images || [];
        setFormData({
          bed_no: bed.bed_no,
          bed_price: bed.bed_price?.toString() || '',
          images: bedImages,
        });
        setOriginalImages([...bedImages]);
      } else {
        setFormData({
          bed_no: 'BED',
          bed_price: '',
          images: [],
        });
      }
      setErrors({});
    }
  }, [visible, bed]);

  const updateField = (field: string, value: string) => {
    if (field === 'bed_no') {
      const numericValue = value.replace(/[^0-9]/g, '');
      value = 'BED' + numericValue;
    }
    
    if (field === 'bed_price') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        value = numericValue;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bed_no.trim() || formData.bed_no.trim() === 'BED') {
      newErrors.bed_no = 'Bed number is required (e.g., BED1, BED2)';
    }

    if (!formData.bed_price || !formData.bed_price.trim()) {
      newErrors.bed_price = 'Bed price is required';
    } else {
      const price = parseFloat(formData.bed_price);
      if (isNaN(price) || price <= 0) {
        newErrors.bed_price = 'Please enter a valid price (must be greater than 0)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    try {
      setLoading(true);

      // Note: S3 deletion is handled by the backend
      // Frontend just sends the updated images list, backend removes deleted images

      const bedData = {
        room_id: roomId,
        bed_no: formData.bed_no.trim(),
        pg_id: pgId,
        bed_price: parseFloat(formData.bed_price),
        images: formData.images, // Always send images array, even if empty, so backend can clear removed images
      };

      if (isEditMode && bed) {
        await updateBedMutation({ id: bed.s_no, data: bedData }).unwrap();
        showSuccessAlert('Bed updated successfully');
      } else {
        await createBedMutation(bedData).unwrap();
        showSuccessAlert('Bed created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} bed`;
      if (__DEV__) {
        console.log('❌ Bed creation/update failed:', {
          status: error?.response?.status,
          message: errorMessage,
          bedNumber: formData.bed_no,
          roomId: roomId,
        });
      }

      showErrorAlert(error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={isEditMode ? '✏️ Edit Bed' : '🛏️ Add New Bed'}
      subtitle={`Room ${roomNo}`}
      submitLabel={isEditMode ? 'Update' : 'Create'}
      cancelLabel="Cancel"
      isLoading={loading}
      onSubmit={handleSubmit}
      onCancel={handleClose}
    >
      {/* Bed Number */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Bed Number <Text style={{ color: Theme.colors.danger }}>*</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: Theme.colors.primary + '15',
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderWidth: 1,
              borderColor: errors.bed_no ? Theme.colors.danger : Theme.colors.border,
              borderRightWidth: 0,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
              BED
            </Text>
          </View>
          <TextInput
            value={formData.bed_no.substring(3)}
            onChangeText={(value) => updateField('bed_no', value)}
            placeholder="1, 2, 101"
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: errors.bed_no ? Theme.colors.danger : Theme.colors.border,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderLeftWidth: 0,
              padding: 12,
              fontSize: 14,
              backgroundColor: '#fff',
            }}
          />
        </View>
        {errors.bed_no && (
          <Text style={{ fontSize: 11, color: Theme.colors.danger, marginTop: 4 }}>
            {errors.bed_no}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 4 }}>
          Bed number will be: {formData.bed_no || 'BED___'}
        </Text>
      </View>

      {/* Bed Price */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Bed Price <Text style={{ color: Theme.colors.danger }}>*</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: Theme.colors.primary + '15',
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderWidth: 1,
              borderColor: errors.bed_price ? Theme.colors.danger : Theme.colors.border,
              borderRightWidth: 0,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
              ₹
            </Text>
          </View>
          <TextInput
            value={formData.bed_price}
            onChangeText={(value) => updateField('bed_price', value)}
            placeholder="0.00"
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: errors.bed_price ? Theme.colors.danger : Theme.colors.border,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderLeftWidth: 0,
              padding: 12,
              fontSize: 14,
              backgroundColor: '#fff',
            }}
          />
        </View>
        {errors.bed_price && (
          <Text style={{ fontSize: 11, color: Theme.colors.danger, marginTop: 4 }}>
            {errors.bed_price}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 4 }}>
          Individual bed price (overrides room price if set)
        </Text>
      </View>

      {/* Bed Images */}
      <View style={{ marginBottom: 20 }}>
        <ImageUploadS3
          images={formData.images}
          onImagesChange={(images: string[]) => setFormData((prev) => ({ ...prev, images }))}
          maxImages={3}
          label="Bed Images (Optional)"
          disabled={loading}
          folder={getFolderConfig().beds.images}
          useS3={true}
          entityId={bed?.s_no?.toString()}
        />
      </View>
    </SlideBottomModal>
  );
};
