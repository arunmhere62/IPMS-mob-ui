import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import { Theme } from "../../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { DashboardAttentionSkeleton } from "../../../../components/SkeletonLoader";
import type { Tenant } from "../../api";

type AttentionTab = "pending_rent" | "partial_rent" | "without_advance";

interface FollowUpsCardProps {
  tenantStatus?: {
    pending_rent: { count: number; tenants: Tenant[] };
    partial_rent: { count: number; tenants: Tenant[] };
    without_advance: { count: number; tenants: Tenant[] };
  } | null;
  isLoading: boolean;
  dashboardError?: unknown;
  selectedLocationName?: string;
  navigation: any;
}

const normalizePhone = (raw?: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
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

export const FollowUpsCard: React.FC<FollowUpsCardProps> = ({
  tenantStatus,
  isLoading,
  dashboardError,
  selectedLocationName,
  navigation,
}) => {
  const [attentionTab, setAttentionTab] = useState<AttentionTab>("pending_rent");

  const getGapSnapshotForTab = useCallback(
    (
      tab: AttentionTab,
      tenant?: Tenant,
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
              ?.pending_due_amount,
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
              ?.partial_due_amount,
          ),
          gaps,
        };
      }

      return {
        gapCount: readCount(
          (tenant as unknown as { gap_count?: unknown })?.gap_count,
        ),
        gapDueAmount: readNum(
          (tenant as unknown as { gap_due_amount?: unknown })?.gap_due_amount,
        ),
        gaps:
          (
            tenant as unknown as {
              gaps?: Array<{ gapStart?: unknown; gapEnd?: unknown }>;
            }
          )?.gaps ?? [],
      };
    },
    [],
  );

  const buildWhatsAppTemplate = (
    type: AttentionTab,
    tenant?: Tenant,
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
      Alert.alert("No phone number", "This tenant does not have a phone number.");
      return;
    }
    try {
      const url = `tel:${digits}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert("Cannot place call", "Calling is not supported on this device.");
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
      Alert.alert("No WhatsApp number", "This tenant does not have a WhatsApp number.");
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
        Alert.alert("WhatsApp not available", "WhatsApp is not installed or cannot be opened on this device.");
        return;
      }
      await Linking.openURL(urlToOpen);
    } catch {
      Alert.alert("WhatsApp failed", "Unable to open WhatsApp for this tenant.");
    }
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
    [tenantStatus],
  );

  const selectedAttention =
    widgetItems.find((w) => w.key === attentionTab) ?? widgetItems[0];

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Follow Ups</Text>
        <View style={{ marginTop: 12 }}>
          <DashboardAttentionSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <Text style={styles.sectionTitle}>Follow Ups</Text>

      {!!dashboardError && (
        <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 10 }}>
          Failed to load. Pull to refresh.
        </Text>
      )}

      <View style={{ marginTop: 12 }}>
        <View style={styles.card}>
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
                      backgroundColor: active
                        ? "rgba(255,255,255,0.25)"
                        : Theme.withOpacity(w.tint, 0.12),
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
          <View style={styles.headerRow}>
            <Text style={styles.headerSubtitle}>
              {selectedAttention?.subtitle ?? ""}
            </Text>
            <AnimatedPressableCard onPress={() => navigation.navigate("Tenants")}>
              <Text style={styles.seeAllText}>See all</Text>
            </AnimatedPressableCard>
          </View>

          {/* Tenant list */}
          {!selectedAttention || selectedAttention.tenants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
              <Text style={styles.emptyTitle}>All good!</Text>
              <Text style={styles.emptySubtitle}>No tenants need attention here.</Text>
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
                      navigate: (screen: string, params?: unknown) => void;
                    }
                  ).navigate("TenantDetails", { tenantId: t.s_no });
                };

                const onPressWhatsApp = () => {
                  const msg = buildWhatsAppTemplate(attentionTab, t);
                  if (!msg) {
                    Alert.alert(
                      "Amount not available",
                      "Due amount is not available for this tenant. Please open tenant details and verify the pending amount.",
                    );
                    return;
                  }
                  openWhatsApp(whatsapp, msg);
                };

                return (
                  <AnimatedPressableCard
                    key={t.s_no}
                    onPress={openTenantDetails}
                    style={styles.tenantRow}
                  >
                    <View
                      style={[
                        styles.tenantAvatar,
                        {
                          backgroundColor: Theme.withOpacity(
                            selectedAttention?.tint ?? Theme.colors.primary,
                            0.12,
                          ),
                        },
                      ]}
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
                      <Text style={styles.tenantName}>
                        {t.name ?? "Tenant"}
                      </Text>
                      <Text style={styles.tenantMeta}>
                        {roomNo ? `Room ${roomNo}` : "Room —"}
                        {bedNo ? ` · Bed ${bedNo}` : ""}
                        {typeof gapDueAmount === "number"
                          ? ` · ${formatCurrency(gapDueAmount)}`
                          : ""}
                      </Text>
                      {!!duePeriodText && (
                        <Text style={styles.tenantPeriod}>{duePeriodText}</Text>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <AnimatedPressableCard
                        onPress={() => openCall(phone)}
                        style={styles.callBtn}
                      >
                        <Ionicons name="call" size={15} color={Theme.colors.primary} />
                      </AnimatedPressableCard>
                      <AnimatedPressableCard
                        onPress={onPressWhatsApp}
                        style={styles.whatsappBtn}
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
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: Theme.colors.text.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  card: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: Theme.colors.background.secondary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
  },
  headerSubtitle: {
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  seeAllText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    height: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  emptySubtitle: {
    color: Theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tenantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tenantName: {
    color: Theme.colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  tenantMeta: {
    color: Theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  tenantPeriod: {
    color: Theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
});
