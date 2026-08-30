require('dotenv').config();
const withWebViewUpiInterceptor = require('./plugins/withWebViewUpiInterceptor');

console.log('[app.config.js] dotenv loaded:');
console.log('[app.config.js] APP_ENV =', process.env.APP_ENV);
console.log('[app.config.js] API_BASE_URL =', process.env.API_BASE_URL);
console.log('[app.config.js] LOCAL_API_BASE_URL =', process.env.LOCAL_API_BASE_URL);
console.log('[app.config.js] MODE =', process.env.MODE);

// Single source of truth for the local API URL: the LOCAL_API_BASE_URL env var
// (see .env / .env.example). Change it there once and it propagates everywhere.
const LOCAL_API_BASE_URL = process.env.LOCAL_API_BASE_URL || 'http://192.168.1.6:3001/api/v1';

const ENVIRONMENTS = {
  local: {
    apiBaseUrl: LOCAL_API_BASE_URL,
    subscriptionMode: false,
    showDevBanner: true,
  },
  development: {
    apiBaseUrl: 'https://dev-api.indianpgmanagement.com/api/v1',
    subscriptionMode: true,
    showDevBanner: true,
  },
  production: {
    apiBaseUrl: 'https://mobapi.indianpgmanagement.com/api/v1',
    subscriptionMode: true,
    showDevBanner: false,
  },
};

module.exports = ({ config }) => {
  const baseExpoConfig = config ?? {};

  const appEnv = (process.env.APP_ENV || 'local').toLowerCase();
  const envConfig = ENVIRONMENTS[appEnv] || ENVIRONMENTS.local;

  const paymentResultIntentFilter = {
    action: "VIEW",
    data: [
      {
        scheme: "pgapp",
        host: "payment-result"
      }
    ],
    category: ["BROWSABLE", "DEFAULT"]
  };

  const basePlugins = Array.isArray(baseExpoConfig.plugins) ? baseExpoConfig.plugins : [];
  const hasPaymentResultIntentFilter = (baseExpoConfig.android?.intentFilters ?? []).some((intentFilter) => {
    return intentFilter?.data?.some((data) => data?.scheme === 'pgapp' && data?.host === 'payment-result');
  });
  const pluginsWithoutNotifications = basePlugins.filter((plugin) => {
    if (plugin === 'expo-notifications') return false;
    if (Array.isArray(plugin) && plugin[0] === 'expo-notifications') return false;
    return true;
  });
  const existingNotificationsPlugin = basePlugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
  const existingNotificationsOptions = Array.isArray(existingNotificationsPlugin) && typeof existingNotificationsPlugin[1] === 'object'
    ? existingNotificationsPlugin[1]
    : {};

  return {
    ...baseExpoConfig,
    android: {
      ...(baseExpoConfig.android ?? {}),
      usesCleartextTraffic: true,
      intentFilters: [
        ...((baseExpoConfig.android?.intentFilters ?? [])),
        ...(hasPaymentResultIntentFilter ? [] : [paymentResultIntentFilter]),
      ],
    },
    ios: {
      ...(baseExpoConfig.ios ?? {}),
      // Required for Linking.canOpenURL() to detect installed UPI apps on iOS.
      // iOS 9+ requires apps to declare which URL schemes they query.
      infoPlist: {
        ...(baseExpoConfig.ios?.infoPlist ?? {}),
        LSApplicationQueriesSchemes: [
          ...((baseExpoConfig.ios?.infoPlist?.LSApplicationQueriesSchemes) ?? []),
          'upi',
          'tez',        // Google Pay (old scheme)
          'gpay',       // Google Pay (new)
          'phonepe',    // PhonePe
          'paytmmp',    // Paytm
          'bhim',       // BHIM
          'mobikwik',   // Mobikwik
          'freecharge', // Freecharge
          'amazonpay',  // Amazon Pay
          'myjio',      // Jio
          'whatsapp',   // WhatsApp (for UPI on WhatsApp)
        ],
      },
    },
    plugins: [
      ...pluginsWithoutNotifications,
      "expo-font",
      "expo-iap",
      // Patches react-native-webview's iOS native code to route custom URL
      // schemes (upi://, gpay://, etc.) through onShouldStartLoadWithRequest
      // instead of auto-opening them. Required for UPI app chooser on iOS.
      withWebViewUpiInterceptor,
      [
        "expo-notifications",
        {
          ...existingNotificationsOptions,
          color: "#3B82F6",
          sounds: []
        }
      ]
    ],
    extra: {
      ...(baseExpoConfig.extra ?? {}),
      eas: {
        ...(baseExpoConfig.extra?.eas ?? {}),
        projectId: "0f6ecb0b-7511-427b-be33-74a4bd0207fe"
      },
      appEnv,
      // Expose the local API URL so environment.ts can use it as the single
      // source of truth for runtime env switching (NetworkLoggerScreen, etc.).
      localApiBaseUrl: LOCAL_API_BASE_URL,
      // Allow forcing iOS to use CCAvenue instead of Apple IAP for testing/merchant needs.
      useIapForIos: process.env.USE_IAP_FOR_IOS !== 'false',
      apiBaseUrl: process.env.API_BASE_URL || envConfig.apiBaseUrl,
      subscriptionMode: process.env.SUBSCRIPTION_MODE
        ? process.env.SUBSCRIPTION_MODE === 'true'
        : envConfig.subscriptionMode,
      showDevBanner: process.env.SHOW_DEV_BANNER
        ? process.env.SHOW_DEV_BANNER === 'true'
        : envConfig.showDevBanner,
      // External website where iOS users register (App Store Guideline 3.1.1
      // requires business/org signup to happen outside the iOS app).
      webSignupUrl: process.env.WEB_SIGNUP_URL || 'https://www.indianpgmanagement.com',
    }
  };
};
