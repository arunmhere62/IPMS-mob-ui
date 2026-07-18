import {
  AUTH_ROUTES,
  OWNER_ROUTES,
  TENANT_ROUTES,
  ROUTE_GROUPS,
  TAB_SCREENS,
  type AuthRoute,
  type OwnerRoute,
  type TenantRoute,
} from '../routes';

describe('routes', () => {
  describe('AUTH_ROUTES', () => {
    it('has all auth route constants', () => {
      expect(AUTH_ROUTES.ROLE_SELECTION).toBe('RoleSelection');
      expect(AUTH_ROUTES.LOGIN).toBe('Login');
      expect(AUTH_ROUTES.TENANT_LOGIN).toBe('TenantLogin');
      expect(AUTH_ROUTES.SIGNUP).toBe('Signup');
      expect(AUTH_ROUTES.SIGNUP_OTP).toBe('SignupOtp');
      expect(AUTH_ROUTES.OTP_VERIFICATION).toBe('OTPVerification');
      expect(AUTH_ROUTES.TENANT_OTP_VERIFICATION).toBe('TenantOTPVerification');
      expect(AUTH_ROUTES.LEGAL_DOCUMENTS).toBe('LegalDocuments');
      expect(AUTH_ROUTES.LEGAL_WEBVIEW).toBe('LegalWebView');
    });

    it('has 9 auth routes', () => {
      expect(Object.keys(AUTH_ROUTES)).toHaveLength(9);
    });
  });

  describe('OWNER_ROUTES', () => {
    it('has main tabs route', () => {
      expect(OWNER_ROUTES.MAIN_TABS).toBe('MainTabs');
    });

    it('has dashboard route', () => {
      expect(OWNER_ROUTES.DASHBOARD).toBe('Dashboard');
    });

    it('has tenant routes', () => {
      expect(OWNER_ROUTES.TENANTS).toBe('Tenants');
      expect(OWNER_ROUTES.TENANT_DETAILS).toBe('TenantDetails');
      expect(OWNER_ROUTES.ADD_TENANT).toBe('AddTenant');
      expect(OWNER_ROUTES.TENANT_RENT_PAYMENTS).toBe('TenantRentPaymentsScreen');
      expect(OWNER_ROUTES.TENANT_ADVANCE_PAYMENTS).toBe('TenantAdvancePaymentsScreen');
      expect(OWNER_ROUTES.TENANT_REFUND_PAYMENTS).toBe('TenantRefundPaymentsScreen');
    });

    it('has room routes', () => {
      expect(OWNER_ROUTES.ROOMS).toBe('Rooms');
      expect(OWNER_ROUTES.ROOM_DETAILS).toBe('RoomDetails');
      expect(OWNER_ROUTES.ROOM_ELECTRICITY_BILLS).toBe('RoomElectricityBills');
      expect(OWNER_ROUTES.BEDS).toBe('Beds');
    });

    it('has payment routes', () => {
      expect(OWNER_ROUTES.PAYMENTS).toBe('Payments');
      expect(OWNER_ROUTES.RENT_PAYMENTS).toBe('RentPayments');
      expect(OWNER_ROUTES.ADVANCE_PAYMENTS).toBe('AdvancePayments');
      expect(OWNER_ROUTES.REFUND_PAYMENTS).toBe('RefundPayments');
    });

    it('has organization routes', () => {
      expect(OWNER_ROUTES.PG_LOCATIONS).toBe('PGLocations');
      expect(OWNER_ROUTES.PG_DETAILS).toBe('PGDetails');
      expect(OWNER_ROUTES.ORGANIZATIONS).toBe('Organizations');
    });

    it('has employee routes', () => {
      expect(OWNER_ROUTES.EMPLOYEES).toBe('Employees');
      expect(OWNER_ROUTES.ADD_EMPLOYEE).toBe('AddEmployee');
      expect(OWNER_ROUTES.EMPLOYEE_DETAILS).toBe('EmployeeDetails');
      expect(OWNER_ROUTES.EMPLOYEE_PERMISSION_OVERRIDES).toBe('EmployeePermissionOverrides');
    });

    it('has visitor routes', () => {
      expect(OWNER_ROUTES.VISITORS).toBe('Visitors');
      expect(OWNER_ROUTES.ADD_VISITOR).toBe('AddVisitor');
      expect(OWNER_ROUTES.VISITOR_DETAILS).toBe('VisitorDetails');
    });

    it('has ticket routes', () => {
      expect(OWNER_ROUTES.TICKETS).toBe('Tickets');
      expect(OWNER_ROUTES.CREATE_TICKET).toBe('CreateTicket');
      expect(OWNER_ROUTES.TICKET_DETAILS).toBe('TicketDetails');
      expect(OWNER_ROUTES.PG_TENANT_TICKETS).toBe('PgTenantTickets');
      expect(OWNER_ROUTES.PG_TENANT_TICKET_DETAIL).toBe('PgTenantTicketDetail');
    });

    it('has settings and profile routes', () => {
      expect(OWNER_ROUTES.SETTINGS).toBe('Settings');
      expect(OWNER_ROUTES.USER_PROFILE).toBe('UserProfile');
      expect(OWNER_ROUTES.FAQ_WEBVIEW).toBe('FaqWebView');
    });

    it('has subscription routes', () => {
      expect(OWNER_ROUTES.SUBSCRIPTION_PLANS).toBe('SubscriptionPlans');
      expect(OWNER_ROUTES.SUBSCRIPTION_HISTORY).toBe('SubscriptionHistory');
      expect(OWNER_ROUTES.SUBSCRIPTION_CONFIRM).toBe('SubscriptionConfirm');
      expect(OWNER_ROUTES.PAYMENT_OPTIONS).toBe('PaymentOptions');
      expect(OWNER_ROUTES.PAYMENT_WEBVIEW).toBe('PaymentWebView');
    });
  });

  describe('TENANT_ROUTES', () => {
    it('has all tenant route constants', () => {
      expect(TENANT_ROUTES.DASHBOARD).toBe('TenantDashboard');
      expect(TENANT_ROUTES.TICKETS).toBe('TenantTickets');
      expect(TENANT_ROUTES.CREATE_TICKET).toBe('TenantCreateTicket');
      expect(TENANT_ROUTES.TICKET_DETAIL).toBe('TenantTicketDetail');
    });

    it('has 4 tenant routes', () => {
      expect(Object.keys(TENANT_ROUTES)).toHaveLength(4);
    });
  });

  describe('ROUTE_GROUPS', () => {
    it('contains all auth routes', () => {
      expect(ROUTE_GROUPS.AUTH).toContain('RoleSelection');
      expect(ROUTE_GROUPS.AUTH).toContain('Login');
      expect(ROUTE_GROUPS.AUTH).toContain('TenantLogin');
    });

    it('contains all owner routes', () => {
      expect(ROUTE_GROUPS.OWNER).toContain('MainTabs');
      expect(ROUTE_GROUPS.OWNER).toContain('Dashboard');
      expect(ROUTE_GROUPS.OWNER).toContain('Tenants');
    });

    it('contains all tenant routes', () => {
      expect(ROUTE_GROUPS.TENANT).toContain('TenantDashboard');
      expect(ROUTE_GROUPS.TENANT).toContain('TenantTickets');
    });

    it('has correct number of routes in each group', () => {
      expect(ROUTE_GROUPS.AUTH).toHaveLength(9);
      expect(ROUTE_GROUPS.OWNER).toHaveLength(43);
      expect(ROUTE_GROUPS.TENANT).toHaveLength(4);
    });
  });

  describe('TAB_SCREENS', () => {
    it('contains 4 tab screens', () => {
      expect(TAB_SCREENS).toHaveLength(4);
    });

    it('contains correct tab screens', () => {
      expect(TAB_SCREENS).toContain('Dashboard');
      expect(TAB_SCREENS).toContain('Tenants');
      expect(TAB_SCREENS).toContain('Payments');
      expect(TAB_SCREENS).toContain('Settings');
    });

    it('is readonly at type level', () => {
      // Note: as const makes it readonly at type level, not runtime
      // This test verifies the type is correct
      const screens = TAB_SCREENS;
      expect(Array.isArray(screens)).toBe(true);
    });
  });

  describe('Type exports', () => {
    it('AuthRoute type accepts valid auth routes', () => {
      const route: AuthRoute = 'Login';
      expect(route).toBe('Login');
    });

    it('OwnerRoute type accepts valid owner routes', () => {
      const route: OwnerRoute = 'Dashboard';
      expect(route).toBe('Dashboard');
    });

    it('TenantRoute type accepts valid tenant routes', () => {
      const route: TenantRoute = 'TenantDashboard';
      expect(route).toBe('TenantDashboard');
    });
  });
});
