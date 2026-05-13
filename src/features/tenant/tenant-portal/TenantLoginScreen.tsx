import React, { useEffect, useState } from 'react';
import { View, Text, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, TouchableOpacity, Image, ScrollView } from 'react-native';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useTenantSendOtpMutation } from '@/services/api/tenantPortalAuthApi';
import Theme from '@/theme';
import { Card } from '@/components/Card';
import { CountryPhoneSelector } from '@/components/CountryPhoneSelector';
import { Button } from '@/components/Button';

interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  phoneLength: number;
}

interface TenantLoginScreenProps {
  navigation: any;
}

export const TenantLoginScreen: React.FC<TenantLoginScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    phoneLength: 10,
  });
  const [sendOtp, { isLoading: sendingOtp }] = useTenantSendOtpMutation();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

      // Navigate to OTP verification screen
      navigation.navigate('TenantOTPVerification', { phone: fullPhone });
    } catch (err: any) {
      showErrorAlert(err, 'OTP Error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.background.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: Theme.spacing.lg,
          }}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: keyboardVisible ? Theme.spacing.md : Theme.spacing.xl }}>
            <Image
              source={require('../../../../assets/splash-logo.png')}
              resizeMode="contain"
              style={{ width: 110, height: 110 }}
            />
          </View>

          {/* Title */}
          <View style={{ alignItems: 'center', marginBottom: Theme.spacing.lg }}>
            <Text style={{
              fontSize: Theme.typography.fontSize.xl,
              fontWeight: Theme.typography.fontWeight.bold,
              color: Theme.colors.text.primary,
            }}>
              Tenant Portal
            </Text>
            <Text style={{
              fontSize: Theme.typography.fontSize.sm,
              color: Theme.colors.text.secondary,
              marginTop: Theme.spacing.xs,
            }}>
              Login to view your PG details
            </Text>
          </View>

          <Card className="mb-6 shadow-none">
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
              <Text style={{ fontSize: 12, color: Theme.colors.danger, marginBottom: 12, marginLeft: 4 }}>
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

            <Text style={{
              fontSize: Theme.typography.fontSize.sm,
              color: Theme.colors.text.secondary,
              textAlign: 'center',
              marginTop: Theme.spacing.md,
            }}>
              You will receive a 4-digit OTP on your registered phone number
            </Text>
          </Card>

          {/* Back to Role Selection */}
          <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RoleSelection')}
              style={{
                paddingVertical: Theme.spacing.sm,
                paddingHorizontal: Theme.spacing.md,
              }}
            >
              <Text style={{
                fontSize: Theme.typography.fontSize.sm,
                color: Theme.colors.text.secondary,
                fontWeight: '500',
              }}>
                ← Back to Welcome
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
