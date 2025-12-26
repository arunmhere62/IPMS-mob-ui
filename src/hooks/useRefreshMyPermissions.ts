import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useLazyGetMyPermissionsQuery } from '../services/api/rbacApi';
import { setPermissionsMap, clearPermissions } from '../store/slices/rbacSlice';

type Options = {
  ttlMs?: number;
  enableAppResume?: boolean;
};

export const useRefreshMyPermissions = (options?: Options) => {
  const ttlMs = options?.ttlMs ?? 10 * 60 * 1000;
  const enableAppResume = options?.enableAppResume ?? true;

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const loadedAt = useSelector((state: RootState) => (state as any).rbac?.loadedAt || null);

  const [fetchMyPerms] = useLazyGetMyPermissionsQuery();

  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch(clearPermissions());
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await fetchMyPerms().unwrap();
      dispatch(setPermissionsMap((data as any)?.permissions_map || {}));
    } catch {
      dispatch(setPermissionsMap({}));
    } finally {
      inFlightRef.current = false;
    }
  }, [dispatch, fetchMyPerms, isAuthenticated]);

  const maybeRefresh = useCallback(async () => {
    if (!isAuthenticated) return;

    if (!loadedAt) {
      await refresh();
      return;
    }

    const age = Date.now() - Number(loadedAt);
    if (age >= ttlMs) {
      await refresh();
    }
  }, [isAuthenticated, loadedAt, refresh, ttlMs]);

  useEffect(() => {
    if (!enableAppResume) return;

    let prevState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasBackground = prevState === 'background' || prevState === 'inactive';
      const isActive = nextState === 'active';
      prevState = nextState;

      if (isAuthenticated && wasBackground && isActive) {
        maybeRefresh();
      }
    });

    return () => sub.remove();
  }, [enableAppResume, isAuthenticated, maybeRefresh]);

  return { refresh, maybeRefresh };
};
