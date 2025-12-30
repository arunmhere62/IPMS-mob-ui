import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../../theme';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { useResendOtpMutation, useVerifyOtpMutation } from '../../services/api/authApi';
import { useRegisterNotificationTokenMutation } from '../../services/api/notificationsApi';
import { AppDispatch } from '../../store';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { OTPInput } from '../../components/OTPInput';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { navigationRef } from '../../navigation/navigationRef';
import { useLazyGetRequiredLegalDocumentsStatusQuery } from '../../services/api/legalDocumentsApi';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface OTPVerificationScreenProps {
  navigation: any;
  route: any;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation, route }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [verifyOtp, { isLoading: verifyingOtp }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resendingOtp }] = useResendOtpMutation();
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery();
  const [registerToken] = useRegisterNotificationTokenMutation();

  useEffect(() => {
    setOtpError('');
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateOtp = (otpValue: string): boolean => {
    if (!otpValue) {
      setOtpError('OTP is required');
      return false;
    }
    if (otpValue.length !== 4) {
      setOtpError('OTP must be 4 digits');
      return false;
    }
    setOtpError('');
    return true;
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp(otp)) {
      return;
    }

    try {
      const result = await verifyOtp({ phone, otp }).unwrap();

      dispatch(
        setCredentials({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
      
      // Register push notification token after successful login
      await registerPushToken();
      
      showSuccessAlert('Login successful!');

      const status = await getRequiredLegalStatus({ context: 'LOGIN' }).unwrap();
      if (status?.pending?.length) {
        setTimeout(() => {
          const nav = navigationRef.current;
          if (nav && typeof nav.navigate === 'function') {
            nav.navigate('LegalDocuments' as never, {
              context: 'LOGIN',
              pending: status.pending,
            } as never);
          }
        }, 0);
        return;
      }

      // Do not manually navigate to MainTabs here.
      // AppNavigator will switch to the authenticated stack as soon as setCredentials() updates isAuthenticated.
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
    }
  };

  const registerPushToken = async () => {
    try {
      console.log('[OTP] 🔔 Registering push notification token after login...');
      
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('[OTP] ⚠️ Not a physical device, skipping token registration');
        return;
      }

      // Check permission status
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('[OTP] ⚠️ Notification permission not granted, skipping token registration');
        return;
      }

      // Get Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || '0f6ecb0b-7511-427b-be33-74a4bd0207fe';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      console.log('[OTP] 📱 Expo Push Token:', token);

      // Register token with backend via RTK Query
      // x-user-id header is automatically added from auth state
      const regResult = await registerToken({
        fcm_token: token,
        device_type: Platform.OS,
        device_id: Device.modelId || Device.modelName || 'unknown',
        device_name: Device.deviceName || Device.modelName || 'Android Device',
      }).unwrap();
      
      console.log('[OTP] ✅ Push token registered successfully:', regResult);
    } catch (error) {
      console.error('[OTP] ❌ Failed to register push token:', error);
      // Don't block login flow for notification errors
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      await resendOtp({ phone }).unwrap();
      showSuccessAlert('OTP resent successfully');
      setResendTimer(60);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
    }
  };

  return (
    <ScreenLayout contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        title="Verify OTP"
        subtitle={`Enter the 4-digit code sent to ${phone}`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1,
            justifyContent: keyboardVisible ? 'flex-start' : 'center',
            padding: Theme.spacing.lg,
            paddingTop: keyboardVisible ? Theme.spacing.xl : Theme.spacing.lg,
            paddingBottom: Theme.spacing.xxxl 
          }}
          style={{ backgroundColor: CONTENT_COLOR }}
          keyboardShouldPersistTaps="handled"
        >
          <Card
            backgroundColor="bg-transparent"
            shadowColor=""
            style={{
              padding: Theme.spacing.lg,
              marginBottom: Theme.spacing.lg,
              borderWidth: 1,
              borderColor: Theme.withOpacity(Theme.colors.border, 0.25),
              // backgroundColor: Theme.withOpacity('#000000', 0.03),
            }}
          >
            <Text
              style={{
                fontSize: Theme.typography.fontSize.xl,
                fontWeight: Theme.typography.fontWeight.bold,
                color: Theme.colors.text.primary,
                marginBottom: Theme.spacing.xs,
                textAlign: 'center',
              }}
            >
              Enter verification code
            </Text>

            <Text
              style={{
                fontSize: Theme.typography.fontSize.sm,
                color: Theme.colors.text.secondary,
                textAlign: 'center',
                marginBottom: Theme.spacing.lg,
              }}
            >
              We sent a 4-digit code to{' '}
              <Text style={{ color: Theme.colors.text.primary, fontWeight: Theme.typography.fontWeight.semibold }}>
                {phone}
              </Text>
            </Text>

          <OTPInput
            length={4}
            value={otp}
            onChangeText={(text: string) => {
              setOtp(text);
              setOtpError('');
            }}
            error={!!otpError}
            autoFocus
          />

          {otpError ? (
            <Text style={{
              color: Theme.colors.danger,
              fontSize: Theme.typography.fontSize.sm,
              marginTop: Theme.spacing.sm,
              textAlign: 'center',
            }}>
              {otpError}
            </Text>
          ) : null}

          <View style={{ marginTop: Theme.spacing.lg }}>
            <Button
              title="Verify OTP"
              onPress={handleVerifyOtp}
              loading={verifyingOtp}
              variant="primary"
              size="lg"
            />
          </View>

          <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text style={{ 
                  color: Theme.colors.primary, 
                  fontWeight: Theme.typography.fontWeight.semibold 
                }}>
                  {resendingOtp ? 'Resending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: Theme.colors.text.secondary }}>
                Resend available in {resendTimer}s
              </Text>
            )}
          </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: Theme.spacing.md }}
            >
              <Text style={{ color: Theme.colors.text.secondary, textAlign: 'center' }}>
                Change Phone Number
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};
