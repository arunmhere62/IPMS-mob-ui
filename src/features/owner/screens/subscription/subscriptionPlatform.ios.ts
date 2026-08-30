/**
 * iOS platform-specific subscription logic.
 *
 * On iOS, paid digital subscriptions must be sold via Apple In-App Purchase
 * (App Store Guideline 3.1.1). Prices come from StoreKit (Apple's price
 * tiers, tax-inclusive). GST breakdown is NOT shown because Apple handles
 * tax separately — showing a GST line would be misleading.
 */
import type { ProductSubscription } from 'expo-iap';
import type { SubscriptionPlan } from '@/features/owner/api/subscriptionApi';
import { getIapProductIdForPlan } from '@/config/iapProducts';
import type { SubscriptionPlatform, PlanPriceInfo, PlanPurchaseState } from './subscriptionPlatform';

/**
 * Factory: creates an iOS SubscriptionPlatform bound to the current IAP
 * product list and purchase state from the useIAPSubscription hook.
 *
 * Called once per render in SubscriptionPlansScreen with the latest IAP
 * state so the platform module always sees fresh StoreKit data.
 */
export function createIosSubscriptionPlatform(args: {
  iapProducts: ProductSubscription[];
  iapIsReady: boolean;
  purchasingProductIds: string[];
}): SubscriptionPlatform {
  const { iapProducts, iapIsReady, purchasingProductIds } = args;

  return {
    getPlanPriceInfo(plan: SubscriptionPlan): PlanPriceInfo {
      const isFreePlan = Boolean(plan.is_free);
      const iapProductId = getIapProductIdForPlan(plan.s_no);

      // Free / trial plans have no IAP counterpart — show DB price (₹0 = Free).
      if (isFreePlan || !iapProductId) {
        return {
          displayPrice: formatDbPrice(plan.price, plan.currency),
          subText: null,
          showGstBreakdown: false,
        };
      }

      // Paid plan with IAP — show Apple's StoreKit price.
      const product = iapProducts.find((p) => p.id === iapProductId);
      if (product?.displayPrice) {
        // Apple prices are tax-inclusive — no GST breakdown line.
        return {
          displayPrice: product.displayPrice,
          subText: null,
          showGstBreakdown: false,
        };
      }

      // StoreKit hasn't loaded the product yet (e.g. connecting, signed out,
      // or sandbox account not set up). Do NOT fall back to the DB price —
      // it differs from Apple's price and showing it would mislead the user
      // (App Review rejection risk per Guideline 3.1.1). Show a placeholder
      // until Apple's price is available.
      return {
        displayPrice: '—',
        subText: null,
        showGstBreakdown: false,
      };
    },

    getPlanPurchaseState(plan: SubscriptionPlan): PlanPurchaseState {
      const isFreePlan = Boolean(plan.is_free);
      const iapProductId = getIapProductIdForPlan(plan.s_no);
      const isIapPlan = !isFreePlan && iapProductId !== null;

      return {
        isIapPlan,
        iapNotReady: isIapPlan && !iapIsReady,
        isIapPurchasing: isIapPlan && purchasingProductIds.includes(iapProductId ?? ''),
      };
    },
  };
}

/**
 * Formats a DB price (number/string) for display. Used as a fallback when
 * StoreKit hasn't loaded yet, or for free plans.
 */
function formatDbPrice(price: string | number, currency?: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice) || numPrice <= 0) return 'Free';
  if (currency && currency.toUpperCase() !== 'INR') {
    return `${currency.toUpperCase()} ${numPrice.toLocaleString()}`;
  }
  return `₹${numPrice.toLocaleString('en-IN')}`;
}
