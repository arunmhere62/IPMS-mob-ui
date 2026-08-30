/**
 * In-App Purchase product configuration.
 *
 * Apple App Store Guideline 3.1.1 requires paid digital subscriptions
 * offered inside the iOS app to be sold via Apple In-App Purchase (StoreKit 2).
 * Android continues to use CCAvenue via the existing web checkout flow.
 *
 * === App Store Connect setup (one-time, manual) ===
 * Create a single Subscription Group named "IPGM Plans" in App Store Connect
 * and add the auto-renewable subscription products below. Use the exact
 * Product IDs listed in IAP_PRODUCT_IDS. Configure pricing/localizations and
 * submit the IAPs for review alongside the next app binary.
 *
 * === Explicit Product ID → plan mapping ===
 * Each Apple IAP product maps explicitly to a backend `subscription_plans.s_no`
 * via IAP_PRODUCT_TO_PLAN_ID. This allows multiple plans with the same
 * duration (e.g. PremiumX and EnterpriseX are both 365 days) to each have
 * their own IAP product. The backend applies the SAME mapping when validating
 * receipts, so entitlement is granted for the exact plan the user purchased.
 *
 * NOTE: If a plan's s_no changes in the DB, update BOTH this file and the
 * backend iap.service.ts map.
 */

// Apple IAP product identifiers. Keep in sync with App Store Connect.
export const IAP_PRODUCT_IDS = {
  MONTHLY: 'com.indianpgmanagement.sub.monthly',
  PREMIUMX_LITE: 'com.indianpgmanagement.sub.premiumxlite',
  PREMIUMX: 'com.indianpgmanagement.sub.premiumx',
  ENTERPRISEX: 'com.indianpgmanagement.sub.enterprisex',
} as const;

export type IapProductId = (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

// All subscription SKUs — used to fetch products from StoreKit in one call.
export const IAP_SUBSCRIPTION_SKUS: string[] = Object.values(IAP_PRODUCT_IDS);

/**
 * Maps an Apple IAP `productId` to the backend `subscription_plans.s_no`.
 * The backend must apply the SAME mapping when validating receipts, so this
 * constant is the single source of truth for the client. The server copy is
 * a defensive duplicate.
 *
 * DB plan reference (must match production subscription_plans rows):
 *   s_no=6 → Testing Plan   (30 days,  ₹10)   → MONTHLY
 *   s_no=4 → PremiumX Lite  (180 days, ₹5999) → PREMIUMX_LITE
 *   s_no=3 → PremiumX       (365 days, ₹9999) → PREMIUMX
 *   s_no=2 → EnterpriseX    (365 days, ₹24999)→ ENTERPRISEX
 */
export const IAP_PRODUCT_TO_PLAN_ID: Record<string, number> = {
  [IAP_PRODUCT_IDS.MONTHLY]: 6,
  [IAP_PRODUCT_IDS.PREMIUMX_LITE]: 4,
  [IAP_PRODUCT_IDS.PREMIUMX]: 3,
  [IAP_PRODUCT_IDS.ENTERPRISEX]: 2,
};

/**
 * Maps a backend plan `s_no` to its Apple IAP product id.
 * Used by SubscriptionPlansScreen to look up the right SKU for a plan.
 */
export const PLAN_ID_TO_IAP_PRODUCT: Record<number, string> = Object.fromEntries(
  Object.entries(IAP_PRODUCT_TO_PLAN_ID).map(([productId, planId]) => [planId, productId]),
);

/**
 * Returns the Apple IAP product id for a given plan `s_no`, or null if the
 * plan has no IAP equivalent (e.g. free / trial plans like StarterX).
 */
export const getIapProductIdForPlan = (planId: number | null | undefined): string | null => {
  if (!planId) return null;
  return PLAN_ID_TO_IAP_PRODUCT[planId] ?? null;
};
