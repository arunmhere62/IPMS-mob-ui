module.exports = {
  expo: {
    name: "PG Management",
    slug: "pgmanagement",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pgmanagement.app",
      infoPlist: {
        UIBackgroundModes: [
          "remote-notification",
          "remote-notification"
        ],
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.pgmanagement.app",
      adaptiveIcon: {
        backgroundColor: "#3B82F6"
      },
      permissions: [
        "NOTIFICATIONS",
        "INTERNET"
      ],
      useNextNotificationsApi: true,
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "pgapp",
              host: "payment-result"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro"
    },
    scheme: "pgapp",
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#3B82F6",
          sounds: ["./assets/notification-sound.wav"]
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "0f6ecb0b-7511-427b-be33-74a4bd0207fe"
      },
      // Single source of truth for API URL - change in .env file
      apiBaseUrl: process.env.API_BASE_URL || "http://172.20.10.2:5000/api/v1",
      // Subscription Configuration
      subscriptionMode: process.env.SUBSCRIPTION_MODE === 'true',
      showDevBanner: process.env.SHOW_DEV_BANNER === 'true'
    }
  }
};
