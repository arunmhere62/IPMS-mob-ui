import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { RootState } from "../../store";
import {
  Room,
  useDeleteRoomMutation,
  useGetAllRoomsQuery,
} from "../../api/roomsApi";
import { Card } from "../../../../components/Card";
import { ActionButtons } from "../../../../components/ActionButtons";
import { SkeletonLoader } from "../../../../components/SkeletonLoader";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { Theme } from "../../../../theme";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { ScreenLayout } from "../../../../components/ScreenLayout";
import { RoomFormModal } from "./CreateEditRoomModal";
import { showDeleteConfirmation } from "../../../../components/DeleteConfirmationDialog";
import { showErrorAlert, showSuccessAlert } from "../../../../utils/errorHandler";
import { CONTENT_COLOR } from "@/constant";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/config/rbac.config";
import { Ionicons } from "@expo/vector-icons";
import { useOnboardingTour } from "@/context/OnboardingTourContext";

interface RoomsScreenProps {
  navigation: any;
}

export const RoomsScreen: React.FC<RoomsScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector(
    (state: RootState) => state.pgLocations
  );
  const { can } = usePermissions();

  const canCreateRoom = can(Permission.CREATE_ROOM);
  const canEditRoom = can(Permission.EDIT_ROOM);
  const canDeleteRoom = can(Permission.DELETE_ROOM);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<any>(null);

  const [appliedSearch, setAppliedSearch] = useState("");

  const roomsQueryArgs = useMemo(() => {
    if (!selectedPGLocationId) return undefined as any;
    return {
      pg_id: selectedPGLocationId,
      limit: 100,
      search: appliedSearch || undefined,
    };
  }, [selectedPGLocationId, appliedSearch]);

  const {
    data: roomsResponse,
    refetch: refetchRooms,
    isFetching: isRoomsFetching,
  } = useGetAllRoomsQuery(roomsQueryArgs, {
    skip: !selectedPGLocationId,
    refetchOnMountOrArgChange: false,
  });

  const [deleteRoomMutation] = useDeleteRoomMutation();

  const { tourStep, advanceTour } = useOnboardingTour();

  const roomPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (tourStep === 'tap_room_for_tenant') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(roomPulse, { toValue: 1.08, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(roomPulse, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      roomPulse.setValue(1);
    }
  }, [tourStep, roomPulse]);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  // Scroll position tracking
  const flatListRef = useRef<any>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    setRooms(((roomsResponse as any)?.data || []) as Room[]);
    setPagination((roomsResponse as any)?.pagination || undefined);
  }, [roomsResponse]);

  // Reset scroll position when PG location changes
  useEffect(() => {
    scrollPositionRef.current = 0;
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    setLoading(!!selectedPGLocationId && isRoomsFetching);
  }, [isRoomsFetching, selectedPGLocationId]);

  // Restore scroll position when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => {
        if (flatListRef.current && scrollPositionRef.current > 0) {
          flatListRef.current.scrollToOffset({
            offset: scrollPositionRef.current,
            animated: true,
          });
        }
      }, 100); // Small delay to ensure list is rendered
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
    if (!canEditRoom) {
      Alert.alert("Access Denied", "You don't have permission to edit rooms");
      return;
    }
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
    if (!canDeleteRoom) {
      Alert.alert("Access Denied", "You don't have permission to delete rooms");
      return;
    }
    showDeleteConfirmation({
      title: "Delete Room",
      message: "Are you sure you want to delete Room",
      itemName: roomNo,
      onConfirm: async () => {
        try {
          // Delete room from database (backend will handle S3 image deletion)
          const response = await deleteRoomMutation(roomId).unwrap();

          if (!(response as any)?.success) {
            showErrorAlert(response as any, "Delete Error");
            return;
          }

          showSuccessAlert(response);
          // Optimistically remove from local state without refetching
          setRooms((prev) => prev.filter((room) => room.s_no !== roomId));
        } catch (error: any) {
          showErrorAlert(error, "Delete Error");
        }
      },
    });
  };

  const renderRoomCard = ({ item, index }: { item: Room; index: number }) => {
      const totalBeds = item.total_beds ?? item.beds?.length ?? 0;
      const hasOccupancyFlag = (item.beds || []).some(
        (b) => typeof (b as any)?.is_occupied === "boolean"
      );
      const occupiedBeds =
        typeof (item as any)?.occupied_beds === "number"
          ? (item as any).occupied_beds
          : hasOccupancyFlag
          ? (item.beds || []).filter((b) => Boolean((b as any)?.is_occupied))
              .length
          : undefined;
      const availableBeds =
        typeof (item as any)?.available_beds === "number"
          ? (item as any).available_beds
          : typeof occupiedBeds === "number"
          ? Math.max(totalBeds - occupiedBeds, 0)
          : undefined;

      const showTourHint = tourStep === 'tap_room_for_tenant' && index === 0;

      return (
        <AnimatedPressableCard
          onPress={() => {
            if (showTourHint) advanceTour();
            navigation.navigate("RoomDetails", { roomId: item.s_no });
          }}
        >
          {showTourHint && (
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <View style={{ backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="finger-print" size={11} color="#fff" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>Tap to open room</Text>
              </View>
              <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1E3A8A', marginTop: 2 }} />
            </View>
          )}
          <Animated.View style={{ transform: [{ scale: showTourHint ? roomPulse : 1 }] }}>
          <Card
            className=""
            style={{ marginHorizontal: 10, marginVertical: 4, padding: 12 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Theme.colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>🏠</Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: Theme.colors.text.primary,
                    }}
                  >
                    {item.room_no}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: Theme.colors.text.tertiary }}
                  >
                    ID: {item.s_no}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <ActionButtons
                  onView={() => {
                    navigation.navigate("RoomDetails", { roomId: item.s_no });
                  }}
                  onEdit={() => handleOpenEditModal(item.s_no)}
                  onDelete={() => handleDeleteRoom(item.s_no, item.room_no)}
                  disableEdit={!canEditRoom}
                  disableDelete={!canDeleteRoom}
                  blockPressWhenDisabled
                  showView
                  containerStyle={{ gap: 6 }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Ionicons name="bed-outline" size={13} color="#6B7280" />
                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>{totalBeds} Total</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Ionicons name="bed-outline" size={13} color="#16A34A" />
                <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>{typeof availableBeds === 'number' ? availableBeds : '—'} Free</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Ionicons name="bed-outline" size={13} color="#DC2626" />
                <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>{typeof occupiedBeds === 'number' ? occupiedBeds : '—'} Taken</Text>
              </View>
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
                <Text
                  style={{ fontSize: 10, color: Theme.colors.text.tertiary }}
                >
                  📍 {item.pg_locations.location_name}
                </Text>
              </View>
            )}
          </Card>
          </Animated.View>
        </AnimatedPressableCard>
      );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        onBackPress={() => navigation.goBack()}
        showBackButton={navigation.canGoBack()}
        title="Rooms"
        subtitle={`${pagination?.total || 0} total`}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: Theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
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
          <AnimatedPressableCard
            onPress={handleSearch}
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              🔍
            </Text>
          </AnimatedPressableCard>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {loading && !refreshing ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} style={{ marginBottom: 10, padding: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <SkeletonLoader
                      width={32}
                      height={32}
                      borderRadius={16}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <SkeletonLoader
                        width={100}
                        height={14}
                        style={{ marginBottom: 6 }}
                      />
                      <SkeletonLoader width={140} height={10} />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <SkeletonLoader width={28} height={28} borderRadius={8} />
                    <SkeletonLoader width={28} height={28} borderRadius={8} />
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <SkeletonLoader width={90} height={10} />
                  <SkeletonLoader width={70} height={10} />
                </View>
              </Card>
            ))}
          </View>
        ) : rooms.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏠</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: Theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              No Rooms Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Theme.colors.text.secondary,
                textAlign: "center",
              }}
            >
              {searchQuery
                ? "Try a different search term"
                : "Add your first room to get started"}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={rooms}
            renderItem={renderRoomCard}
            keyExtractor={(item) => item.s_no.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
            onScroll={(event) => {
              scrollPositionRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          />
        )}
      </View>

      {/* FAB: Add Room */}
      <View style={{ position: 'absolute', right: 20, bottom: 80 }}>
        <AnimatedPressableCard
          onPress={() => {
            if (!canCreateRoom) {
              Alert.alert('Access Denied', "You don't have permission to create rooms");
              return;
            }
            setEditingRoomId(null);
            setEditModalVisible(true);
          }}
          disabled={!canCreateRoom}
          style={{
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
            opacity: canCreateRoom ? 1 : 0.45,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '300' }}>+</Text>
        </AnimatedPressableCard>
      </View>

      {/* Room Form Modal */}
      <RoomFormModal
        visible={editModalVisible}
        roomId={editingRoomId}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          handleEditSuccess();
          handleCloseEditModal();
        }}
      />
    </ScreenLayout>
  );
};
