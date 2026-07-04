import React, { memo } from "react";
import type { ComponentProps } from "react";
import {
  View,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressableCard } from "./AnimatedPressableCard";

interface MenuItem {
  title: string;
  icon: string;
  screen: string;
  color: string;
  subtitle?: string;
}

interface QuickActionsProps {
  menuItems: MenuItem[];
  onNavigate: (screen: string) => void;
  variant?: "grid" | "horizontal";
  horizontalRows?: 1 | 2;
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const SUBTITLES: Record<string, string> = {
  PGLocations: "Manage PGs",
  Tenants: "View tenants",
  Rooms: "Rooms & beds",
  Expenses: "Track costs",
  UpcomingVacancies: "See who's leaving soon",
};

const QuickActionItem = memo<{ item: MenuItem; onNavigate: (screen: string) => void; isLarge?: boolean }>(
  ({ item, onNavigate, isLarge }) => {
    const bgColor = item.color + "15";
    const subtitle = item.subtitle || SUBTITLES[item.screen] || "";

    return (
      <AnimatedPressableCard
        onPress={() => onNavigate(item.screen)}
        style={{
          flex: isLarge ? 1 : undefined,
          width: isLarge ? undefined : '48.5%',
        }}
      >
        <View
          style={{
            backgroundColor: bgColor,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: item.color + "25",
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: item.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={item.icon as IoniconName}
              size={22}
              color="#FFFFFF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color: "#111827",
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {item.title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: "#6B7280",
                  fontSize: 11,
                  fontWeight: "500",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={16} color={item.color} />
        </View>
      </AnimatedPressableCard>
    );
  }
);

QuickActionItem.displayName = "QuickActionItem";

export const QuickActions = memo<QuickActionsProps>(
  ({ menuItems, onNavigate }) => {
    // First row: first 3 items stacked, second row: remaining items
    const topRow = menuItems.slice(0, 3);
    const bottomRow = menuItems.slice(3);

    return (
      <View style={{ marginBottom: 12, paddingHorizontal: 16, marginTop: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name="flash" size={18} color="#6366F1" />
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginLeft: 6 }}>
            Quick Actions
          </Text>
        </View>

        {/* Top row: 3 items as large full-width cards */}
        <View style={{ gap: 8, marginBottom: 8 }}>
          {topRow.map((item, index) => (
            <QuickActionItem key={index} item={item} onNavigate={onNavigate} isLarge />
          ))}
        </View>

        {/* Bottom row: remaining items side by side, or full-width if single */}
        {bottomRow.length > 0 && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {bottomRow.map((item, index) => (
              <QuickActionItem key={index} item={item} onNavigate={onNavigate} isLarge={bottomRow.length === 1} />
            ))}
          </View>
        )}
      </View>
    );
  }
);

QuickActions.displayName = "QuickActions";
