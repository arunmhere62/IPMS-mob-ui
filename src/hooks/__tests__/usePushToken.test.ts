import { renderHook } from '@testing-library/react-native';
import { getExpoPushToken, useIncomingNotifications } from '../usePushToken';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: jest.fn(() => true),
}));

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return 'android';
    },
    set OS(value) {
      // Allow setting for testing
    },
  },
}));

describe('usePushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExpoPushToken', () => {
    it('returns null when not on a device', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(false);

      const token = await getExpoPushToken();

      expect(token).toBeNull();
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns null when permissions are not granted', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const token = await getExpoPushToken();

      expect(token).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('requests permissions when existing status is not granted', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      const token = await getExpoPushToken();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('test-token');
    });

    it('does not request permissions when already granted', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      const token = await getExpoPushToken();

      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(token).toBe('test-token');
    });

    it('sets notification channel on Android', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      const token = await getExpoPushToken();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
      expect(token).toBe('test-token');
    });

    it('does not set notification channel on iOS', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      const token = await getExpoPushToken();

      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
      expect(token).toBe('test-token');
    });

    it('returns push token when all steps succeed', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'expo-push-token-123' });

      const token = await getExpoPushToken();

      expect(token).toBe('expo-push-token-123');
    });

    it('handles permission status "denied"', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const token = await getExpoPushToken();

      expect(token).toBeNull();
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('handles permission status "undetermined" and grants on request', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      const token = await getExpoPushToken();

      expect(token).toBe('test-token');
    });

    it('handles permission status "undetermined" and denies on request', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const token = await getExpoPushToken();

      expect(token).toBeNull();
    });

    it('handles getExpoPushTokenAsync error', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(new Error('Token error'));

      await expect(getExpoPushToken()).rejects.toThrow('Token error');
    });

    it('handles getPermissionsAsync error', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Permissions error'));

      await expect(getExpoPushToken()).rejects.toThrow('Permissions error');
    });

    it('handles requestPermissionsAsync error', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Request error'));

      await expect(getExpoPushToken()).rejects.toThrow('Request error');
    });

    it('handles setNotificationChannelAsync error on Android', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.setNotificationChannelAsync as jest.Mock).mockRejectedValue(new Error('Channel error'));
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

      await expect(getExpoPushToken()).rejects.toThrow('Channel error');
    });

    it('handles empty token string', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: '' });

      const token = await getExpoPushToken();

      expect(token).toBe('');
    });

    it('handles null token data', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: null });

      const token = await getExpoPushToken();

      expect(token).toBeNull();
    });

    it('handles undefined token data', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: undefined });

      const token = await getExpoPushToken();

      expect(token).toBeUndefined();
    });

    it('handles very long token string', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      const longToken = 'x'.repeat(1000);
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: longToken });

      const token = await getExpoPushToken();

      expect(token).toBe(longToken);
    });

    it('handles token with special characters', async () => {
      (Device.isDevice as unknown as jest.Mock).mockReturnValue(true);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'token-with-special-chars:<>{}[]' });

      const token = await getExpoPushToken();

      expect(token).toBe('token-with-special-chars:<>{}[]');
    });
  });

  describe('useIncomingNotifications', () => {
    it('sets notification handler on mount', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const { unmount } = renderHook(() => useIncomingNotifications(mockOnNotification));

      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockOnNotification);

      unmount();
    });

    it('removes listener on unmount', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const { unmount } = renderHook(() => useIncomingNotifications(mockOnNotification));

      unmount();

      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('calls onNotification when notification is received', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      // Get the callback that was passed to addNotificationReceivedListener
      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const mockNotification = { request: { content: { title: 'Test' } } };
      listenerCallback(mockNotification);

      expect(mockOnNotification).toHaveBeenCalledWith(mockNotification);
    });

    it('sets notification handler with correct configuration', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });

      const handlerConfig = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
      const handlerResult = handlerConfig.handleNotification();

      expect(handlerResult).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      });
    });

    it('handles null onNotification callback', () => {
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const { unmount } = renderHook(() => useIncomingNotifications(null as any));

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(null);
      unmount();
    });

    it('handles undefined onNotification callback', () => {
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const { unmount } = renderHook(() => useIncomingNotifications(undefined as any));

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(undefined);
      unmount();
    });

    it('updates listener when onNotification changes', () => {
      const mockSubscription1 = { remove: jest.fn() };
      const mockSubscription2 = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock)
        .mockReturnValueOnce(mockSubscription1)
        .mockReturnValueOnce(mockSubscription2);

      const mockOnNotification1 = jest.fn();
      const { rerender } = renderHook(() => useIncomingNotifications(mockOnNotification1));

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockOnNotification1);

      const mockOnNotification2 = jest.fn();
      rerender(() => useIncomingNotifications(mockOnNotification2));

      expect(mockSubscription1.remove).toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockOnNotification2);
    });

    it('handles multiple notifications', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      listenerCallback({ request: { content: { title: 'Test 1' } } });
      listenerCallback({ request: { content: { title: 'Test 2' } } });
      listenerCallback({ request: { content: { title: 'Test 3' } } });

      expect(mockOnNotification).toHaveBeenCalledTimes(3);
    });

    it('handles notification with complex payload', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const complexNotification = {
        request: {
          content: {
            title: 'Complex',
            body: 'Body',
            data: { key: 'value', nested: { item: 123 } },
          },
        },
      };
      listenerCallback(complexNotification);

      expect(mockOnNotification).toHaveBeenCalledWith(complexNotification);
    });

    it('handles notification with null payload', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      listenerCallback(null);

      expect(mockOnNotification).toHaveBeenCalledWith(null);
    });

    it('handles notification with undefined payload', () => {
      const mockOnNotification = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      renderHook(() => useIncomingNotifications(mockOnNotification));

      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      listenerCallback(undefined);

      expect(mockOnNotification).toHaveBeenCalledWith(undefined);
    });
  });
});
