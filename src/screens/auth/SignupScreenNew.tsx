import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { OTPInput } from '../../components/OTPInput';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { PasswordInput } from '../../components/PasswordInput';
import { OptionSelector } from '../../components/OptionSelector';
import { CONTENT_COLOR } from '@/constant';
import { useGetCitiesQuery, useGetCountriesQuery, useGetStatesQuery } from '../../services/api/locationApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useSendSignupOtpMutation, useSignupMutation, useVerifySignupOtpMutation } from '../../services/api/authApi';

interface FormData {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  pgName: string;
  pgAddress: string;
  pgPincode: string;
  countryCode: string;
  stateId: number | null;
  cityId: number | null;
  rentCycleType: 'CALENDAR' | 'MIDMONTH';
  rentCycleStart: number | null;
  rentCycleEnd: number | null;
  pgType: string;
}

interface Country {
  s_no: number;
  name: string;
  iso_code: string;
}

interface State {
  s_no: number;
  name: string;
  iso_code: string;
}

interface City {
  s_no: number;
  name: string;
}

export const SignupScreenNew: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pgName: '',
    pgAddress: '',
    pgPincode: '',
    countryCode: 'IN',
    stateId: null,
    cityId: null,
    rentCycleType: 'CALENDAR',
    rentCycleStart: 1,
    rentCycleEnd: 30,
    pgType: 'COLIVING',
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
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');

  const { data: statesResponse, isFetching: isStatesFetching } = useGetStatesQuery(
    { countryCode: formData.countryCode || 'IN' },
    { skip: !formData.countryCode }
  );

  const states = ((statesResponse as any)?.data || []) as State[];

  const { data: citiesResponse, isFetching: isCitiesFetching } = useGetCitiesQuery(
    { stateCode: selectedStateCode },
    { skip: !selectedStateCode }
  );

  const cities = ((citiesResponse as any)?.data || []) as City[];

  const { data: countriesResponse } = useGetCountriesQuery();
  const [sendSignupOtp] = useSendSignupOtpMutation();
  const [verifySignupOtp] = useVerifySignupOtpMutation();
  const [signup] = useSignupMutation();

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

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prevFormData => ({ ...prevFormData, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.organizationName.trim()) {
      Alert.alert('Error', 'Please enter organization name');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email');
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
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.pgName.trim()) {
      Alert.alert('Error', 'Please enter PG name');
      return false;
    }
    if (!formData.pgAddress.trim()) {
      Alert.alert('Error', 'Please enter PG address');
      return false;
    }
    if (!formData.stateId) {
      Alert.alert('Error', 'Please select a state');
      return false;
    }
    if (!formData.cityId) {
      Alert.alert('Error', 'Please select a city');
      return false;
    }
    if (formData.rentCycleType === 'CALENDAR' && !formData.rentCycleEnd) {
      Alert.alert('Error', 'Please enter rent cycle end day');
      return false;
    }
    if (!formData.pgType) {
      Alert.alert('Error', 'Please select PG type');
      return false;
    }
    return true;
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
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const signupData: any = {
        organizationName: formData.organizationName.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        pgName: formData.pgName.trim(),
        pgAddress: formData.pgAddress.trim(),
        stateId: Number(formData.stateId),
        cityId: Number(formData.cityId),
        rentCycleType: formData.rentCycleType,
        rentCycleStart: formData.rentCycleStart,
        rentCycleEnd: formData.rentCycleEnd,
        pgType: formData.pgType,
      };

      if (formData.phone.trim()) {
        signupData.phone = selectedCountry.phoneCode + formData.phone.trim();
      }
      if (formData.pgPincode.trim()) {
        signupData.pgPincode = formData.pgPincode.trim();
      }

      console.log('📤 Sending signup data:', signupData);

      await signup(signupData).unwrap();
      Alert.alert(
        'Success',
        'Account created successfully! Please wait for admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
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
          e.g., "ABC PG Management", "XYZ Housing"
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

      {/* Email Address */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Email Address <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          We'll use this for account recovery and notifications
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
          placeholder="e.g., john@example.com"
          placeholderTextColor="#9CA3AF"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
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

      {/* Password */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Minimum 6 characters (use mix of letters, numbers, symbols)
        </Text>
        <PasswordInput
          label="Password *"
          placeholder="Enter a strong password"
          value={formData.password}
          onChangeText={(text) => updateFormData('password', text)}
        />
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Re-enter your password to confirm
        </Text>
        <PasswordInput
          label="Confirm Password *"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData('confirmPassword', text)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => {
    // Check if step 1 is completed, if not redirect back to step 1
    if (!validateStep1()) {
      Alert.alert('Incomplete Information', 'Please complete all required fields in Step 1 before proceeding.');
      setCurrentStep(1);
      return null;
    }

    return (
    <View>
      {/* PG Name */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          PG Name <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Name of your paying guest accommodation
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

      {/* PG Type */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          PG Type <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Type of accommodation
        </Text>
        <OptionSelector
          label=""
          options={[
            { label: 'Co-living', value: 'COLIVING' },
            { label: 'Mens PG', value: 'MENS' },
            { label: 'Womens PG', value: 'WOMENS' },
          ]}
          selectedValue={formData.pgType || null}
          onSelect={(value) => updateFormData('pgType', value || '')}
          required={true}
        />
      </View>

      {/* Location (State & City) */}
      <View style={{ marginBottom: 16 }}>
        <SearchableDropdown
          label="State"
          placeholder="Select a state"
          items={states.map(state => ({
            id: state.s_no,
            label: state.name,
            value: state.iso_code,
          }))}
          selectedValue={formData.stateId}
          onSelect={(item) => {
            if (!item?.id) {
              updateFormData('stateId', null);
              updateFormData('cityId', null);
              setSelectedStateCode('');
              return;
            }
            updateFormData('stateId', item.id);
            updateFormData('cityId', null);
            setSelectedStateCode(item.value || '');
          }}
          loading={isStatesFetching}
          required={true}
        />

        {formData.stateId && (
          <SearchableDropdown
            label="City"
            placeholder="Select a city"
            items={cities.map(city => ({
              id: city.s_no,
              label: city.name,
              value: city.s_no,
            }))}
            selectedValue={formData.cityId}
            onSelect={(item) => updateFormData('cityId', item?.id || null)}
            loading={isCitiesFetching}
            disabled={!formData.stateId}
            required={true}
          />
        )}
      </View>

      {/* PG Address */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Complete Address <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Street address, building name, area (e.g., "123 Main St, Apt 4, Downtown")
        </Text>
        <TextInput
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 12,
            marginBottom: 0,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            fontSize: 14,
            color: Theme.colors.text.primary,
            minHeight: 80,
          }}
          placeholder="Enter your complete address"
          placeholderTextColor="#9CA3AF"
          value={formData.pgAddress}
          onChangeText={(text) => updateFormData('pgAddress', text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Pincode */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Postal Code <Text style={{ color: '#9CA3AF' }}>(Optional)</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          6-digit postal/zip code of your location
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
          placeholder="e.g., 560001"
          placeholderTextColor="#9CA3AF"
          value={formData.pgPincode}
          onChangeText={(text) => updateFormData('pgPincode', text)}
          keyboardType="numeric"
          maxLength={6}
        />
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
      <ScreenHeader
        title={currentStep === 1 ? 'Create Your Account' : 'Setup Your PG'}
        subtitle={currentStep === 1 ? 'Start completely free - no hidden charges!' : 'Tell us about your PG location'}
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

        {/* Step Indicator */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setCurrentStep(1)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: currentStep >= 1 ? Theme.colors.primary : '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: currentStep === 1 ? 3 : 0,
                borderColor: currentStep === 1 ? Theme.colors.primary : 'transparent',
                shadowColor: currentStep === 1 ? Theme.colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: currentStep === 1 ? 4 : 0,
              }}
            >
              <Text style={{ color: currentStep >= 1 ? 'white' : Theme.colors.text.secondary, fontWeight: 'bold', fontSize: 16 }}>
                {currentStep > 1 ? '✓' : '1'}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                height: 3,
                backgroundColor: currentStep >= 2 ? Theme.colors.primary : '#E5E7EB',
                marginHorizontal: 8,
                borderRadius: 2,
              }}
            />
            <TouchableOpacity
              onPress={() => setCurrentStep(2)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: currentStep >= 2 ? Theme.colors.primary : '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: currentStep === 2 ? 3 : 0,
                borderColor: currentStep === 2 ? Theme.colors.primary : 'transparent',
                shadowColor: currentStep === 2 ? Theme.colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: currentStep === 2 ? 4 : 0,
              }}
            >
              <Text style={{ color: currentStep >= 2 ? 'white' : Theme.colors.text.secondary, fontWeight: 'bold', fontSize: 16 }}>
                2
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: currentStep === 1 ? '600' : '400',
              color: currentStep === 1 ? Theme.colors.primary : Theme.colors.text.secondary 
            }}>
              Account Details
            </Text>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: currentStep === 2 ? '600' : '400',
              color: currentStep === 2 ? Theme.colors.primary : Theme.colors.text.secondary 
            }}>
              PG Information
            </Text>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={{
          backgroundColor: '#F0F9FF',
          borderLeftWidth: 4,
          borderLeftColor: Theme.colors.primary,
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: Theme.colors.text.primary,
            marginBottom: 4,
          }}>
            🎉 Quick & Easy Setup
          </Text>
          <Text style={{
            fontSize: 13,
            color: Theme.colors.text.secondary,
            lineHeight: 18,
          }}>
            {currentStep === 1 
              ? 'Create your account in just 2 simple steps. Start completely free - no hidden charges!'
              : 'Almost done! Just tell us about your PG location and you\'re ready to go.'
            }
          </Text>
        </View>

        {/* Form Content */}
        <Card>
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </Card>

        {/* Buttons */}
        <View style={{ marginTop: 24, gap: 12 }}>
          {currentStep === 2 && (
            <Button
              title="Back"
              onPress={() => setCurrentStep(1)}
              variant="secondary"
              size="md"
            />
          )}
          <Button
            title={currentStep === 1 ? 'Next' : 'Create Account'}
            onPress={() => {
              if (currentStep === 1) {
                if (validateStep1()) {
                  setCurrentStep(2);
                }
              } else {
                handleSubmit();
              }
            }}
            loading={loading}
            variant="primary"
            size="md"
          />
        </View>
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
