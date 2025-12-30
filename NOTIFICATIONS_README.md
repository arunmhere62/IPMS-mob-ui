# Push Notifications Setup Guide

Complete guide for implementing push notifications in the PG Management mobile app using Expo, Firebase Cloud Messaging (FCM), and NestJS backend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Notification Flow](#notification-flow)
3. [Firebase Setup](#firebase-setup)
4. [Expo Configuration](#expo-configuration)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Build Commands](#build-commands)

---

## Architecture Overview

```
┌─────────────────┐
│  Android Device │
│   (User's App)  │
└────────┬────────┘
         │ 1. Request permission & get Expo Push Token
         │
         ▼
┌─────────────────┐
│  NestJS Backend │
│   (API Server)  │
└────────┬────────┘
         │ 2. Store token in database
         │ 3. Send notification request
         │
         ▼
┌─────────────────┐
│ Expo Push API   │
│  (Push Service) │
└────────┬────────┘
         │ 4. Forward to FCM with Firebase credentials
         │
         ▼
┌─────────────────┐
│ Firebase Cloud  │
│   Messaging     │
└────────┬────────┘
         │ 5. Deliver to device via Google Play Services
         │
         ▼
┌─────────────────┐
│  Android Device │
│  (Notification) │
└─────────────────┘
```

---

## Notification Flow

### 1. Token Registration Flow

```
User Opens App
    ↓
Request Notification Permission (Android 13+)
    ↓
Permission Granted?
    ├─ Yes → Get Expo Push Token
    │         ↓
    │    Register Token with Backend
    │         ↓
    │    Backend Stores Token in Database
    │
    └─ No → Show Permission Denied UI
            ↓
       Re-prompt on App Foreground
```

### 2. Notification Sending Flow

```
Backend Triggers Notification
    ↓
Fetch User's Active Expo Push Token from DB
    ↓
Send to Expo Push API with:
    - Token
    - Title, Body, Data
    - Android Channel ID
    ↓
Expo Push API Returns Ticket ID
    ↓
Backend Fetches Receipt (delivery status)
    ↓
Receipt Status:
    ├─ "ok" → Notification Delivered ✅
    ├─ "DeviceNotRegistered" → Mark Token Inactive
    └─ "InvalidCredentials" → Check Firebase Setup
```

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `pg-management` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Add Android App

1. In Firebase Console, click **"Add app"** → Android
2. Enter Android package name: `com.pgmanagement.app`
   - **IMPORTANT:** Must match `android.package` in `app.json`
3. Download `google-services.json`
4. Place file at: `mobile/mob-ui/google-services.json` (project root)

### Step 3: Generate Firebase Service Account Key

This key allows Expo to send notifications via Firebase on your behalf.

1. Go to **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (e.g., `pg-management-875f6-firebase-adminsdk-xxxxx.json`)
4. **IMPORTANT:** Keep this file secure, never commit to git

**File structure:**
```json
{
  "type": "service_account",
  "project_id": "pg-management-875f6",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@pg-management-875f6.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Step 4: Upload Service Account Key to EAS

1. Run: `npx eas credentials`
2. Select **Android** → **production** (or your build profile)
3. Select **"Google Service Account Key for Firebase Cloud Messaging (FCM V1)"**
4. Choose **"Add a new key"**
5. Paste the entire JSON content from the service account file
6. Confirm and save

**Verification:**
- Go to [EAS Credentials](https://expo.dev/accounts/[your-account]/projects/pgmanagement/credentials)
- Verify FCM V1 key is listed under Android credentials

---

## Expo Configuration

### app.json

```json
{
  "expo": {
    "name": "PG Management",
    "slug": "pgmanagement",
    "android": {
      "package": "com.pgmanagement.app",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "NOTIFICATIONS",
        "POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3B82F6",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### eas.json

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_USE_COMMUNITY_AUTOLINKING": "1"
      }
    },
    "standalone-apk": {
      "developmentClient": false,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_USE_COMMUNITY_AUTOLINKING": "1"
      }
    }
  }
}
```

### android/gradle.properties (Size Optimization)

```properties
# Only build for arm64-v8a (modern devices, saves ~60% size)
reactNativeArchitectures=arm64-v8a

# Disable unnecessary image formats
expo.gif.enabled=false
expo.webp.enabled=false

# Enable minification for release builds
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

---

## Backend Implementation

### 1. Install Dependencies

```bash
npm install @nestjs/axios expo-server-sdk
```

### 2. Environment Variables (.env)

```env
# Not needed - Expo handles FCM credentials via EAS
# Just ensure you uploaded the Firebase service account key to EAS
```

### 3. Notification Service (notification.service.ts)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {
    this.expo = new Expo();
  }

  // Register push token
  async registerToken(userId: number, token: string, deviceInfo: any) {
    return this.prisma.pushToken.upsert({
      where: {
        user_id_fcm_token: {
          user_id: userId,
          fcm_token: token,
        },
      },
      update: {
        is_active: true,
        device_type: deviceInfo.osName,
        device_model: deviceInfo.modelName,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        fcm_token: token,
        device_type: deviceInfo.osName,
        device_model: deviceInfo.modelName,
        is_active: true,
      },
    });
  }

  // Send notification via Expo Push Service
  async sendViaExpo(tokens: string[], notification: any) {
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      priority: 'high',
      channelId: 'default', // Android notification channel
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const ticketIds: string[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        ticketChunk.forEach((ticket: ExpoPushTicket) => {
          if (ticket.status === 'ok') {
            ticketIds.push(ticket.id);
          } else {
            this.logger.error(`Ticket error: ${ticket.message}`);
          }
        });
      } catch (error) {
        this.logger.error(`Failed to send chunk: ${error.message}`);
      }
    }

    // Fetch receipts to verify delivery
    const receiptSummary = await this.fetchReceipts(ticketIds);

    return {
      success: true,
      successCount: ticketIds.length,
      ticketIds,
      receiptSummary,
    };
  }

  // Fetch delivery receipts
  async fetchReceipts(ticketIds: string[]) {
    if (ticketIds.length === 0) return { receiptOkCount: 0, receiptErrorCount: 0 };

    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(ticketIds);
    const receiptErrors = [];
    let receiptOkCount = 0;
    let receiptErrorCount = 0;

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'ok') {
            receiptOkCount++;
          } else if (receipt.status === 'error') {
            receiptErrorCount++;
            receiptErrors.push({
              receiptId,
              message: receipt.message,
              details: receipt.details,
            });

            // Mark token inactive if device not registered
            if (receipt.details?.error === 'DeviceNotRegistered') {
              await this.markTokenInactive(receiptId);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to fetch receipts: ${error.message}`);
      }
    }

    return { receiptErrors, receiptOkCount, receiptErrorCount };
  }

  // Mark token as inactive
  async markTokenInactive(token: string) {
    await this.prisma.pushToken.updateMany({
      where: { fcm_token: token },
      data: { is_active: false },
    });
  }
}
```

### 4. Notification Controller (notification.controller.ts)

```typescript
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('register-token')
  async registerToken(@Body() dto: RegisterTokenDto, @GetUser() user: User) {
    return this.notificationService.registerToken(
      user.id,
      dto.token,
      dto.deviceInfo
    );
  }

  @Post('test-token')
  async testToken(@GetUser() user: User) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { user_id: user.id, is_active: true },
      select: { fcm_token: true },
    });

    return this.notificationService.sendViaExpo(
      tokens.map(t => t.fcm_token),
      {
        title: '🔔 Test Notification',
        body: 'Your notifications are working!',
        data: { type: 'test' },
      }
    );
  }
}
```

---

## Frontend Implementation

### 1. App.tsx (Top-level Setup)

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

// Set notification handler (MUST be at top level)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Re-check permission when app comes to foreground
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          // Show UI to request permission again
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return <RootNavigator />;
}
```

### 2. Notification Service (notificationService.ts)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission denied');
    return null;
  }

  // Get Expo Push Token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '0f6ecb0b-7511-427b-be33-74a4bd0207fe', // From app.json
  });

  // Setup Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  return token.data;
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Send immediately
  });
}
```

### 3. OTP Verification Screen (Register Token After Login)

```typescript
import { registerForPushNotifications } from '@/services/notifications';
import * as Device from 'expo-device';

const handleOTPVerification = async () => {
  // ... verify OTP logic

  // Register push token after successful login
  const pushToken = await registerForPushNotifications();
  
  if (pushToken) {
    await registerTokenMutation.mutateAsync({
      token: pushToken,
      deviceInfo: {
        osName: Device.osName,
        modelName: Device.modelName,
      },
    });
  }
};
```

---

## Testing

### 1. Test Token Registration

```bash
# After login, check if token is stored
curl -X GET http://localhost:3000/api/v1/notifications/my-tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Notification Sending

```bash
# Send test notification
curl -X POST http://localhost:3000/api/v1/notifications/test-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "successCount": 1,
  "ticketIds": ["019b6ff6-fb71-7898-a9b8-31f836e19533"],
  "receiptSummary": {
    "receiptOkCount": 1,
    "receiptErrorCount": 0,
    "receiptErrors": []
  }
}
```

### 3. Common Receipt Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `DeviceNotRegistered` | Token expired or app uninstalled | Mark token inactive, user will re-register |
| `InvalidCredentials` | Wrong Firebase service account key | Re-upload correct key to EAS |
| `MessageTooBig` | Notification payload > 4KB | Reduce data size |
| `MessageRateExceeded` | Too many notifications | Implement rate limiting |

---

## Troubleshooting

### Issue: "SenderId mismatch"

**Cause:** Firebase service account key in EAS doesn't match the Firebase project in `google-services.json`

**Solution:**
1. Verify Firebase project ID matches in both files
2. Re-upload correct service account key to EAS credentials
3. Rebuild app with `--clear-cache`

### Issue: Notifications not appearing on device

**Checklist:**
- [ ] Permission granted? Check in app settings
- [ ] Token registered? Check backend database
- [ ] Receipt status "ok"? Check `/test-token` response
- [ ] Android channel created? Check `notificationService.ts`
- [ ] Physical device? Emulators don't support push notifications
- [ ] Google Play Services installed? Required for FCM

### Issue: Build fails with "No matching variant"

**Cause:** React Native module autolinking not working

**Solution:**
1. Set `EXPO_USE_COMMUNITY_AUTOLINKING=1` in `eas.json`
2. Run `npm run clean:deep`
3. Rebuild with `--clear-cache`

---

## Build Commands

### Development Build (with Expo Dev Client)

```bash
npm run build:dev
```
- Opens to Expo launcher
- Requires dev server running
- Hot reload enabled
- Size: ~80MB

### Standalone Production Build

```bash
npm run build:standalone
```
- Opens directly to PG app
- No dev server needed
- Optimized and minified
- Size: ~30-40MB

### Cleanup Commands

```bash
# Quick cleanup
npm run clean

# Deep cleanup (includes Gradle cache)
npm run clean:deep

# Full reset (includes node_modules)
npm run clean:all
npm install
```

---

## Security Notes

### ⚠️ IMPORTANT: Never Commit These Files

Add to `.gitignore`:
```
google-services.json
*-firebase-adminsdk-*.json
.env
```

### Rotate Exposed Keys

If Firebase service account key is exposed:
1. Go to Firebase Console → Service Accounts
2. Delete the exposed key
3. Generate new key
4. Upload to EAS credentials
5. Rebuild app

---

## Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `google-services.json` | Android app Firebase config | `mobile/mob-ui/google-services.json` |
| Firebase service account JSON | Backend FCM credentials | Upload to EAS, don't commit |
| `app.json` | Expo configuration | `mobile/mob-ui/app.json` |
| `eas.json` | EAS build profiles | `mobile/mob-ui/eas.json` |
| `gradle.properties` | Android build settings | `mobile/mob-ui/android/gradle.properties` |
| `notification.service.ts` | Backend notification logic | `mobile/mob-api/src/modules/notification/` |
| `notificationService.ts` | Frontend notification logic | `mobile/mob-ui/src/services/notifications/` |

---

## Token Types Explained

### 1. Expo Push Token
- **Format:** `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
- **Purpose:** Identifies device in Expo Push Service
- **Obtained:** `Notifications.getExpoPushTokenAsync()`
- **Stored:** Backend database
- **Used by:** Backend to send notifications

### 2. Firebase Service Account Key
- **Format:** JSON file with private key
- **Purpose:** Allows Expo to send via Firebase on your behalf
- **Obtained:** Firebase Console → Service Accounts
- **Stored:** EAS credentials (encrypted)
- **Used by:** Expo Push Service to authenticate with FCM

### 3. Firebase Sender ID / Project Number
- **Format:** Numeric (e.g., `737797517297`)
- **Purpose:** Identifies Firebase project
- **Obtained:** Firebase Console → Project Settings
- **Stored:** `google-services.json`
- **Used by:** Android app to connect to FCM

---

## Complete Flow Summary

1. **Setup Phase:**
   - Create Firebase project
   - Download `google-services.json` → place in project root
   - Generate Firebase service account key → upload to EAS
   - Configure `app.json` with Firebase settings

2. **Build Phase:**
   - Run `npm run build:standalone`
   - EAS uses uploaded Firebase credentials
   - Builds APK with FCM integrated

3. **Runtime Phase:**
   - User opens app → request permission
   - Get Expo Push Token → register with backend
   - Backend stores token in database

4. **Notification Phase:**
   - Backend triggers notification
   - Sends to Expo Push API with token
   - Expo forwards to Firebase with service account key
   - Firebase delivers to device via Google Play Services
   - Backend fetches receipt to verify delivery

---

## Support

For issues:
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- EAS Build: https://docs.expo.dev/build/introduction/

---

**Last Updated:** December 30, 2025
**App Version:** 1.0.0
**Expo SDK:** 54.0.30
