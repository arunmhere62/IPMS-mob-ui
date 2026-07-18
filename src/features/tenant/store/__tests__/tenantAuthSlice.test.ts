import tenantAuthReducer, {
  setTenantCredentials,
  setTenantData,
  updateTenantInfo,
  updateTenantAccessToken,
  updateTenantTokens,
  tenantLogout,
  setTenantLastUserRole,
  setTenantLoading,
  setTenantError,
  clearTenantError,
  resetTenantAuth,
  type TenantAuthState,
} from '../tenantAuthSlice';

describe('tenantAuthSlice', () => {
  const initialState: TenantAuthState = {
    tenant: null,
    pg: null,
    rentCycles: [],
    recentPayments: [],
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    lastUserRole: null,
  };

  it('should return initial state', () => {
    expect(tenantAuthReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setTenantCredentials', () => {
    it('sets tenant credentials and authenticates', () => {
      const tenant = { tenant_id: 1, name: 'John', phone: '123', email: null, status: 'ACTIVE' } as any;
      const pg = { pg_id: 1, location_name: 'PG 1', address: 'Addr' } as any;
      const action = setTenantCredentials({ tenant, pg, accessToken: 'tok', refreshToken: 'ref' });
      const state = tenantAuthReducer(initialState, action);

      expect(state.tenant).toEqual(tenant);
      expect(state.pg).toEqual(pg);
      expect(state.accessToken).toBe('tok');
      expect(state.refreshToken).toBe('ref');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.lastUserRole).toBe('tenant');
    });
  });

  describe('setTenantData', () => {
    it('sets tenant data with room/bed/payment info', () => {
      const existingState: TenantAuthState = {
        ...initialState,
        isAuthenticated: true,
        accessToken: 'tok',
      };
      const tenant = { tenant_id: 1, name: 'John', phone: '123', email: null, status: 'ACTIVE' } as any;
      const pg = { pg_id: 1, location_name: 'PG 1', address: 'Addr' } as any;
      const rentCycles = [{ s_no: 1, cycle_type: 'MONTHLY', anchor_day: 1, cycle_start: '2026-01-01', cycle_end: null }] as any;
      const recentPayments = [{ s_no: 1, payment_date: '2026-01-05', amount_paid: '5000', payment_method: 'CASH', status: 'PAID', remarks: null }] as any;

      const action = setTenantData({
        tenant, pg, rentCycles, recentPayments,
        room_no: '101', bed_no: 'B1', bed_price: '5000',
        payment_status: 'PAID', rent_due_amount: 0, pending_months: 0,
      });
      const state = tenantAuthReducer(existingState, action);

      expect(state.tenant?.room_no).toBe('101');
      expect(state.tenant?.bed_no).toBe('B1');
      expect(state.tenant?.bed_price).toBe('5000');
      expect(state.tenant?.payment_status).toBe('PAID');
      expect(state.rentCycles).toEqual(rentCycles);
      expect(state.recentPayments).toEqual(recentPayments);
    });

    it('sets tenant data without optional fields', () => {
      const tenant = { tenant_id: 1, name: 'John', phone: '123', email: null, status: 'ACTIVE' } as any;
      const pg = null;
      const action = setTenantData({ tenant, pg });
      const state = tenantAuthReducer(initialState, action);

      expect(state.tenant).toEqual(tenant);
      expect(state.pg).toBeNull();
      expect(state.rentCycles).toEqual([]);
      expect(state.recentPayments).toEqual([]);
    });
  });

  describe('updateTenantInfo', () => {
    it('updates tenant when tenant exists', () => {
      const existingState: TenantAuthState = {
        ...initialState,
        tenant: { tenant_id: 1, name: 'John', phone: '123', email: 'old@test.com', status: 'ACTIVE' } as any,
      };
      const action = updateTenantInfo({ email: 'new@test.com' });
      const state = tenantAuthReducer(existingState, action);

      expect(state.tenant?.email).toBe('new@test.com');
      expect(state.tenant?.name).toBe('John');
    });

    it('does nothing when tenant is null', () => {
      const action = updateTenantInfo({ email: 'new@test.com' });
      const state = tenantAuthReducer(initialState, action);

      expect(state.tenant).toBeNull();
    });
  });

  describe('updateTenantAccessToken', () => {
    it('updates access token', () => {
      const existingState: TenantAuthState = { ...initialState, accessToken: 'old' };
      const state = tenantAuthReducer(existingState, updateTenantAccessToken('new'));
      expect(state.accessToken).toBe('new');
    });
  });

  describe('updateTenantTokens', () => {
    it('updates both tokens', () => {
      const existingState: TenantAuthState = { ...initialState, accessToken: 'old', refreshToken: 'oldRef' };
      const state = tenantAuthReducer(existingState, updateTenantTokens({ accessToken: 'new', refreshToken: 'newRef' }));
      expect(state.accessToken).toBe('new');
      expect(state.refreshToken).toBe('newRef');
    });
  });

  describe('tenantLogout', () => {
    it('clears auth state but keeps lastUserRole', () => {
      const existingState: TenantAuthState = {
        ...initialState,
        tenant: { tenant_id: 1, name: 'John' } as any,
        accessToken: 'tok',
        refreshToken: 'ref',
        isAuthenticated: true,
        rentCycles: [{ s_no: 1 }] as any,
        recentPayments: [{ s_no: 1 }] as any,
      };
      const state = tenantAuthReducer(existingState, tenantLogout());

      expect(state.tenant).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.rentCycles).toEqual([]);
      expect(state.recentPayments).toEqual([]);
      expect(state.lastUserRole).toBe('tenant');
    });
  });

  describe('setTenantLastUserRole', () => {
    it('sets last user role to tenant', () => {
      const state = tenantAuthReducer(initialState, setTenantLastUserRole('tenant'));
      expect(state.lastUserRole).toBe('tenant');
    });

    it('sets last user role to null', () => {
      const existingState: TenantAuthState = { ...initialState, lastUserRole: 'tenant' };
      const state = tenantAuthReducer(existingState, setTenantLastUserRole(null));
      expect(state.lastUserRole).toBeNull();
    });
  });

  describe('setTenantLoading', () => {
    it('sets loading to true', () => {
      const state = tenantAuthReducer(initialState, setTenantLoading(true));
      expect(state.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const existingState: TenantAuthState = { ...initialState, loading: true };
      const state = tenantAuthReducer(existingState, setTenantLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setTenantError', () => {
    it('sets error message', () => {
      const state = tenantAuthReducer(initialState, setTenantError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });

    it('sets error to null', () => {
      const existingState: TenantAuthState = { ...initialState, error: 'Old error' };
      const state = tenantAuthReducer(existingState, setTenantError(null));
      expect(state.error).toBeNull();
    });
  });

  describe('clearTenantError', () => {
    it('clears error', () => {
      const existingState: TenantAuthState = { ...initialState, error: 'Some error' };
      const state = tenantAuthReducer(existingState, clearTenantError());
      expect(state.error).toBeNull();
    });
  });

  describe('resetTenantAuth', () => {
    it('resets to initial state', () => {
      const existingState: TenantAuthState = {
        ...initialState,
        tenant: { tenant_id: 1 } as any,
        accessToken: 'tok',
        isAuthenticated: true,
        lastUserRole: 'tenant',
      };
      const state = tenantAuthReducer(existingState, resetTenantAuth());
      expect(state).toEqual(initialState);
    });
  });
});
