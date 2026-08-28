import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type AppEnv = 'local' | 'development' | 'production';

interface AppConfig {
  apiBaseUrl?: string;
  localApiBaseUrl?: string;
  useIapForIos?: boolean;
  appEnv?: string;
  webSignupUrl?: string;
}

const appConfig = (Constants.expoConfig?.extra as AppConfig) || {};

export const ENVIRONMENTS: Record<AppEnv, { label: string; color: string }> = {
  local: { label: 'Local', color: '#6B7280' },
  development: { label: 'Development', color: '#F59E0B' },
  production: { label: 'Production', color: '#10B981' },
};

// Single source of truth for the local API URL: read from app.config.js extra
// (which itself reads LOCAL_API_BASE_URL from .env). Change the IP in .env once.
const LOCAL_API_BASE_URL = appConfig.localApiBaseUrl || 'http://192.168.1.4:3001/api/v1';

export const ENV_URLS: Record<AppEnv, string> = {
  local: LOCAL_API_BASE_URL,
  development: 'https://dev-api.indianpgmanagement.com/api/v1',
  production: 'https://mobapi.indianpgmanagement.com/api/v1',
};

/**
 * Strips protocol and API path from a full URL for compact display in the UI.
 * e.g. "http://192.168.1.5:3001/api/v1" -> "192.168.1.5:3001"
 *      "https://mobapi.indianpgmanagement.com/api/v1" -> "mobapi"
 */
export const getDisplayUrl = (url: string): string => {
  try {
    const u = new URL(url);
    // For known cloud hosts, show the subdomain only (cleaner in the UI).
    const host = u.hostname;
    if (host.endsWith('.indianpgmanagement.com')) {
      return host.split('.')[0];
    }
    return u.host; // includes port
  } catch {
    return url;
  }
};


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
  USE_IAP: boolean;
  WEB_SIGNUP_URL: string;
  IS_LOCAL: boolean;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
} = {
  APP_ENV: resolvedEnv,
  ENV_LABEL: ENVIRONMENTS[resolvedEnv]?.label ?? 'Unknown',
  ENV_COLOR: ENVIRONMENTS[resolvedEnv]?.color ?? '#6B7280',

  API_BASE_URL: appConfig.apiBaseUrl!,

  // iOS: use Apple IAP by default. Set USE_IAP_FOR_IOS=false in .env to use CCAvenue instead.
  USE_IAP: Platform.OS === 'ios' && (appConfig.useIapForIos ?? true),

  // External website where new PG owners/businesses register.
  // On iOS production, in-app org/business signup is disabled (App Store Guideline 3.1.1)
  // and the "Sign Up" button opens this URL in Safari via Linking.openURL.
  WEB_SIGNUP_URL: appConfig.webSignupUrl ?? 'https://www.indianpgmanagement.com',

  IS_LOCAL: resolvedEnv === 'local',
  IS_DEVELOPMENT: resolvedEnv === 'development',
  IS_PRODUCTION: resolvedEnv === 'production',
};

export const getCurrentEnv = (): AppEnv => ENV.APP_ENV;

/**
 * Switch environment at runtime (in-memory only). Does NOT persist to AsyncStorage.
 * On next app restart, .env (APP_ENV) is the single source of truth again.
 * Useful for quick testing during development via the Network Logger screen.
 */
export async function setEnvironment(env: AppEnv): Promise<void> {
  const url = ENV_URLS[env];
  ENV.API_BASE_URL = url;
  ENV.APP_ENV = env;
  ENV.ENV_LABEL = ENVIRONMENTS[env]?.label ?? 'Unknown';
  ENV.ENV_COLOR = ENVIRONMENTS[env]?.color ?? '#6B7280';
  ENV.IS_LOCAL = env === 'local';
  ENV.IS_DEVELOPMENT = env === 'development';
  ENV.IS_PRODUCTION = env === 'production';
  console.log(`🔄 Environment switched to ${env} (${url}) [runtime only — .env wins on restart]`);
}

export const getApiUrl = (endpoint: string = '') => {
  return `${ENV.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const logConfig = () => {
  console.log('============================================');
  console.log('🔧 App Configuration');
  console.log('- Environment:', ENV.ENV_LABEL);
  console.log('- API Base URL:', ENV.API_BASE_URL);
  console.log('============================================');
};

if (__DEV__) {
  logConfig();
}
