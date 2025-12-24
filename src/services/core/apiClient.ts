import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../../config/api.config';
import { store } from '../../store';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { networkLogger } from '../../utils/networkLogger';

const needsPgHeader = (url?: string) => {
  if (!url) return false;
  const path = (url.split('?')[0] || '').toString();
  return /^\/(tenants|rooms|beds|advance-payments|refund-payments|payments|pending-payments)(\/|$)/.test(path);
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const state = store.getState() as RootState;
        const token = state.auth.accessToken;
        const { user } = state.auth;
        const selectedPGLocationId = state.pgLocations.selectedPGLocationId;

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add User ID header
        if (user?.s_no && config.headers) {
          config.headers['X-User-Id'] = user.s_no.toString();
        }

        // Add Organization ID header
        if (user?.organization_id && config.headers) {
          config.headers['X-Organization-Id'] = user.organization_id.toString();
        }

        // Add PG Location ID header
        if (selectedPGLocationId && config.headers) {
          config.headers['X-PG-Location-Id'] = selectedPGLocationId.toString();
        }

        const hasPgHeader = !!(
          (config.headers as any)['X-PG-Location-Id'] || (config.headers as any)['x-pg-location-id']
        );
        if (needsPgHeader(config.url) && !hasPgHeader) {
          return Promise.reject(new Error('Missing required headers: X-PG-Location-Id'));
        }

        const logId = `${Date.now()}-${Math.random()}`;

        const headersObj = JSON.parse(JSON.stringify(config.headers || {}));
        if (headersObj.Authorization && typeof headersObj.Authorization === 'string') {
          headersObj.Authorization = 'Bearer ***';
        }

        // Log request
        (config as any).metadata = { startTime: Date.now(), logId };
        const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url || '';
        networkLogger.addLog({
          id: logId,
          method: config.method?.toUpperCase() || 'GET',
          url: fullUrl,
          headers: headersObj,
          requestData: (config as any).data,
          timestamp: new Date(),
        });

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const metadata = (response.config as any).metadata;
        const duration = metadata?.startTime ? Date.now() - metadata.startTime : undefined;
        if (metadata?.logId) {
          networkLogger.updateLog(metadata.logId, {
            status: response.status,
            responseData: response.data,
            duration,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const metadata = (error.config as any)?.metadata;
        const duration = metadata?.startTime ? Date.now() - metadata.startTime : undefined;
        if (metadata?.logId) {
          networkLogger.updateLog(metadata.logId, {
            status: error.response?.status,
            responseData: error.response?.data,
            error: error.message,
            duration,
          });
        }

        if (error.response?.status === 401) {
          // Token expired or invalid
          store.dispatch(logout());
        }

        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  public post<T>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  public put<T>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
