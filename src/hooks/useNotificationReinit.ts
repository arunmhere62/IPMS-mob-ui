import { useEffect } from "react";
import notificationService from "@/services/notifications/notificationService";
import { store } from "@/features/owner/store";

/**
 * Re-initializes notification listeners on app load if a user is already
 * authenticated. Handles hot-reload scenarios where listeners need to be
 * refreshed.
 *
 * Routes to the correct init method based on auth role:
 * - Tenant → initializeForTenant (no owner register-token call)
 * - Owner  → initialize (standard flow)
 */
export function useNotificationReinit() {
  useEffect(() => {
    const state = store.getState();
    const isTenant = state.tenantAuth?.isAuthenticated;
    const ownerId = state.auth.user?.s_no;
    const tenantId = state.tenantAuth.tenant?.tenant_id;

    if (isTenant && tenantId) {
      console.log("[App] 🔄 Re-initializing notifications for tenant:", tenantId);
      void notificationService.initializeForTenant(tenantId, true);
    } else if (ownerId) {
      console.log("[App] 🔄 Re-initializing notifications for owner:", ownerId);
      void notificationService.initialize(ownerId, true);
    }
  }, []);
}
