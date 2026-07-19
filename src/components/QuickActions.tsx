import React, { memo, useRef, useEffect } from "react";
import type { ComponentProps } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
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
  tourHintScreen?: string | null;
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const SUBTITLES: Record<string, string> = {
  PGLocations: "Manage PGs",
  Tenants: "View tenants",
  Rooms: "Rooms & beds",
  Expenses: "Track costs",
  UpcomingVacancies: "See who's leaving soon",
};

const QuickActionItem = memo<{ item: MenuItem; onNavigate: (screen: string) => void; isLarge?: boolean; showTourHint?: boolean }>(
  ({ item, onNavigate, isLarge, showTourHint }) => {
    const bgColor = item.color + "15";
    const subtitle = item.subtitle || SUBTITLES[item.screen] || "";

    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      if (showTourHint) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(1);
      }
    }, [showTourHint, pulseAnim]);

    return (
      <AnimatedPressableCard
        onPress={() => onNavigate(item.screen)}
        style={{
          flex: isLarge ? 1 : undefined,
          width: isLarge ? undefined : '48.5%',
        }}
      >
        {showTourHint && (
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <View style={{ backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="finger-print" size={11} color="#fff" />
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {item.screen === 'QuickSetup' ? 'Tap here to start' : 'Tap to view rooms'}
              </Text>
            </View>
            <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1E3A8A', marginTop: 2 }} />
          </View>
        )}
        <Animated.View style={{ transform: [{ scale: showTourHint ? pulseAnim : 1 }] }}>
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
                adjustsFontSizeToFit minimumFontScale={0.85}
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
                  adjustsFontSizeToFit minimumFontScale={0.85}
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
        </Animated.View>
      </AnimatedPressableCard>
    );
  }
);

QuickActionItem.displayName = "QuickActionItem";

export const QuickActions = memo<QuickActionsProps>(
  ({ menuItems, onNavigate, tourHintScreen }) => {
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
            <QuickActionItem
              key={index}
              item={item}
              onNavigate={onNavigate}
              isLarge
              showTourHint={tourHintScreen === item.screen}
            />
          ))}
        </View>

        {/* Bottom row: remaining items side by side, or full-width if single */}
        {bottomRow.length > 0 && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {bottomRow.map((item, index) => (
              <QuickActionItem
                key={index}
                item={item}
                onNavigate={onNavigate}
                isLarge={bottomRow.length === 1}
                showTourHint={tourHintScreen === item.screen}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

QuickActions.displayName = "QuickActions";
