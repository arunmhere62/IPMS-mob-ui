import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Card } from "../../../../components/Card";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { SkeletonLoader } from "../../../../components/SkeletonLoader";
import { Theme } from "../../../../theme";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { ScreenLayout } from "../../../../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { useGetAllRoomsQuery } from "../../api/roomsApi";
import { useBottomNavScrollHandler } from "../../../../components/BottomNavVisibility";
import { TenantsFilterModal } from "./TenantsFilterModal";
import { Tenant, useLazyGetTenantsQuery } from "../../api";
import { RootState } from "../../store";
import { useOnboardingTour } from "../../../../context/OnboardingTourContext";
import { TenantCard } from "./TenantCard";

interface TenantsScreenProps {
  navigation: any;
}

export const TenantsScreen: React.FC<TenantsScreenProps> = ({ navigation }) => {
  const route = useRoute<any>();
  const { selectedPGLocationId } = useSelector(
    (state: RootState) => state?.pgLocations
  );
  const {
    onScroll: bottomNavOnScroll,
    scrollEventThrottle: bottomNavThrottle,
    onScrollEndDrag: bottomNavOnScrollEndDrag,
    onMomentumScrollEnd: bottomNavOnMomentumScrollEnd,
  } = useBottomNavScrollHandler();

  const [triggerTenants, tenantsQuery] = useLazyGetTenantsQuery();

  const roomsQuery = useGetAllRoomsQuery(
    selectedPGLocationId
      ? { pg_id: selectedPGLocationId, page: 1, limit: 1000 }
      : (undefined as any),
    { skip: !selectedPGLocationId }
  );

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "CHECKED_OUT"
  >("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingRentFilter, setPendingRentFilter] = useState(false);
  const [pendingAdvanceFilter, setPendingAdvanceFilter] = useState(false);
  const [partialRentFilter, setPartialRentFilter] = useState(false);

  const flatListRef = React.useRef<any>(null);
  const scrollPositionRef = React.useRef(0);
  const hasLoadedOnceRef = React.useRef(false);
  const forceRefreshRef = React.useRef(false);

  // Rooms list for filter (independent of tenant list filters)
  const rooms = React.useMemo(() => {
    const apiRooms = (roomsQuery.data as any)?.data;
    return Array.isArray(apiRooms) ? apiRooms : [];
  }, [roomsQuery.data]);

  useEffect(() => {
    // PG changed: reset filters/search to avoid carrying previous PG's filter state
    setSearchQuery("");
    setAppliedSearch("");
    setStatusFilter("ALL");
    setSelectedRoomId(null);
    setPendingRentFilter(false);
    setPendingAdvanceFilter(false);
    setPartialRentFilter(false);
    setShowFilters(false);
    scrollPositionRef.current = 0;
    setCurrentPage(1);
    setHasMore(true);
    hasLoadedOnceRef.current = false;
    loadTenants(1, true, {
      searchQuery: "",
      statusFilter: "ALL",
      selectedRoomId: null,
      pendingRentFilter: false,
      pendingAdvanceFilter: false,
      partialRentFilter: false,
    });
    setShouldReloadOnFocus(false);
  }, [selectedPGLocationId]); // Only reload when PG location changes, not on filter changes

  // Track if we need to reload data (only when filters change, not on navigation return)
  const [shouldReloadOnFocus, setShouldReloadOnFocus] = useState(false);

  // Reload tenants when screen comes into focus (only if needed)
  useFocusEffect(
    React.useCallback(() => {
      const shouldRefresh = route?.params?.refresh || forceRefreshRef.current;

      if (shouldRefresh) {
        console.log("Refresh parameter detected, refreshing tenant list");
        setCurrentPage(1);
        setHasMore(true);
        // Soft refresh: keep current list visible while we fetch fresh data
        loadTenants(1, true, undefined, tenants.length > 0);
        // Clear the refresh parameter and ref
        navigation.setParams({ refresh: undefined });
        forceRefreshRef.current = false;
      } else if (shouldReloadOnFocus || !hasLoadedOnceRef.current) {
        setCurrentPage(1);
        setHasMore(true);
        loadTenants(1, true);
        setShouldReloadOnFocus(false);
      } else {
        // Restore scroll position when returning from navigation
        setTimeout(() => {
          if (flatListRef.current && scrollPositionRef.current > 0) {
            flatListRef.current.scrollToOffset({
              offset: scrollPositionRef.current,
              animated: false,
            });
          }
        }, 100); // Small delay to ensure list is rendered
      }
    }, [shouldReloadOnFocus, navigation, route?.params, tenants.length])
  );

  const loadTenants = async (
    page: number,
    reset: boolean = false,
    overrides?: Partial<{
      searchQuery: string;
      statusFilter: "ALL" | "ACTIVE" | "INACTIVE" | "CHECKED_OUT";
      selectedRoomId: number | null;
      pendingRentFilter: boolean;
      pendingAdvanceFilter: boolean;
      partialRentFilter: boolean;
    }>,
    softReset: boolean = false
  ) => {
    if (!selectedPGLocationId) {
      console.log("Skipping tenant load: no PG location selected");
      return;
    }

    try {
      if (tenantsQuery.isFetching && !reset) return;
      if (!hasMore && !reset) return;

      if (reset && !softReset) {
        setTenants([]);
        setPagination(null);
      }

      const effectiveSearchQuery = overrides?.searchQuery ?? appliedSearch;
      const effectiveStatusFilter = overrides?.statusFilter ?? statusFilter;
      const effectiveSelectedRoomId =
        overrides?.selectedRoomId ?? selectedRoomId;
      const effectivePendingRentFilter =
        overrides?.pendingRentFilter ?? pendingRentFilter;
      const effectivePendingAdvanceFilter =
        overrides?.pendingAdvanceFilter ?? pendingAdvanceFilter;
      const effectivePartialRentFilter =
        overrides?.partialRentFilter ?? partialRentFilter;

      // When room filter is active, fetch all tenants from that room
      const isRoomFiltered = effectiveSelectedRoomId !== null;

      const params = {
        page: isRoomFiltered ? 1 : page,
        limit: isRoomFiltered ? 1000 : 20, // Increased from 10 to 20 for better infinite scroll
        search: effectiveSearchQuery || undefined,
        status:
          effectiveStatusFilter === "ALL" ? undefined : effectiveStatusFilter,
        room_id:
          effectiveSelectedRoomId !== null
            ? effectiveSelectedRoomId
            : undefined,
        pending_rent: effectivePendingRentFilter ? true : undefined,
        pending_advance: effectivePendingAdvanceFilter ? true : undefined,
        partial_rent: effectivePartialRentFilter ? true : undefined,
      };

      console.log("Loading tenants with params:", params);
      const result = await triggerTenants(params).unwrap();

      const nextData = Array.isArray(result?.data)
        ? (result.data as Tenant[])
        : [];
      hasLoadedOnceRef.current = true;
      setTenants((prev) => {
        const nextTenants =
          reset || page <= 1 || isRoomFiltered
            ? nextData
            : [...prev, ...nextData];

        return nextTenants;
      });
      setPagination(result?.pagination || null);

      // Debug: Log tenant statuses when using pending filter
      if (pendingRentFilter && result.data) {
        console.log(
          "Pending filter active - tenant statuses:",
          result.data.map((t) => ({
            name: t.name,
            is_rent_paid: t.is_rent_paid,
            is_rent_partial: t.is_rent_partial,
            pending_months: t.pending_months,
            rent_due_amount: t.rent_due_amount,
            partial_due_amount: t.partial_due_amount,
            pending_due_amount: t.pending_due_amount,
            rent_payments: t.rent_payments?.map((p) => ({
              status: p.status,
              amount: p.amount_paid,
            })),
          }))
        );
      }

      setHasMore(
        result.pagination ? page < result.pagination.totalPages : false
      );
      setCurrentPage(reset ? 1 : page);

      // Scroll to top when resetting
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error("Error loading tenants:", error);
    } finally {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1);
      setHasMore(true);
      // Soft refresh: keep list visible and show spinner
      await loadTenants(1, true, undefined, tenants.length > 0);
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    console.log("Applying filters:", {
      statusFilter,
      selectedRoomId,
      pendingRentFilter,
      pendingAdvanceFilter,
      partialRentFilter,
    });
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true);
  };

  const handleSearch = () => {
    const next = searchQuery.trim();
    setAppliedSearch(next);
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true, { searchQuery: next });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true, { searchQuery: "" });
  };

  const loadMoreTenants = () => {
    if (!hasMore || tenantsQuery.isFetching || selectedRoomId !== null) return;

    const nextPage = currentPage + 1;
    loadTenants(nextPage, false);
  };

  const TenantsListSkeleton = React.useCallback(() => {
    const items = Array.from({ length: 8 });
    return (
      <View style={{ padding: 16 }}>
        {items.map((_, idx) => (
          <View key={idx} style={{ marginBottom: 8 }}>
            <Card style={{ padding: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="60%" height={14} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="40%" height={11} />
                </View>
                <SkeletonLoader width={36} height={16} borderRadius={8} />
              </View>
              <View style={{ flexDirection: "row", gap: 5, marginTop: 8 }}>
                <SkeletonLoader width={50} height={16} borderRadius={8} />
                <SkeletonLoader width={60} height={16} borderRadius={8} />
                <SkeletonLoader width={55} height={16} borderRadius={8} />
              </View>
            </Card>
          </View>
        ))}
      </View>
    );
  }, []);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setSelectedRoomId(null);
    setPendingRentFilter(false);
    setPendingAdvanceFilter(false);
    setPartialRentFilter(false);
    setCurrentPage(1);
    setHasMore(true);
    loadTenants(1, true, {
      statusFilter: "ALL",
      selectedRoomId: null,
      pendingRentFilter: false,
      pendingAdvanceFilter: false,
      partialRentFilter: false,
    });
  };

  const { tourStep, advanceTour } = useOnboardingTour();

  const tenantPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (tourStep === 'tap_tenant') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(tenantPulse, { toValue: 1.15, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(tenantPulse, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      tenantPulse.setValue(1);
    }
  }, [tourStep]);

  const getFilterCount = () => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (selectedRoomId !== null) count++;
    if (pendingRentFilter) count++;
    if (pendingAdvanceFilter) count++;
    if (partialRentFilter) count++;
    return count;
  };

  const renderTenantCard = ({ item, index }: any) => (
    <TenantCard
      tenant={item}
      index={index}
      onPress={(id) => navigation.navigate("TenantDetails", { tenantId: id })}
      tourStep={tourStep}
      advanceTour={advanceTour}
      tenantPulse={tenantPulse}
    />
  );

  return (
    <ScreenLayout
      backgroundColor={Theme.colors.background.blue}
      contentBackgroundColor={Theme.colors.background.secondary}
    >
      <ScreenHeader
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title="Tenants"
        subtitle={`Showing ${tenants.length} of ${
          pagination?.total || 0
        } tenants`}
      />

      {/* Search & Filter Bar */}
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
              lineHeight: 18,
              minHeight: 40,
              textAlignVertical: 'center',
            }}
            placeholder="Search by name..."
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
            <Ionicons name="search" size={18} color="#fff" />
          </AnimatedPressableCard>
          {!!appliedSearch && (
            <AnimatedPressableCard
              onPress={clearSearch}
              style={{
                backgroundColor: Theme.colors.light,
                borderRadius: 8,
                paddingHorizontal: 14,
                justifyContent: "center",
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <Ionicons
                name="close"
                size={18}
                color={Theme.colors.text.secondary}
              />
            </AnimatedPressableCard>
          )}
          <AnimatedPressableCard
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor:
                getFilterCount() > 0
                  ? Theme.colors.primary
                  : Theme.colors.light,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons
              name="filter"
              size={18}
              color={getFilterCount() > 0 ? "#fff" : Theme.colors.text.primary}
            />
            {getFilterCount() > 0 && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: Theme.colors.primary,
                  }}
                >
                  {getFilterCount()}
                </Text>
              </View>
            )}
          </AnimatedPressableCard>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Filter Modal */}
        <TenantsFilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          rooms={rooms}
          statusFilter={statusFilter}
          selectedRoomId={selectedRoomId}
          pendingRentFilter={pendingRentFilter}
          pendingAdvanceFilter={pendingAdvanceFilter}
          partialRentFilter={partialRentFilter}
          onStatusChange={setStatusFilter}
          onRoomChange={setSelectedRoomId}
          onPendingRentChange={setPendingRentFilter}
          onPendingAdvanceChange={setPendingAdvanceFilter}
          onPartialRentChange={setPartialRentFilter}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {selectedRoomId !== null && (
          <View
            style={{
              backgroundColor: "#EFF6FF",
              borderLeftWidth: 4,
              borderLeftColor: Theme.colors.primary,
              padding: 12,
              marginHorizontal: 16,
              marginTop: 8,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: Theme.colors.primary,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              🏠 Showing all tenants from selected room ({tenants.length} total)
            </Text>
          </View>
        )}

        {/* Tenants List */}
        {(tenantsQuery.isUninitialized || tenantsQuery.isFetching) &&
        tenants.length === 0 ? (
          <TenantsListSkeleton />
        ) : (
          <>
            {tenantsQuery.isError && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: "#FEF3C7",
                  borderWidth: 1,
                  borderColor: "#FCD34D",
                }}
              >
                <Text
                  style={{
                    color: "#92400E",
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  Unable to refresh tenant list
                </Text>
                <Text
                  style={{ color: "#B45309", fontSize: 13, marginBottom: 8 }}
                >
                  {(tenantsQuery.error as any)?.data?.message ||
                    (tenantsQuery.error as any)?.error ||
                    "Unable to load tenants. Please try again."}
                </Text>
                <AnimatedPressableCard
                  onPress={() => loadTenants(currentPage, tenants.length === 0)}
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: "#F59E0B",
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontWeight: "600", fontSize: 12 }}
                  >
                    Retry
                  </Text>
                </AnimatedPressableCard>
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={tenants}
              renderItem={renderTenantCard}
              keyExtractor={(item) => String(item?.s_no ?? Math.random())}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Theme.colors.primary]}
                />
              }
              ListEmptyComponent={
                tenantsQuery.isSuccess && !tenantsQuery.isFetching ? (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 60,
                    }}
                  >
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: Theme.colors.text.primary,
                      }}
                    >
                      No Tenants Found
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: Theme.colors.text.secondary,
                        marginTop: 8,
                      }}
                    >
                      {selectedRoomId
                        ? "No tenants in this room"
                        : "Add your first tenant to get started"}
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                tenantsQuery.isFetching && currentPage > 1 ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator
                      size="small"
                      color={Theme.colors.primary}
                    />
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 8,
                        fontSize: 12,
                        color: Theme.colors.text.secondary,
                      }}
                    >
                      Loading more...
                    </Text>
                  </View>
                ) : null
              }
              onEndReached={loadMoreTenants}
              onEndReachedThreshold={0.5}
              onScroll={(event) => {
                scrollPositionRef.current = event.nativeEvent.contentOffset.y;
                bottomNavOnScroll(event);
              }}
              onScrollEndDrag={bottomNavOnScrollEndDrag}
              onMomentumScrollEnd={bottomNavOnMomentumScrollEnd}
              scrollEventThrottle={bottomNavThrottle}
            />
          </>
        )}
      </View>
    </ScreenLayout>
  );
};
