import React, { useEffect, useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image, ScrollView, Alert } from 'react-native';
import { Theme } from '../../../theme';
import { useSendOtpMutation } from '../api/authApi';
import { useLazyGetRequiredLegalDocumentsStatusQuery } from '../../owner/api/legalDocumentsApi';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CountryPhoneSelector } from '../../../components/CountryPhoneSelector';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    phoneLength: 10 });
  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    // Fetch legal documents on mount
    fetchLegalDocuments();

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchLegalDocuments = async () => {
    try {
      const res = await getRequiredLegalStatus({ context: 'LOGIN' }).unwrap();
      const docs = (res as any)?.required || [];
      setLegalDocs(docs);
    } catch (error) {
      console.error('Failed to fetch legal documents:', error);
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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: Theme.spacing.lg }}
        >
          <View style={{ alignItems: 'center', marginBottom: keyboardVisible ? Theme.spacing.md : Theme.spacing.xl }}>
            <Image
              source={require('../../../../assets/splash-logo.png')}
              resizeMode="contain"
              style={{ width: 110, height: 110, borderRadius: 22 }}
            />
          </View>
          <Card className="mb-6 shadow-none">
            {/* Title */}
            <View style={{ alignItems: 'center', marginBottom: Theme.spacing.lg }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: Theme.colors.primary,
                marginBottom: Theme.spacing.xs }}>
                🛡️ PG Owner Login
              </Text>
              <Text style={{
                fontSize: Theme.typography.fontSize.sm,
                color: Theme.colors.text.secondary }}>
                Manage your PG properties
              </Text>
            </View>

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

            <Text style={{
              fontSize: Theme.typography.fontSize.sm,
              color: Theme.colors.text.secondary,
              textAlign: 'center',
              marginTop: Theme.spacing.md,
              marginBottom: Theme.spacing.md }}>
              You will receive an OTP on your registered phone number
            </Text>

            <View style={{ marginTop: Theme.spacing.lg }}>
              <Button
                title="Sign Up"
                onPress={() => navigation.navigate('Signup')}
                variant="outline"
                size='md'
              />
            </View>
          </Card>

          {/* Legal Links */}
          <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 8 }}>
              By continuing, you agree to our
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AnimatedPressableCard onPress={() => handleOpenLegal(['TERMS_OF_SERVICE', 'TERMS_AND_CONDITIONS'], 'Terms & Conditions')}>
                <Text style={{ fontSize: 12, color: Theme.colors.primary, textDecorationLine: 'underline' }}>
                  Terms & Conditions
                </Text>
              </AnimatedPressableCard>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>and</Text>
              <AnimatedPressableCard onPress={() => handleOpenLegal(['PRIVACY_POLICY'], 'Privacy Policy')}>
                <Text style={{ fontSize: 12, color: Theme.colors.primary, textDecorationLine: 'underline' }}>
                  Privacy Policy
                </Text>
              </AnimatedPressableCard>
            </View>
          </View>

          {/* Back to Role Selection */}
          <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
            <AnimatedPressableCard
              onPress={() => navigation.navigate('RoleSelection')}
              style={{
                paddingVertical: Theme.spacing.sm,
                paddingHorizontal: Theme.spacing.md }}
            >
              <Text style={{
                fontSize: Theme.typography.fontSize.sm,
                color: Theme.colors.text.secondary,
                fontWeight: '500' }}>
                ← Back to Welcome
              </Text>
            </AnimatedPressableCard>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  function handleOpenLegal(types: string[], fallbackTitle: string) {
    const doc = legalDocs.find((d: any) => types.includes(String(d?.type || '').toUpperCase()));
    const url = doc?.url;
    if (!url) {
      Alert.alert('Info', `${fallbackTitle} is not available right now.`);
      return;
    }
    const embedUrl = addEmbedParam(String(url));
    navigation.navigate('LegalWebView', { title: fallbackTitle, url: embedUrl });
  }

  function addEmbedParam(rawUrl: string) {
    try {
      const u = new URL(rawUrl);
      u.searchParams.set('embed', '1');
      return u.toString();
    } catch {
      return rawUrl;
    }
  }
};
