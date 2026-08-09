# Push Notification Setup - Step by Step Guide

## Current Status

✅ **Completed:**
- Notification service implementation with retry logic
- Android notification channels setup in App.tsx
- Permission request implementation
- Notification listeners configured
- Backend API endpoints ready
- Gradle configuration updated with Google Services plugin

❌ **Pending:**
- Firebase google-services.json with actual credentials
- APK rebuild with proper Firebase configuration

---

## Step 1: Get Firebase Credentials

### Option A: Download from Expo (Recommended if already configured)

```bash
cd d:\pg-mobile-app\mobile\mob-ui

# List your credentials
eas credentials

# Download google-services.json
# Follow prompts to download Android credentials
```

### Option B: Download from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **pg-management-mobile**
3. Click ⚙️ **Project Settings**
4. Scroll to **Your apps** section
5. Find Android app: `com.pgmanagement.app`
6. Click the app name
7. Scroll down to **google-services.json**
8. Click **Download google-services.json**
9. Save to: `d:\pg-mobile-app\mobile\mob-ui\android\app\google-services.json`

### Option C: Create New Firebase Project

If you don't have Firebase configured yet:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. Name: `pg-management-mobile`
4. Click **Continue**
5. Disable Google Analytics (optional)
6. Click **Create project**
7. Click **Add app** → Select **Android**
8. Enter package name: `com.pgmanagement.app`
9. Download `google-services.json`
10. Save to: `d:\pg-mobile-app\mobile\mob-ui\android\app\google-services.json`

---

## Step 2: Verify google-services.json

The file should contain:
```json
{
  "project_info": {
    "project_number": "YOUR_NUMBER",
    "project_id": "pg-management-mobile",
    "storage_bucket": "pg-management-mobile.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:YOUR_NUMBER:android:YOUR_ID",
        "android_client_info": {
          "package_name": "com.pgmanagement.app"
        }
      },
      ...
    }
  ]
}
```

---

## Step 3: Rebuild the App

### Option A: Local Build (Faster)

```powershell
cd d:\pg-mobile-app\mobile\mob-ui

# Clean everything
npx expo prebuild --platform android --clean

# Build APK
cd android
.\gradlew assembleRelease

# Install on device
adb uninstall com.pgmanagement.app
adb install app\build\outputs\apk\release\app-release.apk
```

**Expected time:** 15-20 minutes

### Option B: EAS Build (More Reliable)

```powershell
cd d:\pg-mobile-app\mobile\mob-ui

# Login to EAS
eas login

# Build APK
eas build -p android --profile apk

# Download and install
# Follow the link provided to download APK
adb uninstall com.pgmanagement.app
adb install path\to\downloaded.apk
```

**Expected time:** 10-15 minutes

---

## Step 4: Test Notification Registration

### 1. Open App and Login

1. Launch the app on device
2. Login with test credentials
3. **Watch the console logs** for:
   ```
   [PUSH] Starting notification initialization for user: 34
   [PUSH] Calling notificationService.initialize...
   [APP] 🔔 Setting up Android notification infrastructure...
   [APP] 📋 Current permission status: granted
   [PUSH] Registering token with backend...
   ✅ FCM token registered with backend successfully
   ```

### 2. Check for Permission Popup

- Should see notification permission popup on login
- Grant permission
- Should see: `[APP] ✅ Notification permission granted`

### 3. Verify Token Registration

- Check backend logs for `/notifications/register-token` API call
- Verify token is stored in database

### 4. Test Notification Delivery

**Option A: Using Settings Screen**
1. Go to Settings → Notifications
2. Click "Test Notification Registration" button
3. Should see notification on device

**Option B: Using Postman**
```
POST https://pg-api-mobile.vercel.app/api/v1/notifications/test
Headers:
  x-user-id: 34
  Content-Type: application/json

Response:
{
  "success": true,
  "notificationId": "..."
}
```

---

## Step 5: Verify Logs

### Android Device Logs

```bash
# Show all PUSH-related logs
adb logcat | findstr /i "PUSH"

# Show all notification-related logs
adb logcat | findstr /i "notification"

# Show all logs from app startup
adb logcat | findstr /i "APP"
```

### Expected Log Sequence

```
[APP] 🔔 Setting up Android notification infrastructure...
[APP] ✅ Android notification channels created
[APP] 📋 Current permission status: granted
[APP] ✅ Notification permission granted
[APP] ✅ Notification infrastructure setup complete
[PUSH] Starting notification initialization for user: 34
[PUSH] Calling notificationService.initialize...
[PUSH] initialize start
[PUSH] setting up android channels
[PUSH] fetching expo push token
[PUSH] Calling getExpoPushTokenAsync with projectId: 0f6ecb0b-7511-427b-be33-74a4bd0207fe
📱 Expo Push Token obtained: ExponentPushToken[...]
[PUSH] registering token with backend
✅ FCM token registered with backend successfully
✅ Notification service initialized
```

---

## Troubleshooting

### Issue: "Notification registration failed"

**Check 1: google-services.json exists**
```bash
ls d:\pg-mobile-app\mobile\mob-ui\android\app\google-services.json
```

**Check 2: Google Services plugin applied**
```bash
grep "com.google.gms.google-services" d:\pg-mobile-app\mobile\mob-ui\android\app\build.gradle
```

**Check 3: Rebuild app**
```bash
cd d:\pg-mobile-app\mobile\mob-ui
npx expo prebuild --platform android --clean
cd android && .\gradlew assembleRelease
```

### Issue: "Permission popup not showing"

**Check 1: App.tsx notification setup is running**
- Look for: `[APP] 🔔 Setting up Android notification infrastructure...`

**Check 2: Permission already granted**
- Check device settings: Settings → Apps → PG Management → Permissions
- If already granted, popup won't show again
- Uninstall app and reinstall to reset permissions

**Check 3: Android 12 or below**
- Notification permission is implicit on Android 12 and below
- Popup only shows on Android 13+

### Issue: "Token registration API not called"

**Check 1: FEATURES.PUSH_NOTIFICATIONS_ENABLED is true**
```bash
grep "PUSH_NOTIFICATIONS_ENABLED" d:\pg-mobile-app\mobile\mob-ui\src\config\env.config.ts
```

**Check 2: User ID is valid**
- Check: `result.user.s_no` is not null/undefined

**Check 3: Check logs for errors**
```bash
adb logcat | findstr "Failed to initialize"
```

### Issue: "Foreground notifications not showing"

**Check 1: Notification handler is configured**
- Should see: `[PUSH] Re-scheduling foreground notification with channel`

**Check 2: Channel ID is correct**
- Verify channel ID matches one created in App.tsx

**Check 3: App is in foreground**
- Notifications only re-scheduled when app is open
- Background notifications handled by system

---

## File Checklist

Before rebuilding, verify these files exist and are correct:

```
✅ d:\pg-mobile-app\mobile\mob-ui\android\app\google-services.json
   - Contains Firebase credentials
   - Package name: com.pgmanagement.app

✅ d:\pg-mobile-app\mobile\mob-ui\android\app\build.gradle
   - Contains: apply plugin: "com.google.gms.google-services"

✅ d:\pg-mobile-app\mobile\mob-ui\android\build.gradle
   - Contains: classpath('com.google.gms:google-services:4.4.0')

✅ d:\pg-mobile-app\mobile\mob-ui\android\app\src\main\AndroidManifest.xml
   - Contains: <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

✅ d:\pg-mobile-app\mobile\mob-ui\src\services\notifications\notificationService.ts
   - Implements initialize(), getExpoPushToken(), registerToken()

✅ d:\pg-mobile-app\mobile\mob-ui\App.tsx
   - Sets up notification channels on startup
   - Requests permissions
   - Initializes for logged-in users

✅ d:\pg-mobile-app\mobile\mob-ui\src\screens\auth\OTPVerificationScreen.tsx
   - Calls notificationService.initialize() after login
   - Calls /notifications/test endpoint in debug mode
```

---

## Next Steps

1. **Get google-services.json** (Step 1)
2. **Verify file placement** (File Checklist)
3. **Rebuild app** (Step 3)
4. **Test on device** (Step 4)
5. **Check logs** (Step 5)
6. **Troubleshoot if needed** (Troubleshooting)

---

## Support

If you encounter issues:

1. Check the logs using: `adb logcat | findstr /i "PUSH"`
2. Verify all files from the checklist exist
3. Ensure google-services.json has valid Firebase credentials
4. Rebuild the app completely: `npx expo prebuild --platform android --clean`
5. Check backend logs for API call errors
