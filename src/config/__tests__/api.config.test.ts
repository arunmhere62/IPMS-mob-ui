import { API_CONFIG, API_ENDPOINTS } from '../api.config';

// Mock ENV
jest.mock('../environment', () => ({
  ENV: {
    API_BASE_URL: 'http://localhost:3000/api/v1/',
  },
}));

describe('api.config', () => {
  describe('API_CONFIG', () => {
    it('has BASE_URL from ENV', () => {
      expect(API_CONFIG.BASE_URL).toBe('http://localhost:3000/api/v1/');
    });

    it('has TIMEOUT', () => {
      expect(API_CONFIG.TIMEOUT).toBe(30000);
    });

    it('has HEADERS with Content-Type', () => {
      expect(API_CONFIG.HEADERS).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    describe('AUTH', () => {
      it('has SEND_OTP endpoint', () => {
        expect(API_ENDPOINTS.AUTH.SEND_OTP).toBe('/auth/send-otp');
      });

      it('has VERIFY_OTP endpoint', () => {
        expect(API_ENDPOINTS.AUTH.VERIFY_OTP).toBe('/auth/verify-otp');
      });

      it('has RESEND_OTP endpoint', () => {
        expect(API_ENDPOINTS.AUTH.RESEND_OTP).toBe('/auth/resend-otp');
      });
    });

    describe('TENANTS', () => {
      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.TENANTS.LIST).toBe('/tenants');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.TENANTS.CREATE).toBe('/tenants');
      });

      it('has UPDATE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.TENANTS.UPDATE(123)).toBe('/tenants/123');
        expect(API_ENDPOINTS.TENANTS.UPDATE(456)).toBe('/tenants/456');
      });

      it('has DELETE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.TENANTS.DELETE(123)).toBe('/tenants/123');
        expect(API_ENDPOINTS.TENANTS.DELETE(789)).toBe('/tenants/789');
      });

      it('has DETAILS function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.TENANTS.DETAILS(123)).toBe('/tenants/123');
        expect(API_ENDPOINTS.TENANTS.DETAILS(999)).toBe('/tenants/999');
      });
    });

    describe('PG_LOCATIONS', () => {
      it('has BASE endpoint', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.BASE).toBe('/pg-locations');
      });

      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.LIST).toBe('/pg-locations');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.CREATE).toBe('/pg-locations');
      });

      it('has UPDATE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.UPDATE(1)).toBe('/pg-locations/1');
        expect(API_ENDPOINTS.PG_LOCATIONS.UPDATE(99)).toBe('/pg-locations/99');
      });

      it('has DELETE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.DELETE(1)).toBe('/pg-locations/1');
        expect(API_ENDPOINTS.PG_LOCATIONS.DELETE(50)).toBe('/pg-locations/50');
      });

      it('has DETAILS function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.PG_LOCATIONS.DETAILS(1)).toBe('/pg-locations/1/details');
        expect(API_ENDPOINTS.PG_LOCATIONS.DETAILS(100)).toBe('/pg-locations/100/details');
      });
    });

    describe('ROOMS', () => {
      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.ROOMS.LIST).toBe('/rooms');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.ROOMS.CREATE).toBe('/rooms');
      });

      it('has UPDATE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.ROOMS.UPDATE(5)).toBe('/rooms/5');
        expect(API_ENDPOINTS.ROOMS.UPDATE(10)).toBe('/rooms/10');
      });

      it('has DELETE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.ROOMS.DELETE(5)).toBe('/rooms/5');
        expect(API_ENDPOINTS.ROOMS.DELETE(20)).toBe('/rooms/20');
      });
    });

    describe('BEDS', () => {
      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.BEDS.LIST).toBe('/beds');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.BEDS.CREATE).toBe('/beds');
      });

      it('has UPDATE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.BEDS.UPDATE(3)).toBe('/beds/3');
        expect(API_ENDPOINTS.BEDS.UPDATE(7)).toBe('/beds/7');
      });

      it('has DELETE function that generates endpoint with ID', () => {
        expect(API_ENDPOINTS.BEDS.DELETE(3)).toBe('/beds/3');
        expect(API_ENDPOINTS.BEDS.DELETE(15)).toBe('/beds/15');
      });
    });

    describe('PAYMENTS', () => {
      it('has rent_payments endpoint', () => {
        expect(API_ENDPOINTS.PAYMENTS.rent_payments).toBe('/rent-payments');
      });

      it('has ADVANCE_PAYMENTS endpoint', () => {
        expect(API_ENDPOINTS.PAYMENTS.ADVANCE_PAYMENTS).toBe('/advance-payments');
      });

      it('has REFUND_PAYMENTS endpoint', () => {
        expect(API_ENDPOINTS.PAYMENTS.REFUND_PAYMENTS).toBe('/refund-payments');
      });
    });

    describe('EXPENSES', () => {
      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.EXPENSES.LIST).toBe('/expenses');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.EXPENSES.CREATE).toBe('/expenses');
      });
    });

    describe('VISITORS', () => {
      it('has LIST endpoint', () => {
        expect(API_ENDPOINTS.VISITORS.LIST).toBe('/visitors');
      });

      it('has CREATE endpoint', () => {
        expect(API_ENDPOINTS.VISITORS.CREATE).toBe('/visitors');
      });
    });
  });
});
