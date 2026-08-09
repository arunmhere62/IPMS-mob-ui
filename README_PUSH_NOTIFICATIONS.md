# Push Notifications (EAS Build) – mob-ui + mob-api

This document describes the end-to-end push notification flow for:

- `mobile/mob-ui` (Expo React Native app built with EAS)
- `mobile/mob-api` (NestJS backend)

## High-level flow

1. **User logs in** in `mob-ui`.
2. `mob-ui` initializes notifications:
   - Requests permission
   - Gets an **Expo Push Token** (`ExponentPushToken[...]`)
   - Registers that token with `mob-api`
3. `mob-api` stores the token in DB (`user_fcm_tokens`).
4. When you want to notify the user:
   - `mob-api` sends a push via **Expo Push Service** (and can also send via FCM if Firebase Admin is configured and you store non-Expo FCM tokens)
5. Device receives push in the APK.

## Architecture / Data flow (token storage + sending)

### 1) Token generation (mob-ui)

- **Where**: `mobile/mob-ui/src/services/notifications/notificationService.ts`
- **How**: `Notifications.getExpoPushTokenAsync({ projectId })`
- **Project id source**: `Constants.expoConfig?.extra?.eas?.projectId`

Output:
- `ExponentPushToken[....]` (stored as a string)

### 2) Token registration API call (mob-ui → mob-api)

- **UI trigger**: `OTPVerificationScreen.tsx` after OTP verify/login success
- **Service call**: `notificationService.initialize(userId)` → `registerToken(userId, token)`
- **RTK endpoint**: `mobile/mob-ui/src/services/api/notificationsApi.ts`

HTTP request:
- **Method**: `POST`
- **URL**: `/notifications/register-token`
- **Headers** (added automatically by `baseApi.ts`):
  - `Authorization: Bearer <accessToken>`
  - `x-user-id: <userId>`
  - `x-organization-id: <organizationId>` (optional for this endpoint)
  - `x-pg-location-id: <pgId>` (optional for this endpoint)
- **Body** (example):
```json
{
  "user_id": 34,
  "fcm_token": "ExponentPushToken[xxxx]",
  "device_type": "android",
  "device_id": "device-abc",
  "device_name": "Android Device"
}
```

Note:
- Backend does **not** trust `body.user_id`; it uses `x-user-id` from headers.

### 3) Header validation + controller (mob-api)

- **Controller**: `mobile/mob-api/src/modules/notification/notification.controller.ts`
- **Guard**: `HeadersValidationGuard`
- **Required header**: `@RequireHeaders({ user_id: true })` → requires `x-user-id`

The controller calls:
- `notificationService.registerToken(userIdFromHeader, body)`

### 4) Database storage (mob-api → MySQL via Prisma)

**Primary table**: `user_fcm_tokens`

- **Schema**: `mobile/mob-api/prisma/schema.prisma`
- **Unique key**: `fcm_token` is unique (`uk_user_fcm_tokens_token`)

Write behavior (`mobile/mob-api/src/modules/notification/notification.service.ts`):
- If token already exists (`findUnique({ where: { fcm_token } })`):
  - `update` it (sets `user_id`, `is_active=true`, `updated_at=now()`)
- Else:
  - `create` a new row with `user_id`, `fcm_token`, device metadata, `is_active=true`

Columns used:
- `user_fcm_tokens.user_id`
- `user_fcm_tokens.fcm_token` (stores Expo push token OR Firebase token)
- `user_fcm_tokens.device_type`, `device_id`, `device_name`
- `user_fcm_tokens.is_active`
- `created_at`, `updated_at`

### 5) Sending flow (mob-api)

When an event wants to notify a user (or for testing):

- `POST /notifications/test`
  - looks up active tokens in `user_fcm_tokens` for `x-user-id`
  - calls `notificationService.sendToUser(userId, payload)`

In `NotificationService.sendToUser()`:
- Load tokens:
  - `prisma.user_fcm_tokens.findMany({ where: { user_id, is_active: true } })`
- Split by token type:
  - **Expo tokens**: `Expo.isExpoPushToken(token)` → sent via Expo
  - **Non-Expo tokens**: treated as Firebase tokens → sent via Firebase Admin (only if configured)
- Send via:
  - `sendViaExpo(expoTokens, payload)`
  - `sendViaFirebase(firebaseTokens, payload)`
- After sending, store history:
  - `prisma.notifications.create({ data: { user_id, title, body, type, data, is_read:false } })`

**History table**: `notifications`
- Stores what was sent to the user, for in-app history + unread count.

### 6) Unregister flow

- **Frontend**: `notificationService.unregisterToken()`
- **API**: `DELETE /notifications/unregister-token`
- **Backend behavior**: marks `user_fcm_tokens.is_active=false` for that token

## Frontend (mob-ui) implementation

### Where token registration happens
After successful OTP verification/login, `mob-ui` calls:

- `notificationService.initialize(userId)`

File:
- `mobile/mob-ui/src/screens/auth/OTPVerificationScreen.tsx`

Notes:
- The call happens after `verifyOtp()` succeeds and `setCredentials()` is dispatched.
- It is guarded by `FEATURES.PUSH_NOTIFICATIONS_ENABLED`.

### How the token is obtained
File:
- `mobile/mob-ui/src/services/notifications/notificationService.ts`

Key function:
- `getExpoPushToken()`

It uses:
- `Constants.expoConfig?.extra?.eas?.projectId`

So make sure your `app.config.js` contains:

- `expo.extra.eas.projectId`

Runtime notes:
- Push tokens require a **physical device** (`expo-device` check).
- On Android, notification channels are created via `expo-notifications`.

### Backend registration call
`notificationService.registerToken()` calls this RTK mutation:

- `POST /notifications/register-token`

File:
- `mobile/mob-ui/src/services/api/notificationsApi.ts`

Headers are automatically included by `baseApi`:
- `Authorization: Bearer <token>`
- `x-user-id: <userId>`
- `x-organization-id: <orgId>`
- `x-pg-location-id: <pgId>` (for some APIs)

File:
- `mobile/mob-ui/src/services/api/baseApi.ts`

### Dev testing helper (optional)
`notificationService.getExpoPushTokenForTesting()` can be used to fetch the Expo push token without registering it to backend.

Extra dev debug:
- In `OTPVerificationScreen.tsx`, when `__DEV__ && FEATURES.PUSH_NOTIFICATIONS_DEBUG`, the app tries a direct `POST {API_BASE_URL}/notifications/test` with only `x-user-id` header.

## Backend (mob-api) implementation

### Token storage
Tokens are stored in Prisma model:

- `user_fcm_tokens`

File:
- `mobile/mob-api/prisma/schema.prisma`

Note: The column is named `fcm_token` but it can store **Expo push tokens** too.

### Register token endpoint
Endpoint:
- `POST /notifications/register-token`

The backend uses `x-user-id` (validated by `HeadersValidationGuard`) instead of relying on `req.user`.

File:
- `mobile/mob-api/src/modules/notification/notification.controller.ts`

Implementation notes:
- Controller is guarded by `HeadersValidationGuard` and endpoints use `@RequireHeaders({ user_id: true })` where needed.
- The request body may include device metadata: `device_type`, `device_id`, `device_name`.

### Send test push to the logged-in user
Endpoint:
- `POST /notifications/test`

This sends a test notification to **all active tokens** stored for the `x-user-id`.

### Send test push directly to a token (quick testing)
Endpoint:
- `POST /notifications/test-token`

Body:
```json
{
  "to": "ExponentPushToken[xxxx]",
  "title": "Test",
  "message": "Hello",
  "type": "TEST",
  "data": { "any": "json" }
}
```

This is useful if you want to test without storing anything in DB.

Note:
- This endpoint still requires `x-user-id` header (guarded by `@RequireHeaders({ user_id: true })`).

### Push security (optional)
If you enabled **Expo Push Security**, set this environment variable on the backend:

- `EXPO_ACCESS_TOKEN=<your_expo_access_token>`

The backend will initialize Expo SDK using it.

### Firebase / FCM (optional)
The backend can also send to **non-Expo** tokens using Firebase Admin, if configured.

Environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` (supports `\n` newlines)
- `FIREBASE_CLIENT_EMAIL`

If these variables are missing, Firebase Admin init is skipped and only Expo tokens will be sent.

Generate token:
- `npx expo login`
- `npx expo token:create`

## EAS / Android credentials required for APK

Push in Expo Go can work easily, but **APK needs credentials**.

In Expo dashboard:

- Go to your project → **Credentials** → **Android**
- Configure **FCM credentials** for your Android application ID (`expo.android.package`)
- Rebuild the APK after setting credentials

Important:
- You must use the same `android.package` in `app.config.js` as the one configured in Firebase/FCM.

## Testing checklist

1. Build and install APK with EAS.
2. Login in the app.
3. Confirm token is registered (backend DB `user_fcm_tokens`).
4. Trigger test:
   - `POST /notifications/test` (requires `x-user-id` header)
   - OR `POST /notifications/test-token` with `to: ExponentPushToken[...]`

## Common issues

- **No notification on APK**:
  - FCM credentials not configured in Expo project credentials
  - Using Expo Go token vs APK token (token changes per install/build)
  - Device battery optimization blocks background notifications

- **register-token fails**:
  - Missing `x-user-id` header (check `baseApi` is sending it)
  - User not logged in / no access token
