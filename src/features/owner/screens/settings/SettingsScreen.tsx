import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { setTenantLastUserRole } from '@/features/tenant/store/tenantAuthSlice';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { clearOrganizations } from '../../store/slices/organizationSlice';
import { clearPermissions } from '../../store/slices/rbacSlice';
import { baseApi } from '@/features/owner/api/baseApi';
import { useLogoutMutation } from '@/features/auth/api/authApi';
import { persistor } from '../../store';
import { Card } from '@/components/Card';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { Theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenLayout } from '@/components/ScreenLayout';
import { CONTENT_COLOR } from '@/constant';
import notificationService from '@/services/notifications/notificationService';
import { useGetSubscriptionStatusQuery } from '@/features/owner/api/subscriptionApi';
import { useLazyGetRequiredLegalDocumentsStatusQuery } from '@/features/owner/api/legalDocumentsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { Platform } from 'react-native';
import { showErrorAlert } from '@/utils/errorHandler';

interface SettingsScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isSuperAdmin } = usePermissions();
  const rbacSubscription = useSelector((state: RootState) => (state as any).rbac?.subscription);
  const appStatus = useSelector((state: RootState) => (state as any).appSettings?.appSettings);
  const currentVersion =
    Platform.OS === 'android'
      ? appStatus?.current_version_android
      : appStatus?.current_version_ios;
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery();

  const [serverLogout] = useLogoutMutation();
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    refetch: refetchSubscriptionStatus,
  } = useGetSubscriptionStatusQuery(undefined, { skip: !isSuperAdmin });

  // Fetch subscription status only when screen comes into focus (lazy loading)
  useFocusEffect(
    useCallback(() => {
      if (!isSuperAdmin) return;
      console.log('🔄 Settings screen focused, fetching subscription...');
      refetchSubscriptionStatus();
    }, [isSuperAdmin, refetchSubscriptionStatus])
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
    if (!isSuperAdmin) return;
    console.log('🔄 Manual refresh triggered');
    await refetchSubscriptionStatus();
  };

  const addEmbedParam = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl);
      u.searchParams.set('embed', '1');
      return u.toString();
    } catch {
      return rawUrl;
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      const res = await getRequiredLegalStatus({ context: 'SETTINGS' }).unwrap();
      const docs = (res as any)?.required || [];
      const doc = docs.find((d: any) => String(d?.type || '').toUpperCase() === 'PRIVACY_POLICY');
      const url = doc?.url;
      if (!url) {
        Alert.alert('Info', 'Privacy Policy link is not available right now.');
        return;
      }
      navigation.navigate('LegalWebView', { title: 'Privacy Policy', url: addEmbedParam(String(url)) });
    } catch {
      showErrorAlert(null, 'Load Privacy Policy Error');
    }
  };

  const openContactUs = async () => {
    try {
      const res = await getRequiredLegalStatus({ context: 'SETTINGS' }).unwrap();
      const docs = (res as any)?.required || [];
      const doc = docs.find((d: any) => String(d?.type || '').toUpperCase() === 'CONTACT_US');
      const url = doc?.url;
      if (!url) {
        Alert.alert('Info', 'Contact Us link is not available right now.');
        return;
      }
      navigation.navigate('LegalWebView', { title: 'Contact Us', url: addEmbedParam(String(url)) });
    } catch {
      showErrorAlert(null, 'Load Contact Us Error');
    }
  };

  const openTermsAndConditions = async () => {
    try {
      const res = await getRequiredLegalStatus({ context: 'SETTINGS' }).unwrap();
      const docs = (res as any)?.required || [];
      const doc = docs.find((d: any) => {
        const type = String(d?.type || '').toUpperCase();
        return type === 'TERMS_OF_SERVICE' || type === 'TERMS_AND_CONDITIONS';
      });
      const url = doc?.url;
      if (!url) {
        Alert.alert('Info', 'Terms & Conditions link is not available right now.');
        return;
      }
      navigation.navigate('LegalWebView', { title: 'Terms & Conditions', url: addEmbedParam(String(url)) });
    } catch {
      showErrorAlert(null, 'Load Terms Error');
    }
  };

  const openRefundPolicy = async () => {
    try {
      const res = await getRequiredLegalStatus({ context: 'SETTINGS' }).unwrap();
      const docs = (res as any)?.required || [];
      const doc = docs.find((d: any) => String(d?.type || '').toUpperCase() === 'REFUND_POLICY');
      const url = doc?.url;
      if (!url) {
        Alert.alert('Info', 'Refund Policy link is not available right now.');
        return;
      }
      navigation.navigate('LegalWebView', { title: 'Refund Policy', url: addEmbedParam(String(url)) });
    } catch {
      showErrorAlert(null, 'Load Refund Policy Error');
    }
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
            if (loggingOut) return;
            setLoggingOut(true);
            try {
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
              // Clear tenant's lastUserRole so next redirect goes to owner login
              dispatch(setTenantLastUserRole(null));
              dispatch(logout());

              // Remove persisted redux state from disk
              try {
                await persistor.purge();
              } catch (e) {
                console.warn('⚠️ Failed to purge persisted store:', e);
              }

              console.log('✅ User logged out successfully');
              // Navigation is handled automatically by AppNavigator based on auth state
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Settings options - conditionally show "Report Issue" for non-Super Admin users
  const settingsOptions = [
    { title: 'Profile', icon: '👤', onPress: () => navigation.navigate('UserProfile') },
    { title: 'Report Issue', icon: '🐛', onPress: () => navigation.navigate('Tickets'), },
    { title: 'Terms & Conditions', icon: '📄', onPress: openTermsAndConditions },
    { title: 'Privacy Policy', icon: '🔒', onPress: openPrivacyPolicy },
    { title: 'Refund Policy', icon: '💰', onPress: openRefundPolicy },
    { title: 'Contact Us', icon: '📞', onPress: openContactUs },
    { title: 'Help & Support', icon: '❓', onPress: () => navigation.navigate('FaqWebView') },
    // { title: 'About', icon: 'ℹ️', onPress: () => { } },
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

          {isSuperAdmin ? (
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

              {/* Trial upgrade banner */}
              {rbacSubscription?.is_trial && rbacSubscription?.has_active_plan && (
                <AnimatedPressableCard
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                  style={{
                    marginBottom: 12,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: rbacSubscription.days_remaining <= 3 ? '#DC2626' : rbacSubscription.days_remaining <= 7 ? '#E11D48' : '#EF4444',
                  }}
                >
                  <View style={{
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 20 }}>🚀</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                          You're on a Trial Plan
                        </Text>
                        {rbacSubscription.days_remaining <= 7 && (
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>
                              {rbacSubscription.days_remaining === 0 ? 'Expires today' : `${rbacSubscription.days_remaining}d left`}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 15 }}>
                        {rbacSubscription.days_remaining <= 3
                          ? 'Upgrade now to avoid losing access to your data'
                          : 'Unlock full access — no limits, no interruptions'}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Upgrade</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={{ height: 3, backgroundColor: 'rgba(0,0,0,0.15)' }}>
                    <View style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(5, ((rbacSubscription.days_remaining) / 30) * 100))}%`,
                      backgroundColor: 'rgba(255,255,255,0.6)',
                    }} />
                  </View>
                </AnimatedPressableCard>
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AnimatedPressableCard
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
                </AnimatedPressableCard>

                <AnimatedPressableCard
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
                </AnimatedPressableCard>
                <AnimatedPressableCard
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
                </AnimatedPressableCard>
              </View>
            </Card>
          ) : null}

          {/* Settings Options */}
          <Card className="mb-4">
            {settingsOptions.map((option, index) => (
              <AnimatedPressableCard
                key={index}
                onPress={option.onPress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderBottomWidth: index < settingsOptions.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <Text className="text-2xl mr-3">{option.icon}</Text>
                <Text className="text-dark font-semibold flex-1">{option.title}</Text>
                <Text className="text-gray-400">›</Text>
              </AnimatedPressableCard>
            ))}
          </Card>

          {/* Test Notification Button (Dev/Testing) */}
          {/* Logout Button */}
          <AnimatedPressableCard
            onPress={handleLogout}
            disabled={loggingOut}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 8,
              paddingVertical: 16,
              marginBottom: 24,
              opacity: loggingOut ? 0.75 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {loggingOut ? <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} /> : null}
              <Text className="text-white text-center font-bold text-lg">Logout</Text>
            </View>
          </AnimatedPressableCard>

          {/* App Version */}
          <Text className="text-center text-gray-500 text-sm mb-4">
            {currentVersion ? `Version ${currentVersion}` : 'Version —'}
          </Text>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
