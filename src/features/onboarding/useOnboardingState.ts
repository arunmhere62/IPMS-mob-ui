import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import { OnboardingStep, OnboardingHintScreen } from './types';

/**
 * Derives the current onboarding step from server-side flags.
 *
 * The permissions API (polled every few minutes) returns:
 *   - is_onboarding_complete
 *   - onboarding_has_rooms
 *   - onboarding_has_tenants
 *
 * These flags are stored in the rbac slice and are the single source of truth.
 * No local persistence — the server drives everything.
 */
export const useOnboardingState = () => {
  const isOnboardingComplete = useSelector(
    (state: RootState) => (state as any).rbac?.isOnboardingComplete ?? null
  );
  const hasRooms = useSelector(
    (state: RootState) => (state as any).rbac?.onboardingHasRooms ?? false
  );
  const hasTenants = useSelector(
    (state: RootState) => (state as any).rbac?.onboardingHasTenants ?? false
  );

  /** null = still loading (server hasn't responded yet). */
  const isLoading = isOnboardingComplete === null;

  const step = useMemo<OnboardingStep>(() => {
    if (isOnboardingComplete === true || hasTenants) return OnboardingStep.DONE;
    if (hasRooms) return OnboardingStep.ROOMS;
    return OnboardingStep.QUICK_SETUP;
  }, [isOnboardingComplete, hasRooms, hasTenants]);

  /** Which Quick Action card to pulse on the Dashboard. */
  const hintScreen = useMemo<OnboardingHintScreen>(() => {
    if (isLoading || step === OnboardingStep.DONE) return null;
    if (step === OnboardingStep.QUICK_SETUP) return 'QuickSetup';
    if (step === OnboardingStep.ROOMS) return 'Rooms';
    return null;
  }, [isLoading, step]);

  const isComplete = step === OnboardingStep.DONE;
  const isActive = !isLoading && !isComplete;

  return { step, hintScreen, isLoading, isComplete, isActive, hasRooms, hasTenants };
};
