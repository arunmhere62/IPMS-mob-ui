import React, { useEffect, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { Theme } from '../../theme';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { OTPInput } from '../../components/OTPInput';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useSendSignupOtpMutation, useVerifySignupOtpMutation } from '../../services/api/authApi';

interface SignupOtpScreenProps {
  navigation: any;
  route: any;
}

export const SignupOtpScreen: React.FC<SignupOtpScreenProps> = ({ navigation, route }) => {
  const phone = String(route?.params?.phone || '');
  const [otp, setOtp] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [sendSignupOtp, { isLoading: resendingOtp }] = useSendSignupOtpMutation();
  const [verifySignupOtp, { isLoading: verifyingOtp }] = useVerifySignupOtpMutation();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 4) {
      showErrorAlert('Please enter valid 4-digit OTP', 'OTP Error');
      return;
    }

    try {
      await verifySignupOtp({ phone, otp: otp.trim() }).unwrap();
      showSuccessAlert('Phone number verified successfully');
      navigation.navigate('Signup', { verifiedPhone: phone });
    } catch (error: unknown) {
      showErrorAlert(error, 'Failed to verify OTP');
    }
  };

  const handleResend = async () => {
    try {
      await sendSignupOtp({ phone }).unwrap();
      setOtp('');
      showSuccessAlert('OTP resent to your phone number');
    } catch (error: unknown) {
      showErrorAlert(error, 'Failed to resend OTP');
    }
  };

  return (
    <ScreenLayout contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        title="Verify Phone Number"
        subtitle={phone ? `Enter the 4-digit OTP sent to ${phone}` : 'Enter the 4-digit OTP sent to your phone'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: keyboardVisible ? 'flex-start' : 'center',
            padding: Theme.spacing.lg,
            paddingBottom: Theme.spacing.xxxl,
          }}
          style={{ backgroundColor: CONTENT_COLOR }}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="shadow-none">
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, textAlign: 'center' }}>
              Enter verification code
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                color: Theme.colors.text.secondary,
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              {phone ? `Phone: ${phone}` : 'Enter OTP'}
            </Text>

            <OTPInput
              length={4}
              value={otp}
              onChangeText={(text) => setOtp(text)}
              error={false}
              autoFocus
            />

            <View style={{ marginTop: 22 }}>
              <Button
                title="Verify OTP"
                onPress={handleVerifyOtp}
                loading={verifyingOtp}
                variant="primary"
                size="md"
              />
            </View>

            <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                Didn't receive OTP?{' '}
                <Text
                  style={{ color: Theme.colors.primary, fontWeight: '600' }}
                  onPress={resendingOtp ? undefined : handleResend}
                >
                  Resend
                </Text>
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};
