/**
 * Onboarding step derived from server flags.
 * The server (permissions API) is the single source of truth.
 *
 * Flow:
 *   quick_setup → rooms → done
 *
 * Flags used:
 *   is_onboarding_complete  — true only when user has rooms AND tenants
 *   onboarding_has_rooms    — true when user has at least one room
 *   onboarding_has_tenants  — true when user has at least one tenant
 */
export enum OnboardingStep {
  /** New user — no rooms yet. Hint: tap Quick Setup. */
  QUICK_SETUP = 'quick_setup',
  /** Rooms created — no tenants yet. Hint: tap Rooms, then tap first room, then tap Add Tenant on first bed. */
  ROOMS = 'rooms',
  /** Onboarding complete — no hints. */
  DONE = 'done',
}

/** Which Quick Action screen to highlight. */
export type OnboardingHintScreen = 'QuickSetup' | 'Rooms' | null;
