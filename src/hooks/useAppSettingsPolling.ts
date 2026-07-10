import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetPublicAppStatusQuery } from '@/features/owner/api/appSettingsApi';
import { setAppSettings } from '@/features/owner/store/slices/appSettingsSlice';

type Options = {
  pollingInterval?: number;
};

export const useAppSettingsPolling = (options?: Options) => {
  const pollingInterval = options?.pollingInterval ?? 5 * 60 * 1000; // Default 5 minutes

  const dispatch = useDispatch();

  const { data } = useGetPublicAppStatusQuery(undefined, {
    pollingInterval,
  });

  useEffect(() => {
    if (data) {
      dispatch(setAppSettings(data));
    }
  }, [data, dispatch]);
};
