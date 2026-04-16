import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme";
import { Room } from "../../services/api/roomsApi";
import { SlideBottomModal } from "../../components/SlideBottomModal";

interface BedsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedRoomId: number | null;
  occupancyFilter: "all" | "occupied" | "available";
  onRoomChange: (roomId: number | null) => void;
  onOccupancyChange: (filter: "all" | "occupied" | "available") => void;
  onApply: () => void;
  onClear: () => void;
}

export const BedsFilterModal: React.FC<BedsFilterModalProps> = ({
  visible,
  onClose,
  rooms,
  selectedRoomId,
  occupancyFilter,
  onRoomChange,
  onOccupancyChange,
  onApply,
  onClear,
}) => {
  const getFilterCount = () => {
    let count = 0;
    if (selectedRoomId) count++;
    if (occupancyFilter !== "all") count++;
    return count;
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={onClose}
      title="Filter Beds"
      subtitle={
        getFilterCount() > 0
          ? `${getFilterCount()} filter${
              getFilterCount() > 1 ? "s" : ""
            } active`
          : undefined
      }
      onSubmit={handleApply}
      onCancel={handleClear}
      submitLabel="Apply Filters"
      cancelLabel={getFilterCount() > 0 ? "Clear Filters" : undefined}
      enableFlexibleHeightDrag={true}
      minHeightPercent={0.6}
    >
      {/* Filter Content */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Room Filter */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: Theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Filter by Room
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <TouchableOpacity
              onPress={() => onRoomChange(null)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor:
                  selectedRoomId === null ? Theme.colors.primary : "#fff",
                borderWidth: 1,
                borderColor:
                  selectedRoomId === null
                    ? Theme.colors.primary
                    : Theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    selectedRoomId === null
                      ? "#fff"
                      : Theme.colors.text.secondary,
                }}
              >
                All Rooms
              </Text>
            </TouchableOpacity>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.s_no}
                onPress={() => onRoomChange(room.s_no)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor:
                    selectedRoomId === room.s_no
                      ? Theme.colors.primary
                      : "#fff",
                  borderWidth: 1,
                  borderColor:
                    selectedRoomId === room.s_no
                      ? Theme.colors.primary
                      : Theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color:
                      selectedRoomId === room.s_no
                        ? "#fff"
                        : Theme.colors.text.secondary,
                  }}
                >
                  {room.room_no}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: Theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Filter by Status
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.text.secondary,
              marginBottom: 12,
            }}
          >
            Select one status filter (mutually exclusive)
          </Text>
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => onOccupancyChange("all")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor:
                  occupancyFilter === "all" ? Theme.colors.primary : "#fff",
                borderWidth: 1,
                borderColor:
                  occupancyFilter === "all"
                    ? Theme.colors.primary
                    : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  occupancyFilter === "all"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={
                  occupancyFilter === "all"
                    ? "#fff"
                    : Theme.colors.text.secondary
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    occupancyFilter === "all"
                      ? "#fff"
                      : Theme.colors.text.secondary,
                }}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onOccupancyChange("available")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor:
                  occupancyFilter === "available" ? "#16A34A" : "#fff",
                borderWidth: 1,
                borderColor:
                  occupancyFilter === "available"
                    ? "#16A34A"
                    : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  occupancyFilter === "available"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={
                  occupancyFilter === "available"
                    ? "#fff"
                    : Theme.colors.text.secondary
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    occupancyFilter === "available"
                      ? "#fff"
                      : Theme.colors.text.secondary,
                }}
              >
                🟢 Available
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onOccupancyChange("occupied")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor:
                  occupancyFilter === "occupied" ? "#DC2626" : "#fff",
                borderWidth: 1,
                borderColor:
                  occupancyFilter === "occupied"
                    ? "#DC2626"
                    : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  occupancyFilter === "occupied"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={
                  occupancyFilter === "occupied"
                    ? "#fff"
                    : Theme.colors.text.secondary
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    occupancyFilter === "occupied"
                      ? "#fff"
                      : Theme.colors.text.secondary,
                }}
              >
                🔴 Occupied
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};
