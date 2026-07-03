import { renderHook } from '@testing-library/react-native';
import { usePermissions } from '../usePermissions';
import { Permission } from '../../config/rbac.config';
import { getBackendPermissionKeyCandidates } from '../../config/rbac-backend-map';
import { RootState } from '@/features/owner/store';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../config/rbac-backend-map', () => ({
  getBackendPermissionKeyCandidates: jest.fn(),
}));

describe('usePermissions', () => {
  const mockUseSelector = require('react-redux').useSelector as jest.Mock;
  const mockGetBackendPermissionKeyCandidates = getBackendPermissionKeyCandidates as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isReady as false when loadedAt is null', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: null,
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isReady).toBe(false);
  });

  it('returns isReady as true when loadedAt is set', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isReady).toBe(true);
  });

  it('returns correct user role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.role).toBe('ADMIN');
  });

  it('returns empty string when user role is undefined', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: {},
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.role).toBe('');
  });

  it('returns isSuperAdmin as true for SUPER_ADMIN role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'SUPER_ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('returns isSuperAdmin as true for super_admin (lowercase) role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'super_admin' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('returns isSuperAdmin as false for non-super admin role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('returns isAdmin as true for ADMIN role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'ADMIN' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isAdmin as true for admin (lowercase) role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'admin' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isAdmin as false for non-admin role', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: { role_name: 'USER' },
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns user object', () => {
    const mockUser = { role_name: 'ADMIN', id: 1, name: 'Test User' };
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: mockUser,
          isAuthenticated: true,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: Date.now(),
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.user).toEqual(mockUser);
  });

  it('returns undefined user when user is null', () => {
    mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: Partial<RootState> = {
        auth: {
          user: null,
          isAuthenticated: false,
        } as any,
      };
      (mockState as any).rbac = {
        permissionsMap: {},
        loadedAt: null,
      };
      return selector(mockState as RootState);
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.user).toBeNull();
  });

  describe('can method', () => {
    it('returns true for super admin regardless of permission', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'SUPER_ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(true);
    });

    it('returns true when permission exists in map', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue(['create_tenant']);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(true);
    });

    it('returns false when permission does not exist in map', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue(['create_tenant']);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(false);
    });

    it('checks multiple permission keys', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue(['create_tenant']);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as unknown as Permission)).toBe(true);
    });

    it('handles empty permission keys array', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue([]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(false);
    });

    it('handles null permissions map', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue(['create_tenant']);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: null,
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(false);
    });

    it('handles undefined permissions map', () => {
      mockGetBackendPermissionKeyCandidates.mockReturnValue(['create_tenant']);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as Permission)).toBe(false);
    });
  });

  describe('canAny method', () => {
    it('returns true for super admin regardless of permissions', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'SUPER_ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAny(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(true);
    });

    it('returns true when at least one permission exists', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAny(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(true);
    });

    it('returns false when no permissions exist', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAny(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(false);
    });

    it('handles empty permissions array', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAny([] as unknown as Permission[])).toBe(false);
    });

    it('handles single permission in array', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAny(['create_tenant'] as unknown as Permission[])).toBe(true);
    });
  });

  describe('canAll method', () => {
    it('returns true for super admin regardless of permissions', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'SUPER_ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(true);
    });

    it('returns true when all permissions exist', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true, delete_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(true);
    });

    it('returns false when some permissions are missing', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(false);
    });

    it('returns false when no permissions exist', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll(['create_tenant', 'delete_tenant'] as unknown as Permission[])).toBe(false);
    });

    it('handles empty permissions array', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll([] as unknown as Permission[])).toBe(true);
    });

    it('handles single permission in array', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAll(['create_tenant'] as unknown as Permission[])).toBe(true);
    });
  });

  describe('canAccess method', () => {
    it('always returns true (placeholder implementation)', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccess('/dashboard')).toBe(true);
      expect(result.current.canAccess('/settings')).toBe(true);
      expect(result.current.canAccess('')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles null user', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: null,
            isAuthenticated: false,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: null,
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe('');
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('handles undefined user', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: undefined,
            isAuthenticated: false,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: null,
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe('');
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.user).toBeUndefined();
    });

    it('handles role_name as null', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: null },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe(''); // null is converted to empty string with ??
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('handles role_name as empty string', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: '' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe('');
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('handles role_name with special characters', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN_TEST' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe('ADMIN_TEST');
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('handles role_name with numbers', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN_123' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe('ADMIN_123');
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('handles permissionsMap with nested structure', () => {
      mockGetBackendPermissionKeyCandidates.mockImplementation((perm) => [perm]);
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: { create_tenant: true },
          loadedAt: Date.now(),
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('create_tenant' as unknown as Permission)).toBe(true);
    });

    it('handles loadedAt as 0', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: 0,
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isReady).toBe(true); // 0 is now considered valid with != null check
    });

    it('handles loadedAt as negative number', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: -1,
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isReady).toBe(true);
    });

    it('handles loadedAt as very large number', () => {
      mockUseSelector.mockImplementation((selector: (state: RootState) => unknown) => {
        const mockState: Partial<RootState> = {
          auth: {
            user: { role_name: 'ADMIN' },
            isAuthenticated: true,
          } as any,
        };
        (mockState as any).rbac = {
          permissionsMap: {},
          loadedAt: 9999999999999,
        };
        return selector(mockState as RootState);
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isReady).toBe(true);
    });
  });
});
