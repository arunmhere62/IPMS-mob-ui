import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  useGetRoomByIdQuery,
  useDeleteRoomMutation,
  useGetBedsByRoomIdQuery,
  useDeleteBedMutation,
  Room,
  Bed,
} from '../../services/api/roomsApi';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { BedFormModal } from '../beds/BedFormModal';
import { RoomFormModal } from './CreateEditRoomModal';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';

interface RoomDetailsScreenProps {
  navigation: any;
  route: any;
}

export const RoomDetailsScreen: React.FC<RoomDetailsScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [room, setRoom] = useState<Room | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bedModalVisible, setBedModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [roomEditModalVisible, setRoomEditModalVisible] = useState(false);

  const {
    data: roomResponse,
    refetch: refetchRoom,
    isFetching: isRoomFetching,
    isError: isRoomError,
  } = useGetRoomByIdQuery(roomId, { skip: !selectedPGLocationId });

  const {
    data: bedsResponse,
    refetch: refetchBeds,
    isFetching: isBedsFetching,
  } = useGetBedsByRoomIdQuery(roomId, { skip: !selectedPGLocationId });

  const [deleteRoomMutation] = useDeleteRoomMutation();
  const [deleteBedMutation] = useDeleteBedMutation();

  useEffect(() => {
    setRoom(((roomResponse as any)?.data || null) as Room | null);
  }, [roomResponse]);

  useEffect(() => {
    setBeds((((bedsResponse as any)?.data || []) as Bed[]) || []);
  }, [bedsResponse]);

  useEffect(() => {
    const nextLoading = !selectedPGLocationId ? true : isRoomFetching || isBedsFetching;
    setLoading(nextLoading);
  }, [isRoomFetching, isBedsFetching, selectedPGLocationId]);

  useEffect(() => {
    if (isRoomError) {
      Alert.alert('Error', 'Failed to load room details');
      navigation.goBack();
    }
  }, [isRoomError, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchRoom();
      await refetchBeds();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddBed = () => {
    setSelectedBed(null);
    setBedModalVisible(true);
  };

  const handleEditBed = (bed: Bed) => {
    setSelectedBed(bed);
    setBedModalVisible(true);
  };

  const handleDeleteBed = (bedId: number, bedNo: string) => {
    showDeleteConfirmation({
      title: 'Delete Bed',
      message: 'Are you sure you want to delete',
      itemName: bedNo,
      onConfirm: async () => {
        try {
          await deleteBedMutation(bedId).unwrap();
          Alert.alert('Success', 'Bed deleted successfully');
          await refetchBeds();
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to delete bed');
        }
      },
    });
  };

  const handleBedFormSuccess = async () => {
    await refetchBeds();
    await refetchRoom();
  };

  const handleEdit = () => {
    setRoomEditModalVisible(true);
  };

  const handleRoomEditSuccess = async () => {
    setRoomEditModalVisible(false);
    await refetchRoom();
    await refetchBeds();
  };

  const handleDelete = () => {
    showDeleteConfirmation({
      title: 'Delete Room',
      message: 'Are you sure you want to delete Room',
      itemName: room?.room_no,
      onConfirm: async () => {
        try {
          await deleteRoomMutation(roomId).unwrap();
          Alert.alert('Success', 'Room deleted successfully');
          navigation.goBack();
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to delete room');
        }
      },
    });
  };

  if (loading) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Room Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
              Loading room details...
            </Text>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  if (!room) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Room Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏠</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary }}>
              Room Not Found
            </Text>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={`Room ${room.room_no}`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

     <View style ={{flex : 1, backgroundColor : CONTENT_COLOR}} >
       <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header Card */}
        <Card
          style={{
            marginHorizontal: 12,
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            backgroundColor: '#fff',
            shadowColor: '#00000015',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: Theme.colors.primary + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🏠</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Room {room.room_no}
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>ID: {room.s_no}</Text>
              </View>
            </View>
            <ActionButtons
              onEdit={handleEdit}
              onDelete={handleDelete}
              showEdit
              showDelete
              showView={false}
              containerStyle={{ gap: 6 }}
            />
          </View>
        </Card>

        {/* Room Images */}
        <Card style={{ margin: 16, padding: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            📷 Room Images {room.images && Array.isArray(room.images) ? `(${room.images.length})` : ''}
          </Text>
          {room.images && Array.isArray(room.images) && room.images.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={212}
              snapToAlignment="start"
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {room.images.map((imageUri: string, index: number) => (
                <View
                  key={index}
                  style={{
                    width: 200,
                    height: 150,
                    marginRight: 12,
                    borderRadius: 12,
                    overflow: 'hidden',
                    ...Theme.colors.shadows.small,
                  }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 12,
                    }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                      {index + 1} / {room.images.length}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No images present for this room
              </Text>
            </View>
          )}
        </Card>

        {/* Room Stats */}
        <Card style={{ marginHorizontal: 16, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, fontWeight: '600' }}>TOTAL</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginTop: 2 }}>
                {beds.length}
              </Text>
            </View>

            <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }}>AVAILABLE</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#059669', marginTop: 2 }}>
                {beds.filter((b) => !b.is_occupied).length}
              </Text>
            </View>

            <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>OCCUPIED</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626', marginTop: 2 }}>
                {beds.filter((b) => b.is_occupied).length}
              </Text>
            </View>
          </View>
        </Card>

        {/* PG Location Info */}
        {room.pg_locations && (
          <Card style={{ margin: 16, marginTop: 0, padding: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: Theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              📍 PG Location
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
              {room.pg_locations.location_name}
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginTop: 4 }}>
              Location ID: {room.pg_locations.s_no}
            </Text>
          </Card>
        )}

        {/* Beds List */}
        <Card style={{ margin: 16, marginTop: 0, padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
              🛏️ Beds ({beds.length})
            </Text>
            <TouchableOpacity
              onPress={handleAddBed}
              style={{
                backgroundColor: Theme.colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Add Bed</Text>
            </TouchableOpacity>
          </View>

          {beds && beds.length > 0 ? (
            <View style={{ gap: 8 }}>
              {beds.map((bed, index) => (
                <View
                  key={bed.s_no}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Theme.colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: bed.is_occupied ? '#FEE2E2' : '#D1FAE5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🛏️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {bed.bed_no}
                      </Text>
                      {bed.bed_price ? (
                        <Text style={{ fontSize: 12, color: Theme.colors.primary, fontWeight: '600', marginTop: 2 }}>
                          ₹{bed.bed_price.toLocaleString('en-IN')}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 2 }}>
                          No price set
                        </Text>
                      )}
                      {bed.is_occupied && bed.tenants && bed.tenants.length > 0 ? (
                        <View>
                          <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600', marginTop: 2 }}>
                            🔴 Occupied
                          </Text>
                          <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginTop: 2 }}>
                            {bed.tenants[0].name}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600', marginTop: 2 }}>
                          🟢 Available
                        </Text>
                      )}
                    </View>
                  </View>
                  <ActionButtons
                    onEdit={() => handleEditBed(bed)}
                    onDelete={() => handleDeleteBed(bed.s_no, bed.bed_no)}
                    showEdit={true}
                    showDelete={true}
                    showView={false}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🛏️</Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                No beds added yet. Tap "Add Bed" to create one.
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
     </View>

      {/* Bed Form Modal */}
      <BedFormModal
        visible={bedModalVisible}
        onClose={() => setBedModalVisible(false)}
        onSuccess={handleBedFormSuccess}
        roomId={room?.s_no || roomId}
        roomNo={room?.room_no || ''}
        bed={selectedBed}
        pgId={selectedPGLocationId || undefined}
        organizationId={undefined}
        userId={undefined}
      />

      {/* Room Form Modal */}
      <RoomFormModal
        visible={roomEditModalVisible}
        roomId={roomId}
        onClose={() => setRoomEditModalVisible(false)}
        onSuccess={handleRoomEditSuccess}
      />
    </ScreenLayout>
  );
};
