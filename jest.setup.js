// Mock environment configuration before it's imported
jest.mock('@/config/environment', () => ({
  ENV: {
    APP_ENV: 'dev',
    API_BASE_URL: 'http://localhost:3000',
    SUBSCRIPTION_MODE: true,
    SHOW_DEV_BANNER: false,
    IS_DEV: true,
    IS_PROD: false,
    IS_DEV_ENV: true,
    IS_PREPROD_ENV: false,
  },
  getApiUrl: (endpoint = '') => `http://localhost:3000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
  logConfig: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'http://localhost:3000',
        subscriptionMode: true,
        showDevBanner: false,
        appEnv: 'dev',
      },
    },
  },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => 'LinearGradient');

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  requestPermissionsAsync: jest.fn(() => ({ granted: true })),
  getExpoPushTokenAsync: jest.fn(() => ({ data: 'mock-token' })),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => []),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  getDeviceTypeAsync: jest.fn(() => 'handheld'),
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock react-native-webview
jest.mock('react-native-webview', () => 'WebView');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
