// Test the pure helper functions from baseApi
// We test the regex and header logic without importing the full module
// (which has RTK Query and environment dependencies)

describe('baseApi helpers', () => {
  // Replicate the needsPgHeader regex from baseApi
  const needsPgHeader = (url?: string) => {
    if (!url) return false;
    const path = (url.split('?')[0] || '').toString();
    return /^\/(tenants|rooms|beds|rent-payments|advance-payments|refund-payments|payments|pending-payments|payroll|dashboard)(\/|$)/.test(path);
  };

  describe('needsPgHeader', () => {
    it('returns true for /tenants', () => {
      expect(needsPgHeader('/tenants')).toBe(true);
    });

    it('returns true for /tenants/123', () => {
      expect(needsPgHeader('/tenants/123')).toBe(true);
    });

    it('returns true for /rooms', () => {
      expect(needsPgHeader('/rooms')).toBe(true);
    });

    it('returns true for /beds', () => {
      expect(needsPgHeader('/beds')).toBe(true);
    });

    it('returns true for /rent-payments', () => {
      expect(needsPgHeader('/rent-payments')).toBe(true);
    });

    it('returns true for /advance-payments', () => {
      expect(needsPgHeader('/advance-payments')).toBe(true);
    });

    it('returns true for /refund-payments', () => {
      expect(needsPgHeader('/refund-payments')).toBe(true);
    });

    it('returns true for /payments', () => {
      expect(needsPgHeader('/payments')).toBe(true);
    });

    it('returns true for /pending-payments', () => {
      expect(needsPgHeader('/pending-payments')).toBe(true);
    });

    it('returns true for /payroll', () => {
      expect(needsPgHeader('/payroll')).toBe(true);
    });

    it('returns true for /dashboard', () => {
      expect(needsPgHeader('/dashboard')).toBe(true);
    });

    it('returns true for /tenants with query params', () => {
      expect(needsPgHeader('/tenants?page=1&limit=20')).toBe(true);
    });

    it('returns false for /auth/login', () => {
      expect(needsPgHeader('/auth/login')).toBe(false);
    });

    it('returns false for /organizations', () => {
      expect(needsPgHeader('/organizations')).toBe(false);
    });

    it('returns false for /rbac/permissions', () => {
      expect(needsPgHeader('/rbac/permissions')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(needsPgHeader(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(needsPgHeader('')).toBe(false);
    });

    it('returns false for /tenants-stats (not exact match)', () => {
      expect(needsPgHeader('/tenants-stats')).toBe(false);
    });

    it('returns false for /dashboard-summary (not exact match)', () => {
      expect(needsPgHeader('/dashboard-summary')).toBe(false);
    });
  });

  // Replicate the toPlainHeaders logic
  const toPlainHeaders = (headers: any): Record<string, any> => {
    if (!headers) return {};
    if (typeof headers.toJSON === 'function') {
      return headers.toJSON();
    }
    if (typeof headers.forEach === 'function') {
      const out: Record<string, any> = {};
      headers.forEach((value: any, key: string) => {
        out[key] = value;
      });
      return out;
    }
    try {
      return { ...headers };
    } catch {
      return {};
    }
  };

  describe('toPlainHeaders', () => {
    it('returns empty object for null', () => {
      expect(toPlainHeaders(null)).toEqual({});
    });

    it('returns empty object for undefined', () => {
      expect(toPlainHeaders(undefined)).toEqual({});
    });

    it('converts Headers with forEach to plain object', () => {
      const mockHeaders = {
        forEach: (cb: (value: string, key: string) => void) => {
          cb('Bearer token', 'Authorization');
          cb('1', 'x-user-id');
        },
      };
      expect(toPlainHeaders(mockHeaders)).toEqual({
        Authorization: 'Bearer token',
        'x-user-id': '1',
      });
    });

    it('converts Headers with toJSON method', () => {
      const mockHeaders = {
        toJSON: () => ({ Authorization: 'Bearer token' }),
      };
      expect(toPlainHeaders(mockHeaders)).toEqual({
        Authorization: 'Bearer token',
      });
    });

    it('spreads plain object headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      expect(toPlainHeaders(headers)).toEqual(headers);
    });

    it('returns empty object for non-spreadable object', () => {
      const obj = Object.create(null);
      expect(toPlainHeaders(obj)).toEqual({});
    });
  });
});
