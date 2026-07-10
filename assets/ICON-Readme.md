# Mobile App Assets

Static assets used by the Expo React Native app for icons, splash screens, and store listings.

## Files

- **adaptive-logo.png** — 103 KB — Android adaptive icon foreground image, used by the home screen launcher
- **app-icon.png** — 232 KB — Main app icon displayed on the device home screen and in the app switcher
- **ball-jump.json** — 3 KB — Lottie animation used for the splash screen loading spinner (referenced in `App.tsx`)
- **feature-graphic.png** — 216 KB — Google Play Store feature graphic banner shown on the store listing page
- **notification-icon-svg.svg** — 543 KB — SVG source file for the push notification icon
- **splash-logo.png** — 232 KB — Logo image displayed on the splash screen during app launch
- **splash-lottie.json** — 1 KB — Alternative Lottie animation for splash screen (not currently active; `ball-jump.json` is used instead)

## Usage

- **App icon & splash** are configured in `app.json` / `app.config.js` via Expo's `expo-splash-screen` and icon settings
- **Lottie animations** are rendered using `lottie-react-native` in `App.tsx` during the splash phase
- **Notification icon** is referenced by `notificationService` for push notification display
- **Feature graphic** is uploaded to Google Play Console for the store listing
