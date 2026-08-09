require('dotenv').config();

console.log('[app.config.js] dotenv loaded:');
console.log('[app.config.js] APP_ENV =', process.env.APP_ENV);
console.log('[app.config.js] API_BASE_URL =', process.env.API_BASE_URL);
console.log('[app.config.js] MODE =', process.env.MODE);

const ENVIRONMENTS = {
  local: {
    apiBaseUrl: 'http://192.168.1.7:3001/api/v1',
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
    plugins: [
      ...pluginsWithoutNotifications,
      "expo-font",
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
      apiBaseUrl: process.env.API_BASE_URL || envConfig.apiBaseUrl,
      subscriptionMode: process.env.SUBSCRIPTION_MODE
        ? process.env.SUBSCRIPTION_MODE === 'true'
        : envConfig.subscriptionMode,
      showDevBanner: process.env.SHOW_DEV_BANNER
        ? process.env.SHOW_DEV_BANNER === 'true'
        : envConfig.showDevBanner,
    }
  };
};
