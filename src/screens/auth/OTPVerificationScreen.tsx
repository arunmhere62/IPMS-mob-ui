import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Theme } from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, resendOtp } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { OTPInput } from '../../components/OTPInput';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import notificationService from '../../services/notifications/notificationService';
import { FEATURES } from '../../config/env.config';
import { CONTENT_COLOR } from '@/constant';

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
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

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
      const result = await dispatch(verifyOtp({ phone, otp })).unwrap();
      
      // Initialize notification service after successful login
      if (result.user && result.user.s_no && FEATURES.PUSH_NOTIFICATIONS_ENABLED) {
        try {
          await notificationService.initialize(result.user.s_no);
          console.log('✅ Notification service initialized');
        } catch (notifError) {
          console.warn('⚠️ Failed to initialize notifications:', notifError);
          // Don't block login if notification setup fails
        }
      } else if (!FEATURES.PUSH_NOTIFICATIONS_ENABLED) {
        console.log('ℹ️ Push notifications are disabled in development mode');
      }
      
      Alert.alert('Success', 'Login successful!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (err: any) {
      Alert.alert('Error', err || 'Invalid OTP');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      await dispatch(resendOtp(phone)).unwrap();
      Alert.alert('Success', 'OTP resent successfully');
      setResendTimer(60);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to resend OTP');
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
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center', 
          padding: Theme.spacing.lg,
          paddingBottom: Theme.spacing.xxxl 
        }}
        style={{ backgroundColor: CONTENT_COLOR }}
      >
        <Card style={{ padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg }}>
          <Text style={{
            fontSize: Theme.typography.fontSize.base,
            fontWeight: Theme.typography.fontWeight.semibold,
            color: Theme.colors.text.primary,
            marginBottom: Theme.spacing.md,
            textAlign: 'center',
          }}>
            Enter OTP
          </Text>

          <OTPInput
            length={4}
            value={otp}
            onChangeText={(text: string) => {
              setOtp(text);
              setOtpError('');
            }}
            error={!!otpError}
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
              loading={loading}
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
                  Resend OTP
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: Theme.colors.text.secondary }}>
                Resend OTP in {resendTimer}s
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
    </ScreenLayout>
  );
};
