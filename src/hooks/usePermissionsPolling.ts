import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useRefreshMyPermissions } from './useRefreshMyPermissions';

export const usePermissionsPolling = () => {
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);
  const { refresh } = useRefreshMyPermissions({ ttlMs: 10 * 60 * 1000, enableAppResume: true });

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated || !accessToken) return;
      await refresh();
    };

    run();
  }, [isAuthenticated, accessToken, refresh]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const intervalId = setInterval(() => {
      refresh();
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, accessToken, refresh]);
};
