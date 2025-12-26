import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { OTPInput } from '../../components/OTPInput';
import {
  useLazyGetCitiesQuery,
  useLazyGetCountriesQuery,
  useLazyGetStatesQuery,
} from '../../services/api/locationApi';
import { useSendSignupOtpMutation, useSignupMutation, useVerifySignupOtpMutation } from '../../services/api/authApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface SignupModalProps {
  visible: boolean;
  onClose: () => void;
}

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

export const SignupModal: React.FC<SignupModalProps> = ({ visible, onClose }) => {
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
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
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

  const [fetchCountriesTrigger] = useLazyGetCountriesQuery();
  const [fetchStatesTrigger] = useLazyGetStatesQuery();
  const [fetchCitiesTrigger] = useLazyGetCitiesQuery();

  const [sendSignupOtp] = useSendSignupOtpMutation();
  const [verifySignupOtp] = useVerifySignupOtpMutation();
  const [signup] = useSignupMutation();

  useEffect(() => {
    if (visible) {
      fetchCountries();
      // Fetch states for default country (India)
      fetchStates('IN');
    }
  }, [visible]);

  useEffect(() => {
    if (formData.countryCode && formData.countryCode !== 'IN') {
      fetchStates(formData.countryCode);
    }
  }, [formData.countryCode]);

  const fetchCountries = async () => {
    try {
      const response = await fetchCountriesTrigger().unwrap();
      if (response?.success) {
        const items = (response as any)?.data;
        setCountries(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  const fetchStates = async (countryCode: string) => {
    setLoadingStates(true);
    try {
      const response = await fetchStatesTrigger({ countryCode }).unwrap();
      if (response?.success) {
        const items = (response as any)?.data;
        setStates(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await fetchCitiesTrigger({ stateCode }).unwrap();
      if (response?.success) {
        const items = (response as any)?.data;
        setCities(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStateChange = (stateId: number) => {
    const selectedState = states.find(s => s.s_no === stateId);
    if (selectedState) {
      setFormData({ ...formData, stateId, cityId: null });
      setCities([]);
      fetchCities(selectedState.iso_code);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
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
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      showErrorAlert(error, 'OTP Error');
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
      showErrorAlert(error, 'OTP Error');
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
      };

      if (formData.phone.trim()) {
        // Send phone with country code
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
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('Error response:', error.response?.data);

      let errorMessage = 'Failed to create account';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: currentStep >= 1 ? Theme.colors.primary : Theme.colors.light,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: currentStep >= 1 ? 'white' : Theme.colors.text.secondary, fontWeight: 'bold' }}>
            1
          </Text>
        </View>
        <View
          style={{
            width: 60,
            height: 2,
            backgroundColor: currentStep >= 2 ? Theme.colors.primary : Theme.colors.light,
          }}
        />
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: currentStep >= 2 ? Theme.colors.primary : Theme.colors.light,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: currentStep >= 2 ? 'white' : Theme.colors.text.secondary, fontWeight: 'bold' }}>
            2
          </Text>
        </View>
      </View>
    </View>
  );

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
            setPhoneVerified(false); // Reset verification when phone changes
          }}
        />
        
        {/* Verify Phone Button */}
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

        {/* Phone Verified Badge */}
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
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Password <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Minimum 6 characters (use mix of letters, numbers, symbols)
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
          placeholder="Enter a strong password"
          placeholderTextColor="#9CA3AF"
          value={formData.password}
          onChangeText={(text) => updateFormData('password', text)}
          secureTextEntry
        />
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          Confirm Password <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Re-enter your password to confirm
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
          placeholder="Re-enter your password"
          placeholderTextColor="#9CA3AF"
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData('confirmPassword', text)}
          secureTextEntry
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
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

      {/* State Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          State <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
          Select your state from the list
        </Text>
        <SearchableDropdown
          label=""
          placeholder="Search and select state"
          items={Array.isArray(states) ? states.map(state => ({
            id: state.s_no,
            label: state.name,
            value: state.iso_code,
          })) : []}
          selectedValue={formData.stateId}
          onSelect={(item) => handleStateChange(item.id)}
          loading={loadingStates}
        />
      </View>

      {/* City Selection */}
      {formData.stateId && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            City <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 8 }}>
            Select your city from the list
          </Text>
          <SearchableDropdown
            label=""
            placeholder="Search and select city"
            items={Array.isArray(cities) ? cities.map(city => ({
              id: city.s_no,
              label: city.name,
              value: city.s_no,
            })) : []}
            selectedValue={formData.cityId}
            onSelect={(item) => updateFormData('cityId', item.id)}
            loading={loadingCities}
          />
        </View>
      )}

      {/* Pincode */}
      <View style={{ marginBottom: 24 }}>
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
    </View>
  );

  const getModalTitle = () => {
    if (currentStep === 1) {
      return 'Account Information';
    }
    return 'PG Location Details';
  };

  const getModalSubtitle = () => {
    if (currentStep === 1) {
      return 'Let\'s start with your basic details';
    }
    return 'Tell us about your PG location';
  };

  const handleModalCancel = () => {
    if (currentStep > 1) {
      handleBack();
    } else {
      onClose();
    }
  };

  const handleModalSubmit = async () => {
    if (currentStep === 1) {
      handleNext();
    } else {
      await handleSubmit();
    }
  };

  return (
    <>
      <SlideBottomModal
        visible={visible && !showOtpVerification}
        onClose={onClose}
        title={getModalTitle()}
        subtitle={getModalSubtitle()}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        submitLabel={currentStep === 1 ? 'Next' : 'Create Account'}
        cancelLabel={currentStep > 1 ? 'Back' : 'Cancel'}
        isLoading={loading}
      >
        <View>
          {renderStepIndicator()}
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </View>
      </SlideBottomModal>

      {/* OTP Verification Modal */}
      <SlideBottomModal
        visible={showOtpVerification}
        onClose={() => {
          setShowOtpVerification(false);
          setOtp('');
        }}
        title="Verify Phone Number"
        subtitle="Enter the 4-digit OTP sent to your phone"
        onSubmit={handleVerifyOtp}
        onCancel={() => {
          setShowOtpVerification(false);
          setOtp('');
        }}
        submitLabel="Verify OTP"
        cancelLabel="Cancel"
        isLoading={loading}
      >
        <View style={{ paddingHorizontal: 16 }}>
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
      </SlideBottomModal>
    </>
  );
};
