import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  lastOnlineTime: Date | null;
}

interface NetworkContextType extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  showOfflineBanner: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isConnected: true,
  connectionType: 'unknown',
  lastOnlineTime: null,
  checkConnection: async () => true,
  showOfflineBanner: false,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: true,
    connectionType: 'unknown',
    lastOnlineTime: null,
  });
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const bannerAnimation = useRef(new Animated.Value(-100)).current;
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(true);

  // Check actual internet connectivity by making a lightweight request
  const checkInternetConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 204;
    } catch (error) {
      console.log('❌ Internet connectivity check failed:', error);
      return false;
    }
  };

  // Alternative connectivity check using DNS
  const checkConnectivityAlternative = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try multiple endpoints for reliability
      const endpoints = [
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace',
        'https://1.1.1.1/cdn-cgi/trace',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          if (response.ok || response.status === 204) {
            return true;
          }
        } catch (err) {
          // Try next endpoint
          continue;
        }
      }

      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      return false;
    }
  };

  // Main connectivity check
  const checkConnection = async (): Promise<boolean> => {
    const isConnected = await checkInternetConnectivity();
    
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

    // Initial check
    checkConnection();

    // Periodic connectivity checks (every 10 seconds)
    checkIntervalRef.current = setInterval(async () => {
      if (!isActive) return;
      
      const wasOnline = isOnlineRef.current;
      const isNowOnline = await checkConnection();

      // Network state changed
      if (wasOnline !== isNowOnline) {
        if (!isNowOnline) {
          console.log('📡 Network: OFFLINE');
          setBannerDismissed(false);
          showBanner();
        } else {
          console.log('📡 Network: ONLINE');
          setBannerDismissed(false);
          // Show "Back Online" message briefly
          setTimeout(() => {
            hideBanner();
          }, 2000);
        }
      }
    }, 10000); // Check every 10 seconds

    // Listen for app state changes (foreground/background)
    const handleAppStateChange = async (state: string) => {
      if (state === 'active') {
        // App came to foreground, check connectivity
        await checkConnection();
      }
    };

    // Cleanup
    return () => {
      isActive = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
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
          backgroundColor: isOnline ? '#10B981' : '#EF4444',
          paddingTop: insets.top + 8, // Dynamic padding based on device
          transform: [{ translateY: animation }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.bannerContent}>
        <Ionicons
          name={isOnline ? 'cloud-done' : 'cloud-offline'}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.bannerText}>
          {isOnline ? '✓ Back Online' : '⚠ No Internet Connection'}
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
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // paddingTop is set dynamically using insets.top
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerSubtext: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
});
