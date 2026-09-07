/**
 * useIAPSubscription
 *
 * Wraps expo-iap's `useIAP` hook and ties it to our backend receipt validation
 * endpoint. iOS-only — Android keeps the CCAvenue web checkout flow.
 *
 * Responsibilities:
 *   - Initialize StoreKit connection on mount
 *   - Fetch the four IPMS subscription products from the App Store
 *   - Request a purchase for a given product id
 *   - On purchase success: send the StoreKit JWS token to the backend for
 *     server-side validation + entitlement grant, then finish the transaction
 *   - Restore purchases (Apple requires a Restore Purchases affordance)
 *
 * App Store Guideline 3.1.1: paid digital subscriptions inside the iOS app
 * must be sold via In-App Purchase. This hook is the iOS purchase path.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  useIAP,
  ErrorCode,
  type Purchase,
  type ProductSubscription,
} from 'expo-iap';
import type { PurchaseError } from 'expo-iap/build/utils/errorMapping';

import { IAP_SUBSCRIPTION_SKUS } from '@/config/iapProducts';
import {
  useValidateIapReceiptMutation,
} from '@/features/owner/api/subscriptionApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface UseIAPSubscriptionOptions {
  /** Called after the backend confirms entitlement grant for a purchase. */
  onEntitlementGranted?: (purchase: Purchase) => void;
  /** Called when a purchase flow is cancelled by the user (no error toast). */
  onPurchaseCancelled?: () => void;
}

interface UseIAPSubscriptionResult {
  /** Whether the IAP connection is ready and products have been fetched. */
  isReady: boolean;
  /** Apple StoreKit products indexed by id. */
  products: ProductSubscription[];
  /** Product ids that are currently being purchased. */
  purchasingProductIds: string[];
  /** True while a restore is in progress. */
  isRestoring: boolean;
  /** Last error message from any IAP operation (null when none). */
  lastError: string | null;
  /** Initiate a subscription purchase for the given Apple product id. */
  purchaseSubscription: (productId: string) => Promise<void>;
  /** Restore previous purchases (Apple requirement). */
  restorePurchases: () => Promise<void>;
}

const isUserCancelled = (error: PurchaseError | Error): boolean => {
  const code = (error as PurchaseError)?.code;
  return code === ErrorCode.UserCancelled;
};

export const useIAPSubscription = (
  options: UseIAPSubscriptionOptions = {},
): UseIAPSubscriptionResult => {
  const { onEntitlementGranted, onPurchaseCancelled } = options;
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [purchasingProductIds, setPurchasingProductIds] = useState<string[]>([]);

  const [validateIapReceipt] = useValidateIapReceiptMutation();

  // Keep latest callbacks in refs so the expo-iap listener (registered once)
  // always sees the latest closures without re-subscribing.
  const onEntitlementGrantedRef = useRef(onEntitlementGranted);
  const onPurchaseCancelledRef = useRef(onPurchaseCancelled);
  const validateRef = useRef(validateIapReceipt);
  onEntitlementGrantedRef.current = onEntitlementGranted;
  onPurchaseCancelledRef.current = onPurchaseCancelled;
  validateRef.current = validateIapReceipt;

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases: restorePurchasesNative,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const productId = purchase.productId;
      const token = purchase.purchaseToken ?? null;
      const transactionId =
        (purchase as any).transactionId ?? (purchase as any).originalTransactionIdentifierIOS ?? null;
      const originalTransactionId =
        (purchase as any).originalTransactionIdentifierIOS ?? undefined;

      if (!token) {
        setLastError('Apple transaction token missing. Cannot validate purchase.');
        return;
      }

      try {
        const result = await validateRef.current({
          transactionToken: token,
          productId,
          transactionId: transactionId ?? undefined,
          originalTransactionId,
        }).unwrap();

        // Backend confirmed entitlement — finish the StoreKit transaction so
        // it doesn't keep replaying on every app launch.
        await finishTransaction({ purchase, isConsumable: false });
        onEntitlementGrantedRef.current?.(purchase);
        void result;
      } catch (err: any) {
        const message =
          (err?.data && (err.data.message || err.data.error)) ||
          err?.error ||
          'Failed to validate Apple purchase with the server.';
        setLastError(message);
        // Do NOT finish the transaction — StoreKit will replay it next launch
        // and we'll retry validation. This is the Apple-recommended pattern.
      } finally {
        setPurchasingProductIds((ids) => ids.filter((id) => id !== productId));
      }
    },
    onPurchaseError: (error: PurchaseError) => {
      const productId = error.productId ?? '';
      if (productId) {
        setPurchasingProductIds((ids) => ids.filter((id) => id !== productId));
      }
      if (isUserCancelled(error)) {
        onPurchaseCancelledRef.current?.();
        return;
      }
      setLastError(error.message || 'Purchase failed.');
    },
    onError: (error: Error) => {
      setLastError(error.message || 'In-app purchase error.');
    },
  });

  // Fetch subscription products once the store connection is established.
  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: IAP_SUBSCRIPTION_SKUS, type: 'subs' }).catch((e: Error) => {
        setLastError(e.message || 'Failed to load subscription products.');
      });
    }
  }, [connected, fetchProducts]);

  const purchaseSubscription = useCallback(
    async (productId: string) => {
      if (!connected) {
        setLastError('Store is not ready. Please try again in a moment.');
        return;
      }
      setLastError(null);
      setPurchasingProductIds((ids) => (ids.includes(productId) ? ids : [...ids, productId]));
      try {
        await requestPurchase({
          request: {
            apple: { sku: productId },
            google: { skus: [productId] },
          },
          type: 'subs',
        });
      } catch (err: any) {
        setPurchasingProductIds((ids) => ids.filter((id) => id !== productId));
        if (isUserCancelled(err)) {
          onPurchaseCancelledRef.current?.();
          return;
        }
        setLastError(err?.message || 'Unable to start purchase.');
      }
    },
    [connected, requestPurchase],
  );

  const restorePurchases = useCallback(async () => {
    setIsRestoring(true);
    setLastError(null);
    try {
      await restorePurchasesNative();
      // After the sync, surface any unfinished transactions to the validation
      // flow so entitlements get re-granted if the user reinstalls the app.
      await getAvailablePurchases();
      showSuccessAlert('Purchases restored.');
    } catch (err: any) {
      setLastError(err?.message || 'Restore failed.');
      showErrorAlert(err, 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  }, [restorePurchasesNative, getAvailablePurchases]);

  // Surface lastError to the user via alert. Kept separate so the hook can
  // be reused in non-UI contexts if needed.
  useEffect(() => {
    if (lastError) {
      Alert.alert('Subscription', lastError);
    }
  }, [lastError]);

  return {
    isReady: connected,
    products: subscriptions,
    purchasingProductIds,
    isRestoring,
    lastError,
    purchaseSubscription,
    restorePurchases,
  };
};
