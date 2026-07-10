import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import {
  useGetRoomByIdQuery,
  useDeleteRoomMutation,
  useGetBedsByRoomIdQuery,
  useDeleteBedMutation,
  Room,
  Bed,
} from '../../api/roomsApi';
import {
  useGetElectricityBillsQuery,
  ElectricityBill,
} from '../../api/electricityBillApi';
import { Card } from '../../../../components/Card';
import { ActionButtons } from '../../../../components/ActionButtons';
import { SkeletonLoader } from '../../../../components/SkeletonLoader';
import { AnimatedPressableCard } from '../../../../components/AnimatedPressableCard';
import { Theme } from '../../../../theme';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { BedFormModal } from '../beds/BedFormModal';
import { BulkAddBedsModal } from '../beds/BulkAddBedsModal';
import { RoomFormModal } from './CreateEditRoomModal';
import { showDeleteConfirmation } from '../../../../components/DeleteConfirmationDialog';
import { Ionicons } from '@expo/vector-icons';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { CONTENT_COLOR } from '@/constant';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';
import { useOnboardingTour } from '@/context/OnboardingTourContext';

interface RoomDetailsScreenProps {
  navigation: any;
  route: any;
}

export const RoomDetailsScreen: React.FC<RoomDetailsScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();
  const screenWidth = Dimensions.get('window').width;

  const canEditRoom = can(Permission.EDIT_ROOM);
  const canDeleteRoom = can(Permission.DELETE_ROOM);
  const canCreateBed = can(Permission.CREATE_BED);
  const canEditBed = can(Permission.EDIT_BED);
  const canDeleteBed = can(Permission.DELETE_BED);
  const canCreateTenant = can(Permission.CREATE_TENANT);

  const { tourStep } = useOnboardingTour();

  const tenantPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (tourStep === 'tap_add_tenant') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(tenantPulse, { toValue: 1.12, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(tenantPulse, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      tenantPulse.setValue(1);
    }
  }, [tourStep, tenantPulse]);

  const [room, setRoom] = useState<Room | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bedModalVisible, setBedModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [roomEditModalVisible, setRoomEditModalVisible] = useState(false);
  const [bulkBedsModalVisible, setBulkBedsModalVisible] = useState(false);

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

  // Calculate last month for electricity bill check
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthYear = lastMonth.getFullYear();
  const lastMonthMonth = lastMonth.getMonth() + 1; // Months are 0-indexed

  const {
    data: electricityBillsResponse,
  } = useGetElectricityBillsQuery({
    room_id: roomId,
    year: lastMonthYear,
    month: lastMonthMonth,
  }, { skip: !selectedPGLocationId || !room });

  const electricityBills = (electricityBillsResponse?.data || []) as ElectricityBill[];
  const hasLastMonthBill = electricityBills.length > 0;

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
      showErrorAlert(null, 'Load Room Error');
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
    if (!canCreateBed) {
      Alert.alert('Access Denied', "You don't have permission to create beds");
      return;
    }
    setSelectedBed(null);
    setBedModalVisible(true);
  };

  const handleBulkAddBeds = () => {
    if (!canCreateBed) {
      Alert.alert('Access Denied', "You don't have permission to create beds");
      return;
    }
    setBulkBedsModalVisible(true);
  };

  const handleBulkBedsSuccess = async () => {
    setBulkBedsModalVisible(false);
    await refetchBeds();
    await refetchRoom();
  };

  const handleEditBed = (bed: Bed) => {
    if (!canEditBed) {
      Alert.alert('Access Denied', "You don't have permission to edit beds");
      return;
    }
    setSelectedBed(bed);
    setBedModalVisible(true);
  };

  const handleDeleteBed = (bedId: number, bedNo: string) => {
    if (!canDeleteBed) {
      Alert.alert('Access Denied', "You don't have permission to delete beds");
      return;
    }
    showDeleteConfirmation({
      title: 'Delete Bed',
      message: 'Are you sure you want to delete',
      itemName: bedNo,
      onConfirm: async () => {
        try {
          await deleteBedMutation(bedId).unwrap();
          showSuccessAlert('Bed deleted successfully');
          setBeds((prev) => prev.filter((bed) => bed.s_no !== bedId));
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
        }
      },
    });
  };


  const handleBedFormSuccess = async () => {
    await refetchBeds();
    await refetchRoom();
  };

  const handleEdit = () => {
    if (!canEditRoom) {
      Alert.alert('Access Denied', "You don't have permission to edit rooms");
      return;
    }
    setRoomEditModalVisible(true);
  };

  const handleRoomEditSuccess = async () => {
    setRoomEditModalVisible(false);
    await refetchRoom();
    await refetchBeds();
  };

  const handleDelete = () => {
    if (!canDeleteRoom) {
      Alert.alert('Access Denied', "You don't have permission to delete rooms");
      return;
    }
    showDeleteConfirmation({
      title: 'Delete Room',
      message: 'Are you sure you want to delete Room',
      itemName: room?.room_no,
      onConfirm: async () => {
        try {
          await deleteRoomMutation(roomId).unwrap();
          showSuccessAlert('Room deleted successfully');
          navigation.goBack();
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
        }
      },
    });
  };

  const isBackgroundRefreshing = !refreshing && !!room && (isRoomFetching || isBedsFetching);

  if (loading && !room) {
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <SkeletonLoader width={42} height={42} borderRadius={14} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width={140} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width={90} height={10} borderRadius={6} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <SkeletonLoader width={28} height={28} borderRadius={8} />
                  <SkeletonLoader width={28} height={28} borderRadius={8} />
                </View>
              </View>
            </Card>

            <Card style={{ margin: 16, padding: 16 }}>
              <SkeletonLoader width={160} height={16} borderRadius={6} style={{ marginBottom: 12 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <SkeletonLoader
                    key={idx}
                    width={200}
                    height={150}
                    borderRadius={12}
                    style={{ marginRight: 12 }}
                  />
                ))}
              </ScrollView>
            </Card>

            <Card style={{ marginHorizontal: 16, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <SkeletonLoader width={54} height={10} borderRadius={6} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={34} height={16} borderRadius={6} />
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <SkeletonLoader width={74} height={10} borderRadius={6} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={34} height={16} borderRadius={6} />
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <SkeletonLoader width={64} height={10} borderRadius={6} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={34} height={16} borderRadius={6} />
                </View>
              </View>
            </Card>

            <Card style={{ margin: 16, marginTop: 0, padding: 16 }}>
              <SkeletonLoader width={120} height={14} borderRadius={6} style={{ marginBottom: 12 }} />
              <SkeletonLoader width={Math.min(screenWidth - 64, 240)} height={16} borderRadius={6} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={130} height={10} borderRadius={6} />
            </Card>

            <Card style={{ margin: 16, marginTop: 0, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SkeletonLoader width={140} height={16} borderRadius={6} />
                <SkeletonLoader width={90} height={32} borderRadius={8} />
              </View>

              <View style={{ gap: 8 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <View
                    key={idx}
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
                      <SkeletonLoader width={36} height={36} borderRadius={18} />
                      <View style={{ flex: 1 }}>
                        <SkeletonLoader width={120} height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                        <SkeletonLoader width={70} height={10} borderRadius={6} style={{ marginBottom: 6 }} />
                        <SkeletonLoader width={90} height={10} borderRadius={6} />
                      </View>
                    </View>
                    <SkeletonLoader width={28} height={28} borderRadius={8} />
                  </View>
                ))}
              </View>
            </Card>
          </ScrollView>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isBackgroundRefreshing}
            onRefresh={handleRefresh}
          />
        }
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
              disableEdit={!canEditRoom}
              disableDelete={!canDeleteRoom}
              blockPressWhenDisabled
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
              <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>TOTAL</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginTop: 2 }}>
                {beds.length}
              </Text>
            </View>

            <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#059669', fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>AVAILABLE</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#059669', marginTop: 2 }}>
                {beds.filter((b) => !b.is_occupied).length}
              </Text>
            </View>

            <View style={{ width: 1, height: 26, backgroundColor: Theme.colors.border }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>OCCUPIED</Text>
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

        {/* Electricity Bills */}
        <Card style={{ margin: 16, marginTop: 0, padding: 16 }}>
          <AnimatedPressableCard
            onPress={() => navigation.navigate('RoomElectricityBills', { roomId: room.s_no, roomNo: room.room_no })}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: '#F59E0B' + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Electricity Bills
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
                  View & manage room bills
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Theme.colors.text.tertiary} />
          </AnimatedPressableCard>

          {/* Last month bill status badge */}
          {beds.some(b => b.is_occupied) && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons
                name={hasLastMonthBill ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={hasLastMonthBill ? '#16A34A' : '#DC2626'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: hasLastMonthBill ? '#16A34A' : '#DC2626',
                }}
              >
                {hasLastMonthBill
                  ? `Bill created for ${lastMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
                  : `No bill for ${lastMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}
              </Text>
            </View>
          )}
        </Card>

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
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AnimatedPressableCard
                onPress={handleAddBed}
                disabled={!canCreateBed}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: canCreateBed ? 1 : 0.45 }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>Add Bed</Text>
              </AnimatedPressableCard>
              <AnimatedPressableCard
                onPress={handleBulkAddBeds}
                disabled={!canCreateBed}
                style={{ backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: canCreateBed ? 1 : 0.45 }}
              >
                <Ionicons name="layers" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>Bulk Add</Text>
              </AnimatedPressableCard>
            </View>
          </View>

          {beds && beds.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {beds.map((bed, index) => {
                const occupied = bed.is_occupied;
                const tenant = bed.tenants?.[0];
                return (
                  <View
                    key={bed.s_no}
                    style={{
                      width: '47%',
                      backgroundColor: occupied ? '#FEE2E2' : '#D1FAE5',
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    {/* Bed icon box + number + status */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <View style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name="bed" size={20} color={occupied ? '#DC2626' : '#16A34A'} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary }}>
                          {bed.bed_no}
                        </Text>
                        <Text style={{ fontSize: 11, color: occupied ? '#DC2626' : '#16A34A', marginTop: 1 }}>
                          {occupied ? 'Occupied' : 'Available'}
                        </Text>
                      </View>
                    </View>

                    {/* Tenant name or price */}
                    <View style={{ marginBottom: 12 }}>
                      {occupied && tenant ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="person" size={12} color="#F59E0B" />
                          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '500' }} numberOfLines={1} adjustsFontSizeToFit>
                            {tenant.name}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.primary }}>
                          {bed.bed_price ? `₹${Number(bed.bed_price).toLocaleString('en-IN')}/mo` : '—'}
                        </Text>
                      )}
                    </View>

                    {/* Add / View button */}
                    {!occupied ? (
                      <>
                        {tourStep === 'tap_add_tenant' && index === 0 && (
                          <View style={{ alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="finger-print" size={11} color="#fff" />
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>Tap to add tenant</Text>
                            </View>
                            <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1E3A8A', marginTop: 2 }} />
                          </View>
                        )}
                        <Animated.View style={{ transform: [{ scale: tourStep === 'tap_add_tenant' && index === 0 ? tenantPulse : 1 }] }}>
                          <AnimatedPressableCard
                            onPress={() => {
                              navigation.navigate('AddTenant', { bed_id: bed.s_no, room_id: room.s_no });
                            }}
                            disabled={!canCreateTenant}
                            style={{ backgroundColor: '#16A34A', borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginBottom: 8, opacity: canCreateTenant ? 1 : 0.45 }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>+ Add Tenant</Text>
                          </AnimatedPressableCard>
                        </Animated.View>
                      </>
                    ) : tenant?.s_no ? (
                      <AnimatedPressableCard
                        onPress={() => navigation.navigate('TenantDetails', { tenantId: tenant.s_no })}
                        style={{ backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginBottom: 8 }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>View Tenant</Text>
                      </AnimatedPressableCard>
                    ) : <View style={{ marginBottom: 8 }} />}

                    {/* Edit + Delete buttons */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {canEditBed && (
                        <AnimatedPressableCard
                          onPress={() => handleEditBed(bed)}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#F3F4F6', borderRadius: 6, paddingVertical: 6, borderWidth: 1, borderColor: '#D1D5DB' }}
                        >
                          <Ionicons name="pencil" size={11} color="#374151" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }} numberOfLines={1} adjustsFontSizeToFit>Edit</Text>
                        </AnimatedPressableCard>
                      )}
                      {canDeleteBed && (
                        <AnimatedPressableCard
                          onPress={() => handleDeleteBed(bed.s_no, bed.bed_no)}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#FEE2E2', borderRadius: 6, paddingVertical: 6, borderWidth: 1, borderColor: '#FECACA' }}
                        >
                          <Ionicons name="trash" size={11} color="#DC2626" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#DC2626' }} numberOfLines={1} adjustsFontSizeToFit>Delete</Text>
                        </AnimatedPressableCard>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Ionicons name="bed-outline" size={40} color="#D1D5DB" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 12, marginBottom: 4 }}>No Beds Yet</Text>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                Tap "Add Bed" to get started.
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
      />

      {/* Bulk Add Beds Modal */}
      <BulkAddBedsModal
        visible={bulkBedsModalVisible}
        onClose={() => setBulkBedsModalVisible(false)}
        onSuccess={handleBulkBedsSuccess}
        roomId={room?.s_no || roomId}
        roomNo={room?.room_no || ''}
        existingBedCount={beds.length}
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
