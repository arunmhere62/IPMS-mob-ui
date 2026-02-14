import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface BottomNavVisibilityContextValue {
  hidden: boolean;
  hide: () => void;
  show: () => void;
  translateY: Animated.Value;
  hideDistance: number;
  setHideDistance: (n: number) => void;
}

const BottomNavVisibilityContext = createContext<BottomNavVisibilityContextValue | undefined>(undefined);

export const BottomNavVisibilityProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [hidden, setHidden] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const hideDistanceRef = useRef(100);
  const [hideDistanceState, setHideDistanceState] = useState<number>(100);
  const currentTranslateRef = useRef(0);

  const animateTo = useCallback((toValue: number) => {
    currentTranslateRef.current = toValue;
    Animated.timing(translateY, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const hide = useCallback(() => {
    setHidden(true);
    animateTo(hideDistanceRef.current);
  }, [animateTo]);

  const show = useCallback(() => {
    setHidden(false);
    animateTo(0);
  }, [animateTo]);

  const setHideDistance = useCallback((n: number) => {
    const v = Math.max(0, Math.round(n));
    hideDistanceRef.current = v;
    setHideDistanceState(v);
  }, []);

  const value = useMemo(
    () => ({ hidden, hide, show, translateY, hideDistance: hideDistanceState, setHideDistance }),
    [hidden, hide, show, translateY, hideDistanceState, setHideDistance]
  );

  return (
    <BottomNavVisibilityContext.Provider value={value}>
      {children}
    </BottomNavVisibilityContext.Provider>
  );
};

export const useBottomNavVisibility = () => {
  const ctx = useContext(BottomNavVisibilityContext);
  if (!ctx) throw new Error('useBottomNavVisibility must be used within BottomNavVisibilityProvider');
  return ctx;
};

// Hook to attach to ScrollView/FlatList onScroll to auto hide/show BottomNav
export const useBottomNavScrollHandler = (opts?: {
  threshold?: number; // minimal delta to react per frame
  invert?: boolean;   // reverse behavior
}) => {
  const { hide, show, translateY, hideDistance } = useBottomNavVisibility();
  const lastYRef = useRef(0);
  const lastDirRef = useRef<'up' | 'down' | null>(null);
  const currentTranslateRef = useRef(0);

  const threshold = typeof opts?.threshold === 'number' ? opts.threshold : 24;
  const invert = opts?.invert === true;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastYRef.current;
    lastYRef.current = y;

    // Always show when at very top
    if (y <= 0) {
      show();
      translateY.stopAnimation();
      translateY.setValue(0);
      currentTranslateRef.current = 0;
      lastDirRef.current = 'up';
      return;
    }

    // Ignore tiny jitter
    if (Math.abs(dy) < Math.max(1, threshold / 8)) return;

    const movingDown = dy > 0; // content moves up, user scrolling down
    const dir: 'up' | 'down' = movingDown ? 'down' : 'up';
    lastDirRef.current = dir;

    const signedDy = invert ? -dy : dy;
    const next = Math.max(0, Math.min(hideDistance, currentTranslateRef.current + signedDy));
    currentTranslateRef.current = next;
    translateY.stopAnimation();
    translateY.setValue(next);

    // update hidden flag roughly when more than half hidden/shown
    if (next >= hideDistance * 0.5) {
      // prefer hide state
      // do not call hide() here to avoid extra animation, only set flag on snap
    }
  }, [hideDistance, invert, show, translateY, threshold]);

  const snap = useCallback(() => {
    const t = currentTranslateRef.current;
    const target = t > hideDistance / 2 ? hideDistance : 0;
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start(() => {
      currentTranslateRef.current = target;
      if (target === 0) show(); else hide();
    });
  }, [hide, show, translateY, hideDistance]);

  return {
    onScroll,
    scrollEventThrottle: 16 as const,
    onScrollEndDrag: snap,
    onMomentumScrollEnd: snap,
  };
};
