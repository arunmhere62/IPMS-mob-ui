import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../../../theme";
import { Card } from "../../../../components/Card";
import { AnimatedPressableCard } from "../../../../components/AnimatedPressableCard";
import type { DashboardMonthlyMetricsResponse } from "../../api/dashboardApi";

interface MonthlyMetricsCardProps {
  monthlyMetrics?: DashboardMonthlyMetricsResponse["data"];
  isFetching: boolean;
  onDateRangeChange: (monthStart?: string, monthEnd?: string) => void;
  formatCurrency: (amount?: number) => string;
}

const getLast6Months = () => {
  const months = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
    const nextMonthFirstDay = new Date(year, month + 1, 1)
      .toISOString()
      .split("T")[0];

    months.push({
      label: monthName,
      monthStart: firstDay,
      monthEnd: nextMonthFirstDay,
      isCurrentMonth: i === 0,
    });
  }

  return months;
};

export const MonthlyMetricsCard: React.FC<MonthlyMetricsCardProps> = ({
  monthlyMetrics,
  isFetching,
  onDateRangeChange,
  formatCurrency,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getLast6Months()[0]);

  const months = getLast6Months();

  const handleSelectMonth = (month: (typeof months)[0]) => {
    setSelectedMonth(month);
    setShowDropdown(false);
    onDateRangeChange(month.monthStart, month.monthEnd);
  };

  useEffect(() => {
    if (showDropdown) {
      const timeout = setTimeout(() => {
        setShowDropdown(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showDropdown]);

  const mm = monthlyMetrics?.monthly_metrics;
  const hasData = !!mm;
  const cashReceived = mm?.cash_received ?? 0;
  const refundsPaid = mm?.refunds_paid ?? 0;
  const advancePaid = mm?.advance_paid ?? 0;
  const expensesPaid = mm?.expenses_paid ?? 0;
  const displayCurrency = (value: number) =>
    hasData ? formatCurrency(value) : isFetching ? "—" : formatCurrency(0);

  const tileBg = Theme.colors.light;
  const tileBorder = Theme.colors.border;
  const tileRadius = 14;
  const tilePad = 12;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <Card
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          backgroundColor: Theme.colors.background.secondary,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: 1,
              paddingRight: 10,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.12),
                borderWidth: 1,
                borderColor: Theme.withOpacity(Theme.colors.primary, 0.18),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="bar-chart"
                size={16}
                color={Theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 15,
                  fontWeight: "900",
                }}
              >
                PG Overview
              </Text>
              <Text
                style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                {isFetching ? "Loading…" : selectedMonth.label}
              </Text>
            </View>
          </View>

          {/* Month picker */}
          <View style={{ position: "relative" }}>
            <AnimatedPressableCard
              onPress={() => setShowDropdown(!showDropdown)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: Theme.colors.light,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Theme.colors.text.secondary}
              />
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 12,
                  fontWeight: "800",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                {selectedMonth.label}
              </Text>
              <Ionicons
                name={showDropdown ? "chevron-up" : "chevron-down"}
                size={12}
                color={Theme.colors.text.secondary}
              />
            </AnimatedPressableCard>

            {showDropdown && (
              <View
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.14,
                  shadowRadius: 12,
                  elevation: 10,
                  zIndex: 1000,
                  minWidth: 170,
                  overflow: "hidden",
                }}
              >
                {months.map((month, index) => {
                  const active = selectedMonth.label === month.label;
                  return (
                    <AnimatedPressableCard
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: active
                          ? Theme.withOpacity(Theme.colors.primary, 0.1)
                          : "transparent",
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: Theme.colors.border,
                      }}
                      onPress={() => handleSelectMonth(month)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: Theme.withOpacity(
                              Theme.colors.primary,
                              active ? 0.14 : 0.08,
                            ),
                            borderWidth: 1,
                            borderColor: Theme.withOpacity(
                              Theme.colors.primary,
                              active ? 0.2 : 0.12,
                            ),
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color={Theme.colors.primary}
                          />
                        </View>
                        <View>
                          <Text
                            style={{
                              color: Theme.colors.text.primary,
                              fontSize: 12,
                              fontWeight: "800",
                            }}
                            numberOfLines={1}
                            adjustsFontSizeToFit minimumFontScale={0.85}
                          >
                            {month.label}
                          </Text>
                          {month.isCurrentMonth && (
                            <Text
                              style={{
                                color: Theme.colors.text.secondary,
                                fontSize: 10,
                                marginTop: 1,
                              }}
                              numberOfLines={1}
                              adjustsFontSizeToFit minimumFontScale={0.85}
                            >
                              Current
                            </Text>
                          )}
                        </View>
                      </View>
                      {active && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Theme.colors.primary}
                        />
                      )}
                    </AnimatedPressableCard>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Metrics grid — 2x2 */}
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Collected */}
            <View
              style={{
                flex: 1,
                backgroundColor: tileBg,
                borderRadius: tileRadius,
                padding: tilePad,
                borderWidth: 1,
                borderColor: tileBorder,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 11,
                  fontWeight: "800",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                Collected
              </Text>
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 16,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {displayCurrency(cashReceived)}
              </Text>
            </View>

            {/* Expenses */}
            <View
              style={{
                flex: 1,
                backgroundColor: tileBg,
                borderRadius: tileRadius,
                padding: tilePad,
                borderWidth: 1,
                borderColor: tileBorder,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 11,
                  fontWeight: "800",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                Expenses
              </Text>
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 16,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {displayCurrency(expensesPaid)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {/* Refunds Paid */}
            <View
              style={{
                flex: 1,
                backgroundColor: tileBg,
                borderRadius: tileRadius,
                padding: tilePad,
                borderWidth: 1,
                borderColor: tileBorder,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 11,
                  fontWeight: "800",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                Refunds
              </Text>
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 16,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {displayCurrency(refundsPaid)}
              </Text>
            </View>

            {/* Advance Paid */}
            <View
              style={{
                flex: 1,
                backgroundColor: tileBg,
                borderRadius: tileRadius,
                padding: tilePad,
                borderWidth: 1,
                borderColor: tileBorder,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 11,
                  fontWeight: "800",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.85}
              >
                Advance
              </Text>
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontSize: 16,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {displayCurrency(advancePaid)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};
