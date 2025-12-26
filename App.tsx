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
              <AppContent />
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

  return (
    <NetworkStatusProvider>
      <ErrorAlert error={error} onDismiss={clearError} />
      <AppNavigator />
      <NetworkLoggerFloatingButton />
    </NetworkStatusProvider>
  );
}
