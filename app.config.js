module.exports = ({ config }) => {
  const baseExpoConfig = config ?? {};

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
      appEnv: (process.env.APP_ENV || process.env.MODE || 'dev').toLowerCase(),
      // Production builds must set API_BASE_URL via eas.json env.
      // Local dev fallback: update this IP if your dev machine changes.
      // apiBaseUrl: process.env.API_BASE_URL || "http://192.168.1.5:3001/api/v1",
      apiBaseUrl: process.env.API_BASE_URL || "https://mobapi.indianpgmanagement.com/api/v1",
      // Subscription Configuration
      subscriptionMode: process.env.SUBSCRIPTION_MODE === 'true',
      showDevBanner: process.env.SHOW_DEV_BANNER === 'true'
    }
  };
};
