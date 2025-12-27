import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { type RequiredLegalDocument, useLazyGetRequiredLegalDocumentsStatusQuery } from '../../services/api/legalDocumentsApi';

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
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false);
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

  const validateForm = () => {
    if (!formData.organizationName.trim()) {
      Alert.alert('Error', 'Please enter organization name');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
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

  const openLegalDocByType = async (types: string | string[], fallbackTitle: string) => {
    const url = findLegalDocUrl(types);
    if (!url) {
      Alert.alert('Info', `${fallbackTitle} link is not available right now.`);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', `Unable to open ${fallbackTitle}`);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
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
      const signupData: any = {
        organizationName: formData.organizationName.trim(),
        name: formData.name.trim(),
        pgName: formData.pgName.trim(),
        rentCycleType: formData.rentCycleType,
        rentCycleStart: formData.rentCycleStart,
        rentCycleEnd: formData.rentCycleEnd,
      };

      if (formData.phone.trim()) {
        signupData.phone = selectedCountry.phoneCode + formData.phone.trim();
      }
      console.log('📤 Sending signup data:', signupData);

      const status = await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap();
      if (status?.pending?.length) {
        (navigation as any).navigate('LegalDocuments', {
          context: 'SIGNUP',
          pending: status.pending,
          signupData,
        });
        return;
      }

      const response = await signup(signupData).unwrap();
      showSuccessAlert(response, {
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

  const renderStep1 = () => (
    <View>
      {/* Organization Name */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Organization Name <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
         Enter your organization name. You can add and manage multiple PGs under a single organization.
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
          placeholder="Enter your organization name"
          placeholderTextColor="#9CA3AF"
          value={formData.organizationName}
          onChangeText={(text) => updateFormData('organizationName', text)}
        />
      </View>
      {/* PG Name */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          PG Name <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Name of your first PG under this organization (you can add more PGs later)
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
          placeholder="e.g., Green Valley PG, Comfort Homes"
          placeholderTextColor="#9CA3AF"
          value={formData.pgName}
          onChangeText={(text) => updateFormData('pgName', text)}
        />
      </View>

      {/* Your Name */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Your Full Name <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Your first and last name
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

      {/* Phone Number with Country Selector */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Phone Number <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Mobile number with country code for OTP verification
        </Text>
        <CountryPhoneSelector
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          size="medium"
          phoneValue={formData.phone}
          onPhoneChange={(text) => {
            updateFormData('phone', text);
            setPhoneVerified(false);
          }}
        />

        {formData.phone.trim() && !phoneVerified && (
          <TouchableOpacity
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 8,
              paddingVertical: 10,
              marginTop: 8,
              alignItems: 'center',
            }}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              {loading ? 'Sending OTP...' : 'Verify Phone Number'}
            </Text>
          </TouchableOpacity>
        )}

        {phoneVerified && (
          <View
            style={{
              backgroundColor: '#D1FAE5',
              borderRadius: 8,
              paddingVertical: 10,
              marginTop: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#6EE7B7',
            }}
          >
            <Text style={{ color: '#059669', fontWeight: '600', fontSize: 14 }}>
              ✓ Phone Verified
            </Text>
          </View>
        )}
      </View>


      {/* Rent Cycle Type Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Rent Cycle Type <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 12 }}>
          Select how your PG's rent cycle works. This determines when rent is due each month.
        </Text>

        {/* Calendar Month Cycle Option */}
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
            console.log('📅 Calendar pressed, current type:', formData.rentCycleType);
            setFormData(prev => ({
              ...prev,
              rentCycleType: 'CALENDAR',
              rentCycleStart: 1,
              rentCycleEnd: 30,
            }));
            console.log('📅 Calendar state updated');
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
            📅 Calendar Month Cycle (Most Common)
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 6 }}>
            Rent Period: 1st to 30th/31st of every month
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            Example: Jan 1 - Jan 31, Feb 1 - Feb 28, etc. Rent due on 1st of next month.
          </Text>
        </TouchableOpacity>

        {/* Mid-Month Cycle Option */}
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
            console.log('🔄 MIDMONTH pressed, current type:', formData.rentCycleType);
            setFormData(prev => ({
              ...prev,
              rentCycleType: 'MIDMONTH',
              rentCycleStart: 1,
              rentCycleEnd: 30,
            }));
            console.log('🔄 MIDMONTH state updated');
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
            🔄 Custom Cycle (Mid-Month)
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 6 }}>
            Rent Period: Custom dates (e.g., 10th to 9th of next month)
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary }}>
            Example: If tenant checks in on 10th, rent cycle is 10th to 9th every month.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Fields Based on Rent Cycle Type */}
      {formData.rentCycleType === 'MIDMONTH' && (
        <View style={{ marginBottom: 16, backgroundColor: '#F0F9FF', borderLeftWidth: 4, borderLeftColor: Theme.colors.primary, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 8 }}>
            ℹ️ How Mid-Month Cycle Works
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 18, marginBottom: 8 }}>
            The rent cycle will be automatically set based on each tenant's check-in date.
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 18, marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>Example:</Text> If a tenant checks in on the 23rd, their rent cycle will be:
          </Text>
          <View style={{ backgroundColor: 'white', borderRadius: 6, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.primary, marginBottom: 4 }}>
              • <Text style={{ fontWeight: '600' }}>Start Date:</Text> 23rd of every month
            </Text>
            <Text style={{ fontSize: 11, color: Theme.colors.text.primary }}>
              • <Text style={{ fontWeight: '600' }}>End Date:</Text> 22nd of next month
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontStyle: 'italic' }}>
            No manual configuration needed - the system will handle this automatically for each tenant.
          </Text>
        </View>
      )}
    </View>
  );

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
      <ScreenHeader
        title={'Create Your Account'}
        subtitle={'Start completely free - no hidden charges!'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, backgroundColor: CONTENT_COLOR }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            {renderStep1()}

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
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </ScreenLayout>
  );
};
