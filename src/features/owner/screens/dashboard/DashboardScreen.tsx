import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  FlatList,
  RefreshControl,
  Text,
  Linking,
  Alert,
} from "react-native";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Theme } from "../../../../theme";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPGLocation } from "../../store/slices/pgLocationSlice";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { ScreenLayout } from "../../../../components/ScreenLayout";
import { useBottomNavScrollHandler } from "../../../../components/BottomNavVisibility";
import { Card } from "../../../../components/Card";
import { QuickActions } from "../../../../components/QuickActions";
import { MonthlyMetricsCard } from "./MonthlyMetricsCard";
import { TicketStatsCard } from "./TicketStatsCard";
import {
  SkeletonLoader,
  DashboardHeaderSkeleton,
  DashboardMetricsSkeleton,
  DashboardAttentionSkeleton,
  DashboardMonthlyMetricsSkeleton,
} from "../../../../components/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";
import { SlideBottomModal } from "../../../../components/SlideBottomModal";
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
import { useOnboardingTour } from "@/context/OnboardingTourContext";

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
  const { user } = useSelector((state: RootState) => state.auth);
  const appStatus = useSelector((state: RootState) => (state as any).appSettings?.appSettings);
  const isOnboardingComplete = useSelector((state: RootState) => (state as any).rbac?.isOnboardingComplete ?? null);
  const onboardingHasRooms = useSelector((state: RootState) => (state as any).rbac?.onboardingHasRooms ?? false);
  usePermissions();
  const { tourStep, startOnboardingTour, startRoomsFromDashboardTour, advanceTour } = useOnboardingTour();

  // Auto-start tour when onboarding is not complete.
  // If rooms already exist (e.g. from QuickSetup), skip to tap_rooms.
  useEffect(() => {
    if (isOnboardingComplete === false && tourStep === null) {
      if (onboardingHasRooms) {
        startRoomsFromDashboardTour();
      } else {
        startOnboardingTour();
      }
    }
  }, [isOnboardingComplete, onboardingHasRooms, tourStep, startOnboardingTour, startRoomsFromDashboardTour]);
  const [refreshing, setRefreshing] = useState(false);
  const [attentionTab, setAttentionTab] = useState<
    "pending_rent" | "partial_rent" | "without_advance"
  >("pending_rent");
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);
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
      // Advance tour if user tapped Quick Setup during onboarding
      if (screen === "QuickSetup" && tourStep === 'tap_quick_setup') {
        advanceTour();
      }
      // Advance tour if user tapped Rooms during onboarding
      if (screen === "Rooms" && tourStep === 'tap_rooms') {
        advanceTour();
      }
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
    [navigation, tourStep, advanceTour]
  );

  const getGapSnapshotForTab = useCallback(
    (
      tab: "pending_rent" | "partial_rent" | "without_advance",
      tenant?: Tenant
    ): {
      gapCount: number;
      gapDueAmount?: number;
      gaps: Array<{ gapStart?: unknown; gapEnd?: unknown }>;
    } => {
      if (!tenant) return { gapCount: 0, gapDueAmount: undefined, gaps: [] };

      const readNum = (v: unknown): number | undefined => {
        const n =
          typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
        return Number.isFinite(n) ? n : undefined;
      };

      const readCount = (v: unknown): number => {
        const n = readNum(v);
        return typeof n === "number" ? n : 0;
      };

      if (tab === "pending_rent") {
        const unpaidMonths = (
          tenant as unknown as {
            unpaid_months?: Array<{ cycle_start?: string; cycle_end?: string }>;
          }
        )?.unpaid_months ?? [];
        const gaps = unpaidMonths.map((m) => ({
          gapStart: m?.cycle_start ?? "",
          gapEnd: m?.cycle_end ?? "",
        }));
        return {
          gapCount: gaps.length,
          gapDueAmount: readNum(
            (tenant as unknown as { pending_due_amount?: unknown })
              ?.pending_due_amount
          ),
          gaps,
        };
      }

      if (tab === "partial_rent") {
        const unpaidMonths = (
          tenant as unknown as {
            unpaid_months?: Array<{ cycle_start?: string; cycle_end?: string }>;
          }
        )?.unpaid_months ?? [];
        const gaps = unpaidMonths.map((m) => ({
          gapStart: m?.cycle_start ?? "",
          gapEnd: m?.cycle_end ?? "",
        }));
        return {
          gapCount: gaps.length,
          gapDueAmount: readNum(
            (tenant as unknown as { partial_due_amount?: unknown })
              ?.partial_due_amount
          ),
          gaps,
        };
      }

      // Fallback for without advance: keep legacy gap fields (if present)
      return {
        gapCount: readCount(
          (tenant as unknown as { gap_count?: unknown })?.gap_count
        ),
        gapDueAmount: readNum(
          (tenant as unknown as { gap_due_amount?: unknown })?.gap_due_amount
        ),
        gaps:
          (
            tenant as unknown as {
              gaps?: Array<{ gapStart?: unknown; gapEnd?: unknown }>;
            }
          )?.gaps ?? [],
      };
    },
    []
  );

  const normalizePhone = (raw?: string) => {
    if (!raw) return "";
    const digits = String(raw).replace(/[^0-9]/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  const buildWhatsAppTemplate = (
    type: "pending_rent" | "partial_rent" | "without_advance",
    tenant?: Tenant
  ): string | null => {
    const name = tenant?.name?.trim() ? tenant.name.trim() : "there";

    const { gapCount, gapDueAmount, gaps } = getGapSnapshotForTab(type, tenant);

    const gapPeriodsLine = (() => {
      if (!Array.isArray(gaps) || gaps.length === 0) return "";
      const first = gaps
        .slice(0, 2)
        .map((g) => {
          const s = String(g?.gapStart ?? "").trim();
          const e = String(g?.gapEnd ?? "").trim();
          if (!s || !e) return "";
          return `${s} to ${e}`;
        })
        .filter(Boolean);
      if (first.length === 0) return "";
      return `\n🗓️ Due period(s): ${first.join(", ")}`;
    })();

    const pendingAmount =
      typeof gapDueAmount === "number"
        ? gapDueAmount
        : typeof tenant?.pending_due_amount === "number"
        ? tenant.pending_due_amount
        : typeof tenant?.rent_due_amount === "number"
        ? tenant.rent_due_amount
        : typeof tenant?.pending_payment?.total_pending === "number"
        ? tenant.pending_payment.total_pending
        : undefined;

    const remainingPartial =
      typeof gapDueAmount === "number"
        ? gapDueAmount
        : typeof tenant?.partial_due_amount === "number"
        ? tenant.partial_due_amount
        : typeof tenant?.pending_payment?.current_month_pending === "number"
        ? tenant.pending_payment.current_month_pending
        : undefined;

    const amountLine = (amount?: number) => {
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
        return "";
      return `\n📌 Amount due: ${formatCurrency(amount)}`;
    };

    const monthsLine = (months?: number) => {
      if (typeof months !== "number" || !Number.isFinite(months) || months <= 0)
        return "";
      return `\n🗓️ Pending months: ${months}`;
    };

    if (type === "pending_rent") {
      if (
        typeof pendingAmount !== "number" ||
        !Number.isFinite(pendingAmount) ||
        pendingAmount <= 0
      ) {
        return null;
      }
      return (
        `Hi ${name},\n\n` +
        `💰 This is ${selectedLocationName} management. Friendly reminder that your rent is pending.` +
        amountLine(pendingAmount) +
        (gapCount > 0 ? `\n📍 Missed cycles: ${gapCount}` : "") +
        gapPeriodsLine +
        monthsLine(tenant?.pending_months) +
        `\n\n✅ Kindly make the payment at your earliest convenience.\n` +
        `If you have already paid, please share the confirmation.\n\n` +
        `🙏 Thank you.`
      );
    }

    if (type === "partial_rent") {
      if (
        typeof remainingPartial !== "number" ||
        !Number.isFinite(remainingPartial) ||
        remainingPartial <= 0
      ) {
        return null;
      }
      return (
        `Hi ${name},\n\n` +
        `💰 This is ${selectedLocationName} management. We have received a partial rent payment.` +
        amountLine(remainingPartial) +
        (gapCount > 0 ? `\n📍 Missed cycles: ${gapCount}` : "") +
        gapPeriodsLine +
        `\n\n✅ Kindly pay the remaining amount at your earliest convenience.\n` +
        `If there is any issue, please message us—we will help.\n\n` +
        `🙏 Thank you.`
      );
    }

    return (
      `Hi ${name},\n\n` +
      `🧾 This is ${selectedLocationName} management. Gentle reminder regarding your advance/security deposit.` +
      `\n\n✅ Kindly pay it at your earliest convenience to complete the onboarding formalities.` +
      `\n📎 If you have already paid, please share the receipt/confirmation.` +
      `\n\n🙏 Thank you.`
    );
  };

  const openCall = async (raw?: string) => {
    const digits = normalizePhone(raw);
    if (!digits) {
      Alert.alert(
        "No phone number",
        "This tenant does not have a phone number."
      );
      return;
    }

    try {
      const url = `tel:${digits}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert(
          "Cannot place call",
          "Calling is not supported on this device."
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Call failed", "Unable to open phone dialer.");
    }
  };

  const openWhatsApp = async (raw?: string, message?: string) => {
    const digits = normalizePhone(raw);
    if (!digits) {
      Alert.alert(
        "No WhatsApp number",
        "This tenant does not have a WhatsApp number."
      );
      return;
    }

    try {
      const encodedText = message ? encodeURIComponent(message) : "";
      const appUrl = encodedText
        ? `whatsapp://send?phone=${digits}&text=${encodedText}`
        : `whatsapp://send?phone=${digits}`;
      const webUrl = encodedText
        ? `https://wa.me/${digits}?text=${encodedText}`
        : `https://wa.me/${digits}`;

      const canApp = await Linking.canOpenURL(appUrl);
      const urlToOpen = canApp ? appUrl : webUrl;
      const can = await Linking.canOpenURL(urlToOpen);

      if (!can) {
        Alert.alert(
          "WhatsApp not available",
          "WhatsApp is not installed or cannot be opened on this device."
        );
        return;
      }

      await Linking.openURL(urlToOpen);
    } catch {
      Alert.alert(
        "WhatsApp failed",
        "Unable to open WhatsApp for this tenant."
      );
    }
  };

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

  const getInitials = (name?: string) => {
    const n = String(name ?? "").trim();
    if (!n) return "T";
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "T";
    const b = parts.length > 1 ? parts[1]?.[0] ?? "" : "";
    return (a + b).toUpperCase();
  };

  const widgetItems = useMemo(
    () =>
      [
        {
          key: "pending_rent" as const,
          title: "Pending Rent",
          subtitle: "Collect dues quickly",
          tint: "#EF4444",
          icon: "alert-circle" as const,
          count: tenantStatus?.pending_rent?.count ?? 0,
          tenants: (tenantStatus?.pending_rent?.tenants ?? []) as Tenant[],
        },
        {
          key: "partial_rent" as const,
          title: "Partial Rent",
          subtitle: "Follow-up needed",
          tint: "#F59E0B",
          icon: "warning" as const,
          count: tenantStatus?.partial_rent?.count ?? 0,
          tenants: (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[],
        },
        {
          key: "without_advance" as const,
          title: "No Advance",
          subtitle: "Request security deposit",
          tint: "#3B82F6",
          icon: "wallet" as const,
          count: tenantStatus?.without_advance?.count ?? 0,
          tenants: tenantStatus?.without_advance?.tenants ?? [],
        },
      ] as const,
    [tenantStatus]
  );

  const selectedAttention =
    widgetItems.find((w) => w.key === attentionTab) ?? widgetItems[0];

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
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {dashboardFetching ? (
              <DashboardHeaderSkeleton />
            ) : (
            <View
              style={{
                backgroundColor: Theme.colors.background.blueMedium,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      color: Theme.colors.text.primary,
                      fontSize: 18,
                      fontWeight: "900",
                    }}
                  >
                    Owner Dashboard
                  </Text>
                  <Text
                    style={{
                      color: Theme.colors.text.secondary,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Track occupancy, revenue & follow-ups
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <AnimatedPressableCard
                    onPress={() => setShowOwnerInfo(true)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Theme.colors.light,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={18}
                      color={Theme.colors.text.secondary}
                    />
                  </AnimatedPressableCard>

                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: Theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#fff" />
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Theme.colors.text.secondary,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit minimumFontScale={0.85}
                  >
                    TOTAL BEDS
                  </Text>
                  <Text
                    style={{
                      color: Theme.colors.text.primary,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                  >
                    {bedMetrics?.total_beds ?? (dashboardFetching ? "—" : 0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Theme.colors.text.secondary,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit minimumFontScale={0.85}
                  >
                    OCCUPIED
                  </Text>
                  <Text
                    style={{
                      color: Theme.colors.text.primary,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                  >
                    {bedMetrics?.occupied_beds ?? (dashboardFetching ? "—" : 0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Theme.colors.text.secondary,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit minimumFontScale={0.85}
                  >
                    OCCUPANCY
                  </Text>
                  <Text
                    style={{
                      color: Theme.colors.text.primary,
                      fontSize: 18,
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                  >
                    {typeof bedMetrics?.occupancy_rate === "number"
                      ? `${bedMetrics.occupancy_rate.toFixed(0)}%`
                      : dashboardFetching
                      ? "—"
                      : "0%"}
                  </Text>
                </View>
              </View>
            </View>
            )}
          </View>

          <SlideBottomModal
            visible={showOwnerInfo}
            onClose={() => setShowOwnerInfo(false)}
            title="Dashboard explained"
            subtitle={
              selectedLocationName ? `For ${selectedLocationName}` : undefined
            }
            submitLabel="Got it"
            onSubmit={() => setShowOwnerInfo(false)}
          >
            <View style={{ gap: 14 }}>
              <View>
                <Text
                  style={{
                    color: Theme.colors.text.primary,
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  Occupancy
                </Text>
                <Text
                  style={{
                    color: Theme.colors.text.secondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  How many beds are currently occupied out of total beds.
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    color: Theme.colors.text.primary,
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  PG Value
                </Text>
                <Text
                  style={{
                    color: Theme.colors.text.secondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Total monthly rent value of beds (overall capacity).
                </Text>
              </View>
            </View>
          </SlideBottomModal>

          <QuickActions
            menuItems={dashboardQuickActions}
            onNavigate={handleQuickActionNavigate}
            tourHintScreen={
              tourStep === 'tap_quick_setup' ? 'QuickSetup'
              : tourStep === 'tap_rooms' ? 'Rooms'
              : null
            }
          />

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {!!dashboardError && (
              <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 10 }}>
                Failed to load dashboard summary. Pull to refresh.
              </Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {dashboardFetching ? (
              <DashboardAttentionSkeleton />
            ) : (
              <>
            <Text
              style={{
                color: Theme.colors.text.primary,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              Attention Required
            </Text>
            <Text
              style={{
                color: Theme.colors.text.secondary,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Quick follow-ups for pending rent and advance
            </Text>
            </>
            )}
          </View>

          {dashboardFetching ? null : (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <View style={{ borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 16, padding: 14, backgroundColor: Theme.colors.background.secondary }}>
            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {widgetItems.map((w) => {
                const active = w.key === attentionTab;
                return (
                  <AnimatedPressableCard
                    key={w.key}
                    onPress={() => setAttentionTab(w.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: active ? w.tint : "#F3F4F6",
                    }}
                  >
                    <Ionicons
                      name={w.icon}
                      size={14}
                      color={active ? "#fff" : Theme.colors.text.secondary}
                    />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={{
                        color: active ? "#fff" : Theme.colors.text.primary,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {w.title}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 999,
                        backgroundColor: active ? "rgba(255,255,255,0.25)" : Theme.withOpacity(w.tint, 0.12),
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#fff" : w.tint,
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        {w.count}
                      </Text>
                    </View>
                  </AnimatedPressableCard>
                );
              })}
            </ScrollView>

            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {selectedAttention?.subtitle ?? ""}
              </Text>
              <AnimatedPressableCard onPress={() => navigation.navigate("Tenants")}>
                <Text
                  style={{
                    color: Theme.colors.primary,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  See all
                </Text>
              </AnimatedPressableCard>
            </View>

            {/* Tenant list */}
            {!selectedAttention || selectedAttention.tenants.length === 0 ? (
              <View
                style={{
                  height: 340,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                <Text
                  style={{
                    color: Theme.colors.text.primary,
                    fontSize: 14,
                    fontWeight: "800",
                    marginTop: 8,
                  }}
                >
                  All good!
                </Text>
                <Text
                  style={{
                    color: Theme.colors.text.secondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  No tenants need attention here.
                </Text>
              </View>
            ) : (
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={{ height: 340 }}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              >
                {selectedAttention.tenants.map((t) => {
                  const phone = t.phone_no;
                  const whatsapp = t.whatsapp_number ?? t.phone_no;
                  const roomNo = t.rooms?.room_no;
                  const bedNo = t.beds?.bed_no;

                  const { gapCount: _gapCount, gapDueAmount, gaps: _gaps } =
                    getGapSnapshotForTab(attentionTab, t);

                  const duePeriodText = (() => {
                    if (attentionTab === "without_advance") return null;
                    if (!Array.isArray(_gaps) || _gaps.length === 0)
                      return "Due period not available";
                    const first = _gaps[0] as {
                      gapStart?: unknown;
                      gapEnd?: unknown;
                    };
                    const s = String(first?.gapStart ?? "").trim();
                    const e = String(first?.gapEnd ?? "").trim();
                    if (!s || !e) return "Due period not available";
                    return `${s} to ${e}`;
                  })();

                  const openTenantDetails = () => {
                    if (typeof t?.s_no !== "number") return;
                    (
                      navigation as unknown as {
                        navigate: (
                          screen: string,
                          params?: unknown
                        ) => void;
                      }
                    ).navigate("TenantDetails", { tenantId: t.s_no });
                  };

                  const onPressWhatsApp = () => {
                    const msg = buildWhatsAppTemplate(attentionTab, t);
                    if (!msg) {
                      Alert.alert(
                        "Amount not available",
                        "Due amount is not available for this tenant. Please open tenant details and verify the pending amount."
                      );
                      return;
                    }
                    openWhatsApp(whatsapp, msg);
                  };

                  return (
                    <AnimatedPressableCard
                      key={t.s_no}
                      onPress={openTenantDetails}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: Theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: Theme.withOpacity(
                            selectedAttention?.tint ?? Theme.colors.primary,
                            0.12
                          ),
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: selectedAttention?.tint ?? Theme.colors.primary,
                            fontSize: 13,
                            fontWeight: "800",
                          }}
                        >
                          {getInitials(t.name)}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: Theme.colors.text.primary,
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {t.name ?? "Tenant"}
                        </Text>
                        <Text
                          style={{
                            color: Theme.colors.text.secondary,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {roomNo ? `Room ${roomNo}` : "Room —"}
                          {bedNo ? ` · Bed ${bedNo}` : ""}
                          {typeof gapDueAmount === "number"
                            ? ` · ${formatCurrency(gapDueAmount)}`
                            : ""}
                        </Text>
                        {!!duePeriodText && (
                          <Text
                            style={{
                              color: Theme.colors.text.tertiary,
                              fontSize: 10,
                              marginTop: 2,
                            }}
                          >
                            {duePeriodText}
                          </Text>
                        )}
                      </View>

                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <AnimatedPressableCard
                          onPress={() => openCall(phone)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.1),
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="call" size={15} color={Theme.colors.primary} />
                        </AnimatedPressableCard>
                        <AnimatedPressableCard
                          onPress={onPressWhatsApp}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: "#DCFCE7",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="logo-whatsapp" size={15} color="#22C55E" />
                        </AnimatedPressableCard>
                      </View>
                    </AnimatedPressableCard>
                  );
                })}
              </ScrollView>
            )}
          </View>
          </View>
          )}

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
