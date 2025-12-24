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
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import {
  useGetAllBedsQuery,
  useGetBedsByRoomIdQuery,
  useGetAllRoomsQuery,
  useDeleteBedMutation,
  Room,
  Bed,
} from '../../services/api/roomsApi';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { BedFormModal } from './BedFormModal';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { Ionicons } from '@expo/vector-icons';
import { showErrorAlert } from '../../utils/errorHandler';
import { CONTENT_COLOR } from '@/constant';

interface BedsScreenProps {
  navigation: any;
}

export const BedsScreen: React.FC<BedsScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state?.pgLocations);
  const { user } = useSelector((state: RootState) => state?.auth);

  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<any>(null);

  // Filters
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [occupancyFilter, setOccupancyFilter] = useState<'all' | 'occupied' | 'available'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [draftSelectedRoomId, setDraftSelectedRoomId] = useState<number | null>(null);
  const [draftOccupancyFilter, setDraftOccupancyFilter] = useState<'all' | 'occupied' | 'available'>('all');

  // Modal
  const [bedModalVisible, setBedModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const [appliedSearch, setAppliedSearch] = useState('');

  const {
    data: roomsResponse,
    isFetching: isRoomsFetching,
  } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? {
          pg_id: selectedPGLocationId,
          limit: 100,
        }
      : (undefined as any),
    { skip: !selectedPGLocationId }
  );

  const {
    data: bedsAllResponse,
    refetch: refetchAllBeds,
    isFetching: isBedsAllFetching,
  } = useGetAllBedsQuery(
    selectedPGLocationId
      ? {
          limit: 100,
          search: appliedSearch || undefined,
        }
      : (undefined as any),
    { skip: !selectedPGLocationId || !!selectedRoomId }
  );

  const {
    data: bedsByRoomResponse,
    refetch: refetchBedsByRoom,
    isFetching: isBedsByRoomFetching,
  } = useGetBedsByRoomIdQuery(selectedRoomId as number, {
    skip: !selectedPGLocationId || !selectedRoomId,
  });

  const [deleteBedMutation] = useDeleteBedMutation();

  // Track if this is the first mount to load data
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    // Keep local list in sync with RTK responses while applying client-side occupancy filter
    const response = selectedRoomId ? bedsByRoomResponse : bedsAllResponse;
    const incomingBeds = (response as any)?.data || [];

    let filteredBeds = incomingBeds as Bed[];
    if (occupancyFilter === 'occupied') {
      filteredBeds = filteredBeds.filter((bed) => bed.is_occupied);
    } else if (occupancyFilter === 'available') {
      filteredBeds = filteredBeds.filter((bed) => !bed.is_occupied);
    }

    setBeds(filteredBeds);
    setPagination((response as any)?.pagination || undefined);
  }, [bedsAllResponse, bedsByRoomResponse, selectedRoomId, occupancyFilter]);

  // Refetch beds when screen is focused (navigating back from another screen)
  useFocusEffect(
    React.useCallback(() => {
      // Don't refetch on focus - only load on PG location/room change
      return () => {
        // Cleanup if needed
      };
    }, [selectedPGLocationId, selectedRoomId])
  );

  useEffect(() => {
    setRooms(((roomsResponse as any)?.data || []) as Room[]);
  }, [roomsResponse]);

  useEffect(() => {
    if (!showFilters) return;
    setDraftSelectedRoomId(selectedRoomId);
    setDraftOccupancyFilter(occupancyFilter);
  }, [showFilters, selectedRoomId, occupancyFilter]);

  useEffect(() => {
    const nextLoading = !!selectedPGLocationId && (isRoomsFetching || isBedsAllFetching || isBedsByRoomFetching);
    setLoading(nextLoading);
  }, [isRoomsFetching, isBedsAllFetching, isBedsByRoomFetching, selectedPGLocationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedRoomId) {
        await refetchBedsByRoom();
      } else {
        await refetchAllBeds();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedPGLocationId || !searchQuery.trim()) return;

    setAppliedSearch(searchQuery.trim());
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
          // Optimistically remove from local state without refetching
          setBeds(prev => prev.filter(bed => bed.s_no !== bedId));
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
        }
      },
    });
  };

  const handleBedFormSuccess = async () => {
    if (selectedRoomId) {
      await refetchBedsByRoom();
    } else {
      await refetchAllBeds();
    }
  };

  const applyFilters = () => {
    if (!selectedPGLocationId) {
      setShowFilters(false);
      return;
    }

    const nextRoomId = draftSelectedRoomId;
    const nextOccupancy = draftOccupancyFilter;

    setSelectedRoomId(nextRoomId);
    setOccupancyFilter(nextOccupancy);

    setTimeout(() => {
      if (nextRoomId) {
        refetchBedsByRoom();
      } else {
        refetchAllBeds();
      }
    }, 0);
  };

  const clearFilters = () => {
    setDraftSelectedRoomId(null);
    setDraftOccupancyFilter('all');
    setSelectedRoomId(null);
    setOccupancyFilter('all');
    setSearchQuery('');
    setAppliedSearch('');
    setShowFilters(false);

    if (selectedPGLocationId) {
      // Ensure the query is no longer skipped (selectedRoomId cleared) before refetching
      setTimeout(() => {
        refetchAllBeds();
      }, 0);
    }
  };

  const getFilterCount = () => {
    let count = 0;
    if (selectedRoomId) count++;
    if (occupancyFilter !== 'all') count++;
    return count;
  };

  const renderBedCard = ({ item }: { item: Bed }) => (
    <Card
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        marginTop: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: item.is_occupied ? '#FEE2E2' : '#D1FAE5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="bed" size={18} color={item.is_occupied ? '#DC2626' : '#16A34A'} />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>{item.bed_no}</Text>
            <Text style={{ fontSize: 12, color: item.is_occupied ? '#DC2626' : '#16A34A', marginTop: 2 }}>
              {item.is_occupied ? 'Occupied' : 'Available'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {!item.is_occupied && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddTenant', { bed_id: item.s_no, room_id: item.room_id })}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#10B981',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Add Tenant</Text>
            </TouchableOpacity>
          )}
          <ActionButtons
            onEdit={() => handleEditBed(item)}
            onDelete={() => handleDeleteBed(item.s_no, item.bed_no)}
            onView={() => item.is_occupied && item.tenants?.[0]?.s_no && navigation.navigate('TenantDetails', { tenantId: item.tenants[0].s_no })}
            showEdit
            showDelete
            showView={!!(item.is_occupied && item.tenants?.[0]?.s_no)}
            containerStyle={{ gap: 6 }}
          />
        </View>
      </View>

      <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>Room</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
            {item.rooms?.room_no || 'N/A'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>Price</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.primary }}>
            {item.bed_price ? `₹${item.bed_price.toLocaleString('en-IN')}` : 'Unassigned'}
          </Text>
        </View>
      </View>
      {item.is_occupied && item.tenants?.[0]?.name && (
        <View style={{ 
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6
        }}>
          <Ionicons name="person" size={14} color="#F59E0B" />
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>Occupant:</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
            {item.tenants[0].name}
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        onBackPress={() => navigation.goBack()}
        showBackButton
        title="Beds"
        subtitle={`${pagination?.total || 0} total`}
      />
      {/* Search and Filter Bar */}
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Theme.colors.background.secondary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
            }}
            placeholder="Search by bed number..."
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
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: getFilterCount() > 0 ? Theme.colors.primary : Theme.colors.light,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="filter" size={18} color={getFilterCount() > 0 ? '#fff' : Theme.colors.text.primary} />
            {getFilterCount() > 0 && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary }}>
                  {getFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>


        {/* Filter Modal Overlay */}
        <Modal
          visible={showFilters}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilters(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowFilters(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  maxHeight: SCREEN_HEIGHT * 0.7,
                }}
              >
                {/* Handle Bar */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: Theme.colors.border,
                      borderRadius: 2,
                    }}
                  />
                </View>

                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: Theme.colors.border,
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary }}>
                      Filter Beds
                    </Text>
                    {getFilterCount() > 0 && (
                      <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 2 }}>
                        {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} active
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowFilters(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: Theme.colors.light,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={20} color={Theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Filter Content */}
                <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }} contentContainerStyle={{ padding: 20 }}>
                  {/* Room Filter */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                      Filter by Room
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setDraftSelectedRoomId(null)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: draftSelectedRoomId === null ? Theme.colors.primary : '#fff',
                          borderWidth: 1,
                          borderColor: draftSelectedRoomId === null ? Theme.colors.primary : Theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: draftSelectedRoomId === null ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          All Rooms
                        </Text>
                      </TouchableOpacity>
                      {rooms.map((room) => (
                        <TouchableOpacity
                          key={room.s_no}
                          onPress={() => setDraftSelectedRoomId(room.s_no)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: draftSelectedRoomId === room.s_no ? Theme.colors.primary : '#fff',
                            borderWidth: 1,
                            borderColor: draftSelectedRoomId === room.s_no ? Theme.colors.primary : Theme.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: draftSelectedRoomId === room.s_no ? '#fff' : Theme.colors.text.secondary,
                            }}
                          >
                            {room.room_no}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
                      Filter by Status
                    </Text>
                    <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 12 }}>
                      Select one status filter (mutually exclusive)
                    </Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setDraftOccupancyFilter('all')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: draftOccupancyFilter === 'all' ? Theme.colors.primary : '#fff',
                          borderWidth: 1,
                          borderColor: draftOccupancyFilter === 'all' ? Theme.colors.primary : Theme.colors.border,
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name={draftOccupancyFilter === 'all' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={draftOccupancyFilter === 'all' ? '#fff' : Theme.colors.text.secondary}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: draftOccupancyFilter === 'all' ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          All
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setDraftOccupancyFilter('available')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: draftOccupancyFilter === 'available' ? '#16A34A' : '#fff',
                          borderWidth: 1,
                          borderColor: draftOccupancyFilter === 'available' ? '#16A34A' : Theme.colors.border,
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name={draftOccupancyFilter === 'available' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={draftOccupancyFilter === 'available' ? '#fff' : Theme.colors.text.secondary}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: draftOccupancyFilter === 'available' ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          🟢 Available
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setDraftOccupancyFilter('occupied')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: draftOccupancyFilter === 'occupied' ? '#DC2626' : '#fff',
                          borderWidth: 1,
                          borderColor: draftOccupancyFilter === 'occupied' ? '#DC2626' : Theme.colors.border,
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name={draftOccupancyFilter === 'occupied' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={draftOccupancyFilter === 'occupied' ? '#fff' : Theme.colors.text.secondary}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: draftOccupancyFilter === 'occupied' ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          🔴 Occupied
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    padding: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: Theme.colors.border,
                  }}
                >
                  {getFilterCount() > 0 && (
                    <TouchableOpacity
                      onPress={clearFilters}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: Theme.colors.light,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                        Clear Filters
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      applyFilters();
                      setShowFilters(false);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: Theme.colors.primary,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                      Apply Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {loading && !refreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 12, color: Theme.colors.text.secondary }}>Loading beds...</Text>
          </View>
        ) : beds.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Ionicons name="bed-outline" size={64} color={Theme.colors.text.tertiary} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 16, marginBottom: 8 }}>
              No Beds Found
            </Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
              {getFilterCount() > 0 ? 'Try adjusting your filters' : 'Add your first bed to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={beds}
            renderItem={renderBedCard}
            keyExtractor={(item) => item.s_no.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}

        {/* Bed Form Modal - Only for editing */}
        <BedFormModal
          visible={bedModalVisible}
          onClose={() => setBedModalVisible(false)}
          onSuccess={handleBedFormSuccess}
          roomId={selectedBed?.room_id || 0}
          roomNo={selectedBed?.rooms?.room_no || ''}
          bed={selectedBed}
          pgId={selectedPGLocationId || undefined}
          organizationId={user?.organization_id}
          userId={user?.s_no}
        />
      </View>
    </ScreenLayout>
  );
};
