import { useEffect, useState } from "react";
import { setupGlobalErrorHandlers } from "@/utils/errorHandler";
import notificationService from "@/services/notifications/notificationService";

interface AppInitState {
  isInitialized: boolean;
  appError: string | null;
  clearError: () => void;
}

/**
 * Handles early app initialization:
 * - Global error handlers
 * - Early notification permission request (Android 13+ requirement)
 */
export function useAppInit(): AppInitState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Starting app initialization...");
        setupGlobalErrorHandlers();

        // Request notification permission early (Android 13+ requirement)
        // Token registration happens later after user login
        console.log("🔔 Requesting notification permission early...");
        const permissionGranted =
          await notificationService.requestPermissionEarly();
        console.log("🔔 Notification permission result:", permissionGranted);

        console.log("✅ App initialized successfully");
        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Failed to initialize app:", error);
        setAppError(`Initialization failed: ${error}`);
        setIsInitialized(true); // Still show the app with error handling
      }
    };

    initializeApp();
  }, []);

  const clearError = () => {
    setAppError(null);
    setIsInitialized(false);
  };

  return { isInitialized, appError, clearError };
}
