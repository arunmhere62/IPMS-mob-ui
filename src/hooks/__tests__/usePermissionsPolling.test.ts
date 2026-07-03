import { renderHook } from '@testing-library/react-native';
import { usePermissionsPolling } from '../usePermissionsPolling';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../useRefreshMyPermissions', () => ({
  useRefreshMyPermissions: jest.fn(),
}));

describe('usePermissionsPolling', () => {
  const mockUseSelector = require('react-redux').useSelector as jest.Mock;
  const mockUseRefreshMyPermissions = require('../useRefreshMyPermissions').useRefreshMyPermissions as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes without errors', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: false, accessToken: null });
    const mockRefresh = jest.fn();
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    renderHook(() => usePermissionsPolling());

    expect(mockUseRefreshMyPermissions).toHaveBeenCalledWith({
      ttlMs: 10 * 60 * 1000,
      enableAppResume: true,
    });
  });

  it('calls refresh on mount when authenticated', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, accessToken: 'test-token' });
    const mockRefresh = jest.fn().mockResolvedValue(undefined);
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    renderHook(() => usePermissionsPolling());

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('does not call refresh when not authenticated', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: false, accessToken: null });
    const mockRefresh = jest.fn();
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    renderHook(() => usePermissionsPolling());

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('does not call refresh when no access token', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, accessToken: null });
    const mockRefresh = jest.fn();
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    renderHook(() => usePermissionsPolling());

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('sets up polling interval when authenticated', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, accessToken: 'test-token' });
    const mockRefresh = jest.fn();
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    renderHook(() => usePermissionsPolling());

    jest.advanceTimersByTime(60 * 1000);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('clears interval on unmount', () => {
    mockUseSelector.mockReturnValue({ isAuthenticated: true, accessToken: 'test-token' });
    const mockRefresh = jest.fn();
    mockUseRefreshMyPermissions.mockReturnValue({ refresh: mockRefresh });

    const { unmount } = renderHook(() => usePermissionsPolling());

    unmount();

    jest.advanceTimersByTime(60 * 1000);

    // Should not call refresh after unmount
    expect(mockRefresh).toHaveBeenCalledTimes(1); // Only initial call
  });
});
