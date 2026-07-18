/**
 * Mock environment configuration for tests
 * This prevents the validation error that occurs in the real environment.ts
 */

export const ENV = {
  APP_ENV: 'dev' as const,
  API_BASE_URL: 'http://localhost:3000',
  SUBSCRIPTION_MODE: true,
  SHOW_DEV_BANNER: false,
  IS_DEV: true,
  IS_PROD: false,
  IS_DEV_ENV: true,
  IS_PREPROD_ENV: false,
} as const;

export const getApiUrl = (endpoint = '') => {
  return `http://localhost:3000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const logConfig = jest.fn();
