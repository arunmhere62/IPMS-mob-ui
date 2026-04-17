import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { Permission } from "../config/rbac.config";
import { Ionicons } from "@expo/vector-icons";
import { useBottomNavVisibility } from "./BottomNavVisibility";
import { usePermissions } from "@/hooks/usePermissions";

interface BottomNavProps {
  navigation: any;
  currentRoute: string;
}

interface TabConfig {
  name: string;
  label: string;
  icon: string;
  permission?: Permission;
}

interface MenuItem {
  name: string;
  label: string;
  icon: string;
  route: string;
  permission?: Permission;
}

// User tabs (Admin/Employee) - Super Admin will use separate web app
const userTabs: TabConfig[] = [
  {
    name: "Dashboard",
    label: "Home",
    icon: "home",
    permission: Permission.VIEW_DASHBOARD,
  },
  {
    name: "Tenants",
    label: "Tenants",
    icon: "people",
    permission: Permission.VIEW_TENANTS,
  },
  {
    name: "Payments",
    label: "Payments",
    icon: "card",
    permission: Permission.VIEW_PAYMENT,
  },
  { name: "More", label: "More", icon: "grid" },
];

const moreMenuItems: MenuItem[] = [
  {
    name: "PG Locations",
    label: "PG Locations",
    icon: "business",
    route: "PGLocations",
  },
  {
    name: "Tenants",
    label: "Tenants",
    icon: "people",
    route: "Tenants",
    permission: Permission.VIEW_TENANTS,
  },
  { name: "Employees", label: "Employees", icon: "people", route: "Employees" },
  {
    name: "Rooms",
    label: "Rooms",
    icon: "home",
    route: "Rooms",
    permission: Permission.VIEW_ROOM,
  },
  {
    name: "Beds",
    label: "Beds",
    icon: "bed",
    route: "Beds",
    permission: Permission.VIEW_BED,
  },
  {
    name: "Rent",
    label: "Rent",
    icon: "cash",
    route: "RentPayments",
    permission: Permission.VIEW_PAYMENT,
  },
  {
    name: "Advance",
    label: "Advance",
    icon: "card",
    route: "AdvancePayments",
    permission: Permission.VIEW_PAYMENT,
  },
  {
    name: "Refund",
    label: "Refund",
    icon: "return-down-back",
    route: "RefundPayments",
    permission: Permission.VIEW_PAYMENT,
  },
  { name: "Expenses", label: "Expenses", icon: "receipt", route: "Expenses" },
  { name: "Settings", label: "Settings", icon: "settings", route: "Settings" },
];

const TabItem = ({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <View style={styles.tabContainer}>
          <View style={styles.tabContent}>
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={
                isActive ? Theme.colors.primary : Theme.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? Theme.colors.primary
                    : Theme.colors.text.secondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BottomNav: React.FC<BottomNavProps> = React.memo(
  ({ navigation, currentRoute }) => {
    const insets = useSafeAreaInsets();
    const accessibleTabs = userTabs;
    const { translateY, setHideDistance } = useBottomNavVisibility();
    const [moreModalVisible, setMoreModalVisible] = useState(false);
    const { can } = usePermissions();

    // Enhanced animation values for smooth bottom nav animations
    const bottomNavScale = React.useRef(new Animated.Value(1)).current;
    const bottomNavOpacity = React.useRef(new Animated.Value(1)).current;
    const modalScale = React.useRef(new Animated.Value(0.8)).current;
    const modalOpacity = React.useRef(new Animated.Value(0)).current;

    const bottomNavAnimatedStyle = {
      transform: [{ translateY }, { scale: bottomNavScale }],
      opacity: bottomNavOpacity,
    };

    const modalAnimatedStyle = {
      transform: [{ scale: modalScale }],
      opacity: modalOpacity,
    };

    const handleTabPress = (tab: TabConfig) => {
      if (tab.name === "More") {
        // Animate bottom nav out and modal in
        Animated.parallel([
          Animated.spring(bottomNavScale, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 300,
            friction: 8,
          }),
          Animated.timing(bottomNavOpacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setMoreModalVisible(true);

        // Animate modal in
        Animated.parallel([
          Animated.spring(modalScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 8,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        navigation.navigate(tab.name);
      }
    };

    const handleModalClose = () => {
      // Animate modal out
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 0.8,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Restore bottom nav
      Animated.parallel([
        Animated.spring(bottomNavScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(bottomNavOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setMoreModalVisible(false);
      }, 200);
    };

    const handleMenuItemPress = (item: MenuItem) => {
      // Animate modal out and restore bottom nav
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 0.8,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.parallel([
        Animated.spring(bottomNavScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(bottomNavOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setMoreModalVisible(false);
        navigation.navigate(item.route);
      }, 200);
    };

    const filteredMenuItems = moreMenuItems.filter((item) => {
      if (!item.permission) return true;
      return can(item.permission);
    });

    return (
      <>
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (typeof h === "number" && h > 0) setHideDistance(h);
          }}
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom + -2, 10) },
            bottomNavAnimatedStyle,
          ]}
        >
          {accessibleTabs.map((tab) => {
            const isActive = currentRoute === tab.name;
            return (
              <TabItem
                key={tab.name}
                tab={tab}
                isActive={isActive}
                onPress={() => handleTabPress(tab)}
              />
            );
          })}
        </Animated.View>

        {/* More Menu Modal */}
        <Modal
          visible={moreModalVisible}
          transparent
          animationType="none"
          onRequestClose={handleModalClose}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleModalClose}
          >
            <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
              <ScrollView
                style={styles.menuScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.menuGrid}>
                  {filteredMenuItems.map((item) => {
                    const itemScale = React.useRef(
                      new Animated.Value(1)
                    ).current;
                    const itemOpacity = React.useRef(
                      new Animated.Value(1)
                    ).current;

                    const handleItemPressIn = () => {
                      Animated.parallel([
                        Animated.spring(itemScale, {
                          toValue: 0.9,
                          useNativeDriver: true,
                          tension: 300,
                          friction: 8,
                        }),
                        Animated.timing(itemOpacity, {
                          toValue: 0.7,
                          duration: 100,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    };

                    const handleItemPressOut = () => {
                      Animated.parallel([
                        Animated.spring(itemScale, {
                          toValue: 1,
                          useNativeDriver: true,
                          tension: 300,
                          friction: 8,
                        }),
                        Animated.timing(itemOpacity, {
                          toValue: 1,
                          duration: 150,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    };

                    return (
                      <Animated.View
                        key={item.name}
                        style={{
                          transform: [{ scale: itemScale }],
                          opacity: itemOpacity,
                        }}
                      >
                        <TouchableOpacity
                          style={styles.menuGridItem}
                          onPress={() => handleMenuItemPress(item)}
                          onPressIn={handleItemPressIn}
                          onPressOut={handleItemPressOut}
                          activeOpacity={1}
                        >
                          <View style={styles.menuGridIconContainer}>
                            <Ionicons
                              name={item.icon as any}
                              size={24}
                              color={Theme.colors.primary}
                            />
                          </View>
                          <Text style={styles.menuGridLabel}>{item.label}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }
);

BottomNav.displayName = "BottomNav";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 0,
    minHeight: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    position: "relative",
  },
  icon: {
    marginBottom: 1,
    textAlign: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: -4,
    left: -12,
    right: -12,
    bottom: -4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    zIndex: -1,
  },
  tabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },
  tabContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  menuScrollView: {
    maxHeight: "100%",
  },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
  },
  menuGridItem: {
    alignItems: "center",
    width: 70,
    marginBottom: 8,
  },
  menuGridIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  menuGridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
});
