/**
 * Environment Configuration
 * 
 * Manages environment-specific settings for the app
 */

import { ENV } from './environment';

// Check if running in development mode
export const IS_DEV = __DEV__;

// Explicit runtime environment (local/development/production) from app.config.js -> expo.extra
export const IS_LOCAL = ENV.APP_ENV === 'local';
export const IS_DEVELOPMENT = ENV.APP_ENV === 'development';
export const IS_PRODUCTION_ENV = ENV.APP_ENV === 'production';

// Check if running in Expo Go (for development)
// Expo Go doesn't support native modules like Firebase
export const IS_EXPO_GO = !!(
  // @ts-ignore -- expo is a runtime global injected by Expo in some environments
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
console.log('  - IS_LOCAL:', IS_LOCAL);
console.log('  - IS_DEVELOPMENT:', IS_DEVELOPMENT);
console.log('  - IS_PRODUCTION_ENV:', IS_PRODUCTION_ENV);
console.log('  - IS_EXPO_GO:', IS_EXPO_GO);
console.log('  - PUSH_NOTIFICATIONS_ENABLED:', FEATURES.PUSH_NOTIFICATIONS_ENABLED);
console.log('  - PUSH_NOTIFICATIONS_DEBUG:', FEATURES.PUSH_NOTIFICATIONS_DEBUG);

export default {
  IS_DEV,
  IS_EXPO_GO,
  FEATURES,
};
