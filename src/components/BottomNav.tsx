import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { Permission } from "../config/rbac.config";
import { Ionicons } from "@expo/vector-icons";
import { useBottomNavVisibility } from "./BottomNavVisibility";
import { usePermissions } from "@/hooks/usePermissions";
import { AnimatedPressableCard } from "./AnimatedPressableCard";

// Fallback hook for when BottomNavVisibilityProvider is not available
const useBottomNavVisibilitySafe = () => {
  try {
    return useBottomNavVisibility();
  } catch {
    // Provider not available, return default values
    const translateY = useRef(new Animated.Value(0)).current;
    return useMemo(() => ({
      hidden: false,
      hide: () => {},
      show: () => {},
      translateY,
      hideDistance: 100,
      setHideDistance: () => {} }), [translateY]);
  }
};

interface BottomNavProps {
  navigation?: any;
  currentRoute?: string;
  // Configurable tabs for tenant portal or custom navigation
  tabs?: TabConfig[];
  activeTab?: string;
  onTabPress?: (tabName: string) => void;
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
    permission: Permission.VIEW_DASHBOARD },
  {
    name: "Rooms",
    label: "Rooms",
    icon: "bed-outline",
    permission: Permission.VIEW_ROOM },
  {
    name: "Tenants",
    label: "Tenants",
    icon: "people",
    permission: Permission.VIEW_TENANTS },
  {
    name: "UpcomingVacancies",
    label: "Vacancies",
    icon: "log-out-outline" },
  { name: "More", label: "More", icon: "grid" },
];

const moreMenuItems: MenuItem[] = [
  {
    name: "PG Locations",
    label: "PG Locations",
    icon: "business",
    route: "PGLocations" },
  { name: "Employees", label: "Employees", icon: "people", route: "Employees" },
  {
    name: "Rent",
    label: "Rent",
    icon: "cash",
    route: "RentPayments",
    permission: Permission.VIEW_PAYMENT },
  {
    name: "Advance",
    label: "Advance",
    icon: "card",
    route: "AdvancePayments",
    permission: Permission.VIEW_PAYMENT },
  {
    name: "Refund",
    label: "Refund",
    icon: "return-down-back",
    route: "RefundPayments",
    permission: Permission.VIEW_PAYMENT },
  { name: "Expenses", label: "Expenses", icon: "receipt", route: "Expenses" },
  { name: "TenantTickets", label: "Tenant Tickets", icon: "ticket-outline", route: "PgTenantTickets" },
  { name: "Settings", label: "Settings", icon: "settings", route: "Settings" },
];

const MenuGridItem = ({ item, onPress }: { item: MenuItem; onPress: () => void }) => {
  return (
    <AnimatedPressableCard
      onPress={onPress}
      scaleValue={0.9}
      style={styles.menuGridItem}
    >
      <View style={styles.menuGridIconContainer}>
        <Ionicons name={item.icon as any} size={24} color={Theme.colors.primary} />
      </View>
      <Text style={styles.menuGridLabel}>{item.label}</Text>
    </AnimatedPressableCard>
  );
};

const TabItem = ({
  tab,
  isActive,
  onPress }: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) => {
  return (
    <AnimatedPressableCard
      onPress={onPress}
      scaleValue={0.9}
      style={styles.tab}
    >
      <View style={styles.tabContainer}>
        <View style={styles.tabContent}>
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={
              isActive ? Theme.colors.primary : Theme.colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.label,
              {
                color: isActive
                  ? Theme.colors.primary
                  : Theme.colors.text.tertiary },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit minimumFontScale={0.85}
          >
            {tab.label}
          </Text>
        </View>
      </View>
    </AnimatedPressableCard>
  );
};

export const BottomNav: React.FC<BottomNavProps> = React.memo(
  ({ navigation, currentRoute, tabs, activeTab: propActiveTab, onTabPress }) => {
    const insets = useSafeAreaInsets();
    // Use configurable tabs if provided, otherwise use default user tabs
    const accessibleTabs = tabs || userTabs;
    const { translateY, setHideDistance } = useBottomNavVisibilitySafe();
    const [moreModalVisible, setMoreModalVisible] = useState(false);
    const { can } = usePermissions();

    const handleTabPress = (tab: TabConfig) => {
      if (tab.name === "More") {
        setMoreModalVisible(true);
        return;
      }
      // If onTabPress is provided, use it for tab navigation
      if (onTabPress) {
        onTabPress(tab.name);
      } else if (navigation) {
        navigation.navigate(tab.name);
      }
    };

    const handleMenuItemPress = (item: MenuItem) => {
      setMoreModalVisible(false);
      navigation.navigate(item.route);
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
            { transform: [{ translateY }] },
          ]}
        >
          {accessibleTabs.map((tab) => {
            // Use activeTab prop if provided (configurable mode), otherwise use currentRoute
            const isActive = propActiveTab !== undefined
              ? propActiveTab === tab.name
              : currentRoute === tab.name;
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

        {/* More Menu Modal - only for admin mode with default tabs */}
        {!tabs && (
        <Modal
          visible={moreModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMoreModalVisible(false)}
        >
          <AnimatedPressableCard
            style={styles.modalOverlay}
            onPress={() => setMoreModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <ScrollView
                style={styles.menuScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.menuGrid}>
                  {filteredMenuItems.map((item) => (
                    <MenuGridItem
                      key={item.name}
                      item={item}
                      onPress={() => handleMenuItemPress(item)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </AnimatedPressableCard>
        </Modal>
        )}
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
    elevation: 5 },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    position: "relative" },
  icon: {
    marginBottom: 1,
    textAlign: "center" },
  label: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center" },
  activeIndicator: {
    position: "absolute",
    top: -4,
    left: -12,
    right: -12,
    bottom: -4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    zIndex: -1 },
  tabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative" },
  tabContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 6,
    paddingVertical: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%" },
  menuScrollView: {
    maxHeight: "100%" },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16 },
  menuGridItem: {
    alignItems: "center",
    width: 70,
    marginBottom: 8 },
  menuGridIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6 },
  menuGridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    textAlign: "center" } });
