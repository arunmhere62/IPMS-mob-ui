import { renderHook, act } from '@testing-library/react-native';
import { useRefreshMyPermissions } from '../useRefreshMyPermissions';

// Mock dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@/features/owner/api/rbacApi', () => ({
  useLazyGetMyPermissionsQuery: jest.fn(),
}));

describe('useRefreshMyPermissions', () => {
  const mockDispatch = jest.fn();
  const mockUseSelector = require('react-redux').useSelector as jest.Mock;
  const mockUseLazyGetMyPermissionsQuery = require('@/features/owner/api/rbacApi').useLazyGetMyPermissionsQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    require('react-redux').useDispatch.mockReturnValue(mockDispatch);
  });

  it('initializes with default options', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, rbac: { loadedAt: null } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([jest.fn(), { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions());

    expect(result.current).toHaveProperty('refresh');
    expect(result.current).toHaveProperty('maybeRefresh');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.maybeRefresh).toBe('function');
  });

  it('clears permissions when not authenticated', async () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: false, rbac: { loadedAt: Date.now() } });
    const mockFetch = jest.fn().mockResolvedValue({ data: { permissions_map: {} } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'rbac/clearPermissions',
    }));
  });

  it('fetches permissions when authenticated and not loaded', async () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, rbac: { loadedAt: null } });
    const mockFetch = jest.fn().mockResolvedValue({
      data: {
        permissions_map: { create_tenant: true },
        subscription: { plan: 'premium' },
        is_onboarding_complete: true,
      },
    });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });


  it('refreshes when loadedAt is older than ttlMs', async () => {
    const oldTimestamp = Date.now() - 15 * 60 * 1000; // 15 minutes ago
    mockUseSelector.mockImplementation((selector: any) => {
      const mockState = {
        auth: { isAuthenticated: true },
        rbac: { loadedAt: oldTimestamp },
      };
      return selector(mockState);
    });
    const mockFetch = jest.fn().mockResolvedValue({ data: { permissions_map: {} } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions({ ttlMs: 10 * 60 * 1000 }));

    await act(async () => {
      await result.current.maybeRefresh();
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not refresh when loadedAt is recent', async () => {
    const recentTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    mockUseSelector.mockImplementation((selector: any) => {
      const mockState = {
        auth: { isAuthenticated: true },
        rbac: { loadedAt: recentTimestamp },
      };
      return selector(mockState);
    });
    const mockFetch = jest.fn().mockResolvedValue({ data: { permissions_map: {} } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions({ ttlMs: 10 * 60 * 1000 }));

    await act(async () => {
      await result.current.maybeRefresh();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refreshes when loadedAt is null', async () => {
    mockUseSelector.mockImplementation((selector: any) => {
      const mockState = {
        auth: { isAuthenticated: true },
        rbac: { loadedAt: null },
      };
      return selector(mockState);
    });
    const mockFetch = jest.fn().mockResolvedValue({ data: { permissions_map: {} } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions());

    await act(async () => {
      await result.current.maybeRefresh();
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not refresh when not authenticated', async () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: false, rbac: { loadedAt: null } });
    const mockFetch = jest.fn().mockResolvedValue({ data: { permissions_map: {} } });
    mockUseLazyGetMyPermissionsQuery.mockReturnValue([mockFetch, { isLoading: false }]);

    const { result } = renderHook(() => useRefreshMyPermissions());

    await act(async () => {
      await result.current.maybeRefresh();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
