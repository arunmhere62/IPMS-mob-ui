/**
 * Shared interface for platform-specific subscription logic.
 *
 * React Native's bundler auto-selects `subscriptionPlatform.ios.ts` on iOS
 * and `subscriptionPlatform.android.ts` on Android. This file defines the
 * common interface both must implement, plus shared types.
 *
 * The split keeps iOS (Apple IAP / StoreKit) and Android (CCAvenue) logic
 * in separate files so each platform's code is clean and self-contained.
 */
import type { SubscriptionPlan } from '@/features/owner/api/subscriptionApi';

/**
 * Resolved price info for a plan card.
 * - `displayPrice`: the formatted price string shown to the user (e.g. "₹99.00")
 * - `subText`: optional secondary line under the price (e.g. "+ 18% GST = ₹116.82")
 *   — null when there's no secondary line (Apple IAP prices are tax-inclusive).
 * - `showGstBreakdown`: whether the collapsible GST section should render.
 */
export interface PlanPriceInfo {
  displayPrice: string;
  subText: string | null;
  showGstBreakdown: boolean;
}

/**
 * Resolved purchase state for a plan card's CTA button.
 */
export interface PlanPurchaseState {
  /** The plan is sold via Apple IAP (iOS only). */
  isIapPlan: boolean;
  /** StoreKit is still connecting — CTA should show "Connecting to Store..." */
  iapNotReady: boolean;
  /** A purchase for this product is currently in progress. */
  isIapPurchasing: boolean;
}

/**
 * Platform-specific subscription logic.
 * Implemented separately for iOS and Android.
 */
export interface SubscriptionPlatform {
  /**
   * Resolve the price to display for a plan.
   * - iOS: returns Apple StoreKit `displayPrice` (tax-inclusive, no GST line)
   * - Android: returns the DB base price + GST sub-text
   */
  getPlanPriceInfo(plan: SubscriptionPlan): PlanPriceInfo;

  /**
   * Resolve the purchase state for a plan card's CTA.
   * - iOS: IAP-specific flags (isIapPlan, iapNotReady, isIapPurchasing)
   * - Android: all false (CCAvenue flow handles its own loading state)
   */
  getPlanPurchaseState(plan: SubscriptionPlan): PlanPurchaseState;
}
