import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
  lastOnlineTime: Date | null;
}

interface NetworkContextType extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  showOfflineBanner: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isConnected: true,
  connectionType: "unknown",
  lastOnlineTime: null,
  checkConnection: async () => true,
  showOfflineBanner: false,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: true,
    connectionType: "unknown",
    lastOnlineTime: null,
  });
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const bannerAnimation = useRef(new Animated.Value(-100)).current;
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(true);
  const consecutiveFailureCount = useRef(0);
  const lastCheckTime = useRef(0);

  // Check actual internet connectivity by making a lightweight request
  const checkInternetConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 second timeout

      const response = await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 204;
    } catch (error) {
      // Only log if it's not an abort (which is expected timeout)
      if (error instanceof Error && error.name !== "AbortError") {
        console.log("❌ Internet connectivity check failed:", error);
      }
      return false;
    }
  };

  // Main connectivity check
  const checkConnection = async (): Promise<boolean> => {
    const now = Date.now();

    // Debounce: Don't check if we checked less than 3 seconds ago
    if (now - lastCheckTime.current < 3000) {
      return isOnlineRef.current;
    }

    lastCheckTime.current = now;
    const isConnected = await checkInternetConnectivity();

    if (isConnected) {
      consecutiveFailureCount.current = 0;
    } else {
      consecutiveFailureCount.current += 1;

      // Only consider offline after 2 consecutive failures
      if (consecutiveFailureCount.current < 2) {
        return isOnlineRef.current;
      }
    }

    setNetworkStatus((prev) => ({
      ...prev,
      isOnline: isConnected,
      isConnected: isConnected,
      lastOnlineTime: isConnected ? new Date() : prev.lastOnlineTime,
    }));

    isOnlineRef.current = isConnected;

    return isConnected;
  };

  // Show/hide offline banner with animation
  const showBanner = () => {
    setShowOfflineBanner(true);
    Animated.spring(bannerAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(bannerAnimation, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowOfflineBanner(false);
    });
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    hideBanner();
  };

  // Monitor network status changes
  useEffect(() => {
    let isActive = true;
    let foregroundTimeout: NodeJS.Timeout | null = null;

    // Initial check
    checkConnection();

    // Listen for app state changes (foreground/background)
    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === "active") {
        // App came to foreground, wait 2 seconds before checking to avoid false negatives
        if (foregroundTimeout) clearTimeout(foregroundTimeout);
        foregroundTimeout = setTimeout(async () => {
          if (isActive) {
            await checkConnection();
          }
        }, 2000);
      }
    };

    // Periodic connectivity checks (every 30 seconds instead of 10)
    checkIntervalRef.current = setInterval(async () => {
      if (!isActive) return;

      const wasOnline = isOnlineRef.current;
      const isNowOnline = await checkConnection();

      // Network state changed
      if (wasOnline !== isNowOnline) {
        if (!isNowOnline) {
          console.log("📡 Network: OFFLINE");
          setBannerDismissed(false);
          showBanner();
        } else {
          console.log("📡 Network: ONLINE");
          setBannerDismissed(false);
          // Show "Back Online" message briefly
          setTimeout(() => {
            hideBanner();
          }, 2000);
        }
      }
    }, 30000); // Check every 30 seconds

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup
    return () => {
      isActive = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (foregroundTimeout) {
        clearTimeout(foregroundTimeout);
      }
      subscription.remove();
    };
  }, []);

  // Show banner when offline
  useEffect(() => {
    if (!networkStatus.isOnline) {
      if (!bannerDismissed) {
        showBanner();
      }
    } else {
      if (bannerDismissed) {
        setBannerDismissed(false);
      }
      // Hide banner after 2 seconds when back online
      const timer = setTimeout(() => {
        hideBanner();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline, bannerDismissed]);

  return (
    <NetworkContext.Provider
      value={{
        ...networkStatus,
        checkConnection,
        showOfflineBanner,
      }}
    >
      {children}

      {/* Offline/Online Banner */}
      {showOfflineBanner && (
        <NetworkBanner
          isOnline={networkStatus.isOnline}
          lastOnlineTime={networkStatus.lastOnlineTime}
          animation={bannerAnimation}
          onDismiss={dismissBanner}
        />
      )}
    </NetworkContext.Provider>
  );
};

// Separate banner component to use safe area insets
const NetworkBanner: React.FC<{
  isOnline: boolean;
  lastOnlineTime: Date | null;
  animation: Animated.Value;
  onDismiss: () => void;
}> = ({ isOnline, lastOnlineTime, animation, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (isOnline) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [isOnline]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          animation.setValue(Math.max(-100, gestureState.dy));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -25) {
          onDismiss();
          return;
        }
        Animated.spring(animation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: isOnline ? "#10B981" : "#EF4444",
          paddingTop: insets.top + 8, // Dynamic padding based on device
          transform: [{ translateY: animation }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.bannerContent}>
        <Ionicons
          name={isOnline ? "cloud-done" : "cloud-offline"}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.bannerText}>
          {isOnline ? "✓ Back Online" : "⚠ No Internet Connection"}
        </Text>
      </View>
      {!isOnline && lastOnlineTime && (
        <Text style={styles.bannerSubtext}>
          Last online: {getTimeAgo(lastOnlineTime, now)}
        </Text>
      )}
    </Animated.View>
  );
};

// Helper function to get time ago
const getTimeAgo = (date: Date, now: Date): string => {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // paddingTop is set dynamically using insets.top
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  bannerSubtext: {
    color: "#FFFFFF",
    fontSize: 11,
    opacity: 0.9,
    textAlign: "center",
    marginTop: 4,
  },
});
