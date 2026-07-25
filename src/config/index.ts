// Re-export from centralized environment configuration
import { ENV } from './environment';
export { ENV, getApiUrl, logConfig, setEnvironment, clearEnvironmentOverride, initEnvironmentOverride, getCurrentEnv } from './environment';
export type { AppEnv } from './environment';

// Getter for all consumers — returns the current API URL (may change at runtime)
export const getApiBaseUrl = () => ENV.API_BASE_URL;

export * from './api.config';
