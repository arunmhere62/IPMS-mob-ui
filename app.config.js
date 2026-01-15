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
  const pluginsWithoutNotifications = basePlugins.filter((plugin) => {
    if (plugin === 'expo-notifications') return false;
    if (Array.isArray(plugin) && plugin[0] === 'expo-notifications') return false;
    return true;
  });

  return {
    ...baseExpoConfig,
    android: {
      ...(baseExpoConfig.android ?? {}),
      usesCleartextTraffic: true,
      intentFilters: [
        ...((baseExpoConfig.android?.intentFilters ?? [])),
        paymentResultIntentFilter,
      ],
    },
    plugins: [
      ...pluginsWithoutNotifications,
      "expo-font",
      [
        "expo-notifications",
        {
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
      // Single source of truth for API URL - change in .env file
      // apiBaseUrl: process.env.API_BASE_URL || "https://ipms-mob-api-dev.pgmanagement.site/api/v1",
      apiBaseUrl: process.env.API_BASE_URL || "http://192.168.29.97:5001/api/v1",
      // Subscription Configuration
      subscriptionMode: process.env.SUBSCRIPTION_MODE === 'true',
      showDevBanner: process.env.SHOW_DEV_BANNER === 'true'
    }
  };
};
