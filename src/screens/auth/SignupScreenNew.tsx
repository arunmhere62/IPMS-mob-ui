import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { OTPInput } from '../../components/OTPInput';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { CONTENT_COLOR } from '@/constant';
import { useGetCountriesQuery } from '../../services/api/locationApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useSendSignupOtpMutation, useSignupMutation, useVerifySignupOtpMutation } from '../../services/api/authApi';
import {
  type RequiredLegalDocument,
  useAcceptLegalDocumentMutation,
  useLazyGetRequiredLegalDocumentsStatusQuery,
} from '../../services/api/legalDocumentsApi';

interface FormData {
  organizationName: string;
  name: string;
  phone: string;
  pgName: string;
  countryCode: string;
  rentCycleType: 'CALENDAR' | 'MIDMONTH';
  rentCycleStart: number | null;
  rentCycleEnd: number | null;
}

interface Country {
  s_no: number;
  name: string;
  iso_code: string;
}

export const SignupScreenNew: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [requiredLegalDocs, setRequiredLegalDocs] = useState<RequiredLegalDocument[]>([]);
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    name: '',
    phone: '',
    pgName: '',
    countryCode: 'IN',
    rentCycleType: 'CALENDAR',
    rentCycleStart: 1,
    rentCycleEnd: 30,
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    phoneLength: 10,
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [fullPhone, setFullPhone] = useState('');


  const { data: countriesResponse } = useGetCountriesQuery();
  const [sendSignupOtp] = useSendSignupOtpMutation();
  const [verifySignupOtp] = useVerifySignupOtpMutation();
  const [signup] = useSignupMutation();
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery();
  const [acceptLegalDocument] = useAcceptLegalDocumentMutation();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (countriesResponse?.success) {
      setCountries((countriesResponse as any).data || []);
    }
  }, []);

  useEffect(() => {
    if (countriesResponse?.success) {
      setCountries((countriesResponse as any).data || []);
    }
  }, [countriesResponse]);

  useEffect(() => {
    (async () => {
      try {
        const status = await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap();
        const pending = (status?.pending ?? []) as RequiredLegalDocument[];
        setRequiredLegalDocs(Array.isArray(pending) ? pending : []);
      } catch {
        setRequiredLegalDocs([]);
      }
    })();
  }, [getRequiredLegalStatus]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prevFormData => ({ ...prevFormData, [field]: value }));
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

  const validateForm = () => {
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!phoneVerified) {
      Alert.alert('Error', 'Please verify your phone number first');
      return false;
    }
    if (!formData.pgName.trim()) {
      Alert.alert('Error', 'Please enter PG name');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (formData.rentCycleType === 'CALENDAR' && !formData.rentCycleEnd) {
      Alert.alert('Error', 'Please enter rent cycle end day');
      return false;
    }
    if (!hasAgreedToLegal) {
      Alert.alert('Error', 'Please agree to the Terms & Conditions and Privacy Policy');
      return false;
    }
    return true;
  };

  const findLegalDocUrl = (types: string | string[]) => {
    const candidates = (Array.isArray(types) ? types : [types])
      .map((t) => String(t || '').toUpperCase())
      .filter(Boolean);

    const doc = (requiredLegalDocs || []).find((d: any) => {
      const dt = String(d?.type || '').toUpperCase();
      return candidates.includes(dt);
    });
    return doc?.url || (doc as any)?.content_url;
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

  const openLegalDocByType = async (types: string | string[], fallbackTitle: string) => {
    const url = findLegalDocUrl(types);
    if (!url) {
      Alert.alert('Info', `${fallbackTitle} link is not available right now.`);
      return;
    }
    (navigation as any).navigate('LegalWebView', { title: fallbackTitle, url: addEmbedParam(url) });
  };

  const handleSendOtp = async () => {
    if (!validatePhone(formData.phone.trim())) {
      return;
    }

    setLoading(true);
    try {
      const phoneWithCode = selectedCountry.phoneCode + formData.phone.trim();
      setFullPhone(phoneWithCode);

      await sendSignupOtp({ phone: phoneWithCode }).unwrap();
      setShowOtpVerification(true);
      showSuccessAlert('OTP sent to your phone number');
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      showErrorAlert(error, 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 4) {
      Alert.alert('Error', 'Please enter valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtp({ phone: fullPhone, otp }).unwrap();
      setPhoneVerified(true);
      setShowOtpVerification(false);
      setOtp('');
      showSuccessAlert('Phone number verified successfully');
    } catch (error: any) {
      console.error('❌ Verify OTP error:', error);
      showErrorAlert(error, 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const pgName = formData.pgName.trim();
      const signupData: any = {
        organizationName: pgName,
        name: formData.name.trim(),
        pgName,
        rentCycleType: formData.rentCycleType,
        rentCycleStart: formData.rentCycleStart,
        rentCycleEnd: formData.rentCycleEnd,
      };

      if (formData.phone.trim()) {
        signupData.phone = selectedCountry.phoneCode + formData.phone.trim();
      }
      console.log('📤 Sending signup data:', signupData);

      const status = await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap();
      const docsToAccept = ((status as any)?.required ?? (status?.pending ?? [])) as RequiredLegalDocument[];

      const signupResult: any = await signup(signupData).unwrap();
      const rawUserId = signupResult?.userId ?? signupResult?.user_id ?? signupResult?.s_no;
      const userId = Number(rawUserId);

      if (docsToAccept?.length) {
        if (!Number.isFinite(userId) || userId <= 0) {
          throw new Error('Signup succeeded but user id was not returned');
        }

        for (const doc of docsToAccept) {
          const s_no = Number((doc as any).s_no);
          if (!Number.isFinite(s_no) || s_no <= 0) continue;
          await acceptLegalDocument({ s_no, acceptance_context: 'SIGNUP', user_id: userId }).unwrap();
        }
      }

      showSuccessAlert(signupResult, {
        onOk: () => {
          (navigation as any).navigate('Login');
        },
      });
    } catch (error: any) {
      showErrorAlert(error, 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneVerification = () => (
    phoneVerified ? null :
    <View>
      <CountryPhoneSelector
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        size="large"
        phoneValue={formData.phone}
        onPhoneChange={(text) => {
          updateFormData('phone', text);
          setPhoneVerified(false);
          setPhoneError('');
        }}
      />

      {phoneError && (
        <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, marginLeft: 4 }}>
          {phoneError}
        </Text>
      )}

      <Button
        title="Send OTP"
        onPress={handleSendOtp}
        loading={loading}
        variant="primary"
        size="md"
      />

      <Text
        className="mt-6"
        style={{
          fontSize: Theme.typography.fontSize.sm,
          color: Theme.colors.text.secondary,
          textAlign: 'center',
          marginBottom: Theme.spacing.md,
        }}
      >
        You will receive a 4-digit OTP on your phone number
      </Text>
    </View>
  );

  const renderOnboardingAfterOtp = () => {
    if (!phoneVerified) return null;

    return (
      <View>
        <View
          style={{
            backgroundColor: '#D1FAE5',
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: '#6EE7B7',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
            Signup successful
          </Text>
          <Text style={{ color: '#065F46', fontSize: 12 }}>
            Now create your PG setup to continue using the app.
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Setup your PG <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
            Almost done. Just a few details to create your account.
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            PG Name <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
            This will also be used as your organization name for now. You can rename it later.
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              fontSize: 14,
              color: Theme.colors.text.primary,
            }}
            placeholder="e.g., Green Valley PG"
            placeholderTextColor="#9CA3AF"
            value={formData.pgName}
            onChangeText={(text) => updateFormData('pgName', text)}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Your Full Name <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              fontSize: 14,
              color: Theme.colors.text.primary,
            }}
            placeholder="e.g., John Doe"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Rent Cycle Type <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 10 }}>
            Rent cycle = from which date to which date you count “1 month rent”.
            Pick the style your PG follows.
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              backgroundColor: formData.rentCycleType === 'CALENDAR' ? '#EFF6FF' : 'white',
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              borderWidth: 2,
              borderColor: formData.rentCycleType === 'CALENDAR' ? Theme.colors.primary : '#E5E7EB',
            }}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                rentCycleType: 'CALENDAR',
                rentCycleStart: 1,
                rentCycleEnd: 30,
              }));
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
              Calendar Month (Most common)
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
              Easy option: rent is counted from the 1st to the last day of the month.
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 6 }}>
              Example:
              Jan cycle = 1 Jan → 31 Jan
              Feb cycle = 1 Feb → 28 Feb
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 6 }}>
              Choose this if you collect rent for “full calendar month”.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              backgroundColor: formData.rentCycleType === 'MIDMONTH' ? '#EFF6FF' : 'white',
              borderRadius: 8,
              padding: 12,
              borderWidth: 2,
              borderColor: formData.rentCycleType === 'MIDMONTH' ? Theme.colors.primary : '#E5E7EB',
            }}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                rentCycleType: 'MIDMONTH',
                rentCycleStart: 1,
                rentCycleEnd: 30,
              }));
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
              Mid‑Month / Check‑in based
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
              Rent month starts from tenant check‑in date.
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 6 }}>
              Example:
              If tenant checks in on 10th:
              Rent cycle = 10th → 9th next month
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 6 }}>
              Another example: check‑in on 23rd means cycle is 23rd → 22nd.
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 6 }}>
              Choose this if you charge rent based on the day they join.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'flex-start' }}
            onPress={() => setHasAgreedToLegal((v) => !v)}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: hasAgreedToLegal ? Theme.colors.primary : '#D1D5DB',
                backgroundColor: hasAgreedToLegal ? Theme.colors.primary : 'white',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {hasAgreedToLegal ? <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
            </View>

            <Text style={{ flex: 1, marginLeft: 10, fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 18 }}>
              I agree to the{' '}
              <Text
                style={{ color: Theme.colors.primary, fontWeight: '700' }}
                onPress={() => openLegalDocByType('TERMS_AND_CONDITIONS', 'Terms & Conditions')}
              >
                Terms & Conditions
              </Text>
              {' '}and{' '}
              <Text
                style={{ color: Theme.colors.primary, fontWeight: '700' }}
                onPress={() => openLegalDocByType('PRIVACY_POLICY', 'Privacy Policy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24 }}>
          <Button
            title={'Create Account'}
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            size="md"
          />
        </View>
      </View>
    );
  };

  // OTP Verification Modal Content
  const otpModalContent = (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 16, textAlign: 'center' }}>
        Phone: {fullPhone}
      </Text>

      <OTPInput
        length={4}
        value={otp}
        onChangeText={(text) => {
          setOtp(text);
        }}
        error={false}
      />

      <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, textAlign: 'center' }}>
          Didn't receive OTP?{' '}
          <Text
            style={{ color: Theme.colors.primary, fontWeight: '600' }}
            onPress={handleSendOtp}
          >
            Resend
          </Text>
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout contentBackgroundColor={CONTENT_COLOR}>
      {phoneVerified ? (
        <ScreenHeader
          title={'Setup your PG'}
          subtitle={'Complete setup to continue using the app'}
          showBackButton={true}
          onBackPress={() => setPhoneVerified(false)}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: phoneVerified ? CONTENT_COLOR : Theme.colors.background.primary }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: phoneVerified ? 'flex-start' : 'center',
              padding: Theme.spacing.lg,
            }}
          >
            {!phoneVerified ? (
              <View style={{ alignItems: 'center', marginBottom: keyboardVisible ? Theme.spacing.md : Theme.spacing.xl }}>
                <Image
                  source={require('../../../assets/splash-logo.png')}
                  resizeMode="contain"
                  style={{ width: 110, height: 110 }}
                />
              </View>
            ) : null}

            <Card className="mb-6 shadow-none">
              {renderPhoneVerification()}
              {renderOnboardingAfterOtp()}
            </Card>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* OTP Verification Modal */}
        <SlideBottomModal
          visible={showOtpVerification}
          onClose={() => setShowOtpVerification(false)}
          title="Verify Phone Number"
          subtitle="Enter the 4-digit OTP sent to your phone"
          children={otpModalContent}
          onSubmit={handleVerifyOtp}
          submitLabel="Verify OTP"
          cancelLabel="Cancel"
          isLoading={loading}
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};
