/**
 * Android platform-specific subscription logic.
 *
 * On Android, subscriptions are sold via CCAvenue web checkout. Prices come
 * from the backend DB (base price + GST breakdown). The GST breakdown
 * section is shown for paid plans that have gst_breakdown data.
 */
import type { SubscriptionPlan } from '@/features/owner/api/subscriptionApi';
import type { SubscriptionPlatform, PlanPriceInfo, PlanPurchaseState } from './subscriptionPlatform';

/**
 * Factory: creates an Android SubscriptionPlatform.
 *
 * On Android there's no StoreKit/IAP state to bind, so this is stateless.
 * The factory pattern mirrors the iOS module for API consistency.
 */
export function createAndroidSubscriptionPlatform(): SubscriptionPlatform {
  return {
    getPlanPriceInfo(plan: SubscriptionPlan): PlanPriceInfo {
      const isFreePlan = Boolean(plan.is_free);
      const numPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
      const isFreeByPrice = !Number.isFinite(numPrice) || numPrice <= 0;

      if (isFreePlan || isFreeByPrice) {
        return {
          displayPrice: 'Free',
          subText: null,
          showGstBreakdown: false,
        };
      }

      // Paid plan with GST breakdown — show base price + GST sub-text.
      if (plan.gst_breakdown) {
        const gstAmount = plan.gst_breakdown.cgst_amount + plan.gst_breakdown.sgst_amount;
        const basePrice = plan.gst_breakdown.total_price_including_gst - gstAmount;
        const gstRate = plan.gst_breakdown.cgst_rate + plan.gst_breakdown.sgst_rate;
        return {
          displayPrice: formatPrice(basePrice, plan.currency),
          subText: `+ ${gstRate}% GST  = ${formatPrice(plan.gst_breakdown.total_price_including_gst, plan.currency)}`,
          showGstBreakdown: true,
        };
      }

      // Paid plan without GST breakdown — just show the price.
      return {
        displayPrice: formatPrice(plan.price, plan.currency),
        subText: null,
        showGstBreakdown: false,
      };
    },

    getPlanPurchaseState(_plan: SubscriptionPlan): PlanPurchaseState {
      // Android uses CCAvenue — no IAP flags.
      return {
        isIapPlan: false,
        iapNotReady: false,
        isIapPurchasing: false,
      };
    },
  };
}

function formatPrice(price: string | number, currency?: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice) || numPrice <= 0) return 'Free';
  if (currency && currency.toUpperCase() !== 'INR') {
    return `${currency.toUpperCase()} ${numPrice.toLocaleString()}`;
  }
  return `₹${numPrice.toLocaleString('en-IN')}`;
}
