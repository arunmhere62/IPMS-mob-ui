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

export default function App() {
  const [appError, setAppError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize global error handlers
        setupGlobalErrorHandlers();
        
        
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

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3B82F6' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>Loading PG Management...</Text>
      </View>
    );
  }

  // Show error screen if critical error occurred
  if (appError) {
    return (
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
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate
            loading={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
              </View>
            }
            persistor={persistor}
          >
            <ErrorProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </ErrorProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { error, clearError } = useError();

  // Set default status bar configuration
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(Theme.colors.background.primary, true);
      StatusBar.setTranslucent(false);
    }
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  // Setup notification permissions and channels on app startup (Android 13+ requirement)
  useEffect(() => {
    const setupNotificationInfrastructure = async () => {
      try {
        if (Platform.OS === 'android') {
          console.log('[APP] 🔔 Setting up Android notification infrastructure...');
          
          // Import Notifications here to avoid issues
          const Notifications = (await import('expo-notifications')).default;
          
          // Create notification channels FIRST (required for Android)
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
            sound: 'default',
            showBadge: true,
            enableVibrate: true,
            enableLights: true,
          });

          await Notifications.setNotificationChannelAsync('rent-reminders', {
            name: 'Rent Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
            sound: 'default',
          });

          await Notifications.setNotificationChannelAsync('payments', {
            name: 'Payments',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10B981',
            sound: 'default',
          });

          await Notifications.setNotificationChannelAsync('alerts', {
            name: 'Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#EF4444',
            sound: 'default',
          });

          console.log('[APP] ✅ Android notification channels created');

          // Request permissions (critical for Android 13+)
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          console.log('[APP] 📋 Current permission status:', existingStatus);
          
          if (existingStatus !== 'granted') {
            console.log('[APP] 🔐 Requesting notification permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            console.log('[APP] 📋 Permission request result:', status);
            
            if (status !== 'granted') {
              console.warn('[APP] ⚠️ Notification permission denied by user');
            } else {
              console.log('[APP] ✅ Notification permission granted');
            }
          } else {
            console.log('[APP] ✅ Notification permission already granted');
          }

          // Set notification handler
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });

          console.log('[APP] ✅ Notification infrastructure setup complete');
        }
      } catch (error) {
        console.error('[APP] ❌ Failed to setup notification infrastructure:', error);
      }
    };

    setupNotificationInfrastructure();
  }, []);

  // Initialize notifications for already logged-in users
  useEffect(() => {
    const initNotificationsForLoggedInUser = async () => {
      try {
        // Wait for store to rehydrate and notification infrastructure
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const state = store.getState();
        const user = state.auth?.user;
        const isAuthenticated = state.auth?.isAuthenticated;
        
        if (isAuthenticated && user?.s_no) {
          console.log('[APP] User already logged in, initializing notifications...');
          await notificationService.initialize(user.s_no);
        }
      } catch (error) {
        console.warn('[APP] Failed to initialize notifications on app start:', error);
      }
    };

    initNotificationsForLoggedInUser();
  }, []);

  return (
    <NetworkStatusProvider>
      <ErrorAlert error={error} onDismiss={clearError} />
      <AppNavigator />
      {/* <NetworkLoggerFloatingButton enabled={__DEV__} /> */}
      <NetworkLoggerFloatingButton enabled={true} />
    </NetworkStatusProvider>
  );
}
