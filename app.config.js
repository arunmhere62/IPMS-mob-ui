const API_ENVIRONMENTS = [
  {
    label: 'Production',
    url: 'https://mobapi.indianpgmanagement.com/api/v1',
    description: 'Live production database',
  },
  {
    label: 'Local Dev',
    url: 'http://192.168.1.2:3001/api/v1',
    description: 'Local development database',
  },
];

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
      // ── Centralized API config ──
      // Update LOCAL_DEV_IP here when your dev machine IP changes.
      // Production builds override via eas.json env: API_BASE_URL
      apiBaseUrl: process.env.API_BASE_URL || API_ENVIRONMENTS[1].url,
      apiEnvironments: API_ENVIRONMENTS,
      // Subscription Configuration
      subscriptionMode: process.env.SUBSCRIPTION_MODE === 'true',
      showDevBanner: process.env.SHOW_DEV_BANNER === 'true'
    }
  };
};
