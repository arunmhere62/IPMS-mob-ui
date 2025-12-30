import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import { useSendOtpMutation } from '../../services/api/authApi';
import { useSendStaticTestNotificationMutation } from '../../services/api/notificationsApi';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  phoneLength: number;
}

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    phoneLength: 10,
  });
  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();
  const [sendStaticTest, { isLoading: testingNotification }] = useSendStaticTestNotificationMutation();
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check notification permission status on component mount
  // Permission is requested in App.tsx, here we just check status and get token
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      console.log('[LOGIN] 🔔 Checking notification status...');

      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('[LOGIN] ⚠️ Not a physical device, skipping notification check');
        return;
      }

      // Check current permission status (permission was requested in App.tsx)
      const { status } = await Notifications.getPermissionsAsync();
      console.log('[LOGIN] Current permission status:', status);
      
      if (status !== 'granted') {
        console.log('[LOGIN] ❌ Notification permission not granted');
        // Don't show alert here - permission was already requested in App.tsx
        return;
      }

      console.log('[LOGIN] ✅ Notification permission granted');
      setPermissionGranted(true);

      // Get Expo Push Token (only after permission is confirmed)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || '0f6ecb0b-7511-427b-be33-74a4bd0207fe';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      console.log('[LOGIN] 📱 Expo Push Token:', token);
      setNotificationToken(token);
      
      // Token registration happens after login in OTPVerificationScreen
      // Here we just confirm we have the token ready
      console.log('[LOGIN] ✅ Push token ready, will register after login');

    } catch (error) {
      console.error('[LOGIN] ❌ Notification check failed:', error);
    }
  };

  // Test notification function using RTK Query
  const handleTestNotification = async () => {
    try {
      console.log('[TEST] 🧪 Testing push notification via RTK Query...');
      
      const result = await sendStaticTest({
        title: '🎉 Test Notification',
        body: 'This is a static test notification from LoginScreen',
        data: {
          type: 'TEST',
          source: 'login_screen',
          timestamp: new Date().toISOString(),
        }
      }).unwrap();

      console.log('[TEST] ✅ Backend response:', result);

      if (result.success) {
        Alert.alert(
          '✅ Test Sent',
          `Notification sent to ${result.result?.successCount || 0} device(s)!\n\nCheck your device for the notification.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Test Failed',
          result.message || 'Unknown error',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[TEST] ❌ Test notification failed:', error);
      Alert.alert(
        '❌ Error',
        `Failed to send test notification:\n\n${error?.data?.message || error?.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      return;
    }

    try {
      // Send phone with country code and space
      const fullPhone = selectedCountry.phoneCode + ' ' + phone;
      const res = await sendOtp({ phone: fullPhone }).unwrap();
      showSuccessAlert(res);
      navigation.navigate('OTPVerification', { phone: fullPhone });
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.background.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ 
          flex: 1,
          justifyContent: 'center', 
          padding: Theme.spacing.lg 
        }}>
          <View style={{ marginBottom: Theme.spacing.xl }}>
            <Text style={{ 
              fontSize: Theme.typography.fontSize['4xl'], 
              fontWeight: Theme.typography.fontWeight.bold, 
              color: Theme.colors.primary, 
              textAlign: 'center', 
              marginBottom: Theme.spacing.sm 
            }}>
              PG Management
            </Text>
            <Text style={{ 
              fontSize: Theme.typography.fontSize.base, 
              color: Theme.colors.text.secondary, 
              textAlign: 'center' 
            }}>
              Login to manage your PG operations
            </Text>
          </View>

          <Card className="mb-6 shadow-none">
            <Text className="text-2xl font-semibold text-dark mb-6">Login</Text>
            
            {/* Country + Phone in Single Row */}
            <CountryPhoneSelector
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
              size="large"
              phoneValue={phone}
              onPhoneChange={(text: string) => {
                setPhone(text);
                setPhoneError('');
              }}
            />

            {/* Error Message */}
            {phoneError && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, marginLeft: 4 }}>
                {phoneError}
              </Text>
            )}

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={sendingOtp}
              variant="primary"
              size="md"
            />
            
            <Text className='mt-6' style={{ 
              fontSize: Theme.typography.fontSize.sm, 
              color: Theme.colors.text.secondary, 
              textAlign: 'center', 
              marginBottom: Theme.spacing.md 
            }}>
              You will receive a 6-digit OTP on your registered phone number
            </Text>

            <View style={{ marginTop: Theme.spacing.lg }}>
              <Button
                title="Create New Account"
                onPress={() => navigation.navigate('Signup')}
                variant="outline"
                size='md'
              />
            </View>

            {/* Test Push Notification Button */}
            <View style={{ marginTop: Theme.spacing.md, paddingTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <Text style={{ 
                fontSize: 12, 
                color: Theme.colors.text.secondary, 
                textAlign: 'center', 
                marginBottom: Theme.spacing.sm 
              }}>
                🧪 Push Notification Test
              </Text>

              {/* Status Indicator */}
              {permissionGranted && notificationToken && (
                <View style={{ 
                  backgroundColor: '#D1FAE5', 
                  padding: 8, 
                  borderRadius: 6, 
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 11, color: '#065F46', fontWeight: '600' }}>
                    ✅ Permission Granted - Token Ready
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={handleTestNotification}
                disabled={testingNotification || !notificationToken}
                style={{
                  backgroundColor: testingNotification || !notificationToken ? '#9CA3AF' : '#F59E0B',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {testingNotification ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                      Sending Test...
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                    📱 Send Test Notification
                  </Text>
                )}
              </TouchableOpacity>
              
              <Text style={{ 
                fontSize: 10, 
                color: '#6B7280', 
                textAlign: 'center', 
                marginTop: 8,
                fontStyle: 'italic'
              }}>
                {notificationToken 
                  ? 'Token ready - login to register with backend' 
                  : permissionGranted 
                    ? 'Getting push token...'
                    : 'Waiting for notification permission...'}
              </Text>

              {/* Show token for curl testing */}
              {notificationToken && (
                <View style={{ marginTop: 12, padding: 8, backgroundColor: '#F3F4F6', borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, color: '#374151', textAlign: 'center', fontFamily: 'monospace' }}>
                    Token: {notificationToken.substring(0, 30)}...
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
