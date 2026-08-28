import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StatusBar } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { NetworkStatusProvider } from "./src/providers/NetworkStatusProvider";
import { AppNavigator } from "@/navigation/AppNavigator";
import { ErrorProvider } from "./src/providers/ErrorProvider";
import ErrorAlert from "./src/components/ErrorAlert/ErrorAlert";
import { useError } from "./src/providers/ErrorProvider";
import { NetworkLoggerFloatingButton } from "./src/components/NetworkLoggerFloatingButton";
import { AppStatusGate } from "./src/providers/AppStatusGate";
import { ToastProvider } from "./src/providers/ToastProvider";
import { persistor, store } from "@/features/owner/store";
import { ENV } from "@/config/environment";
import { useActivityTracking } from "./src/services/activity/useActivityTracking";

// Hooks
import { useAppInit } from "./src/hooks/useAppInit";
import { useSplashScreen } from "./src/hooks/useSplashScreen";
import { useNotificationReinit } from "./src/hooks/useNotificationReinit";

// Components
import { PersistLoadingScreen, AppErrorScreen } from "./src/components/AppScreens";
import { SplashOverlay } from "./src/components/SplashOverlay";

// CRITICAL: Set notification handler at the TOP LEVEL (outside component)
// This ensures notifications are handled even when app is in background/killed
import * as Notifications from "expo-notifications";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useActivityTracking();

  const { isInitialized, appError, clearError } = useAppInit();
  const [persistReady, setPersistReady] = React.useState(false);
  const {
    splashVisible,
    splashOpacity,
    setRootLaidOut,
    setOverlayLaidOut,
  } = useSplashScreen(isInitialized, persistReady);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      onLayout={() => setRootLaidOut(true)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ErrorBoundary>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate
              loading={<PersistLoadingScreen />}
              onBeforeLift={() => setPersistReady(true)}
              persistor={persistor}
            >
              <ErrorProvider>
                <ToastProvider>
                  {appError ? (
                    <AppErrorScreen error={appError} onRetry={clearError} />
                  ) : (
                    <AppContent />
                  )}
                </ToastProvider>
              </ErrorProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </ErrorBoundary>

      <SplashOverlay
        visible={splashVisible}
        opacity={splashOpacity}
        onLayout={() => setOverlayLaidOut(true)}
      />
    </View>
  );
}

function AppContent() {
  const { error, clearError } = useError();
  useNotificationReinit();

  return (
    <NetworkStatusProvider>
      <ErrorAlert error={error} onDismiss={clearError} />
      <AppStatusGate>
        <AppNavigator />
      </AppStatusGate>
      <NetworkLoggerFloatingButton enabled={ENV.IS_LOCAL || ENV.IS_DEVELOPMENT} />
    </NetworkStatusProvider>
  );
}
