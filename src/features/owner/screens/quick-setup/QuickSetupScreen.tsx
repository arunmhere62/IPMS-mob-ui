import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { ScreenLayout } from "@/components/ScreenLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedPressableCard } from "@/components/AnimatedPressableCard";
import { Theme } from "@/theme";
import { RootState, AppDispatch } from "@/features/owner/store";
import { setSelectedPGLocation } from "@/features/owner/store/slices/pgLocationSlice";
import {
  useCreateRoomMutation,
  useBulkCreateBedMutation,
  useGetAllRoomsQuery,
} from "@/features/owner/api/roomsApi";
import { useGetPGLocationsQuery } from "@/features/owner/api/pgLocationsApi";
import { showErrorAlert, showSuccessAlert } from "@/utils/errorHandler";
import { useOnboardingTour } from "@/context/OnboardingTourContext";
import { setIsOnboardingComplete } from "@/features/owner/store/slices/rbacSlice";
import { Ionicons } from "@expo/vector-icons";

interface RoomSetupRow {
  id: number;
  roomNo: string;
  beds: string;
  price: string;
}

// Production constants
const MAX_ROOMS = 50;
const MAX_BEDS_PER_ROOM = 50;
const MIN_PRICE = 1;
const MAX_PRICE = 10_00_000; // ₹10,00,000 per bed
const MAX_PRICE_DECIMALS = 2;
const ROOM_NUMBER_START = 101;

const generateBedNo = (roomIndex: number, bedIndex: number): string => {
  return `BED${roomIndex * 100 + bedIndex + 1}`;
};

const formatPrice = (value: number): string => {
  return `₹${value.toLocaleString("en-IN")}`;
};

const extractSno = (response: any): number | undefined => {
  const raw =
    response?.data?.s_no ?? response?.s_no ?? response?.data?.data?.s_no;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : undefined;
};

export const QuickSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId, isRehydrated } = useSelector(
    (state: RootState) => state.pgLocations
  );

  const { data: pgLocationsResponse, isFetching: pgLocationsFetching } =
    useGetPGLocationsQuery(undefined, { skip: false });
  const { data: existingRoomsResponse, isFetching: isFetchingExistingRooms } =
    useGetAllRoomsQuery(
      { pg_id: selectedPGLocationId ?? undefined },
      { skip: !selectedPGLocationId }
    );

  const [createRoom] = useCreateRoomMutation();
  const [bulkCreateBeds] = useBulkCreateBedMutation();
  const { endTour } = useOnboardingTour();
  const isOnboardingComplete = useSelector(
    (state: RootState) => (state as any).rbac?.isOnboardingComplete ?? null
  );

  const [numRooms, setNumRooms] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [rooms, setRooms] = useState<RoomSetupRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completedRooms, setCompletedRooms] = useState<string[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useCallback(<T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: React.SetStateAction<T>
  ) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  const existingRoomNos = useMemo(() => {
    const raw = existingRoomsResponse as any;
    const rooms = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const set = new Set<string>();
    rooms.forEach((r: any) => {
      const no = r?.room_no;
      if (typeof no === "string" && no.trim()) {
        const normalized = no.trim().toUpperCase();
        // Support both "RM101" and "101" formats from backend
        if (/^\d+$/.test(normalized)) {
          set.add(`RM${normalized}`);
        } else {
          set.add(normalized);
        }
      }
    });
    return set;
  }, [existingRoomsResponse]);

  const getNextAvailableRoomNos = useCallback(
    (count: number, currentRooms: RoomSetupRow[]): string[] => {
      const taken = new Set(existingRoomNos);
      currentRooms.forEach((r) => {
        if (r.roomNo.trim()) {
          taken.add(`RM${r.roomNo.trim()}`);
        }
      });
      const numbers: string[] = [];
      let candidate = ROOM_NUMBER_START;
      while (numbers.length < count) {
        const fullNo = `RM${candidate}`;
        if (!taken.has(fullNo)) {
          numbers.push(String(candidate));
          taken.add(fullNo);
        }
        candidate++;
      }
      return numbers;
    },
    [existingRoomNos]
  );

  // Auto-select first PG location if none selected
  useEffect(() => {
    if (!isRehydrated || pgLocationsFetching) return;
    if (selectedPGLocationId) return;

    const locations =
      (pgLocationsResponse as any)?.data ??
      (Array.isArray(pgLocationsResponse) ? pgLocationsResponse : []);
    if (Array.isArray(locations) && locations.length > 0) {
      const first = locations[0];
      const id = typeof first === "object" ? first.s_no : first;
      if (typeof id === "number" && id > 0) {
        dispatch(setSelectedPGLocation(id));
      }
    }
  }, [isRehydrated, selectedPGLocationId, pgLocationsResponse, pgLocationsFetching, dispatch]);

  const handleNumRoomsChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const count = parseInt(digits, 10);
    const validCount =
      !Number.isNaN(count) && count > 0 && count <= MAX_ROOMS ? count : 0;

    setNumRooms(digits);
    setRooms((prev) => {
      if (validCount === 0) return [];
      // Keep existing rooms, add or remove only what changed
      const next: RoomSetupRow[] = prev.slice(0, validCount);
      const toAdd = validCount - next.length;
      if (toAdd > 0) {
        const baseId = prev.length > 0 ? Math.max(...prev.map((r) => r.id)) + 1 : 0;
        const newNumbers = getNextAvailableRoomNos(toAdd, next);
        for (let i = 0; i < toAdd; i++) {
          next.push({
            id: baseId + i,
            roomNo: newNumbers[i],
            beds: "2",
            price: defaultPrice || "",
          });
        }
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.numRooms;
      return next;
    });
  };

  const cleanPrice = (raw: string): string => {
    const numeric = raw.replace(/[^0-9.]/g, "");
    const parts = numeric.split(".");
    const sanitized =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : numeric;
    if (!sanitized) return sanitized;
    const [intPart, ...rest] = sanitized.split(".");
    const cleanedInt = intPart.replace(/^0+/, "") || "0";
    const decimal = rest.join("").substring(0, MAX_PRICE_DECIMALS);
    const value = decimal.length ? `${cleanedInt}.${decimal}` : cleanedInt;
    // Clamp to maximum price while typing
    if (parseFloat(value) > MAX_PRICE) {
      return String(MAX_PRICE);
    }
    return value;
  };

  const handleDefaultPriceChange = (value: string) => {
    const sanitized = cleanPrice(value);
    setDefaultPrice((prevDefault) => {
      if (sanitized) {
        setRooms((prevRooms) =>
          prevRooms.map((r) => {
            // Only update rooms that are empty or still match the previous default
            if (!r.price || r.price === prevDefault) {
              return { ...r, price: sanitized };
            }
            return r;
          })
        );
      }
      return sanitized;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.defaultPrice;
      return next;
    });
  };

  const updateRoom = (id: number, field: keyof RoomSetupRow, value: string) => {
    let newRoomNo = "";
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "beds") {
          return { ...r, beds: value.replace(/[^0-9]/g, "") };
        }
        if (field === "price") {
          return { ...r, price: cleanPrice(value) };
        }
        if (field === "roomNo") {
          const numeric = value.replace(/[^0-9]/g, "").substring(0, 6);
          newRoomNo = numeric.replace(/^0+/, "");
          return { ...r, roomNo: newRoomNo };
        }
        return r;
      })
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`room_${id}_${field}`];
      if (field === "roomNo" && newRoomNo) {
        const fullRoomNo = `RM${newRoomNo}`;
        if (existingRoomNos.has(fullRoomNo)) {
          next[`room_${id}_roomNo`] = "Room already exists";
        }
      }
      return next;
    });
  };

  const addRoom = () => {
    setRooms((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((r) => r.id)) + 1 : 0;
      const newNumbers = getNextAvailableRoomNos(1, prev);
      return [
        ...prev,
        {
          id: nextId,
          roomNo: newNumbers[0],
          beds: "2",
          price: defaultPrice || "",
        },
      ];
    });
    setNumRooms((prev) => String(parseInt(prev || "0", 10) + 1));
  };

  const removeRoom = (id: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setNumRooms((prev) => String(Math.max(0, parseInt(prev || "0", 10) - 1)));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const count = parseInt(numRooms, 10);
    if (!numRooms || Number.isNaN(count) || count <= 0) {
      nextErrors.numRooms = `Enter number of rooms (1-${MAX_ROOMS})`;
    } else if (count > MAX_ROOMS) {
      nextErrors.numRooms = `Maximum ${MAX_ROOMS} rooms at a time`;
    }

    const price = parseFloat(defaultPrice);
    if (!defaultPrice || Number.isNaN(price) || price < MIN_PRICE) {
      nextErrors.defaultPrice = `Enter a valid bed price (min ₹${MIN_PRICE})`;
    } else if (price > MAX_PRICE) {
      nextErrors.defaultPrice = `Price cannot exceed ${formatPrice(MAX_PRICE)}`;
    }

    const seenRoomNos = new Set<string>();
    rooms.forEach((r) => {
      if (!r.roomNo.trim()) {
        nextErrors[`room_${r.id}_roomNo`] = "Room number required";
      } else {
        const fullRoomNo = `RM${r.roomNo.trim()}`;
        if (seenRoomNos.has(fullRoomNo)) {
          nextErrors[`room_${r.id}_roomNo`] = "Duplicate room number";
        } else if (existingRoomNos.has(fullRoomNo)) {
          nextErrors[`room_${r.id}_roomNo`] = "Room already exists";
        }
        seenRoomNos.add(fullRoomNo);
      }
      const beds = parseInt(r.beds, 10);
      if (!r.beds || Number.isNaN(beds) || beds <= 0) {
        nextErrors[`room_${r.id}_beds`] = "Enter beds count";
      } else if (beds > MAX_BEDS_PER_ROOM) {
        nextErrors[`room_${r.id}_beds`] = `Max ${MAX_BEDS_PER_ROOM} beds`;
      }
      const p = parseFloat(r.price);
      if (!r.price || Number.isNaN(p) || p < MIN_PRICE) {
        nextErrors[`room_${r.id}_price`] = `Enter price (min ₹${MIN_PRICE})`;
      } else if (p > MAX_PRICE) {
        nextErrors[`room_${r.id}_price`] = `Max ${formatPrice(MAX_PRICE)}`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fix the highlighted fields");
      return;
    }
    if (!selectedPGLocationId) {
      Alert.alert(
        "PG Location missing",
        "Please create a PG location first."
      );
      return;
    }
    if (isFetchingExistingRooms) {
      Alert.alert("Loading", "Please wait while we check existing rooms.");
      return;
    }

    safeSetState<boolean>(setIsSubmitting, true);
    safeSetState(setProgress, { current: 0, total: rooms.length });
    safeSetState<string[]>(setCompletedRooms, []);

    try {
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const roomRes = await createRoom({
          pg_id: selectedPGLocationId,
          room_no: `RM${room.roomNo.trim()}`,
          images: [],
        }).unwrap();

        const roomId = extractSno(roomRes);

        if (!roomId) {
          throw new Error(`Room ${room.roomNo} was not created`);
        }

        const bedCount = parseInt(room.beds, 10);
        const bedPrice = parseFloat(room.price);
        const beds = Array.from({ length: bedCount }, (_, bedIndex) => ({
          bed_no: generateBedNo(i, bedIndex),
          bed_price: bedPrice,
          images: [],
        }));

        await bulkCreateBeds({
          room_id: roomId,
          pg_id: selectedPGLocationId,
          beds,
        }).unwrap();

        safeSetState(setProgress, { current: i + 1, total: rooms.length });
        safeSetState(setCompletedRooms, (prev) => [
          ...prev,
          `RM${room.roomNo.trim()}`,
        ]);
      }

      dispatch(setIsOnboardingComplete(true));
      showSuccessAlert("Rooms and beds created successfully", {
        onOk: () => {
          endTour();
          navigation.navigate("MainTabs", { screen: "Dashboard" });
        },
      });
    } catch (error: any) {
      showErrorAlert(error, "Failed to set up rooms and beds");
    } finally {
      safeSetState<boolean>(setIsSubmitting, false);
    }
  };

  const totalBeds = useMemo(
    () => rooms.reduce((sum, r) => sum + (parseInt(r.beds, 10) || 0), 0),
    [rooms]
  );
  const totalRevenue = useMemo(
    () =>
      rooms.reduce(
        (sum, r) =>
          sum + (parseInt(r.beds, 10) || 0) * (parseFloat(r.price) || 0),
        0
      ),
    [rooms]
  );

  const hasNoLocation =
    isRehydrated &&
    !selectedPGLocationId &&
    !pgLocationsFetching &&
    (!Array.isArray((pgLocationsResponse as any)?.data) ||
      (pgLocationsResponse as any)?.data.length === 0);

  return (
    <ScreenLayout contentBackgroundColor={Theme.colors.background.primary}>
      <ScreenHeader
        title="Quick Setup"
        subtitle="Create your rooms and beds in one go"
        showBackButton={isOnboardingComplete !== false}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {hasNoLocation ? (
            <Card>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Theme.colors.text.primary,
                  textAlign: "center",
                }}
              >
                No PG location found
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Theme.colors.text.secondary,
                  textAlign: "center",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                Create a PG location first to set up rooms and beds.
              </Text>
              <Button
                title="Create PG Location"
                onPress={() => navigation.navigate("PGLocations")}
                variant="primary"
              />
            </Card>
          ) : (
            <>
              <Card style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: Theme.colors.text.primary,
                    marginBottom: 16,
                  }}
                >
                  Step 1: Basic Details
                </Text>

                {/* Number of Rooms */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: Theme.colors.text.primary,
                      marginBottom: 6,
                    }}
                  >
                    Number of Rooms{" "}
                    <Text style={{ color: Theme.colors.danger }}>*</Text>
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F8FAFC",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: errors.numRooms
                        ? Theme.colors.danger
                        : Theme.colors.border,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={Theme.colors.text.secondary}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      value={numRooms}
                      onChangeText={handleNumRoomsChange}
                      placeholder="e.g., 5"
                      keyboardType="numeric"
                      maxLength={2}
                      returnKeyType="next"
                      accessibilityLabel="Number of rooms"
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        fontSize: 14,
                        color: Theme.colors.text.primary,
                      }}
                    />
                  </View>
                  {errors.numRooms && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: Theme.colors.danger,
                        marginTop: 4,
                      }}
                    >
                      {errors.numRooms}
                    </Text>
                  )}
                </View>

                {/* Default Bed Price */}
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: Theme.colors.text.primary,
                      marginBottom: 6,
                    }}
                  >
                    Default Bed Price / Month{" "}
                    <Text style={{ color: Theme.colors.danger }}>*</Text>
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F8FAFC",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: errors.defaultPrice
                        ? Theme.colors.danger
                        : Theme.colors.border,
                      paddingHorizontal: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: Theme.colors.primary + "15",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        marginRight: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: Theme.colors.primary,
                        }}
                      >
                        ₹
                      </Text>
                    </View>
                    <TextInput
                      value={defaultPrice}
                      onChangeText={handleDefaultPriceChange}
                      placeholder="e.g., 5000"
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      accessibilityLabel="Default bed price per month"
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        fontSize: 14,
                        color: Theme.colors.text.primary,
                      }}
                    />
                  </View>
                  {errors.defaultPrice && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: Theme.colors.danger,
                        marginTop: 4,
                      }}
                    >
                      {errors.defaultPrice}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      color: Theme.colors.text.secondary,
                      marginTop: 8,
                    }}
                  >
                    Tip: You can still update individual bed prices later from the Rooms screen.
                  </Text>
                </View>
              </Card>

              {rooms.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      paddingHorizontal: 4,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: Theme.colors.text.primary,
                        }}
                      >
                        Step 2: Rooms & Beds
                      </Text>
                      {isFetchingExistingRooms && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: Theme.colors.text.secondary,
                            marginTop: 2,
                          }}
                        >
                          Checking existing rooms…
                        </Text>
                      )}
                    </View>
                    <AnimatedPressableCard
                      onPress={addRoom}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: Theme.colors.primary + "15",
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={Theme.colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: Theme.colors.primary,
                          marginLeft: 4,
                        }}
                      >
                        Add Room
                      </Text>
                    </AnimatedPressableCard>
                  </View>

                  {rooms.map((room, index) => {
                    const beds = parseInt(room.beds, 10) || 0;
                    const price = parseFloat(room.price) || 0;
                    const total = beds * price;
                    const roomLabel = `Room ${index + 1}`;
                    return (
                      <Card
                        key={room.id}
                        style={{
                          marginBottom: 8,
                          padding: 10,
                          backgroundColor: "#fff",
                          borderWidth: 1,
                          borderColor: Theme.colors.border + "80",
                        }}
                      >
                        {/* Responsive row: Room No | Beds | Price | Delete */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          {/* Room No */}
                          <View style={{ flex: 1, minWidth: 72 }}>
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "700",
                                color: Theme.colors.text.secondary,
                                marginBottom: 3,
                              }}
                            >
                              Room No
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#F8FAFC",
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: errors[`room_${room.id}_roomNo`]
                                  ? Theme.colors.danger
                                  : Theme.colors.border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "700",
                                  color: Theme.colors.primary,
                                  paddingLeft: 8,
                                }}
                              >
                                RM
                              </Text>
                              <TextInput
                                value={room.roomNo}
                                onChangeText={(v) =>
                                  updateRoom(room.id, "roomNo", v)
                                }
                                placeholder="101"
                                keyboardType="numeric"
                                maxLength={6}
                                returnKeyType="next"
                                accessibilityLabel={`${roomLabel} number`}
                                style={{
                                  flex: 1,
                                  paddingVertical: 6,
                                  paddingHorizontal: 3,
                                  fontSize: 13,
                                  color: Theme.colors.text.primary,
                                }}
                              />
                            </View>
                            {errors[`room_${room.id}_roomNo`] && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: Theme.colors.danger,
                                  marginTop: 2,
                                }}
                                numberOfLines={1}
                              >
                                {errors[`room_${room.id}_roomNo`]}
                              </Text>
                            )}
                          </View>

                          {/* Beds */}
                          <View style={{ width: 52 }}>
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "700",
                                color: Theme.colors.text.secondary,
                                marginBottom: 3,
                                textAlign: "center",
                              }}
                            >
                              Beds
                            </Text>
                            <TextInput
                              value={room.beds}
                              onChangeText={(v) =>
                                updateRoom(room.id, "beds", v)
                              }
                              placeholder="2"
                              keyboardType="numeric"
                              maxLength={2}
                              returnKeyType="next"
                              accessibilityLabel={`${roomLabel} number of beds`}
                              style={{
                                backgroundColor: "#F8FAFC",
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: errors[`room_${room.id}_beds`]
                                  ? Theme.colors.danger
                                  : Theme.colors.border,
                                paddingVertical: 6,
                                fontSize: 13,
                                color: Theme.colors.text.primary,
                                textAlign: "center",
                              }}
                            />
                            {errors[`room_${room.id}_beds`] && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: Theme.colors.danger,
                                  marginTop: 2,
                                  textAlign: "center",
                                }}
                                numberOfLines={1}
                              >
                                {errors[`room_${room.id}_beds`]}
                              </Text>
                            )}
                          </View>

                          {/* Price */}
                          <View style={{ flex: 1.5, minWidth: 90 }}>
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "700",
                                color: Theme.colors.text.secondary,
                                marginBottom: 3,
                              }}
                            >
                              Price / Bed
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#F8FAFC",
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: errors[`room_${room.id}_price`]
                                  ? Theme.colors.danger
                                  : Theme.colors.border,
                                paddingHorizontal: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "700",
                                  color: Theme.colors.primary,
                                  marginRight: 3,
                                }}
                              >
                                ₹
                              </Text>
                              <TextInput
                                value={room.price}
                                onChangeText={(v) =>
                                  updateRoom(room.id, "price", v)
                                }
                                placeholder="5000"
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                accessibilityLabel={`${roomLabel} bed price per month`}
                                style={{
                                  flex: 1,
                                  paddingVertical: 6,
                                  fontSize: 13,
                                  color: Theme.colors.text.primary,
                                }}
                              />
                            </View>
                            {errors[`room_${room.id}_price`] && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: Theme.colors.danger,
                                  marginTop: 2,
                                }}
                                numberOfLines={1}
                              >
                                {errors[`room_${room.id}_price`]}
                              </Text>
                            )}
                          </View>

                          {/* Delete */}
                          <AnimatedPressableCard
                            onPress={() => removeRoom(room.id)}
                            accessibilityLabel={`Remove ${roomLabel}`}
                            accessibilityHint="Double tap to remove this room from the setup"
                            style={{
                              width: 28,
                              height: 28,
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                              backgroundColor: Theme.colors.danger + "12",
                              marginBottom: 1,
                            }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={Theme.colors.danger}
                            />
                          </AnimatedPressableCard>
                        </View>

                        {/* Total - always visible below */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 8,
                            paddingTop: 6,
                            borderTopWidth: 1,
                            borderTopColor: Theme.colors.border + "60",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: Theme.colors.text.secondary,
                            }}
                          >
                            Total for this room
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "800",
                              color: beds > 0 ? Theme.colors.primary : Theme.colors.text.secondary,
                            }}
                          >
                            {beds > 0
                              ? `₹${total.toLocaleString("en-IN")}`
                              : "—"}
                          </Text>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}

              {rooms.length > 0 && (
                <Card style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: Theme.colors.text.primary,
                      }}
                    >
                      Total Rooms
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: Theme.colors.primary,
                      }}
                    >
                      {rooms.length}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: Theme.colors.text.primary,
                      }}
                    >
                      Total Beds
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: Theme.colors.primary,
                      }}
                    >
                      {totalBeds}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: Theme.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: Theme.colors.text.primary,
                      }}
                    >
                      Total Monthly Revenue
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: Theme.colors.primary,
                      }}
                    >
                      ₹{totalRevenue.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </Card>
              )}

              {isSubmitting && (
                <Card style={{ marginBottom: 16, borderWidth: 1, borderColor: Theme.colors.primary + "40" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <ActivityIndicator
                      color={Theme.colors.primary}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: Theme.colors.text.primary,
                      }}
                    >
                      Creating rooms & beds…
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View
                    style={{
                      height: 6,
                      backgroundColor: Theme.colors.border + "60",
                      borderRadius: 3,
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        backgroundColor: Theme.colors.primary,
                        borderRadius: 3,
                        width: `${
                          progress.total > 0
                            ? (progress.current / progress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      fontSize: 12,
                      color: Theme.colors.text.secondary,
                      marginBottom: 12,
                    }}
                  >
                    {progress.current} of {progress.total} rooms created
                  </Text>

                  {/* Completed rooms */}
                  {completedRooms.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      {completedRooms.map((roomNo) => (
                        <View
                          key={roomNo}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={Theme.colors.primary}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: Theme.colors.text.secondary,
                              marginLeft: 6,
                            }}
                          >
                            {roomNo} created with beds
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              )}

              {rooms.length > 0 && (
                <Button
                  title="Create Rooms & Beds"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  variant="primary"
                  size="lg"
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};
