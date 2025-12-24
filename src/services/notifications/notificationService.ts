/**
 * Notification Service
 * 
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { store } from '../../store';
import { notificationsApi } from '../api/notificationsApi';
import { FEATURES } from '../../config/env.config';
import Constants from 'expo-constants';

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

  /**
   * Initialize notification service
   */
  async initialize(userId: number) {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        return false;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
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
        await this.setupAndroidChannels();
      }

      // Get Expo Push Token
      const token = await this.getExpoPushToken();
      if (!token) {
        console.log('❌ Failed to get Expo Push token');
        return false;
      }

      // Register token with backend
      await this.registerToken(userId, token);

      // Setup notification listeners
      this.setupNotificationListeners();

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission not granted');
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
   * Get Expo Push Token
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error getting Expo Push token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(userId: number, token: string) {
    try {
      const deviceInfo = {
        user_id: userId,
        fcm_token: token,
        device_type: Platform.OS,
        device_id: 'device-' + Math.random().toString(36).substring(7),
        device_name: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      };

      await store.dispatch(notificationsApi.endpoints.registerNotificationToken.initiate(deviceInfo)).unwrap();
      console.log('✅ FCM token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register FCM token:', error);
      throw error;
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTapped(response.notification);
    });

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('👆 App opened from notification:', response);
        this.handleNotificationTapped(response.notification);
      }
    });
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
    
    // Navigate to appropriate screen based on notification type
    if (data?.type) {
      this.navigateToScreen(data.type as string, data);
    }
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
  private navigateToScreen(type: string, data: any) {
    // This will be implemented with navigation reference
    console.log('Navigate to:', type, data);
    
    // Example navigation logic:
    // switch (type) {
    //   case FCM_CONFIG.types.RENT_REMINDER:
    //     navigation.navigate('TenantDetails', { tenantId: data.tenant_id });
    //     break;
    //   case FCM_CONFIG.types.PAYMENT_CONFIRMATION:
    //     navigation.navigate('Payments');
    //     break;
    //   // ... other cases
    // }
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
   * Unregister token (on logout)
   */
  async unregisterToken() {
    try {
      if (this.expoPushToken) {
        await store
          .dispatch(
            notificationsApi.endpoints.unregisterNotificationToken.initiate({
              fcm_token: this.expoPushToken,
            })
          )
          .unwrap();
        this.expoPushToken = null;
        console.log('✅ Expo Push token unregistered');
      }
    } catch (error) {
      console.error('❌ Failed to unregister token:', error);
    }
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
