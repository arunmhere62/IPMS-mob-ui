import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
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
import { SkeletonLoader } from "../../../../components/SkeletonLoader";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { FloatingActionButton } from "../../../../components/FloatingActionButton";
import { Theme } from "../../../../theme";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { ScreenLayout } from "../../../../components/ScreenLayout";
import { RoomFormModal } from "./CreateEditRoomForm";
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

  const { width: screenWidth } = useWindowDimensions();

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
    if (flatListRef.current?.scrollTo) {
      flatListRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [selectedPGLocationId]);

  useEffect(() => {
    setLoading(!!selectedPGLocationId && isRoomsFetching);
  }, [isRoomsFetching, selectedPGLocationId]);

  // Restore scroll position when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setTimeout(() => {
        if (flatListRef.current?.scrollTo && scrollPositionRef.current > 0) {
          flatListRef.current.scrollTo({
            y: scrollPositionRef.current,
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

  const getSharingType = (room: Room) => {
    const total = room.total_beds ?? room.beds?.length ?? 0;
    if (total === 1) return "Single Sharing";
    if (total === 2) return "Double Sharing";
    if (total === 3) return "Triple Sharing";
    return `${total} Bed Sharing`;
  };

  const getRoomPrice = (room: Room) => {
    const prices = (room.beds || [])
      .map((b) => Number(b.bed_price) || 0)
      .filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getAvailability = (room: Room) => {
    const total = room.total_beds ?? room.beds?.length ?? 0;
    const occupied =
      typeof room.occupied_beds === "number"
        ? room.occupied_beds
        : (room.beds || []).filter((b) => Boolean(b.is_occupied)).length;
    const available =
      typeof room.available_beds === "number"
        ? room.available_beds
        : Math.max(total - occupied, 0);
    return { total, occupied, available };
  };

  const groupedRooms = useMemo(() => {
    let list = rooms.filter((r) => {
      if (!appliedSearch) return true;
      const q = appliedSearch.toLowerCase();
      return r.room_no?.toLowerCase().includes(q);
    });

    const groups: Record<string, Room[]> = {};
    list.forEach((room) => {
      const key = getSharingType(room);
      if (!groups[key]) groups[key] = [];
      groups[key].push(room);
    });

    // Sort groups by desired order and rooms within group by room number
    const order = ["Single Sharing", "Double Sharing", "Triple Sharing"];
    const entries = Object.entries(groups).sort(([a], [b]) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return entries.map(([title, data]) => ({
      title,
      data: [...data].sort((a, b) => {
        const numA = parseInt(a.room_no?.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.room_no?.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      }),
    }));
  }, [rooms, appliedSearch]);

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

  const formatPrice = (price: number) => (price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—');

  const getChipLayout = () => {
    const columns = screenWidth < 360 ? 2 : screenWidth < 480 ? 3 : screenWidth < 720 ? 4 : 5;
    const gap = 8;
    const padding = 24; // 12px horizontal padding each side
    const chipWidth = Math.floor((screenWidth - padding - gap * (columns - 1)) / columns);
    return { columns, gap, chipWidth };
  };

  const renderRoomChip = ({ item, index }: { item: Room; index: number }) => {
    const { total, available } = getAvailability(item);
    const { min, max } = getRoomPrice(item);
    const isFull = available === 0;
    const isAvailable = available === total;
    const showTourHint = tourStep === 'tap_room_for_tenant' && index === 0;
    const roomNo = item.room_no?.startsWith('RM-') ? item.room_no : item.room_no?.startsWith('RM') ? `RM-${item.room_no.slice(2)}` : `RM-${item.room_no}`;
    const cardBg = isAvailable ? '#ECFDF5' : isFull ? '#FEF2F2' : '#FFFBEB';
    const borderColor = isAvailable ? '#A7F3D0' : isFull ? '#FECACA' : '#FDE68A';

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
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Tap to open room</Text>
            </View>
            <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1E3A8A', marginTop: 2 }} />
          </View>
        )}
        <Animated.View style={{ transform: [{ scale: showTourHint ? roomPulse : 1 }] }}>
          <Card style={{
            padding: 10,
            margin: 0,
            alignItems: 'flex-start',
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor: borderColor,
          }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: Theme.colors.text.primary,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {roomNo}
            </Text>

            <Text style={{ fontSize: 10, color: Theme.colors.text.secondary, marginBottom: 6 }}>
              {total} beds
            </Text>

            <View
              style={{
                backgroundColor: isAvailable ? '#10B981' : isFull ? '#EF4444' : '#F59E0B',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: '#fff',
                  letterSpacing: 0.3,
                }}
              >
                {isAvailable ? 'AVAILABLE' : isFull ? 'NOT AVAILABLE' : `${available} LEFT`}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: Theme.colors.primary,
              }}
            >
              {min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`}
            </Text>
          </Card>
        </Animated.View>
      </AnimatedPressableCard>
    );
  };

  const renderSection = ({ item }: { item: { title: string; data: Room[] } }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, marginTop: 8 }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: Theme.colors.text.primary }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontWeight: '600' }}>
          {item.data.length} rooms
        </Text>
      </View>
      {(() => {
        const { chipWidth, gap } = getChipLayout();
        return (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 12,
              gap,
            }}
          >
            {item.data.map((room, idx) => (
              <View key={room.s_no} style={{ width: chipWidth }}>
                {renderRoomChip({ item: room, index: idx })}
              </View>
            ))}
          </View>
        );
      })()}
    </View>
  );

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
          backgroundColor: Theme.colors.background.secondary,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Theme.colors.background.primary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              lineHeight: 18,
              minHeight: 40,
              textAlignVertical: 'center',
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
          (() => {
            const { chipWidth, gap } = getChipLayout();
            return (
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <SkeletonLoader width={120} height={14} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
                  {Array.from({ length: getChipLayout().columns * 2 }).map((_, idx) => (
                    <Card key={idx} style={{ padding: 10, width: chipWidth }}>
                      <SkeletonLoader width={50} height={11} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width={35} height={9} style={{ marginBottom: 8 }} />
                      <SkeletonLoader width={55} height={12} style={{ marginBottom: 6 }} borderRadius={6} />
                      <SkeletonLoader width={60} height={11} />
                    </Card>
                  ))}
                </View>
              </View>
            );
          })()
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
          <ScrollView
            ref={flatListRef as any}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            onScroll={(event) => {
              scrollPositionRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {groupedRooms.map((section) => (
              <View key={section.title}>
                {renderSection({ item: section })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* FAB: Add Room */}
      <FloatingActionButton
        onPress={() => {
          if (!canCreateRoom) {
            Alert.alert('Access Denied', "You don't have permission to create rooms");
            return;
          }
          setEditingRoomId(null);
          setEditModalVisible(true);
        }}
        disabled={!canCreateRoom}
      />

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
