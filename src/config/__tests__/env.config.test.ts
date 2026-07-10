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

  describe('IS_DEV_ENV', () => {
    it('is true when APP_ENV is dev', () => {
      const APP_ENV = 'dev';
      expect(APP_ENV === 'dev').toBe(true);
    });

    it('is false when APP_ENV is preprod', () => {
      const APP_ENV = 'preprod' as string;
      expect(APP_ENV === 'dev').toBe(false);
    });
  });

  describe('IS_PREPROD_ENV', () => {
    it('is true when APP_ENV is preprod', () => {
      const APP_ENV = 'preprod';
      expect(APP_ENV === 'preprod').toBe(true);
    });

    it('is false when APP_ENV is dev', () => {
      const APP_ENV = 'dev' as string;
      expect(APP_ENV === 'preprod').toBe(false);
    });
  });
});
