import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { Room, useDeleteRoomMutation, useGetAllRoomsQuery } from '../../services/api/roomsApi';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { RoomFormModal } from './CreateEditRoomModal';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { CONTENT_COLOR } from '@/constant';

interface RoomsScreenProps {
  navigation: any;
}

export const RoomsScreen: React.FC<RoomsScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<any>(null);

  const [appliedSearch, setAppliedSearch] = useState('');

  const {
    data: roomsResponse,
    refetch: refetchRooms,
    isFetching: isRoomsFetching,
  } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? {
          pg_id: selectedPGLocationId,
          limit: 100,
          search: appliedSearch || undefined,
        }
      : (undefined as any),
    { skip: !selectedPGLocationId }
  );

  const [deleteRoomMutation] = useDeleteRoomMutation();
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);


  // Track if this is the first mount to load data
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    setRooms(((roomsResponse as any)?.data || []) as Room[]);
    setPagination((roomsResponse as any)?.pagination || undefined);
  }, [roomsResponse]);

  useEffect(() => {
    setLoading(!!selectedPGLocationId && isRoomsFetching);
  }, [isRoomsFetching, selectedPGLocationId]);

  // Only reload rooms when PG location changes, not on every focus
  useFocusEffect(
    React.useCallback(() => {
      // Don't reload on focus - only load on PG location change
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchRooms();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedPGLocationId) return;

    setAppliedSearch(searchQuery);
  };

  const handleOpenEditModal = (roomId: number) => {
    setEditingRoomId(roomId);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingRoomId(null);
  };

  const handleEditSuccess = () => {
    refetchRooms();
  };


  const handleDeleteRoom = (roomId: number, roomNo: string) => {
    showDeleteConfirmation({
      title: 'Delete Room',
      message: 'Are you sure you want to delete Room',
      itemName: roomNo,
      onConfirm: async () => {
        try {
          // Delete room from database (backend will handle S3 image deletion)
          let response = await deleteRoomMutation(roomId).unwrap();
          
          showSuccessAlert(response)
          // Optimistically remove from local state without refetching
          setRooms(prev => prev.filter(room => room.s_no !== roomId));
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
          
        }
      },
    });
  };

  const renderRoomCard = ({ item }: { item: Room }) => (
    (() => {
      const totalBeds = item.total_beds ?? item.beds?.length ?? 0;
      const hasOccupancyFlag = (item.beds || []).some((b) => typeof (b as any)?.is_occupied === 'boolean');
      const occupiedBeds =
        typeof (item as any)?.occupied_beds === 'number'
          ? (item as any).occupied_beds
          : hasOccupancyFlag
            ? (item.beds || []).filter((b) => Boolean((b as any)?.is_occupied)).length
            : undefined;
      const availableBeds =
        typeof (item as any)?.available_beds === 'number'
          ? (item as any).available_beds
          : typeof occupiedBeds === 'number'
            ? Math.max(totalBeds - occupiedBeds, 0)
            : undefined;

      return (
    <TouchableOpacity
      onPress={() => navigation.navigate('RoomDetails', { roomId: item.s_no })}
      activeOpacity={0.8}
    >
      <Card className='' style={{ marginHorizontal: 10, marginVertical: 4, padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Theme.colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🏠</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
                {item.room_no}
              </Text>
              <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                ID: {item.s_no}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <ActionButtons
              onView={() => navigation.navigate('RoomDetails', { roomId: item.s_no })}
              onEdit={() => handleOpenEditModal(item.s_no)}
              onDelete={() => handleDeleteRoom(item.s_no, item.room_no)}
              showEdit
              showDelete
              showView
              containerStyle={{ gap: 6 }}
            />
          </View>
        </View>

        <View
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#D0D5DD',
          }}
        >
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            Total Beds: <Text style={{ fontWeight: '700', color: Theme.colors.text.primary }}>{totalBeds}</Text>
            {'  |  '}
            Available:{' '}
            <Text style={{ fontWeight: '700', color: Theme.colors.text.primary }}>
              {typeof availableBeds === 'number' ? availableBeds : '—'}
            </Text>
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 4 }}>
            {typeof occupiedBeds === 'number' && totalBeds
              ? `${Math.round((occupiedBeds / totalBeds) * 100)}% occupied`
              : 'Occupancy data pending'}
          </Text>
        </View>

        {item.pg_locations && (
          <View
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: Theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>
              📍 {item.pg_locations.location_name}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
      );
    })()
  );

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader 
        onBackPress={() => navigation.goBack()} 
        showBackButton 
        title="Rooms" 
        subtitle={`${pagination?.total || 0} total`}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Theme.colors.background.secondary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
            }}
            placeholder="Search by room number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={handleSearch}
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{flex : 1, backgroundColor : CONTENT_COLOR}}>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 12, color: Theme.colors.text.secondary }}>Loading rooms...</Text>
        </View>
      ) : rooms.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏠</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
            No Rooms Found
          </Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
            {searchQuery ? 'Try a different search term' : 'Add your first room to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.s_no.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      </View>

      <TouchableOpacity
        onPress={() => {
          setEditingRoomId(null);
          setEditModalVisible(true);
        }}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 80,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '300' }}>+</Text>
      </TouchableOpacity>

      {/* Room Form Modal */}
      <RoomFormModal
        visible={editModalVisible}
        roomId={editingRoomId}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

    </ScreenLayout>
  );
};
