/**
 * Environment Configuration
 * 
 * Manages environment-specific settings for the app
 */

import { ENV } from './environment';

// Check if running in development mode
export const IS_DEV = __DEV__;

// Explicit runtime environment (dev/preprod) from app.config.js -> expo.extra
export const IS_DEV_ENV = ENV.APP_ENV === 'dev';
export const IS_PREPROD_ENV = ENV.APP_ENV === 'preprod';

// Check if running in Expo Go (for development)
// Expo Go doesn't support native modules like Firebase
export const IS_EXPO_GO = !!(
  // @ts-ignore
  typeof expo !== 'undefined' && expo?.modules?.ExpoGo
);

// Feature flags
export const FEATURES = {
  // Disable push notifications in dev mode or Expo Go
  PUSH_NOTIFICATIONS_ENABLED: true,

  // Dev-only helpers (manual triggers, extra logs, etc.)
  PUSH_NOTIFICATIONS_DEBUG: true,
  
  // You can add more feature flags here
  ANALYTICS_ENABLED: !IS_DEV,
  CRASH_REPORTING_ENABLED: !IS_DEV,
};

// Log environment info
console.log('🔧 Environment Configuration:');
console.log('  - IS_DEV:', IS_DEV);
console.log('  - APP_ENV:', ENV.APP_ENV);
console.log('  - IS_DEV_ENV:', IS_DEV_ENV);
console.log('  - IS_PREPROD_ENV:', IS_PREPROD_ENV);
console.log('  - IS_EXPO_GO:', IS_EXPO_GO);
console.log('  - PUSH_NOTIFICATIONS_ENABLED:', FEATURES.PUSH_NOTIFICATIONS_ENABLED);
console.log('  - PUSH_NOTIFICATIONS_DEBUG:', FEATURES.PUSH_NOTIFICATIONS_DEBUG);

export default {
  IS_DEV,
  IS_EXPO_GO,
  FEATURES,
};
