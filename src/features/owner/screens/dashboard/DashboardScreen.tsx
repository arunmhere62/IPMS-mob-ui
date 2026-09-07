import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Theme } from "../../../../theme";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPGLocation } from "../../store/slices/pgLocationSlice";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { ScreenLayout } from "../../../../components/ScreenLayout";
import { useBottomNavScrollHandler } from "../../../../components/BottomNavVisibility";
import { QuickActions } from "../../../../components/QuickActions";
import { MonthlyMetricsCard } from "./MonthlyMetricsCard";
import { TicketStatsCard } from "./TicketStatsCard";
import { FollowUpsCard } from "./FollowUpsCard";
import {
  DashboardHeaderSkeleton,
  DashboardMonthlyMetricsSkeleton,
} from "../../../../components/SkeletonLoader";
import { useGetPGLocationsQuery } from "../../api/pgLocationsApi";
import type {
  DashboardSummaryResponse,
  DashboardMonthlyMetricsResponse,
} from "../../api/dashboardApi";
import {
  useGetDashboardSummaryQuery,
  useLazyGetDashboardMonthlyMetricsQuery,
  useGetDashboardTicketStatsQuery,
} from "../../api/dashboardApi";
import { usePermissions } from "../../../../hooks/usePermissions";
import { AppDispatch, RootState } from "../../store";
import { Tenant } from "../../api";
import { AnnouncementBanner } from "../../../../components/AnnouncementBanner";
import { TrialBanner } from "../../../../components/TrialBanner";
import { useOnboardingState } from "@/features/onboarding";

type DashboardRouteName =
  | "PGLocations"
  | "Rooms"
  | "Beds"
  | "Tenants"
  | "RentPayments"
  | "AdvancePayments"
  | "RefundPayments"
  | "Visitors"
  | "Employees"
  | "Expenses"
  | "Settings"
  | "QuickSetup";

export const DashboardScreen: React.FC = () => {
  // All hooks must be called at the top level
  const navigation =
    useNavigation<NavigationProp<Record<DashboardRouteName, undefined>>>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId, isRehydrated } = useSelector(
    (state: RootState) => state.pgLocations
  );
  const appStatus = useSelector((state: RootState) => (state as any).appSettings?.appSettings);
  usePermissions();
  const { hintScreen } = useOnboardingState();
  const [refreshing, setRefreshing] = useState(false);
  const {
    onScroll: bottomNavOnScroll,
    scrollEventThrottle: bottomNavThrottle,
    onScrollEndDrag: bottomNavOnScrollEndDrag,
    onMomentumScrollEnd: bottomNavOnMomentumScrollEnd,
  } = useBottomNavScrollHandler();

  const { data: pgLocationsResponse, refetch: refetchPGLocations } =
    useGetPGLocationsQuery(undefined, {
      skip: false,
    });

  const responseData =
    typeof pgLocationsResponse === "object" &&
    pgLocationsResponse &&
    "data" in (pgLocationsResponse as object)
      ? (pgLocationsResponse as { data?: unknown }).data
      : undefined;

  const locations = Array.isArray(responseData) ? responseData : [];
  const selectedLocationName =
    (locations as Array<{ s_no?: number; location_name?: string }>).find(
      (l) => l?.s_no === selectedPGLocationId
    )?.location_name ?? "our PG";

  const {
    data: dashboardSummaryResponse,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
    error: dashboardError,
  } = useGetDashboardSummaryQuery(undefined, {
    skip: !selectedPGLocationId,
  });

  const dashboardSummary = (
    dashboardSummaryResponse as DashboardSummaryResponse<Tenant> | undefined
  )?.data;
  const bedMetrics = dashboardSummary?.bed_metrics;
  const tenantStatus = dashboardSummary?.tenant_status;

  const [
    getMonthlyMetrics,
    { data: monthlyMetricsResponse, isFetching: monthlyMetricsFetching },
  ] = useLazyGetDashboardMonthlyMetricsQuery();

  const monthlyMetrics = (
    monthlyMetricsResponse as DashboardMonthlyMetricsResponse | undefined
  )?.data;

  const {
    data: ticketStatsResponse,
    isFetching: ticketStatsFetching,
  } = useGetDashboardTicketStatsQuery(undefined, {
    skip: !selectedPGLocationId,
  });

  const ticketStats = ticketStatsResponse?.data;

  // Load initial monthly metrics
  useEffect(() => {
    if (selectedPGLocationId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
      const monthEnd = new Date(year, month + 1, 1).toISOString().split("T")[0];
      getMonthlyMetrics({ monthStart, monthEnd });
    }
  }, [selectedPGLocationId, getMonthlyMetrics]);

  const handleDateRangeChange = useCallback(
    (monthStart?: string, monthEnd?: string) => {
      getMonthlyMetrics({ monthStart, monthEnd });
    },
    [getMonthlyMetrics]
  );

  const dashboardQuickActions = useMemo(
    () => [
      {
        title: "Quick Setup",
        icon: "flash",
        screen: "QuickSetup",
        color: "#6366F1",
      },
      { title: "Rooms", icon: "home", screen: "Rooms", color: "#22C55E" },
      { title: "Tenants", icon: "people", screen: "Tenants", color: "#EC4899" },
      {
        title: "Upcoming Vacancies",
        icon: "calendar-outline",
        screen: "UpcomingVacancies",
        color: "#8B5CF6",
      },
    ],
    []
  );

  const handleQuickActionNavigate = useCallback(
    (screen: string) => {
      // Screens that exist as tabs — navigate within tab navigator to keep bottom nav visible
      const tabScreens = ["Rooms", "Tenants", "UpcomingVacancies", "Dashboard"];
      if (tabScreens.includes(screen)) {
        // Navigate to the tab within MainTabs (sibling tab screens)
        const parent = (navigation as any).getParent?.();
        if (parent) {
          parent.navigate('MainTabs', { screen });
        } else {
          navigation.navigate(screen as never);
        }
      } else {
        // Non-tab screens (e.g. PGLocations) — push onto the parent stack
        const parent = (navigation as any).getParent?.();
        if (parent) {
          parent.navigate(screen as never);
        } else {
          navigation.navigate(screen as never);
        }
      }
    },
    [navigation]
  );

  const formatCurrency = (amount?: number) => {
    const n = Number(amount ?? 0);
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `₹${Math.round(n)}`;
    }
  };

  // Step 2: Auto-select first PG location when locations are loaded (only after rehydration)
  useEffect(() => {
    if (isRehydrated && locations.length > 0 && !selectedPGLocationId) {
      console.log(
        "✅ Auto-selecting first PG location:",
        locations[0].location_name
      );
      dispatch(setSelectedPGLocation(locations[0].s_no));
    }
  }, [locations, selectedPGLocationId, dispatch, isRehydrated]);

  // Step 3: Load all PG-dependent data ONLY after PG location is selected
  useEffect(() => {
    if (selectedPGLocationId) {
      console.log("🚀 PG Location selected, loading dashboard data...");
      loadAllDashboardData();
    }
  }, [selectedPGLocationId]);

  // Step 3: Load all dashboard data after PG location is selected
  const loadAllDashboardData = async () => {
    if (!selectedPGLocationId) {
      console.warn("⚠️ Cannot load dashboard data: No PG location selected");
      return;
    }

    try {
      console.log("📊 Loading dashboard data for PG:", selectedPGLocationId);
      await refetchDashboard();
      console.log("✅ Dashboard data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    if (selectedPGLocationId) {
      console.log("🔄 Refreshing dashboard data...");
      await loadAllDashboardData();
      console.log("🔄 Refreshing monthly metrics...");
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
      const monthEnd = new Date(year, month + 1, 1).toISOString().split("T")[0];
      getMonthlyMetrics({ monthStart, monthEnd });
    } else {
      console.log("🔄 Refreshing PG locations...");
      await refetchPGLocations();
    }

    setRefreshing(false);
  };

  return (
    <ScreenLayout
      backgroundColor={Theme.colors.background.blue}
      contentBackgroundColor={Theme.colors.background.secondary}
    >
      <ScreenHeader title="Dashboard" showPGSelector={true} />
      {appStatus?.show_announcement && appStatus.announcement_title ? (
        <AnnouncementBanner
          title={appStatus.announcement_title}
          message={appStatus.announcement_message}
        />
      ) : null}
      <TrialBanner />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={bottomNavOnScroll}
          scrollEventThrottle={bottomNavThrottle}
          onScrollEndDrag={bottomNavOnScrollEndDrag}
          onMomentumScrollEnd={bottomNavOnMomentumScrollEnd}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            {dashboardFetching ? (
              <DashboardHeaderSkeleton />
            ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Total Beds */}
              <View style={{ flex: 1, backgroundColor: Theme.colors.background.blueLight, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Theme.withOpacity(Theme.colors.primary, 0.2) }}>
                <Text style={{ color: Theme.colors.primary, fontSize: 20, fontWeight: "900" }}>
                  {bedMetrics?.total_beds ?? 0}
                </Text>
                <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                  Total Beds
                </Text>
              </View>
              {/* Occupied */}
              <View style={{ flex: 1, backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Theme.withOpacity(Theme.colors.secondary, 0.2) }}>
                <Text style={{ color: Theme.colors.secondary, fontSize: 20, fontWeight: "900" }}>
                  {bedMetrics?.occupied_beds ?? 0}
                </Text>
                <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                  Occupied
                </Text>
              </View>
              {/* Available */}
              <View style={{ flex: 1, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Theme.withOpacity(Theme.colors.warning, 0.2) }}>
                <Text style={{ color: Theme.colors.warning, fontSize: 20, fontWeight: "900" }}>
                  {bedMetrics ? (bedMetrics.total_beds - bedMetrics.occupied_beds) : 0}
                </Text>
                <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                  Available
                </Text>
              </View>
            </View>
            )}
          </View>

          <QuickActions
            menuItems={dashboardQuickActions}
            onNavigate={handleQuickActionNavigate}
            hintScreen={hintScreen}
          />

          <FollowUpsCard
            tenantStatus={tenantStatus}
            isLoading={dashboardFetching}
            dashboardError={dashboardError}
            selectedLocationName={selectedLocationName}
            navigation={navigation}
          />

          {ticketStats ? (
            <TicketStatsCard
              overview={ticketStats.overview}
              recentTickets={ticketStats.recentTickets}
              unreadTickets={ticketStats.unreadTickets}
              isLoading={ticketStatsFetching}
            />
          ) : null}

          {monthlyMetricsFetching ? (
            <DashboardMonthlyMetricsSkeleton />
          ) : (
            <MonthlyMetricsCard
              monthlyMetrics={monthlyMetrics}
              isFetching={monthlyMetricsFetching}
              onDateRangeChange={handleDateRangeChange}
              formatCurrency={formatCurrency}
            />
          )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
