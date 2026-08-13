/**
 * Activity Tracking Service
 *
 * Detects app lifecycle events (install, update, open, close)
 * and sends them to the backend via direct fetch (not RTK Query)
 * to avoid dependency on Redux state for pre-login events.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../../config';

const STORAGE_KEY_INSTALLED = '@app_activity_installed';
const STORAGE_KEY_VERSION = '@app_activity_version';
const STORAGE_KEY_OPEN_TIME = '@app_activity_last_open';

export type ActivityActionType =
  | 'APP_INSTALL'
  | 'APP_UPDATE'
  | 'APP_OPEN'
  | 'APP_CLOSE';

interface ActivityPayload {
  action_type: ActivityActionType;
  user_id?: number;
  tenant_id?: number;
  app_version?: string;
  os_version?: string;
  device_model?: string;
  device_id?: string;
  metadata?: Record<string, unknown>;
}

class ActivityTrackingService {
  private isInitialized = false;

  /**
   * Read persisted Redux state from AsyncStorage to get current user/tenant ID.
   * Redux persist stores under key 'root' with auth and tenantAuth slices.
   */
  private async getCurrentUserId(): Promise<{ user_id?: number; tenant_id?: number }> {
    try {
      const raw = await AsyncStorage.getItem('persist:root');
      if (!raw) return {};
      const root = JSON.parse(raw);

      // Parse auth slice (owner)
      if (root.auth) {
        const auth = JSON.parse(root.auth);
        if (auth?.user?.s_no) {
          return { user_id: auth.user.s_no };
        }
      }

      // Parse tenantAuth slice (tenant)
      if (root.tenantAuth) {
        const tenantAuth = JSON.parse(root.tenantAuth);
        if (tenantAuth?.tenant?.tenant_id) {
          return { tenant_id: tenantAuth.tenant.tenant_id };
        }
      }
    } catch {
      // Silent fail - if we can't read state, just skip user ID
    }
    return {};
  }

  /**
   * Get current app version from expo-constants
   */
  private getAppVersion(): string {
    return (
      Constants.expoConfig?.version ??
      (Constants.manifest as any)?.version ??
      'unknown'
    );
  }

  /**
   * Get device info for activity logging
   */
  private getDeviceInfo() {
    return {
      app_version: this.getAppVersion(),
      os_version: Device.osVersion
        ? `${Device.osName ?? Platform.OS} ${Device.osVersion}`
        : Platform.OS,
      device_model: Device.modelName ?? Device.deviceName ?? Platform.OS,
      device_id: Device.deviceName ?? undefined,
    };
  }

  /**
   * Send activity log to backend (uses fetch directly, not RTK Query)
   * This works even before login since /activity/log is public
   */
  private async sendActivity(payload: ActivityPayload): Promise<void> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/activity/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.warn('[ActivityTracking] Failed to log activity:', payload.action_type);
      }
    } catch (error) {
      // Silent fail - activity tracking should never crash the app
      console.warn('[ActivityTracking] Error logging activity:', error);
    }
  }

  /**
   * Track app install and update on app launch.
   * Call this once from App.tsx on startup.
   */
  async trackInstallAndUpdate(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const deviceInfo = this.getDeviceInfo();
    const currentVersion = this.getAppVersion();

    try {
      const wasInstalled = await AsyncStorage.getItem(STORAGE_KEY_INSTALLED);
      const previousVersion = await AsyncStorage.getItem(STORAGE_KEY_VERSION);

      if (!wasInstalled) {
        // First ever launch = APP_INSTALL
        await this.sendActivity({
          action_type: 'APP_INSTALL',
          ...deviceInfo,
        });
        await AsyncStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
        await AsyncStorage.setItem(STORAGE_KEY_VERSION, currentVersion);
      } else if (previousVersion && previousVersion !== currentVersion) {
        // Version changed = APP_UPDATE
        await this.sendActivity({
          action_type: 'APP_UPDATE',
          ...deviceInfo,
          metadata: {
            previous_version: previousVersion,
            new_version: currentVersion,
          },
        });
        await AsyncStorage.setItem(STORAGE_KEY_VERSION, currentVersion);
      }
    } catch (error) {
      console.warn('[ActivityTracking] Error tracking install/update:', error);
    }
  }

  /**
   * Track app open event (app comes to foreground)
   */
  async trackAppOpen(): Promise<void> {
    const now = Date.now();
    const deviceInfo = this.getDeviceInfo();
    const userIds = await this.getCurrentUserId();

    try {
      await AsyncStorage.setItem(STORAGE_KEY_OPEN_TIME, String(now));
      await this.sendActivity({
        action_type: 'APP_OPEN',
        ...userIds,
        ...deviceInfo,
      });
    } catch (error) {
      console.warn('[ActivityTracking] Error tracking app open:', error);
    }
  }

  /**
   * Track app open with explicit user_id/tenant_id (called after login).
   * This solves the issue where the initial APP_OPEN at app launch has no user ID
   * because the user hasn't logged in yet.
   */
  async trackAppOpenWithUser(userId?: number, tenantId?: number): Promise<void> {
    const now = Date.now();
    const deviceInfo = this.getDeviceInfo();

    try {
      await AsyncStorage.setItem(STORAGE_KEY_OPEN_TIME, String(now));
      await this.sendActivity({
        action_type: 'APP_OPEN',
        ...(userId ? { user_id: userId } : {}),
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ...deviceInfo,
      });
    } catch (error) {
      console.warn('[ActivityTracking] Error tracking app open with user:', error);
    }
  }

  /**
   * Track app close event (app goes to background)
   * Calculates session duration from last open time
   */
  async trackAppClose(): Promise<void> {
    const deviceInfo = this.getDeviceInfo();
    const userIds = await this.getCurrentUserId();

    try {
      const openTimeStr = await AsyncStorage.getItem(STORAGE_KEY_OPEN_TIME);
      const sessionDuration = openTimeStr
        ? Date.now() - Number(openTimeStr)
        : undefined;

      await this.sendActivity({
        action_type: 'APP_CLOSE',
        ...userIds,
        ...deviceInfo,
        metadata: sessionDuration ? { session_duration_ms: sessionDuration } : undefined,
      });

      await AsyncStorage.removeItem(STORAGE_KEY_OPEN_TIME);
    } catch (error) {
      console.warn('[ActivityTracking] Error tracking app close:', error);
    }
  }
}

export const activityTrackingService = new ActivityTrackingService();
