/**
 * In-App Purchase product configuration.
 *
 * Apple App Store Guideline 3.1.1 requires paid digital subscriptions
 * offered inside the iOS app to be sold via Apple In-App Purchase (StoreKit 2).
 * Android continues to use CCAvenue via the existing web checkout flow.
 *
 * === App Store Connect setup (one-time, manual) ===
 * Create a single Subscription Group named "IPMS Plans" in App Store Connect
 * and add the four auto-renewable subscription products below. Use the exact
 * Product IDs listed in IAP_PRODUCT_IDS. Configure pricing/localizations and
 * submit the IAPs for review alongside the next app binary.
 *
 * Reference durations (must match the App Store Connect product config):
 *   Monthly     -> 1 month
 *   Quarterly   -> 3 months
 *   Half-Yearly -> 6 months
 *   Yearly      -> 1 year
 *
 * === Backend mapping ===
 * The backend (IPMS-mob-api) maps each Apple `productId` to the existing
 * `subscription_plans.s_no` via the IAP_PRODUCT_MAP below. The mapping is
 * duplicated on the server (see iap.service.ts) so receipts can be validated
 * and entitlement granted without trusting the client.
 */

// Apple IAP product identifiers. Keep in sync with App Store Connect.
export const IAP_PRODUCT_IDS = {
  MONTHLY: 'com.indianpgmanagement.sub.monthly',
  QUARTERLY: 'com.indianpgmanagement.sub.quarterly',
  HALF_YEARLY: 'com.indianpgmanagement.sub.halfyearly',
  YEARLY: 'com.indianpgmanagement.sub.yearly',
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
 * NOTE: The plan_id values below must match the production subscription_plans
 * rows for the corresponding durations. If a plan's s_no changes in the DB,
 * update BOTH this file and the backend iap.service.ts map.
 */
export const IAP_PRODUCT_TO_PLAN_ID: Record<string, number> = {
  [IAP_PRODUCT_IDS.MONTHLY]: 0, // placeholder — set after confirming DB plan ids
  [IAP_PRODUCT_IDS.QUARTERLY]: 0,
  [IAP_PRODUCT_IDS.HALF_YEARLY]: 0,
  [IAP_PRODUCT_IDS.YEARLY]: 0,
};

/**
 * Maps a backend plan duration (in days) to an Apple IAP product id.
 * Used by SubscriptionPlansScreen to look up the right SKU for a plan.
 */
export const PLAN_DURATION_TO_IAP_PRODUCT: Record<number, string> = {
  30: IAP_PRODUCT_IDS.MONTHLY,
  90: IAP_PRODUCT_IDS.QUARTERLY,
  180: IAP_PRODUCT_IDS.HALF_YEARLY,
  365: IAP_PRODUCT_IDS.YEARLY,
};

/**
 * Returns the Apple IAP product id for a given plan duration, or null if the
 * plan has no IAP equivalent (e.g. free / trial plans).
 */
export const getIapProductIdForDuration = (duration: number | null | undefined): string | null => {
  if (!duration) return null;
  return PLAN_DURATION_TO_IAP_PRODUCT[duration] ?? null;
};
