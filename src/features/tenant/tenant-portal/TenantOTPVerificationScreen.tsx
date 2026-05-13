import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { AppDispatch } from '@/store';
import { useTenantSendOtpMutation, useTenantVerifyOtpMutation } from '@/services/api/tenantPortalAuthApi';
import { setTenantCredentials } from '@/store/slices/tenantAuthSlice';
import { navigationRef } from '@/navigation/navigationRef';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import Theme from '@/theme';
import { Card } from '@/components/Card';
import { OTPInput } from '@/components/OTPInput';
import { Button } from '@/components/Button';

interface TenantOTPVerificationScreenProps {
  navigation: any;
  route: any;
}

export const TenantOTPVerificationScreen: React.FC<TenantOTPVerificationScreenProps> = ({ navigation, route }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [verifyOtp, { isLoading: verifyingOtp }] = useTenantVerifyOtpMutation();
  const [resendOtp, { isLoading: resendingOtp }] = useTenantSendOtpMutation();

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

      console.log('OTP Verify - Full Result:', JSON.stringify(result, null, 2));
      // Response: CentralEnvelope -> ResponseUtilWrapper -> { tenant, pg, accessToken, refreshToken }
      const actualData = result.data?.data;
      console.log('OTP Verify - AccessToken:', actualData?.accessToken ? 'present' : 'missing');
      console.log('OTP Verify - Token value:', actualData?.accessToken);

      // Store tenant credentials in Redux
      dispatch(
        setTenantCredentials({
          tenant: actualData?.tenant,
          pg: actualData?.pg,
          accessToken: actualData?.accessToken,
          refreshToken: actualData?.refreshToken,
        })
      );

      console.log('OTP Verify - Credentials dispatched to Redux');
      console.log('OTP Verify - Token should now be in memory (not persisted due to blacklist)');

      showSuccessAlert('Login successful!');

      // Navigate to Tenant Dashboard
      setTimeout(() => {
        const nav = navigationRef.current;
        if (nav && typeof nav.navigate === 'function') {
          nav.navigate('TenantDashboard' as never);
        }
      }, 0);
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
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
            }}
          >
            <Text
              style={{
                fontSize: Theme.typography.fontSize.xl,
                fontWeight: Theme.typography.fontWeight.bold,
                color: Theme.colors.text.primary,
                marginBottom: Theme.spacing.sm,
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
                marginBottom: Theme.spacing.sm,
              }}
            >
              We sent a 4-digit code to
            </Text>

            <View
              style={{
                alignSelf: 'center',
                paddingVertical: Theme.spacing.xs,
                paddingHorizontal: Theme.spacing.md,
                borderRadius: 999,
                backgroundColor: Theme.withOpacity(Theme.colors.text.primary, 0.06),
                borderWidth: 1,
                borderColor: Theme.withOpacity(Theme.colors.border, 0.25),
                marginBottom: Theme.spacing.lg,
              }}
            >
              <Text
                style={{
                  color: Theme.colors.text.primary,
                  fontWeight: Theme.typography.fontWeight.semibold,
                  textAlign: 'center',
                }}
              >
                {phone}
              </Text>
            </View>

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
