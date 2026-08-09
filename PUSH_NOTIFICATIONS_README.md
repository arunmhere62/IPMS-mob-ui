# Push Notifications Implementation Guide

## Overview

This document outlines the complete push notification implementation for PG Management mobile app supporting both iOS and Android platforms using Expo Push Notifications and Firebase Cloud Messaging (FCM).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Request Notification Permissions (Android 13+)   │  │
│  │  2. Create Android Notification Channels             │  │
│  │  3. Get Expo Push Token                              │  │
│  │  4. Register Token with Backend API                  │  │
│  │  5. Setup Notification Listeners                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js/NestJS)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /notifications/register-token                  │  │
│  │  POST /notifications/test                            │  │
│  │  POST /notifications/send                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         Expo Push Service & Firebase Cloud Messaging        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Expo Project ID: 0f6ecb0b-7511-427b-be33-74a4bd...  │  │
│  │  Firebase Project: pg-management-mobile              │  │
│  │  FCM Server Key: From Firebase Service Account       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Android & iOS Devices                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Receive & Display Notifications                     │  │
│  │  - Foreground: App handles display                   │  │
│  │  - Background: System handles display                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Frontend Setup (React Native)

#### 1.1 Install Dependencies
```bash
npm install expo-notifications expo-device expo-constants
```

#### 1.2 Configure app.json
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "0f6ecb0b-7511-427b-be33-74a4bd0207fe"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "color": "#3B82F6"
        }
      ]
    ],
    "android": {
      "permissions": [
        "NOTIFICATIONS",
        "POST_NOTIFICATIONS"
      ]
    }
  }
}
```

#### 1.3 Android Manifest Permissions
File: `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.NOTIFICATIONS"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

#### 1.4 Notification Service Implementation
File: `src/services/notifications/notificationService.ts`

**Key Functions:**
- `initialize()` - Setup permissions, channels, and listeners
- `getExpoPushToken()` - Get device token with retry logic
- `registerToken(userId, token)` - Register token with backend
- `setupNotificationListeners()` - Handle incoming notifications
- `requestPermissions()` - Request Android 13+ POST_NOTIFICATIONS permission

**Critical Implementation Details:**
- Request permissions BEFORE getting token
- Create Android notification channels on app startup (required for Android 8+)
- Re-schedule foreground notifications with correct channel ID (EAS build requirement)
- Use retry logic for token generation (3 attempts with 2s delay)

#### 1.5 App Initialization (App.tsx)
```typescript
useEffect(() => {
  // Setup notification infrastructure on app startup
  // - Create Android channels
  // - Request permissions
  // - Set notification handler
}, []);
```

#### 1.6 Post-Login Initialization (OTPVerificationScreen.tsx)
```typescript
// After successful login:
1. Call notificationService.initialize()
2. Wait 2 seconds for Android channels to initialize
3. Call backend /notifications/test endpoint (debug mode)
```

---

### 2. Android Setup

#### 2.1 Firebase Configuration

**Required Files:**
- `android/app/google-services.json` - Firebase configuration

**How to Get:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `pg-management-mobile`
3. Add Android app with package: `com.pgmanagement.app`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

#### 2.2 Gradle Configuration

**File: `android/build.gradle`**
```gradle
buildscript {
  dependencies {
    classpath('com.google.gms:google-services:4.4.0')
  }
}
```

**File: `android/app/build.gradle`**
```gradle
apply plugin: "com.google.gms.google-services"
```

#### 2.3 Build & Deploy
```bash
# Regenerate native code
npx expo prebuild --platform android --clean

# Build APK
cd android
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

---

### 3. iOS Setup

#### 3.1 Apple Push Notification Certificate

**Required:**
- Apple Developer Account
- APNs Certificate (.p8 file)

**Steps:**
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create APNs key for your app
3. Download `.p8` file
4. Upload to Expo: `eas credentials`

#### 3.2 Entitlements Configuration
```xml
<!-- ios/[AppName]/[AppName].entitlements -->
<key>aps-environment</key>
<string>production</string>
```

#### 3.3 Build & Deploy
```bash
# Build for iOS
eas build -p ios --profile production

# Or local build
npx expo prebuild --platform ios
cd ios
pod install
xcodebuild -workspace [AppName].xcworkspace -scheme [AppName] -configuration Release
```

---

## Backend Implementation

### API Endpoints

#### 1. Register Token
```
POST /notifications/register-token
Headers: x-user-id: <number>
Body: {
  fcm_token: string,
  device_type: "android" | "ios",
  device_id: string,
  device_name: string
}
Response: { success: true, message: "Token registered" }
```

#### 2. Send Test Notification
```
POST /notifications/test
Headers: x-user-id: <number>
Response: { success: true, notificationId: string }
```

#### 3. Send Notification to User
```
POST /notifications/send
Headers: x-user-id: <number>
Body: {
  title: string,
  body: string,
  type: "rent-reminders" | "payments" | "alerts" | "default",
  data: object
}
Response: { success: true, sentCount: number }
```

### Firebase Setup

**Environment Variables:**
```
FIREBASE_PROJECT_ID=pg-management-mobile
FIREBASE_PRIVATE_KEY=<from Firebase Service Account>
FIREBASE_CLIENT_EMAIL=<from Firebase Service Account>
```

**Service Account JSON:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Extract: `project_id`, `private_key`, `client_email`

---

## Notification Channels (Android)

Android 8+ requires notification channels. Create on app startup:

```typescript
// Default channel
{
  name: 'Default',
  importance: AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#3B82F6',
  sound: 'default'
}

// Rent Reminders
{
  name: 'Rent Reminders',
  importance: AndroidImportance.HIGH,
  lightColor: '#3B82F6'
}

// Payments
{
  name: 'Payments',
  importance: AndroidImportance.HIGH,
  lightColor: '#10B981'
}

// Alerts
{
  name: 'Alerts',
  importance: AndroidImportance.MAX,
  lightColor: '#EF4444'
}
```

---

## Testing

### Manual Testing

#### 1. Test Permission Popup
- Login to app
- Should see notification permission popup
- Grant permission

#### 2. Test Token Registration
- Check console logs: `[PUSH] Registering token with backend...`
- Verify API call succeeds: `✅ FCM token registered with backend successfully`

#### 3. Test Notification Delivery
- Use Settings → Test Push Notifications button
- Or send via Postman:
```
POST https://pg-api-mobile.vercel.app/api/v1/notifications/test
Headers: x-user-id: 34
```

#### 4. Check Device Logs
```bash
# Android
adb logcat | grep -i "PUSH\|notification"

# iOS
Console.app → Filter: "notification"
```

---

## Troubleshooting

### Android Issues

#### Issue: "Notification registration failed"
**Causes:**
1. google-services.json missing
2. Google Services plugin not applied
3. Firebase credentials invalid

**Solution:**
```bash
# 1. Verify google-services.json exists
ls android/app/google-services.json

# 2. Verify plugin in android/app/build.gradle
grep "com.google.gms.google-services" android/app/build.gradle

# 3. Rebuild
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

#### Issue: "Permission not granted"
**Solution:**
- App.tsx must call `requestPermissionsAsync()` on startup
- User must grant permission in popup
- Check AndroidManifest.xml has POST_NOTIFICATIONS permission

#### Issue: "Foreground notifications not showing"
**Solution:**
- notificationService must re-schedule foreground notifications
- Use correct Android channel ID
- Verify `setNotificationHandler()` returns `shouldShowAlert: true`

### iOS Issues

#### Issue: "APNs certificate not configured"
**Solution:**
1. Upload APNs certificate to Expo
2. Run: `eas credentials`
3. Rebuild with EAS

#### Issue: "Notifications not received in background"
**Solution:**
- Verify `UIBackgroundModes` includes `remote-notification` in Info.plist
- Check APNs certificate is valid
- Verify app has notification permission

---

## File Structure

```
mobile/
├── mob-ui/
│   ├── src/
│   │   ├── services/
│   │   │   └── notifications/
│   │   │       ├── notificationService.ts
│   │   │       └── index.ts
│   │   ├── screens/
│   │   │   └── auth/
│   │   │       └── OTPVerificationScreen.tsx
│   │   ├── config/
│   │   │   └── env.config.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── android/
│   │   ├── app/
│   │   │   ├── google-services.json
│   │   │   ├── build.gradle
│   │   │   └── src/main/AndroidManifest.xml
│   │   ├── build.gradle
│   │   └── settings.gradle
│   ├── ios/
│   │   └── [AppName]/
│   │       └── [AppName].entitlements
│   ├── app.json
│   └── package.json
│
└── mob-api/
    ├── src/
    │   └── modules/
    │       └── notification/
    │           ├── notification.service.ts
    │           ├── notification.controller.ts
    │           └── notification.module.ts
    └── .env
```

---

## Environment Variables

### Frontend (.env or env.config.ts)
```
EXPO_PUBLIC_API_BASE_URL=https://pg-api-mobile.vercel.app/api/v1
FEATURES_PUSH_NOTIFICATIONS_ENABLED=true
FEATURES_PUSH_NOTIFICATIONS_DEBUG=true
```

### Backend (.env)
```
FIREBASE_PROJECT_ID=pg-management-mobile
FIREBASE_PRIVATE_KEY=<service-account-private-key>
FIREBASE_CLIENT_EMAIL=<service-account-email>
EXPO_PROJECT_ID=0f6ecb0b-7511-427b-be33-74a4bd0207fe
```

---

## Deployment Checklist

### Before Production

- [ ] Firebase project created and configured
- [ ] google-services.json placed in android/app/
- [ ] APNs certificate uploaded to Expo (iOS)
- [ ] Environment variables set in backend
- [ ] Notification channels created on app startup
- [ ] Permission request implemented
- [ ] Token registration tested
- [ ] Test notification endpoint working
- [ ] Foreground notification display tested
- [ ] Background notification delivery tested
- [ ] Logs verified for errors

### Build Commands

```bash
# Android
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk

# iOS
npx expo prebuild --platform ios --clean
cd ios && pod install
xcodebuild -workspace PGManagement.xcworkspace -scheme PGManagement -configuration Release

# Or use EAS
eas build -p android --profile apk
eas build -p ios --profile production
```

---

## Key Concepts

### Expo Push Token vs FCM Token
- **Expo Push Token**: Generated by Expo, used to identify device in Expo system
- **FCM Token**: Generated by Firebase, used for Android push notifications
- Both are obtained from the same `getExpoPushTokenAsync()` call in EAS builds

### Notification Channels (Android)
- Required for Android 8+ (API 26+)
- Each channel has separate settings (sound, vibration, importance)
- Notifications must specify a channel ID
- Created once, persists until app uninstalled

### Foreground vs Background
- **Foreground**: App is open, must explicitly display notification
- **Background**: System handles display automatically
- EAS builds require explicit scheduling for foreground notifications

### Permission Handling
- **Android 12 and below**: Implicit permission
- **Android 13+**: Requires explicit `POST_NOTIFICATIONS` permission
- Must request before getting token
- User can deny, app should handle gracefully

---

## References

- [Expo Notifications](https://docs.expo.dev/guides/push-notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android Notification Channels](https://developer.android.com/training/notify-user/channels)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)

---

## Support

For issues or questions:
1. Check logs: `adb logcat | grep PUSH`
2. Review troubleshooting section
3. Verify all configuration files are in place
4. Test with manual notification endpoint
