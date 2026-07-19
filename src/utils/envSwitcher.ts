import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = '@env_switcher_api_url';

interface ApiEnvironment {
  label: string;
  url: string;
  description: string;
}

const _extra = (Constants.expoConfig?.extra as any) || {};
const defaultUrl = _extra.apiBaseUrl || 'http://localhost:3001/api/v1';

export const API_ENVIRONMENTS: ApiEnvironment[] =
  Array.isArray(_extra.apiEnvironments) && _extra.apiEnvironments.length > 0
    ? _extra.apiEnvironments
    : [
        {
          label: 'Production',
          url: 'https://mobapi.indianpgmanagement.com/api/v1',
          description: 'Live production database',
        },
        {
          label: 'Local Dev',
          url: 'http://192.168.1.2:3001/api/v1',
          description: 'Local development database',
        },
      ];

let _currentUrl: string = defaultUrl;
let _initialized = false;
const _listeners: Set<(url: string) => void> = new Set();

export const getCurrentApiUrl = (): string => _currentUrl;

export const getCurrentEnvLabel = (): string => {
  const match = API_ENVIRONMENTS.find((e) => e.url === _currentUrl);
  return match ? match.label : 'Custom';
};

export const setApiEnvironment = async (url: string): Promise<void> => {
  if (!__DEV__) return;
  _currentUrl = url;
  await AsyncStorage.setItem(STORAGE_KEY, url);
  _listeners.forEach((fn) => fn(url));
};

export const initEnvSwitcher = async (): Promise<void> => {
  if (_initialized) return;
  _initialized = true;
  // In production builds, never override the configured API URL with a stored value
  if (!__DEV__) return;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      _currentUrl = stored;
    }
  } catch (e) {
    console.warn('[envSwitcher] Failed to load saved API URL:', e);
  }
};

export const subscribeEnvChanges = (fn: (url: string) => void): (() => void) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};
