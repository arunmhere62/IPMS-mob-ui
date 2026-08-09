# IPMS Mobile App - Frontend Documentation

React Native + Expo frontend for IPMS mobile application.

---

## 📋 Quick Navigation

### 🚀 Getting Started
- [Setup Instructions](./SETUP_INSTRUCTIONS.md) - Complete environment setup
- [Quick Start Guide](./QUICK_START.md) - Fast onboarding for developers
- [Splash Screen Setup](./SPLASH_SCREEN_SETUP.md) - Customize app splash screen

### 🎨 UI & Design
- [Icon Guide](./assets/ICON-Readme.md) - Icon usage and customization
- [S3 Upload Fix Summary](./S3_UPLOAD_FIX_SUMMARY.md) - Image upload handling

### 🔐 Authentication & Security
- [Auth JWT Flow](../IPMS-mob-api/AUTH_JWT_FLOW.md) - JWT token management
- [Logout Navigation Fix](./docs/LOGOUT_NAVIGATION_FIX.md) - Navigation after logout

### 💳 Payment Integration
- [Payment Screen Loader Fix](./docs/PAYMENT_SCREEN_LOADER_FIX.md) - Payment UI optimization
- [Payment Integration Guide](./README_PAYMENT_INTEGRATION.md) - CCAvenue integration

### 📲 Notifications
- [Push Notifications Setup](./PUSH_NOTIFICATIONS_README.md) - Firebase FCM configuration
- [Notification Setup Steps](./NOTIFICATION_SETUP_STEPS.md) - Configuration steps
- [Notifications README](./NOTIFICATIONS_README.md) - Notification handling

### 🌐 Network & Connectivity
- [Network Status Monitoring](./docs/NETWORK_STATUS_MONITORING.md) - Offline detection
- [Network Status Usage Examples](./docs/NETWORK_STATUS_USAGE_EXAMPLES.md) - Implementation examples
- [Network Banner Safe Area Fix](./docs/NETWORK_BANNER_SAFE_AREA_FIX.md) - UI adjustments
- [Network Configuration Guide](./NETWORK_CONFIGURATION_GUIDE.md) - API configuration

### 🛠️ Architecture & Configuration
- [TypeScript Configuration](./docs/TYPESCRIPT_CONFIGURATION.md) - Type definitions
- [PG Selection Flow](./docs/PG_SELECTION_FLOW.md) - Multi-location selection
- [Keyboard Handling Fix](./docs/KEYBOARD_HANDLING_FIX.md) - Form input optimization
- [Global Error Handling](./docs/GLOBAL_ERROR_HANDLING.md) - Error management
- [Error Handling Guide](./docs/ERROR_HANDLING_GUIDE.md) - Error strategies
- [Error Handling Summary](./docs/ERROR_HANDLING_SUMMARY.md) - Error overview
- [Advance Receipt Implementation](./docs/ADVANCE_RECEIPT_IMPLEMENTATION.md) - Receipt generation

### 📊 Testing & Quality
- [Unit Test Report](./UNIT_TEST_REPORT.md) - Test coverage and results
- [Test Analysis Report](./TEST_ANALYSIS_REPORT.md) - Test analysis
- [Test Results Bug Report](./TEST_RESULTS_BUG_REPORT.md) - Bug findings

### 📱 App Store & Deployment
- [Play Store Assets](./play-store-assets/README.md) - Store listing assets
- [Play Console Checklist](./play-store-assets/PLAY-CONSOLE-CHECKLIST.md) - Deployment checklist
- [Privacy Policy](./play-store-assets/PRIVACY-POLICY.md) - Legal documents
- [Terms and Conditions](./TERMS_AND_CONDITIONS.md) - T&C documentation
- [Rent Cycle Guide](./CALENDAR_VS_MIDMONTH_GUIDE.md) - Rent collection options

### 📝 Notes & Reminders
- [Add Logo Later](./ADD_LOGO_LATER.md) - Pending tasks

---

## 📁 Project Structure

```
IPMS-mob-ui/
├── src/
│   ├── features/
│   │   ├── owner/              # Owner app features
│   │   │   ├── screens/        # Screen components
│   │   │   ├── api/            # RTK Query endpoints
│   │   │   ├── store/          # Redux slices
│   │   │   └── components/     # Feature components
│   │   └── tenant/             # Tenant app features
│   │       ├── screens/
│   │       ├── api/
│   │       ├── store/
│   │       └── components/
│   ├── components/             # Shared components
│   ├── services/               # Business logic
│   ├── navigation/             # Route definitions
│   ├── store/                  # Global Redux store
│   ├── theme/                  # Theme configuration
│   ├── config/                 # App configuration
│   └── types/                  # TypeScript types
├── assets/                     # Images, icons, fonts
├── docs/                       # Technical documentation
├── play-store-assets/          # Store listing assets
├── app.json                    # Expo configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (macOS only)
- Android: Android Studio

### Installation

```bash
# Clone repository
git clone <repo-url>
cd IPMS-mob/IPMS-mob-ui

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Environment Configuration

Create `.env` file in root:
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.7:3001/api/v1
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## 🚀 Building & Deployment

### Development Build
```bash
eas build -p ios --profile ios-dev
eas build -p android --profile android-dev
```

### Production Build
```bash
# iOS
eas build -p ios --profile ios-production
eas submit -p ios --latest

# Android
eas build -p android --profile android-production
eas submit -p android --latest
```

---

## 📦 Key Dependencies

- **react-native**: Mobile framework
- **expo**: Development platform
- **react-navigation**: Routing
- **redux-toolkit**: State management
- **@reduxjs/toolkit/query**: API calls
- **react-native-webview**: WebView for payments
- **expo-notifications**: Push notifications
- **expo-device**: Device information
- **@react-native-async-storage**: Local storage

---

## 🎯 Features

### Owner App
- Multi-location PG management
- Tenant management
- Rent collection (CCAvenue)
- Payment tracking
- Support ticketing
- Employee management
- Reports & analytics

### Tenant App
- View PG details
- Track rent payments
- Submit maintenance requests
- View receipts
- Account management

---

## 🐛 Common Issues

### Build Errors
- Clear cache: `expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Network Issues
- Check API URL in `.env`
- Verify backend is running
- Check firewall settings

### Notification Issues
- Verify FCM credentials
- Check notification permissions
- Review Firebase configuration

See [Troubleshooting](../README.md#-troubleshooting) for more solutions.

---

## 📞 Support

- Check relevant documentation files
- Review error logs in console
- Check [Current Fix Status](../CURRENT_FIX_STATUS.md)

---

**Last Updated:** August 2026  
**Version:** 1.0.0
