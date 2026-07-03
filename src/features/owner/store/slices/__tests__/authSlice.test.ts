import authReducer, {
  logout,
  setCredentials,
  updateUser,
  clearError,
  resetLoading,
  setLastUserRole,
} from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    selectedRole: null,
    lastUserRole: null,
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('logout', () => {
    it('clears auth state', () => {
      const existingState = {
        user: { id: 1, name: 'Test User' } as any,
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
        loading: false,
        error: null,
        selectedRole: 'pg_owner' as const,
        lastUserRole: 'admin' as const,
      };
      const action = logout();
      const state = authReducer(existingState as any, action);

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastUserRole).toBe('admin');
    });
  });

  describe('setCredentials', () => {
    it('sets user credentials', () => {
      const user = { id: 1, name: 'Test User' } as any;
      const action = setCredentials({
        user,
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
      });
      const state = authReducer(initialState, action);

      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('test-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.lastUserRole).toBe('admin');
    });

    it('handles missing refreshToken', () => {
      const user = { id: 1, name: 'Test User' } as any;
      const action = setCredentials({
        user,
        accessToken: 'test-token',
      });
      const state = authReducer(initialState, action);

      expect(state.refreshToken).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('updates user when user exists', () => {
      const existingState = {
        ...initialState,
        user: { id: 1, name: 'Test User', email: 'old@example.com' } as any,
      };
      const action = updateUser({ email: 'new@example.com' });
      const state = authReducer(existingState, action);

      expect(state.user).toEqual({
        id: 1,
        name: 'Test User',
        email: 'new@example.com',
      });
    });

    it('does not update when user is null', () => {
      const action = updateUser({ email: 'new@example.com' });
      const state = authReducer(initialState, action);

      expect(state.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      const existingState = {
        ...initialState,
        error: 'Some error',
      };
      const action = clearError();
      const state = authReducer(existingState, action);

      expect(state.error).toBeNull();
    });
  });

  describe('resetLoading', () => {
    it('resets loading and error', () => {
      const existingState = {
        ...initialState,
        loading: true,
        error: 'Some error',
      };
      const action = resetLoading();
      const state = authReducer(existingState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setLastUserRole', () => {
    it('sets last user role to admin', () => {
      const action = setLastUserRole('admin');
      const state = authReducer(initialState as any, action);

      expect(state.lastUserRole).toBe('admin');
    });

    it('sets last user role to null', () => {
      const existingState = {
        ...initialState,
        lastUserRole: 'admin' as const,
      };
      const action = setLastUserRole(null);
      const state = authReducer(existingState as any, action);

      expect(state.lastUserRole).toBeNull();
    });
  });
});
