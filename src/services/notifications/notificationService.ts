/**
 * Notification Service
 * 
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from '../../features/owner/api/notificationsApi';
import { FEATURES } from '../../config/env.config';
import Constants from 'expo-constants';
import { store } from '@/features/owner/store';
import { navigate, navigationRef as navRef } from '../../navigation/navigationRef';
import { RootState } from '@/features/owner/store';

export interface NotificationData {
  type: string;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private lastInitializedUserId: number | null = null;
  private lastTestSentTimestamp: number = 0;
  private initializeCallCount: number = 0;
  private coldStartHandled: boolean = false;

  // Static flag to prevent multiple initializations across app restarts
  private static _instance: NotificationService | null = null;
  
  constructor() {
    if (NotificationService._instance) {
      console.log('[PUSH] ⚠️ NotificationService instance already exists, reusing');
      return NotificationService._instance;
    }
    NotificationService._instance = this;
    console.log('[PUSH] 🔧 Created new NotificationService instance');
  }

  /**
   * Request notification permission early (call from App.tsx on first launch)
   * This ensures the Android 13+ permission dialog shows on first app open
   * Does NOT register token with backend - that happens after login
   */
  async requestPermissionEarly(): Promise<boolean> {
    try {
      console.log('[PUSH] 🚀 Early permission request starting...');
      
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('[PUSH] ⚠️ Not a physical device, skipping permission request');
        return false;
      }

      // Configure notification handler first
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // CRITICAL for Android 13+: Create notification channels BEFORE requesting permission
      if (Platform.OS === 'android') {
        console.log('[PUSH] 🔧 Creating Android notification channels (required for Android 13+)');
        await this.setupAndroidChannels();
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PUSH] Current permission status:', existingStatus);

      if (existingStatus === 'granted') {
        console.log('[PUSH] ✅ Permission already granted');
        return true;
      }

      // Request permission - this will show the system dialog on Android 13+
      console.log('[PUSH] 📋 Requesting notification permission (Android 13+ system dialog)...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[PUSH] Permission request result:', status);

      if (status === 'granted') {
        console.log('[PUSH] ✅ Permission granted by user');
        // Send a local dummy notification to confirm it's working
        await this.sendLocalDummyNotification();
        return true;
      } else {
        console.log('[PUSH] ❌ Permission denied by user');
        return false;
      }
    } catch (error) {
      console.error('[PUSH] ❌ Early permission request failed:', error);
      return false;
    }
  }

  /**
   * Send a local dummy notification to verify notifications are working
   */
  async sendLocalDummyNotification(): Promise<void> {
    try {
      console.log('[PUSH] 🔔 Sending local dummy notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Notifications Enabled!',
          body: 'You will now receive important updates about your PG.',
          sound: 'default',
          data: { type: 'WELCOME', local: true },
        },
        trigger: null, // null = immediate
      });
      console.log('[PUSH] ✅ Local dummy notification sent');
    } catch (error) {
      console.error('[PUSH] ❌ Failed to send local dummy notification:', error);
    }
  }

  /**
   * Initialize notification service
   */
  async initialize(userId: number, force = false) {
    try {
      this.initializeCallCount++;
      console.log('[PUSH] 🚀 initialize called for userId:', userId, 'call #', this.initializeCallCount, 'force:', force);
      console.log('[PUSH] Current state - isInitialized:', this.isInitialized, 'lastUserId:', this.lastInitializedUserId, 'isInitializing:', this.isInitializing);

      // Guard: Prevent multiple simultaneous initializations
      if (this.isInitializing) {
        console.log('[PUSH] ⚠️ Initialization already in progress, skipping');
        return false;
      }

      // Guard: Prevent re-initialization for same user (unless forced)
      if (!force && this.isInitialized && this.lastInitializedUserId === userId) {
        console.log('[PUSH] ℹ️ Already initialized for user', userId, '- skipping (use force=true to re-init)');
        return true;
      }

      // Cleanup existing listeners before setting up new ones
      // This prevents duplicate listeners from multiple initialize calls
      console.log('[PUSH] 🧹 Cleaning up existing listeners before initialization...');
      this.cleanup();

      this.isInitializing = true;

      console.log('[PUSH] initialize start', {
        userId,
        platform: Platform.OS,
        isDevice: Device.isDevice,
        expoConfig: Constants.expoConfig?.name,
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
        hasExtra: !!Constants.expoConfig?.extra,
        hasEas: !!Constants.expoConfig?.extra?.eas,
      });

      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        this.isInitializing = false;
        return false;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permission denied');
        return false;
      }

      // Setup Android notification channels
      if (Platform.OS === 'android') {
        console.log('[PUSH] setting up android channels');
        await this.setupAndroidChannels();
      }

      // Get Expo Push Token
      console.log('[PUSH] fetching expo push token');
      const token = await this.getExpoPushToken();
      if (!token) {
        console.log('❌ Failed to get Expo Push token');
        return false;
      }

      // Register token with backend
      console.log('[PUSH] registering token with backend', { userId, tokenPreview: token.slice(0, 14) });
      await this.registerToken(userId, token);
      console.log('[PUSH] register-token success');

      // Setup notification listeners
      this.setupNotificationListeners();

      // Mark as initialized
      this.isInitialized = true;
      this.lastInitializedUserId = userId;
      this.isInitializing = false;

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Send a test notification via backend API
   * This method prevents notification loops by using rate limiting
   */
  async sendTestNotification(userId: number): Promise<{success: boolean, message: string}> {
    try {
      // Rate limiting: prevent multiple calls in short succession
      const now = Date.now();
      const timeSinceLastTest = now - this.lastTestSentTimestamp;
      
      if (timeSinceLastTest < 5000) { // 5 second cooldown
        console.log('[TEST] 🛑 Test notification rate limited - please wait 5 seconds');
        return {
          success: false,
          message: 'Please wait 5 seconds between test notifications'
        };
      }
      
      // Update timestamp before API call
      this.lastTestSentTimestamp = now;
      
      // Get API base URL from config
      const API_BASE_URL = (await import('../../config')).API_BASE_URL;
      
      console.log('[TEST] 🧪 Sending test notification to user:', userId);
      
      // Call backend test notification endpoint directly
      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': String(userId),
        },
      });

      const responseText = await response.text();
      console.log('[TEST] Backend response:', {
        status: response.status,
        ok: response.ok,
        body: responseText,
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Test notification sent! You should receive it shortly.'
        };
      } else {
        return {
          success: false,
          message: `Backend error: ${response.status} - ${responseText}`
        };
      }
    } catch (error: any) {
      console.error('[TEST] ❌ Test notification failed:', error);
      return {
        success: false,
        message: error?.message || 'Unknown error'
      };
    }
  }
  
  async getExpoPushTokenForTesting(): Promise<string | null> {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return this.getExpoPushToken();
  }

  /**
   * Request notification permissions
   * For Android 13+ (API 33+), this will show the system permission dialog
   * IMPORTANT: On Android 13+, notification channels must be created BEFORE requesting permission
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('[PUSH] 📋 Checking notification permissions...');
      
      // CRITICAL for Android 13+: Create notification channels BEFORE requesting permission
      // This ensures the permission dialog appears correctly
      if (Platform.OS === 'android') {
        console.log('[PUSH] 🔧 Pre-creating Android notification channels (required for Android 13+)');
        await this.setupAndroidChannels();
      }
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PUSH] Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('[PUSH] 📋 Requesting notification permissions (Android 13+ will show system dialog)...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[PUSH] Permission request result:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission not granted. Final status:', finalStatus);
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('rent-reminders', {
      name: 'Rent Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'default',
    });

    console.log('✅ Android notification channels created');
  }

  /**
   * Get Expo Push Token with retry logic
   */
  async getExpoPushToken(retryCount = 0): Promise<string | null> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    try {
      // Try multiple sources for projectId (EAS builds can be tricky)
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ||
        (Constants.manifest as any)?.extra?.eas?.projectId ||
        (Constants as any).manifest2?.extra?.expoClient?.extra?.eas?.projectId ||
        '0f6ecb0b-7511-427b-be33-74a4bd0207fe'; // Hardcoded fallback

      console.log('[PUSH] getExpoPushToken attempt', retryCount + 1, {
        platform: Platform.OS,
        hasProjectId: !!projectId,
        projectId,
        isDevice: Device.isDevice,
        expoConfig: Constants.expoConfig?.name,
        constantsKeys: Object.keys(Constants),
        manifestKeys: Constants.manifest ? Object.keys(Constants.manifest) : 'no manifest',
      });

      if (!projectId) {
        console.error('❌ EAS projectId not found');
        return null;
      }
      
      console.log('[PUSH] Calling getExpoPushTokenAsync with projectId:', projectId);
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo Push Token obtained:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error: any) {
      console.error(`❌ Error getting Expo Push token (attempt ${retryCount + 1}/${maxRetries}):`, error);
      console.error('[PUSH] Error name:', error?.name);
      console.error('[PUSH] Error message:', error?.message);
      console.error('[PUSH] Error code:', error?.code);
      
      // Retry logic
      if (retryCount < maxRetries - 1) {
        console.log(`[PUSH] Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.getExpoPushToken(retryCount + 1);
      }
      
      console.error('[PUSH] Max retries reached. Full error:', JSON.stringify(error, null, 2));
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(userId: number, token: string) {
    try {
      // Generate a consistent device ID based on user ID + device info
      // This allows us to update the same device record on re-registration
      const deviceId = `device-${Platform.OS}-${userId}-${Device.modelName?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`;
      
      const deviceInfo = {
        user_id: userId,
        fcm_token: token,
        device_type: Platform.OS,
        device_id: deviceId,
        device_name: Device.modelName || (Platform.OS === 'ios' ? 'iOS Device' : 'Android Device'),
      };

      console.log('[PUSH] Registering token with backend...', {
        userId,
        tokenPreview: token.slice(0, 20) + '...',
        deviceType: deviceInfo.device_type,
        deviceId: deviceInfo.device_id,
      });

      const result = await store.dispatch(notificationsApi.endpoints.registerNotificationToken.initiate(deviceInfo)).unwrap();
      console.log('✅ FCM token registered with backend successfully', result);
    } catch (error: any) {
      console.error('❌ Failed to register FCM token:', error);
      console.error('[PUSH] Registration error details:', {
        message: error?.message,
        status: error?.status,
        data: error?.data,
      });
      throw error;
    }
  }
  
  /**
   * Unregister FCM token with backend
   * Call this on logout to stop receiving notifications
   */
  async unregisterToken() {
    try {
      if (!this.expoPushToken) {
        console.log('[PUSH] No token to unregister');
        return;
      }
      
      console.log('[PUSH] Unregistering token with backend...');
      
      // Try to call unregister endpoint if it exists
      try {
        await store.dispatch(
          notificationsApi.endpoints.unregisterNotificationToken.initiate({
            fcm_token: this.expoPushToken,
          })
        ).unwrap();
        console.log('[PUSH] ✅ Token unregistered from backend');
      } catch (e) {
        // If endpoint doesn't exist or fails, try direct API call
        try {
          const API_BASE_URL = (await import('../../config')).API_BASE_URL;
          await fetch(`${API_BASE_URL}/notifications/unregister-token`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              fcm_token: this.expoPushToken,
            }),
          });
          console.log('[PUSH] ✅ Token unregistered via direct API call');
        } catch (directError) {
          console.log('[PUSH] Unregister endpoint not available:', directError);
        }
      }
      
      // Clear token locally
      this.expoPushToken = null;
      
      // Reset initialization flags
      this.isInitialized = false;
      this.lastInitializedUserId = null;
    } catch (error) {
      console.error('[PUSH] ❌ Failed to unregister token:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners() {
    console.log('[PUSH] 🎧 Setting up notification listeners...');

    // Listener for notifications received while app is foregrounded
    // Note: Expo's notification handler (set at top of App.tsx) handles displaying notifications
    // We don't need to manually reschedule them here
    this.notificationListener = Notifications.addNotificationReceivedListener(async notification => {
      const isLocal = (notification.request.trigger && 'type' in notification.request.trigger && notification.request.trigger.type === 'timeInterval') ||
        notification.request.content.data?.local === true;
      // Skip local notifications
      if (isLocal) return;

      console.log('🔔 Remote notification received (foreground):', notification.request.content.data);
      // No need to reschedule - Expo handler already displays it
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTapped(response.notification);
    });

    // Check if app was opened from a notification (cold start)
    // Only handle this once to prevent navigation after login
    if (!this.coldStartHandled) {
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          console.log('👆 App opened from notification (cold start):', response);
          this.coldStartHandled = true;
          setTimeout(() => {
            this.handleNotificationTapped(response.notification);
          }, 1000);
        }
      });
    }
  }

  /**
   * Display local notification
   */
  private async displayLocalNotification(title: string, body: string, data?: any) {
    const channelId = this.getChannelId(data?.type);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });

    // Update badge count
    this.updateBadgeCount();
  }

  /**
   * Handle notification tapped
   */
  private handleNotificationTapped(notification: Notifications.Notification) {
    const data = notification.request.content.data;
    console.log('[PUSH] 👆 Tapped - full data:', JSON.stringify(data));
    console.log('[PUSH] 👆 Tapped - data keys:', data ? Object.keys(data) : 'no data');
    console.log('[PUSH] 👆 Tapped - type:', data?.type);
    console.log('[PUSH] 👆 Tapped - ticketId:', data?.ticketId);
    console.log('[PUSH] 👆 Tapped - screen:', data?.screen);

    if (!data?.type) {
      console.warn('[PUSH] Tapped notification has no type, skipping navigation');
      return;
    }
    this.navigateToScreen(data.type as string, data);
  }


  /**
   * Get channel ID based on notification type
   */
  private getChannelId(type?: string): string {
    if (!type) return 'default';

    switch (type) {
      case 'RENT_REMINDER':
      case 'PAYMENT_DUE_SOON':
        return 'rent-reminders';
      case 'PAYMENT_CONFIRMATION':
      case 'PARTIAL_PAYMENT':
      case 'FULL_PAYMENT':
        return 'payments';
      case 'OVERDUE_ALERT':
      case 'PAYMENT_OVERDUE':
        return 'alerts';
      default:
        return 'default';
    }
  }

  /**
   * Navigate to screen based on notification type
   */
  private navigateToScreen(type: string, data: any, attempt = 0) {
    const isReady = navRef?.current?.isReady?.();
    console.log(`[PUSH] navigateToScreen type=${type} attempt=${attempt} navReady=${String(isReady)}`, data);

    if (!isReady) {
      if (attempt < 10) {
        console.log(`[PUSH] Navigator not ready, retrying in 300ms (attempt ${attempt + 1}/10)`);
        setTimeout(() => this.navigateToScreen(type, data, attempt + 1), 300);
      } else {
        console.warn('[PUSH] Navigator never became ready after 10 attempts');
      }
      return;
    }

    // Check if current user is tenant or owner
    const state = store.getState() as RootState;
    const isTenant = state.tenantAuth.isAuthenticated;
    const isOwner = state.auth.isAuthenticated;
    console.log('[PUSH] User state - isTenant:', isTenant, 'isOwner:', isOwner);

    switch (type) {
      case 'TICKET_NEW':
      case 'TICKET_COMMENT':
      case 'TICKET_CLOSED':
      case 'TICKET_STATUS':
      case 'TICKET_STATUS_CHANGED': {
        const ticketId = data?.ticketId ? Number(data.ticketId) : null;
        console.log('[PUSH] Ticket notification - ticketId:', ticketId);
        if (ticketId) {
          // Navigate to appropriate screen based on user type
          if (isTenant) {
            console.log('[PUSH] Navigating to TenantTicketDetail with ticketId:', ticketId);
            navigate('TenantTicketDetail', { ticketId });
          } else if (isOwner) {
            console.log('[PUSH] Navigating to PgTenantTicketDetail with ticketId:', ticketId);
            navigate('PgTenantTicketDetail', { ticketId });
          } else {
            // Fallback based on screen from backend
            const screen = data?.screen === 'TicketDetail' ? 'PgTenantTicketDetail' : 'TenantTicketDetail';
            console.log('[PUSH] Fallback navigation to:', screen, 'with ticketId:', ticketId);
            navigate(screen, { ticketId });
          }
        } else {
          // Navigate to list screen
          if (isTenant) {
            console.log('[PUSH] Navigating to TenantTickets (no ticketId)');
            navigate('TenantTickets');
          } else if (isOwner) {
            console.log('[PUSH] Navigating to PgTenantTickets (no ticketId)');
            navigate('PgTenantTickets');
          } else {
            console.log('[PUSH] Fallback navigation to TenantTickets (no ticketId)');
            navigate('TenantTickets');
          }
        }
        break;
      }
      case 'RENT_REMINDER':
      case 'PAYMENT_DUE_SOON':
      case 'OVERDUE_ALERT':
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_CONFIRMATION':
      case 'PARTIAL_PAYMENT':
      case 'FULL_PAYMENT': {
        const tenantId = data?.tenantId ? Number(data.tenantId) : null;
        console.log('[PUSH] Payment notification - tenantId:', tenantId);
        if (tenantId) {
          console.log('[PUSH] Navigating to TenantDetails with tenantId:', tenantId);
          navigate('TenantDetails', { tenantId });
        } else {
          console.log('[PUSH] Navigating to Tenants (no tenantId)');
          navigate('Tenants');
        }
        break;
      }
      default:
        console.log('[PUSH] No navigation handler for type:', type);
    }
  }

  /**
   * Update badge count
   */
  async updateBadgeCount() {
    try {
      const count = await this.getUnreadNotificationCount();
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Failed to update badge count:', error);
    }
  }

  /**
   * Get unread notification count from backend
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await store.dispatch(notificationsApi.endpoints.getUnreadNotificationCount.initiate()).unwrap();
      return (response as any)?.count || 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(page = 1, limit = 20) {
    try {
      const response = await store
        .dispatch(notificationsApi.endpoints.getNotificationHistory.initiate({ page, limit }))
        .unwrap();
      return response;
    } catch (error) {
      console.error('❌ Failed to get notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number) {
    try {
      await store.dispatch(notificationsApi.endpoints.markNotificationAsRead.initiate(notificationId)).unwrap();
      await this.updateBadgeCount();
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await store.dispatch(notificationsApi.endpoints.markAllNotificationsAsRead.initiate()).unwrap();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: any) {
    try {
      await store.dispatch(notificationsApi.endpoints.updateNotificationSettings.initiate(settings)).unwrap();
      console.log('✅ Notification settings updated');
    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings() {
    try {
      const response = await store.dispatch(notificationsApi.endpoints.getNotificationSettings.initiate()).unwrap();
      return response;
    } catch (error) {
      console.error('❌ Failed to get settings:', error);
      throw error;
    }
  }

  /**
   * Clean up all notification resources
   * Call this on logout
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Send local notification (for testing)
   */
  async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null,
    });
  }
}

export default new NotificationService();
