/**
 * Mock environment configuration for tests
 * This prevents the validation error that occurs in the real environment.ts
 */

export type AppEnv = 'local' | 'development' | 'production';

export const ENV = {
  APP_ENV: 'local' as AppEnv,
  ENV_LABEL: 'Local',
  ENV_COLOR: '#6B7280',
  API_BASE_URL: 'http://localhost:3000',
  SUBSCRIPTION_MODE: true,
  SHOW_DEV_BANNER: false,
  IS_DEV: true,
  IS_PROD: false,
  IS_LOCAL: true,
  IS_DEVELOPMENT: false,
  IS_PRODUCTION: false,
};

export const getCurrentEnv = (): AppEnv => ENV.APP_ENV;

export async function setEnvironment(_env: AppEnv): Promise<void> {}

export async function clearEnvironmentOverride(): Promise<void> {}

export async function initEnvironmentOverride(): Promise<void> {}

export const getApiUrl = (endpoint = '') => {
  return `http://localhost:3000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const logConfig = jest.fn();
