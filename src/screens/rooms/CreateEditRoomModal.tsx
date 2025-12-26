import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CreateRoomDto, useCreateRoomMutation, useGetRoomByIdQuery, useUpdateRoomMutation } from '../../services/api/roomsApi';
import { Theme } from '../../theme';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { getFolderConfig } from '../../config/aws.config';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface RoomModalProps {
  visible: boolean;
  roomId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  visible,
  roomId,
  onClose,
  onSuccess,
}) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();

  const canCreateRoom = can(Permission.CREATE_ROOM);
  const canEditRoom = can(Permission.EDIT_ROOM);

  const { data: roomResponse, isFetching: isRoomFetching, isError: isRoomError } = useGetRoomByIdQuery(roomId as number, {
    skip: !visible || !roomId,
  });

  const [createRoomMutation] = useCreateRoomMutation();
  const [updateRoomMutation] = useUpdateRoomMutation();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    room_no: 'RM',
    images: [] as string[],
  });
  const [originalImages, setOriginalImages] = useState<string[]>([]); // Track original images for cleanup
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    if (!roomId) {
      setFormData({ room_no: 'RM', images: [] });
      setOriginalImages([]);
      setErrors({});
      return;
    }

    setLoadingData(isRoomFetching);

    const roomData = (roomResponse as any)?.data;
    if (roomData) {
      const roomImages = roomData.images || [];
      setFormData({
        room_no: roomData.room_no,
        images: roomImages,
      });
      setOriginalImages([...roomImages]);
    }
  }, [visible, roomId, roomResponse, isRoomFetching]);

  useEffect(() => {
    if (visible && roomId && isRoomError) {
      Alert.alert('Error', 'Failed to load room data');
      onClose();
    }
  }, [visible, roomId, isRoomError, onClose]);

  const updateField = (field: string, value: string): void => {
    // Special handling for room_no to maintain RM prefix
    if (field === 'room_no') {
      // If user tries to delete RM prefix, restore it
      if (!value.startsWith('RM')) {
        value = 'RM' + value.replace(/^RM/i, '');
      }
      // Ensure RM is uppercase
      if (value.length >= 2) {
        value = 'RM' + value.substring(2);
      }
    }

    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.room_no.trim() || formData.room_no.trim() === 'RM') {
      newErrors.room_no = 'Room number is required (e.g., RM101, RM-A1)';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save images to database when they change
  const handleAutoSaveImages = async (images: string[]): Promise<void> => {
    if (!roomId || !selectedPGLocationId) {
      throw new Error('Room ID or PG Location ID not available');
    }

    const roomData = {
      pg_id: selectedPGLocationId,
      room_no: formData.room_no.trim(),
      images: images, // Always send the images array, even if empty
    };

    await updateRoomMutation({ id: roomId, data: roomData as Partial<CreateRoomDto> }).unwrap();
  };


  const handleSubmit = async (): Promise<void> => {
    if (roomId && !canEditRoom) {
      Alert.alert('Access Denied', "You don't have permission to edit rooms");
      return;
    }
    if (!roomId && !canCreateRoom) {
      Alert.alert('Access Denied', "You don't have permission to create rooms");
      return;
    }
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

      const roomData = {
        pg_id: selectedPGLocationId,
        room_no: formData.room_no.trim(),
        images: formData.images, // Always send the images array, even if empty
      };

      if (roomId) {
        const res = await updateRoomMutation({ id: roomId, data: roomData as Partial<CreateRoomDto> }).unwrap();
        showSuccessAlert(res);
      } else {
        const res = await createRoomMutation(roomData as unknown as CreateRoomDto).unwrap();
        showSuccessAlert(res);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      showErrorAlert(error, 'Room Error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (): Promise<void> => {
    setFormData({
      room_no: 'RM',
      images: [],
    });
    setOriginalImages([]);
    setErrors({});
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={roomId ? 'Edit Room' : 'Add Room'}
      subtitle={roomId ? 'Update room details' : 'Create a new room'}
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel={roomId ? 'Update Room' : 'Create Room'}
      cancelLabel="Cancel"
      isLoading={loading}
    >
      {loadingData ? (
        <View style={{ padding: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
            Loading room data...
          </Text>
        </View>
      ) : (
        <View>
          {/* Room Number */}
          <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: Theme.colors.text.primary,
                      marginBottom: 6,
                    }}
                  >
                    Room Number <Text style={{ color: '#EF4444' }}>*</Text>
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
                        borderColor: errors.room_no ? '#EF4444' : '#E5E7EB',
                        borderRightWidth: 0,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
                        RM
                      </Text>
                    </View>
                    <TextInput
                      value={formData.room_no.substring(2)}
                      onChangeText={(value) => updateField('room_no', 'RM' + value)}
                      placeholder="101, A1, Ground-1"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: errors.room_no ? '#EF4444' : '#E5E7EB',
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                        borderLeftWidth: 0,
                        padding: 12,
                        fontSize: 14,
                        backgroundColor: '#fff',
                      }}
                    />
                  </View>
                  {errors.room_no && (
                    <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                      {errors.room_no}
                    </Text>
                  )}
                  <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginTop: 4 }}>
                    Room number will be: {formData.room_no || 'RM___'}
                  </Text>
                </View>

                {/* Room Images */}
                <View style={{ marginBottom: 16 }}>
                  <ImageUploadS3
                    images={formData.images}
                    onImagesChange={(images: string[]) => setFormData((prev) => ({ ...prev, images }))}
                    maxImages={5}
                    label="Room Images"
                    disabled={loading}
                    folder={getFolderConfig().rooms.images}
                    useS3={true}
                    entityId={roomId?.toString()}
                    autoSave={false} // Disable auto-save - only update on manual save
                    onAutoSave={handleAutoSaveImages}
                  />
                </View>

                {/* Info Card */}
                <View
                  style={{
                    padding: 12,
                    backgroundColor: '#EFF6FF',
                    borderLeftWidth: 3,
                    borderLeftColor: '#3B82F6',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <View  style={{ flexDirection: 'row', alignItems: 'flex-start'  }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>💡</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#1E40AF',
                          marginBottom: 2,
                        }}
                      >
                        Quick Tip
                      </Text>
                      <Text style={{ fontSize: 11, color: '#1E3A8A', lineHeight: 16 }}>
                        You can manage beds for this room from the room details screen.
                      </Text>
                    </View>
                  </View>
          </View>
        </View>
      )}
    </SlideBottomModal>
  );
};

// Export aliases for backward compatibility
export const EditRoomModal = RoomModal;
export const RoomFormModal = RoomModal;
