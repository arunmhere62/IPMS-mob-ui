import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { clearOrganizations } from '../../store/slices/organizationSlice';
import { clearPermissions } from '../../store/slices/rbacSlice';
import { baseApi } from '../../services/api/baseApi';
import { useLogoutMutation } from '../../services/api/authApi';
import { persistor } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { CONTENT_COLOR } from '@/constant';
import notificationService from '../../services/notifications/notificationService';
import { useGetSubscriptionStatusQuery } from '../../services/api/subscriptionApi';
import { API_BASE_URL } from '../../config';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [serverLogout] = useLogoutMutation();
  const [testingNotification, setTestingNotification] = useState(false);

  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    refetch: refetchSubscriptionStatus,
  } = useGetSubscriptionStatusQuery();

  // Fetch subscription status only when screen comes into focus (lazy loading)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Settings screen focused, fetching subscription...');
      refetchSubscriptionStatus();
    }, [dispatch])
  );

  // Debug log subscription status
  useEffect(() => {
    console.log('📊 Subscription Status:', {
      hasActive: subscriptionStatus?.has_active_subscription,
      subscription: subscriptionStatus?.subscription,
      status: subscriptionStatus?.subscription?.status,
      loading: subscriptionLoading,
    });
  }, [subscriptionStatus, subscriptionLoading]);

  const handleRefreshSubscription = async () => {
    console.log('🔄 Manual refresh triggered');
    await refetchSubscriptionStatus();
  };

  // Removed test notification function - now handled only in LoginScreen

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Best-effort server-side logout (revokes tokens)
              try {
                await serverLogout().unwrap();
              } catch (e) {
                console.warn('⚠️ Server logout failed (continuing local logout):', e);
              }

              // Unregister FCM token and cleanup notification service
              await notificationService.unregisterToken();
              notificationService.cleanup();
              console.log('✅ Notification service cleaned up');
            } catch (error) {
              console.warn('⚠️ Failed to cleanup notifications:', error);
            }

            // Clear RTK Query cache + all redux slice state
            dispatch(baseApi.util.resetApiState());
            dispatch(clearOrganizations());
            dispatch(clearPermissions());
            dispatch(setSelectedPGLocation(null));
            dispatch(logout());

            // Remove persisted redux state from disk
            try {
              await persistor.purge();
            } catch (e) {
              console.warn('⚠️ Failed to purge persisted store:', e);
            }

            console.log('✅ User logged out successfully');
          },
        },
      ]
    );
  };

  // Settings options - conditionally show "Report Issue" for non-Super Admin users
  const settingsOptions = [
    { title: 'Profile', icon: '👤', onPress: () => navigation.navigate('UserProfile') },
    { title: 'Report Issue', icon: '🐛', onPress: () => navigation.navigate('Tickets'), },
    { title: 'Notifications', icon: '🔔', onPress: () => { } },
    { title: 'Privacy', icon: '🔒', onPress: () => { } },
    { title: 'Help & Support', icon: '❓', onPress: () => navigation.navigate('FaqWebView') },
    { title: 'About', icon: 'ℹ️', onPress: () => { } },
  ];

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader title="Settings" showBackButton onBackPress={() => navigation.goBack()} />

      <View style={{ flex: 1, backgroundColor: Theme.colors.light }}>
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 80 }}>
          {/* User Info Card */}
          <Card className="mb-4">
            <View className="items-center py-4">
              <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
                <Text className="text-white text-3xl">👤</Text>
              </View>
              <Text className="text-xl font-bold text-dark">{user?.name || 'User'}</Text>
              <Text className="text-gray-600">{user?.phone || user?.email}</Text>
            </View>
          </Card>

          {/* Subscription Card */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.1),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="diamond" size={20} color={Theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Subscription
                </Text>
                {subscriptionLoading ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                ) : subscriptionStatus?.has_active_subscription ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color={Theme.colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, color: Theme.colors.secondary, fontWeight: '600' }}>
                      Active - {subscriptionStatus.subscription?.plan?.name || 'Unknown Plan'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="alert-circle" size={14} color={Theme.colors.warning} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, color: Theme.colors.warning, fontWeight: '600' }}>
                      No Active Subscription
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
            </View>

            {subscriptionStatus?.has_active_subscription && subscriptionStatus.days_remaining !== undefined && (
              <View style={{
                backgroundColor: Theme.colors.background.secondary,
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 6 }}>
                  {subscriptionStatus.days_remaining} days remaining
                </Text>
                <View style={{
                  height: 4,
                  backgroundColor: Theme.colors.border,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${(subscriptionStatus.days_remaining / (subscriptionStatus.subscription?.plan?.duration || 30)) * 100}%`,
                    backgroundColor: Theme.colors.primary,
                  }} />
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Refresh Button */}
              <TouchableOpacity
                onPress={handleRefreshSubscription}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="refresh" size={18} color={Theme.colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: Theme.colors.primary,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="pricetags" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                  View Plans
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionHistory')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: Theme.colors.background.blueLight,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Theme.colors.primary,
                }}
              >
                <Ionicons name="time" size={16} color={Theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.primary }}>
                  History
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Settings Options */}
          <Card className="mb-4">
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.onPress}
                className={`flex-row items-center py-4 ${index < settingsOptions.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
              // style={option.highlight ? { backgroundColor: '#FEF3C7' } : {}}
              >
                <Text className="text-2xl mr-3">{option.icon}</Text>
                <Text className="text-dark font-semibold flex-1">{option.title}</Text>
                {/* {option.highlight && <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '700', marginRight: 8 }}>NEW</Text>} */}
                <Text className="text-gray-400">›</Text>
              </TouchableOpacity>
            ))}
          </Card>

          {/* Test Notification Button (Dev/Testing) */}
          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-lg py-4 mb-6"
          >
            <Text className="text-white text-center font-bold text-lg">Logout</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text className="text-center text-gray-500 text-sm mb-4">
            Version 1.0.0
          </Text>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
