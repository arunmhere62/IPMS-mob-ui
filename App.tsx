import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from './src/store';
import { ActivityIndicator, View, StatusBar, Text, TouchableOpacity, Platform } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkStatusProvider } from './src/providers/NetworkStatusProvider';
import { Theme } from './src/theme';
import { AppNavigator } from '@/navigation/AppNavigator';
import { setupGlobalErrorHandlers } from './src/utils/errorHandler';
import { ErrorProvider } from './src/providers/ErrorProvider';
import ErrorAlert from './src/components/ErrorAlert/ErrorAlert';
import { useError } from './src/providers/ErrorProvider';
import { NetworkLoggerFloatingButton } from './src/components/NetworkLoggerFloatingButton';
import notificationService from './src/services/notifications/notificationService';
import { ToastProvider } from './src/providers/ToastProvider';
import * as Notifications from 'expo-notifications';
import { Animated, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';

// CRITICAL: Set notification handler at the TOP LEVEL (outside component)
// This ensures notifications are handled even when app is in background/killed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [appError, setAppError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [persistReady, setPersistReady] = useState(false);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = React.useRef(new Animated.Value(1)).current;
  const hasHiddenNativeSplash = React.useRef(false);
  const [rootLaidOut, setRootLaidOut] = useState(false);
  const [overlayLaidOut, setOverlayLaidOut] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize global error handlers
        setupGlobalErrorHandlers();
        
        // Request notification permission early (Android 13+ requirement)
        // This ensures the permission dialog shows on first app open
        // Token registration happens later after user login
        console.log('🔔 Requesting notification permission early...');
        const permissionGranted = await notificationService.requestPermissionEarly();
        console.log('🔔 Notification permission result:', permissionGranted);
        
        console.log('✅ App initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setAppError(`Initialization failed: ${error}`);
        setIsInitialized(true); // Still show the app with error handling
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hasHiddenNativeSplash.current) return;
    if (!rootLaidOut) return;

    // Primary path: wait for the overlay container to layout (usually within 1 frame)
    if (overlayLaidOut) {
      hasHiddenNativeSplash.current = true;
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => undefined);
      });
      return;
    }

    // Fallback: if overlay layout never fires on some Android devices, don't deadlock.
    const t = setTimeout(() => {
      if (hasHiddenNativeSplash.current) return;
      hasHiddenNativeSplash.current = true;
      SplashScreen.hideAsync().catch(() => undefined);
    }, 800);

    return () => clearTimeout(t);
  }, [overlayLaidOut, rootLaidOut]);

  useEffect(() => {
    if (!splashVisible) return;
    if (!isInitialized) return;
    if (!persistReady) return;
    if (!minSplashDone) return;

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setSplashVisible(false);
      }
    });
  }, [isInitialized, minSplashDone, splashOpacity, splashVisible]);

  useEffect(() => {
    if (splashVisible) return;

    requestAnimationFrame(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(Theme.colors.background.primary, true);
        StatusBar.setTranslucent(false);
      }
      StatusBar.setBarStyle('dark-content', true);
    });
  }, [splashVisible]);

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      onLayout={() => setRootLaidOut(true)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ErrorBoundary>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate
              loading={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>Loading PG Management...</Text>
                </View>
              }
              onBeforeLift={() => setPersistReady(true)}
              persistor={persistor}
            >
              <ErrorProvider>
                <ToastProvider>
                  {appError ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>App Error</Text>
                      <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{appError}</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setAppError(null);
                          setIsInitialized(false);
                        }}
                        style={{ backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <AppContent />
                  )}
                </ToastProvider>
              </ErrorProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </ErrorBoundary>

      <Animated.View
        pointerEvents={splashVisible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: splashOpacity,
        }}
        onLayout={() => setOverlayLaidOut(true)}
      >
        <LottieView
          source={require('./assets/ball-jump.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140 }}
        />
      </Animated.View>
    </View>
  );
}

function AppContent() {
  const { error, clearError } = useError();

  // Removed all notification setup code - now handled only in LoginScreen

  return (
    <NetworkStatusProvider>
      <ErrorAlert error={error} onDismiss={clearError} />
      <AppNavigator />
      {/* <NetworkLoggerFloatingButton enabled={__DEV__} /> */}
      <NetworkLoggerFloatingButton enabled={true} />
    </NetworkStatusProvider>
  );
}
