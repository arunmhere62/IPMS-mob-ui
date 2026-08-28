import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StatusBar } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { Theme } from "@/theme";

interface SplashScreenState {
  splashVisible: boolean;
  splashOpacity: Animated.Value;
  rootLaidOut: boolean;
  overlayLaidOut: boolean;
  setRootLaidOut: (v: boolean) => void;
  setOverlayLaidOut: (v: boolean) => void;
  isSplashReady: (isInitialized: boolean, persistReady: boolean) => boolean;
}

/**
 * Manages the splash screen lifecycle:
 * - Prevents auto-hide of the native splash
 * - Waits for root + overlay layout before hiding native splash
 * - Fades out the custom Lottie overlay once init + persist + min-time are satisfied
 * - Applies the final StatusBar style after the overlay is gone
 */
export function useSplashScreen(
  isInitialized: boolean,
  persistReady: boolean,
): SplashScreenState {
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [rootLaidOut, setRootLaidOut] = useState(false);
  const [overlayLaidOut, setOverlayLaidOut] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const hasHiddenNativeSplash = useRef(false);

  // Prevent native splash auto-hide
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  // Minimum splash display time (2s)
  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Hide native splash once overlay has laid out (with Android fallback)
  useEffect(() => {
    if (hasHiddenNativeSplash.current) return;
    if (!rootLaidOut) return;

    if (overlayLaidOut) {
      hasHiddenNativeSplash.current = true;
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => undefined);
      });
      return;
    }

    // Fallback for Android devices where overlay layout never fires
    const t = setTimeout(() => {
      if (hasHiddenNativeSplash.current) return;
      hasHiddenNativeSplash.current = true;
      SplashScreen.hideAsync().catch(() => undefined);
    }, 800);

    return () => clearTimeout(t);
  }, [overlayLaidOut, rootLaidOut]);

  // Fade out custom overlay when all conditions are met
  useEffect(() => {
    if (!splashVisible) return;
    if (!isInitialized) return;
    if (!persistReady) return;
    if (!minSplashDone) return;

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSplashVisible(false);
    });
  }, [isInitialized, minSplashDone, splashOpacity, splashVisible, persistReady]);

  // Apply final StatusBar style after overlay is gone
  useEffect(() => {
    if (splashVisible) return;
    requestAnimationFrame(() => {
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor(Theme.colors.background.primary, true);
        StatusBar.setTranslucent(false);
      }
      StatusBar.setBarStyle("dark-content", true);
    });
  }, [splashVisible]);

  const isSplashReady = (init: boolean, persist: boolean) =>
    init && persist && minSplashDone;

  return {
    splashVisible,
    splashOpacity,
    rootLaidOut,
    overlayLaidOut,
    setRootLaidOut,
    setOverlayLaidOut,
    isSplashReady,
  };
}
