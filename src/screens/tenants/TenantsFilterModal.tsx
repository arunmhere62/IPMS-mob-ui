import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme";
import { Room } from "../../services/api/roomsApi";
import { SlideBottomModal } from "../../components/SlideBottomModal";

interface TenantsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  rooms: Room[];
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE" | "CHECKED_OUT";
  selectedRoomId: number | null;
  pendingRentFilter: boolean;
  pendingAdvanceFilter: boolean;
  partialRentFilter: boolean;
  onStatusChange: (
    status: "ALL" | "ACTIVE" | "INACTIVE" | "CHECKED_OUT"
  ) => void;
  onRoomChange: (roomId: number | null) => void;
  onPendingRentChange: (value: boolean) => void;
  onPendingAdvanceChange: (value: boolean) => void;
  onPartialRentChange: (value: boolean) => void;
  onApply: () => void;
  onClear: () => void;
}

export const TenantsFilterModal: React.FC<TenantsFilterModalProps> = ({
  visible,
  onClose,
  rooms,
  statusFilter,
  selectedRoomId,
  pendingRentFilter,
  pendingAdvanceFilter,
  partialRentFilter,
  onStatusChange,
  onRoomChange,
  onPendingRentChange,
  onPendingAdvanceChange,
  onPartialRentChange,
  onApply,
  onClear,
}) => {
  const getFilterCount = () => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (selectedRoomId !== null) count++;
    if (pendingRentFilter) count++;
    if (pendingAdvanceFilter) count++;
    if (partialRentFilter) count++;
    return count;
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={onClose}
      title="Filter Tenants"
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
        {/* Status Filter */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: Theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Filter by Status
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["ALL", "ACTIVE", "INACTIVE", "CHECKED_OUT"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => onStatusChange(status as any)}
                style={{
                  width: "48%",
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor:
                    statusFilter === status ? Theme.colors.primary : "#fff",
                  borderWidth: 1,
                  borderColor:
                    statusFilter === status
                      ? Theme.colors.primary
                      : Theme.colors.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color:
                      statusFilter === status
                        ? "#fff"
                        : Theme.colors.text.secondary,
                  }}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Room Filter */}
        {rooms.length > 0 && (
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
              {rooms.map((room: any) => (
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
        )}

        {/* Payment Filters */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: Theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Payment Filters
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.text.secondary,
              marginBottom: 12,
            }}
          >
            Select one payment filter (mutually exclusive)
          </Text>
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                if (pendingRentFilter) {
                  // If already selected, deselect it
                  onPendingRentChange(false);
                } else {
                  // Select this one and deselect others
                  onPendingRentChange(true);
                  onPendingAdvanceChange(false);
                  onPartialRentChange(false);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: pendingRentFilter ? "#EF4444" : "#fff",
                borderWidth: 1,
                borderColor: pendingRentFilter
                  ? "#EF4444"
                  : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  pendingRentFilter ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color={pendingRentFilter ? "#fff" : Theme.colors.text.secondary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: pendingRentFilter
                    ? "#fff"
                    : Theme.colors.text.secondary,
                }}
              >
                ⚠️ Pending Rent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (pendingAdvanceFilter) {
                  // If already selected, deselect it
                  onPendingAdvanceChange(false);
                } else {
                  // Select this one and deselect others
                  onPendingAdvanceChange(true);
                  onPendingRentChange(false);
                  onPartialRentChange(false);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: pendingAdvanceFilter ? "#F59E0B" : "#fff",
                borderWidth: 1,
                borderColor: pendingAdvanceFilter
                  ? "#F59E0B"
                  : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  pendingAdvanceFilter ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color={
                  pendingAdvanceFilter ? "#fff" : Theme.colors.text.secondary
                }
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: pendingAdvanceFilter
                    ? "#fff"
                    : Theme.colors.text.secondary,
                }}
              >
                💰 No Advance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (partialRentFilter) {
                  // If already selected, deselect it
                  onPartialRentChange(false);
                } else {
                  // Select this one and deselect others
                  onPartialRentChange(true);
                  onPendingRentChange(false);
                  onPendingAdvanceChange(false);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: partialRentFilter ? "#F97316" : "#fff",
                borderWidth: 1,
                borderColor: partialRentFilter
                  ? "#F97316"
                  : Theme.colors.border,
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  partialRentFilter ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color={partialRentFilter ? "#fff" : Theme.colors.text.secondary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: partialRentFilter
                    ? "#fff"
                    : Theme.colors.text.secondary,
                }}
              >
                ⏳ Partial Rent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SlideBottomModal>
  );
};
