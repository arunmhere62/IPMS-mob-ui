/**
 * useActivityTracking Hook
 *
 * Integrates app lifecycle tracking into App.tsx.
 * - Tracks APP_INSTALL and APP_UPDATE on first launch / version change
 * - Tracks APP_OPEN when app comes to foreground
 * - Tracks APP_CLOSE when app goes to background
 *
 * Usage: simply call `useActivityTracking()` in App.tsx
 */

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { activityTrackingService } from '../../services/activity/activityTrackingService';

export function useActivityTracking() {
  const appStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    // Track install/update on first launch
    activityTrackingService.trackInstallAndUpdate();

    // Track initial app open
    activityTrackingService.trackAppOpen();

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prev = appStateRef.current;

      if (prev === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        activityTrackingService.trackAppClose();
      }

      if (prev.match(/inactive|background/) && nextAppState === 'active') {
        // App came back to foreground
        activityTrackingService.trackAppOpen();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
