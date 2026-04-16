import React, { memo, useRef } from "react";
import type { ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

interface MenuItem {
  title: string;
  icon: string;
  screen: string;
  color: string;
}

interface QuickActionsProps {
  menuItems: MenuItem[];
  onNavigate: (screen: string) => void;
  variant?: "grid" | "horizontal";
  horizontalRows?: 1 | 2;
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const QuickActions = memo<QuickActionsProps>(
  ({ menuItems, onNavigate, variant = "grid", horizontalRows = 1 }) => {
    const { width: screenWidth } = useWindowDimensions();

    // Fewer columns on small screens to avoid words breaking mid-word
    const columns =
      screenWidth < 360 ? 2 : screenWidth < 420 ? 3 : screenWidth < 520 ? 4 : 5;
    const itemWidth = `${100 / columns}%` as `${number}%`;

    const rows = horizontalRows ?? 1;
    const horizontalColumns = React.useMemo(() => {
      if (variant !== "horizontal") return [] as MenuItem[][];
      if (rows === 1) return [] as MenuItem[][];

      const cols: MenuItem[][] = [];
      for (let i = 0; i < menuItems.length; i += rows) {
        cols.push(menuItems.slice(i, i + rows));
      }
      return cols;
    }, [menuItems, rows, variant]);

    const renderActionItem = (item: MenuItem, index: number) => {
      const scaleValue = useRef(new Animated.Value(1)).current;
      const opacityValue = useRef(new Animated.Value(1)).current;

      const handlePressIn = () => {
        Animated.spring(scaleValue, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        Animated.timing(opacityValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }).start();
      };

      const handlePressOut = () => {
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }).start();

        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      };

      return (
        <Animated.View
          key={index}
          style={{
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
            width: itemWidth,
            padding: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => onNavigate(item.screen)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={{
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 6,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              borderWidth: 0,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: item.color,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons
                name={item.icon as IoniconName}
                size={22}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={{
                color: "#1F2937",
                fontWeight: "700",
                textAlign: "center",
                fontSize: 11,
                lineHeight: 14,
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              {item.title}
            </Text>

            <View
              style={{
                marginTop: 4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: Theme.withOpacity(item.color, 0.15),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-forward" size={10} color={item.color} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    const renderHorizontalItem = (
      item: MenuItem,
      index: number,
      opts?: {
        marginRight?: number;
        marginBottom?: number;
      }
    ) => {
      const scaleValue = useRef(new Animated.Value(1)).current;
      const opacityValue = useRef(new Animated.Value(1)).current;

      const marginRight = opts?.marginRight ?? 10;
      const marginBottom = opts?.marginBottom ?? 0;

      const handlePressIn = () => {
        Animated.spring(scaleValue, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }).start();
        Animated.timing(opacityValue, {
          toValue: 0.85,
          duration: 110,
          useNativeDriver: true,
        }).start();
      };

      const handlePressOut = () => {
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }).start();
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }).start();
      };

      return (
        <Animated.View
          key={index}
          style={{
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
            marginRight,
            marginBottom,
          }}
        >
          <TouchableOpacity
            onPress={() => onNavigate(item.screen)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={{
              minWidth: 140,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: "#FFFFFF",
              borderWidth: 0,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: item.color,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: item.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons
                  name={item.icon as IoniconName}
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: Theme.withOpacity(item.color, 0.15),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-forward" size={12} color={item.color} />
              </View>
            </View>

            <Text
              numberOfLines={1}
              style={{
                marginTop: 10,
                color: "#1F2937",
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <View style={{ marginBottom: 12, paddingHorizontal: 16, marginTop: 10 }}>
        <View
          style={{
            backgroundColor: "#F8FAFC",
            borderRadius: 16,
            padding: 12,
            borderWidth: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1F2937" }}>
              Quick Actions
            </Text>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: "#6366F1",
                borderWidth: 0,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </View>
          </View>

          {variant === "horizontal" ? (
            rows === 2 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4, paddingRight: 6 }}
              >
                {horizontalColumns.map((colItems, colIndex) => (
                  <View
                    key={colIndex}
                    style={{
                      marginRight:
                        colIndex === horizontalColumns.length - 1 ? 0 : 10,
                    }}
                  >
                    {colItems.map((item, rowIndex) =>
                      renderHorizontalItem(item, colIndex * rows + rowIndex, {
                        marginRight: 0,
                        marginBottom: rowIndex === colItems.length - 1 ? 0 : 10,
                      })
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4, paddingRight: 6 }}
              >
                {menuItems.map((item, index) =>
                  renderHorizontalItem(item, index, {
                    marginRight: 10,
                    marginBottom: 0,
                  })
                )}
              </ScrollView>
            )
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {menuItems.map((item, index) => renderActionItem(item, index))}
            </View>
          )}
        </View>
      </View>
    );
  }
);

QuickActions.displayName = "QuickActions";
