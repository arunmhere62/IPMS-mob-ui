import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/owner/store';
import { MaintenanceScreen } from '@/screens/maintenance/MaintenanceScreen';
import { ForceUpdateScreen } from '@/screens/maintenance/ForceUpdateScreen';

interface AppStatusGateProps {
  children: React.ReactNode;
}

/**
 * Compares two semver strings (e.g. "1.2.3").
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export const AppStatusGate: React.FC<AppStatusGateProps> = ({ children }) => {
  const status = useSelector((state: RootState) => (state as any).appSettings?.appSettings);

  // 1. Maintenance mode — hard block
  if (status?.is_maintenance_mode) {
    return <MaintenanceScreen message={status.maintenance_message} />;
  }

  // 2. Force update — hard block
  const installedVersion = Constants.expoConfig?.version ?? '0.0.0';
  const minimumVersion =
    Platform.OS === 'android'
      ? status?.minimum_version_android
      : status?.minimum_version_ios;
  // Store URLs are not included in the public /status endpoint.
  // ForceUpdateScreen handles a missing storeUrl by showing an alert.
  const storeUrl: string | undefined = undefined;

  if (minimumVersion && compareVersions(installedVersion, minimumVersion) < 0) {
    return (
      <ForceUpdateScreen
        currentVersion={installedVersion}
        minimumVersion={minimumVersion}
        storeUrl={storeUrl}
      />
    );
  }

  return <View style={styles.flex}>{children}</View>;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
