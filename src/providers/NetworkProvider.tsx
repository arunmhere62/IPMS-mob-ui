/**
 * Global Network Provider
 * Handles network connectivity, timeouts, and errors at application root level
 * 
 * Note: To enable full network monitoring, install @react-native-community/netinfo:
 * npm install @react-native-community/netinfo
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { showSuccessAlert } from '@/utils/errorHandler';

interface NetworkContextType {
  isConnected: boolean;
  showOfflineMessage: () => void;
  showTimeoutMessage: () => void;
  retryFailedRequests: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  showOfflineMessage: () => {},
  showTimeoutMessage: () => {},
  retryFailedRequests: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const failedRequestsQueue = useRef<Array<() => Promise<any>>>([]);
  const appState = useRef(AppState.currentState);

  // Track app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App came to foreground');
    }
    appState.current = nextAppState;
  };

  const handleNetworkLost = () => {
    setIsConnected(false);
    setWasOffline(true);
    showOfflineMessage();
  };

  const handleNetworkRestored = () => {
    setIsConnected(true);
    if (wasOffline) {
      Alert.alert(
        '✅ Back Online',
        'Your internet connection has been restored.',
        [
          {
            text: 'Retry Failed Requests',
            onPress: retryFailedRequests,
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      setWasOffline(false);
    }
  };

  const showOfflineMessage = useCallback(() => {
    Alert.alert(
      '📡 No Internet Connection',
      'Please check your network connection and try again.',
      [{ text: 'OK' }]
    );
  }, []);

  const showTimeoutMessage = useCallback(() => {
    Alert.alert(
      '⏱️ Request Timeout',
      'The server is taking too long to respond. Please check your connection or try again later.',
      [
        {
          text: 'Retry',
          onPress: retryFailedRequests,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const retryFailedRequests = useCallback(async () => {
    if (failedRequestsQueue.current.length === 0) {
      console.log('ℹ️ No failed requests to retry');
      return;
    }

    console.log(`🔄 Retrying ${failedRequestsQueue.current.length} failed requests...`);

    const requests = [...failedRequestsQueue.current];
    failedRequestsQueue.current = [];

    const results = await Promise.allSettled(
      requests.map((request) => request())
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`✅ Retry complete: ${succeeded} succeeded, ${failed} failed`);

    if (succeeded > 0) {
      showSuccessAlert(`${succeeded} request(s) completed successfully.`);
    }
  }, []);

  const value: NetworkContextType = {
    isConnected,
    showOfflineMessage,
    showTimeoutMessage,
    retryFailedRequests,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
