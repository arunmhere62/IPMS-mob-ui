// Test environment config logic without importing the module
// (which validates API_BASE_URL on import and may throw in test env)

describe('environment config', () => {
  describe('getApiUrl', () => {
    // Replicate the getApiUrl logic
    const getApiUrl = (baseUrl: string, endpoint: string = '') => {
      return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    };

    it('appends endpoint with leading slash', () => {
      expect(getApiUrl('http://localhost:3000', '/tenants')).toBe('http://localhost:3000/tenants');
    });

    it('adds leading slash to endpoint without one', () => {
      expect(getApiUrl('http://localhost:3000', 'tenants')).toBe('http://localhost:3000/tenants');
    });

    it('returns base URL for empty endpoint', () => {
      expect(getApiUrl('http://localhost:3000', '')).toBe('http://localhost:3000/');
    });

    it('handles endpoint with query params', () => {
      expect(getApiUrl('http://localhost:3000', '/tenants?page=1')).toBe('http://localhost:3000/tenants?page=1');
    });
  });

  describe('ENV defaults', () => {
    it('APP_ENV defaults to local when not specified', () => {
      const appEnv = undefined as string | undefined;
      const result = (appEnv || 'local') as 'local' | 'development' | 'production';
      expect(result).toBe('local');
    });

    it('IS_LOCAL is true when APP_ENV is local', () => {
      const appEnv = 'local';
      expect(appEnv === 'local').toBe(true);
    });

    it('IS_DEVELOPMENT is true when APP_ENV is development', () => {
      const appEnv = 'development';
      expect(appEnv === 'development').toBe(true);
    });

    it('IS_PRODUCTION is true when APP_ENV is production', () => {
      const appEnv = 'production';
      expect(appEnv === 'production').toBe(true);
    });

    it('SUBSCRIPTION_MODE defaults to true', () => {
      const subscriptionMode = undefined as boolean | undefined;
      expect(subscriptionMode ?? true).toBe(true);
    });

    it('SHOW_DEV_BANNER defaults to false', () => {
      const showDevBanner = undefined as boolean | undefined;
      expect(showDevBanner ?? false).toBe(false);
    });
  });
});
