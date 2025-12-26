import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { AnimatedButton } from '../../components/AnimatedButton';
import { ActionButtons } from '../../components/ActionButtons';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { useDeletePGLocationMutation, useGetPGLocationDetailsQuery } from '../../services/api/pgLocationsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface PGDetailsScreenProps {
  navigation: any;
}

interface PGDetails {
  s_no: number;
  location_name: string;
  address: string;
  pincode: string;
  status: string;
  rent_cycle_type: string;
  rent_cycle_start: number | null;
  rent_cycle_end: number | null;
  pg_type: string;
  images: string[];
  city: {
    s_no: number;
    name: string;
  };
  state: {
    s_no: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  room_statistics: {
    total_rooms: number;
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    occupancy_rate: number;
    total_monthly_revenue: number;
  };
  tenant_statistics: {
    total_tenants: number;
    active_tenants: number;
    inactive_tenants: number;
    occupancy_rate: number;
  };
  room_details: Array<{
    s_no: number;
    room_no: string;
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    occupancy_rate: number;
    beds: Array<{
      s_no: number;
      bed_no: string;
      price: string;
      is_occupied: boolean;
      tenant: {
        name: string;
        phone_no: string;
        check_in_date: string;
        check_out_date: string;
      } | null;
      latest_payment: {
        amount_paid: string;
        payment_date: string;
        start_date: string;
        end_date: string;
        actual_rent_amount: string;
      } | null;
    }>;
  }>;
  tenant_details: Array<{
    s_no: number;
    name: string;
    phone_no: string;
    status: string;
    check_in_date: string;
    check_out_date: string;
    created_at: string;
  }>;
}

const StatCard = ({ label, value, color = Theme.colors.primary, size = 'medium' }: { 
  label: string; 
  value: number | string; 
  color?: string;
  size?: 'small' | 'medium';
}) => (
  <View style={{ 
    flex: 1, 
    padding: size === 'small' ? 8 : 12, 
    backgroundColor: '#fff', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center'
  }}>
    <Text style={{ 
      fontSize: size === 'small' ? 10 : 11, 
      color: Theme.colors.text.secondary, 
      marginBottom: 2, 
      fontWeight: '500' 
    }}>
      {label}
    </Text>
    <Text style={{ 
      fontSize: size === 'small' ? 16 : 20, 
      fontWeight: '700', 
      color: color 
    }}>
      {value}
    </Text>
  </View>
);

const RoomSummaryCard = ({ room }: { room: PGDetails['room_details'][0] }) => (
  <View style={{ 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 8
  }}>
    {/* Room Info */}
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
        {room.room_no}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: room.available_beds > 0 ? '#10B981' : '#EF4444',
            marginRight: 4
          }} />
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            {room.occupied_beds}/{room.total_beds} beds
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
          {room.occupancy_rate.toFixed(0)}% occupied
        </Text>
      </View>
    </View>
    
    {/* Quick Actions */}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
          ₹{room.beds.reduce((sum, bed) => sum + Number(bed.price), 0).toLocaleString('en-IN')}
        </Text>
        <Text style={{ fontSize: 10, color: Theme.colors.text.secondary }}>
          {room.available_beds} free
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Theme.colors.text.secondary} />
    </View>
  </View>
);

const RoomCard = ({ room }: { room: PGDetails['room_details'][0] }) => (
  <View style={{ 
    marginBottom: 12, 
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12
  }}>
    {/* Room Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Theme.colors.text.primary }}>
        {room.room_no}
      </Text>
      <View style={{ 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        backgroundColor: room.occupancy_rate > 75 ? '#10B981' : room.occupancy_rate > 50 ? '#F59E0B' : '#EF4444',
        borderRadius: 8
      }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff' }}>
          {room.occupancy_rate.toFixed(0)}%
        </Text>
      </View>
    </View>
    
    {/* Compact Stats Row */}
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
      <StatCard label="Beds" value={`${room.occupied_beds}/${room.total_beds}`} color={Theme.colors.text.secondary} size="small" />
      <StatCard label="Free" value={room.available_beds} color="#3B82F6" size="small" />
    </View>

    {/* Beds List - Compact */}
    {room.beds.length > 0 && (
      <View style={{ borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Beds ({room.beds.length})
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {room.beds.map(bed => (
            <View key={bed.s_no} style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: bed.is_occupied ? '#FEF2F2' : '#F0FDF4',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: bed.is_occupied ? '#FECACA' : '#BBF7D0',
              minWidth: 80
            }}>
              <View style={{ 
                width: 6, 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: bed.is_occupied ? '#EF4444' : '#10B981',
                marginRight: 6
              }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {bed.bed_no}
                </Text>
                <Text style={{ fontSize: 10, color: Theme.colors.primary, fontWeight: '500' }}>
                  ₹{bed.price}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    )}
  </View>
);


export const PGDetailsScreen: React.FC<PGDetailsScreenProps> = ({ navigation }) => {
  const route = useRoute();
  const { pgId } = route.params as { pgId: number };

  const { can } = usePermissions();
  const canEdit = can(Permission.EDIT_PG_LOCATION);
  const canDelete = can(Permission.DELETE_PG_LOCATION);
  const [deletePGLocation] = useDeletePGLocationMutation();

  const [refreshing, setRefreshing] = useState(false);
  const [pgDetails, setPgDetails] = useState<PGDetails | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);

  const {
    data: pgDetailsResponse,
    isFetching,
    error,
    refetch,
  } = useGetPGLocationDetailsQuery(pgId);

  useEffect(() => {
    if ((pgDetailsResponse as any)?.success && (pgDetailsResponse as any)?.data) {
      const responseData = (pgDetailsResponse as any).data;
      const pgData = responseData?.data || responseData;
      setPgDetails(pgData);
    }

    if (error) {
      Alert.alert('Error', 'Failed to load PG details');
    }
  }, [pgDetailsResponse, error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter rooms based on search query
  const filteredRooms = pgDetails?.room_details?.filter(room => 
    room.room_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.beds.some(bed => bed.bed_no.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Toggle room expansion
  const toggleRoomExpansion = (roomId: number) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
  };

  const handleEditPG = () => {
    if (!canEdit) {
      Alert.alert('Access Denied', "You don't have permission to edit PG locations");
      return;
    }
    navigation.navigate('PGLocations', { editPgId: pgId });
  };

  const handleDeletePG = () => {
    if (!canDelete) {
      Alert.alert('Access Denied', "You don't have permission to delete PG locations");
      return;
    }
    showDeleteConfirmation({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete',
      itemName: pgDetails?.location_name ?? 'this PG',
      onConfirm: async () => {
        try {
          await deletePGLocation(pgId).unwrap();
          showSuccessAlert('PG location deleted successfully');
          navigation.goBack();
        } catch (e: any) {
          showErrorAlert(e, 'Delete Error');
        }
      },
    });
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="PG Details"
        subtitle="Overview and statistics"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      <View style={{ flex: 1, backgroundColor: Theme.colors.light }}>
        {isFetching ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
              Loading PG details...
            </Text>
          </View>
        ) : pgDetails ? (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Image Gallery */}
            {pgDetails.images && pgDetails.images.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  pagingEnabled
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                >
                  {pgDetails.images.map((image, index) => (
                    <Card 
                      key={index} 
                      style={{
                        width: 300,
                        height: 200,
                        marginRight: 10,
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                      }}
                    >
                      <Image
                        source={{ uri: image }}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          resizeMode: 'cover',
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                          borderBottomLeftRadius: 12,
                          borderBottomRightRadius: 12,
                        }}
                      />
                    </Card>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                <Card style={{
                  width: '100%',
                  height: 200,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                }}>
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', fontWeight: '500' }}>
                    No Image
                  </Text>
                </Card>
              </View>
            )}

            {/* PG Location Header */}
            <Card style={{ padding: 16, marginBottom: 16, backgroundColor: '#fff' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
                    {pgDetails.location_name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      backgroundColor: pgDetails.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: pgDetails.status === 'ACTIVE' ? '#166534' : '#991B1B',
                      }}>
                        {pgDetails.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <ActionButtons
                  onEdit={handleEditPG}
                  onDelete={handleDeletePG}
                  showView={false}
                  showEdit={true}
                  showDelete={true}
                  disableEdit={!canEdit}
                  disableDelete={!canDelete}
                  blockPressWhenDisabled
                />
              </View>

              {/* Location Info */}
              <View style={{ marginBottom: 12 }}>
                {pgDetails.city && pgDetails.state && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="location" size={16} color={Theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, color: Theme.colors.text.primary, fontWeight: '500' }}>
                      {pgDetails.city.name}, {pgDetails.state.name}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="home" size={16} color={Theme.colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={{ fontSize: 13, color: Theme.colors.text.primary, flex: 1 }}>
                    {pgDetails.address}
                  </Text>
                </View>
                {pgDetails.pincode && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Ionicons name="pin" size={16} color={Theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, color: Theme.colors.text.primary }}>
                      {pgDetails.pincode}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* PG Details */}
            <Card style={{ padding: 16, marginBottom: 16, backgroundColor: '#fff' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                PG Information
              </Text>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>PG Type</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {pgDetails.pg_type === 'COLIVING' ? '👥 Co-living' : pgDetails.pg_type === 'MENS' ? '👨 Mens' : '👩 Womens'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>Rent Cycle</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {pgDetails.rent_cycle_type}
                  </Text>
                </View>
                {pgDetails.rent_cycle_type === 'MIDMONTH' && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>Cycle Start</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {pgDetails.rent_cycle_start || 'N/A'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>Cycle End</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {pgDetails.rent_cycle_end || 'N/A'}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* Room Statistics Overview */}
            <View style={{ 
              marginBottom: 16, 
              backgroundColor: '#fff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Theme.colors.border,
              padding: 16
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                Overview
              </Text>
              
              {/* Main Stats */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <StatCard label="Rooms" value={pgDetails.room_statistics.total_rooms} color={Theme.colors.text.secondary} size="small" />
                <StatCard label="Beds" value={pgDetails.room_statistics.total_beds} color={Theme.colors.text.secondary} size="small" />
                <StatCard label="Tenants" value={pgDetails.tenant_statistics.total_tenants} color={Theme.colors.text.secondary} size="small" />
              </View>
              
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <StatCard label="Occupancy" value={`${pgDetails.room_statistics.occupancy_rate.toFixed(0)}%`} color={pgDetails.room_statistics.occupancy_rate > 75 ? '#10B981' : pgDetails.room_statistics.occupancy_rate > 50 ? '#F59E0B' : '#EF4444'} size="small" />
                <StatCard label="Active" value={pgDetails.tenant_statistics.active_tenants} color="#10B981" size="small" />
                <StatCard label="Available" value={pgDetails.room_statistics.available_beds} color="#3B82F6" size="small" />
              </View>
              
              {/* Revenue Row */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border
              }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontWeight: '500' }}>
                  Monthly Revenue
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.primary }}>
                  ₹{pgDetails.room_statistics.total_monthly_revenue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Room Details */}
            {pgDetails.room_details && pgDetails.room_details.length > 0 && (
              <View>
                {/* Room Controls */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                    Rooms ({filteredRooms.length})
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: viewMode === 'summary' ? Theme.colors.primary : '#fff',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary
                      }}
                      onPress={() => setViewMode('summary')}
                    >
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '500', 
                        color: viewMode === 'summary' ? '#fff' : Theme.colors.primary 
                      }}>
                        List
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: viewMode === 'detailed' ? Theme.colors.primary : '#fff',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary
                      }}
                      onPress={() => setViewMode('detailed')}
                    >
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '500', 
                        color: viewMode === 'detailed' ? '#fff' : Theme.colors.primary 
                      }}>
                        Detailed
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Search Bar */}
                {(pgDetails.room_details.length > 10 || searchQuery) && (
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Theme.colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 12
                  }}>
                    <Ionicons name="search" size={16} color={Theme.colors.text.secondary} />
                    <TextInput
                      style={{ 
                        flex: 1, 
                        marginLeft: 8, 
                        fontSize: 14, 
                        color: Theme.colors.text.primary 
                      }}
                      placeholder="Search room or bed..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={Theme.colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Room List */}
                {viewMode === 'summary' ? (
                  <View>
                    {filteredRooms.slice(0, 20).map(room => (
                      <TouchableOpacity key={room.s_no} onPress={() => toggleRoomExpansion(room.s_no)}>
                        <RoomSummaryCard room={room} />
                        {expandedRoom === room.s_no && (
                          <View style={{ marginTop: 8, marginLeft: 12 }}>
                            <RoomCard room={room} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    {filteredRooms.length > 20 && (
                      <TouchableOpacity
                        style={{
                          padding: 12,
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: Theme.colors.border,
                          alignItems: 'center'
                        }}
                        onPress={() => setViewMode('detailed')}
                      >
                        <Text style={{ fontSize: 14, color: Theme.colors.primary, fontWeight: '500' }}>
                          View all {filteredRooms.length} rooms →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View>
                    {filteredRooms.map(room => (
                      <RoomCard key={room.s_no} room={room} />
                    ))}
                  </View>
                )}

                {/* No Results */}
                {filteredRooms.length === 0 && searchQuery && (
                  <View style={{ 
                    padding: 20, 
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Theme.colors.border
                  }}>
                    <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
                      No rooms found for "{searchQuery}"
                    </Text>
                  </View>
                )}
              </View>
            )}

          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Theme.colors.text.secondary }}>No data available</Text>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};
