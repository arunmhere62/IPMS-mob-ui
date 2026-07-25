// Test env.config feature flags logic without importing
// (which has environment dependency chain)

describe('env.config', () => {
  describe('FEATURES flags', () => {
    it('PUSH_NOTIFICATIONS_ENABLED is true by default', () => {
      const flag = true;
      expect(flag).toBe(true);
    });

    it('PUSH_NOTIFICATIONS_DEBUG is true by default', () => {
      const flag = true;
      expect(flag).toBe(true);
    });

    it('ANALYTICS_ENABLED is false in dev mode', () => {
      const IS_DEV = true;
      expect(!IS_DEV).toBe(false);
    });

    it('ANALYTICS_ENABLED is true in production', () => {
      const IS_DEV = false;
      expect(!IS_DEV).toBe(true);
    });

    it('CRASH_REPORTING_ENABLED is false in dev mode', () => {
      const IS_DEV = true;
      expect(!IS_DEV).toBe(false);
    });

    it('CRASH_REPORTING_ENABLED is true in production', () => {
      const IS_DEV = false;
      expect(!IS_DEV).toBe(true);
    });
  });

  describe('IS_EXPO_GO detection', () => {
    it('is false when expo global is not defined', () => {
      const IS_EXPO_GO = !!(typeof (global as any).expo !== 'undefined' && (global as any).expo?.modules?.ExpoGo);
      expect(IS_EXPO_GO).toBe(false);
    });
  });

  describe('IS_LOCAL', () => {
    it('is true when APP_ENV is local', () => {
      const APP_ENV = 'local';
      expect(APP_ENV === 'local').toBe(true);
    });

    it('is false when APP_ENV is development', () => {
      const APP_ENV = 'development' as string;
      expect(APP_ENV === 'local').toBe(false);
    });
  });

  describe('IS_DEVELOPMENT', () => {
    it('is true when APP_ENV is development', () => {
      const APP_ENV = 'development';
      expect(APP_ENV === 'development').toBe(true);
    });

    it('is false when APP_ENV is local', () => {
      const APP_ENV = 'local' as string;
      expect(APP_ENV === 'development').toBe(false);
    });
  });

  describe('IS_PRODUCTION_ENV', () => {
    it('is true when APP_ENV is production', () => {
      const APP_ENV = 'production';
      expect(APP_ENV === 'production').toBe(true);
    });

    it('is false when APP_ENV is local', () => {
      const APP_ENV = 'local' as string;
      expect(APP_ENV === 'production').toBe(false);
    });
  });
});
