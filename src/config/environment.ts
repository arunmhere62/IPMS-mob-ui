import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppEnv = 'local' | 'development' | 'production';

interface AppConfig {
  apiBaseUrl?: string;
  subscriptionMode?: boolean;
  showDevBanner?: boolean;
  appEnv?: string;
}

const appConfig = (Constants.expoConfig?.extra as AppConfig) || {};

const ENVIRONMENTS: Record<AppEnv, { label: string; color: string }> = {
  local: { label: 'Local', color: '#6B7280' },
  development: { label: 'Development', color: '#F59E0B' },
  production: { label: 'Production', color: '#10B981' },
};

const ENV_URLS: Record<AppEnv, string> = {
  local: 'http://192.168.1.6:3001/api/v1',
  development: 'https://dev-api.indianpgmanagement.com/api/v1',
  production: 'https://mobapi.indianpgmanagement.com/api/v1',
};

const ENV_OVERRIDE_KEY = 'ENV_OVERRIDE';

const rawEnv = (appConfig.appEnv || 'local').toLowerCase();
const resolvedEnv: AppEnv = (['local', 'development', 'production'].includes(rawEnv) ? rawEnv : 'local') as AppEnv;

const validateConfig = () => {
  if (!appConfig.apiBaseUrl) {
    console.error('❌ Missing required configuration:');
    console.error('- API_BASE_URL not found in app config');
    console.error('- Check your eas.json env and app.config.js');
    console.error('- Current app config:', appConfig);
    throw new Error('API_BASE_URL is not configured. Please check your eas.json profile.');
  }
};

validateConfig();

export const ENV: {
  APP_ENV: AppEnv;
  ENV_LABEL: string;
  ENV_COLOR: string;
  API_BASE_URL: string;
  SUBSCRIPTION_MODE: boolean;
  SHOW_DEV_BANNER: boolean;
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_LOCAL: boolean;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
} = {
  APP_ENV: resolvedEnv,
  ENV_LABEL: ENVIRONMENTS[resolvedEnv]?.label ?? 'Unknown',
  ENV_COLOR: ENVIRONMENTS[resolvedEnv]?.color ?? '#6B7280',

  API_BASE_URL: appConfig.apiBaseUrl!,

  SUBSCRIPTION_MODE: appConfig.subscriptionMode ?? true,
  SHOW_DEV_BANNER: appConfig.showDevBanner ?? false,

  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  IS_LOCAL: resolvedEnv === 'local',
  IS_DEVELOPMENT: resolvedEnv === 'development',
  IS_PRODUCTION: resolvedEnv === 'production',
};

export const getCurrentEnv = (): AppEnv => ENV.APP_ENV;

export async function setEnvironment(env: AppEnv): Promise<void> {
  const url = ENV_URLS[env];
  ENV.API_BASE_URL = url;
  ENV.APP_ENV = env;
  ENV.ENV_LABEL = ENVIRONMENTS[env]?.label ?? 'Unknown';
  ENV.ENV_COLOR = ENVIRONMENTS[env]?.color ?? '#6B7280';
  ENV.IS_LOCAL = env === 'local';
  ENV.IS_DEVELOPMENT = env === 'development';
  ENV.IS_PRODUCTION = env === 'production';
  await AsyncStorage.setItem(ENV_OVERRIDE_KEY, env);
  console.log(`🔄 Environment switched to ${env} (${url})`);
}

export async function clearEnvironmentOverride(): Promise<void> {
  await AsyncStorage.removeItem(ENV_OVERRIDE_KEY);
}

export async function initEnvironmentOverride(): Promise<void> {
  try {
    const override = await AsyncStorage.getItem(ENV_OVERRIDE_KEY);
    if (override && ['local', 'development', 'production'].includes(override)) {
      const env = override as AppEnv;
      ENV.API_BASE_URL = ENV_URLS[env];
      ENV.APP_ENV = env;
      ENV.ENV_LABEL = ENVIRONMENTS[env]?.label ?? 'Unknown';
      ENV.ENV_COLOR = ENVIRONMENTS[env]?.color ?? '#6B7280';
      ENV.IS_LOCAL = env === 'local';
      ENV.IS_DEVELOPMENT = env === 'development';
      ENV.IS_PRODUCTION = env === 'production';
      console.log(`🔄 Environment override loaded: ${env} (${ENV_URLS[env]})`);
    }
  } catch (e) {
    console.warn('Failed to load environment override:', e);
  }
}

export const getApiUrl = (endpoint: string = '') => {
  return `${ENV.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const logConfig = () => {
  console.log('============================================');
  console.log('🔧 App Configuration');
  console.log('- Environment:', ENV.ENV_LABEL);
  console.log('- API Base URL:', ENV.API_BASE_URL);
  console.log('- Subscription Mode:', ENV.SUBSCRIPTION_MODE);
  console.log('- Show Dev Banner:', ENV.SHOW_DEV_BANNER);
  console.log('- Dev Mode:', ENV.IS_DEV);
  console.log('============================================');
};

if (__DEV__) {
  logConfig();
}
