// Re-export from centralized environment configuration
import { ENV } from './environment';
export { ENV, getApiUrl, logConfig } from './environment';

import { getCurrentApiUrl } from '../utils/envSwitcher';

// Static default (for non-RTK consumers like notificationService)
export const API_BASE_URL = ENV.API_BASE_URL;
// Dynamic getter — reflects runtime env switches (for RTK Query base queries)
export const getApiBaseUrl = () => getCurrentApiUrl();

export * from './api.config';
