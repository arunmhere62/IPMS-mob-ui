import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Theme } from '../../theme';
import { User } from '../../types';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { CountryPhoneSelector, COUNTRIES } from '../../components/CountryPhoneSelector';
import { OptionSelector } from '../../components/OptionSelector';
import { InputField } from '../../components/InputField';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { OTPInput } from '../../components/OTPInput';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '../../services/api/userApi';
import { useGetCitiesQuery, useGetStatesQuery } from '../../services/api/locationApi';
import { useSendSignupOtpMutation, useVerifySignupOtpMutation } from '../../services/api/authApi';

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onProfileUpdated,
}) => {
  const [updateUserProfileMutation] = useUpdateUserProfileMutation();
  const [sendSignupOtp] = useSendSignupOtpMutation();
  const [verifySignupOtp] = useVerifySignupOtpMutation();

  const {
    data: profileResponse,
    refetch: refetchProfile,
    isFetching: isProfileFetching,
  } = useGetUserProfileQuery(user?.s_no as number, {
    skip: !user?.s_no || !visible,
  });

  const profileUser: User | null =
    ((profileResponse as any)?.data?.data as User) ||
    ((profileResponse as any)?.data as User) ||
    ((profileResponse as any) as User) ||
    null;

  const effectiveUser = profileUser || user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to India
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [stateId, setStateId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const [phoneVerifiedFor, setPhoneVerifiedFor] = useState<string | null>(null);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');

  const { data: statesResponse, isFetching: isStatesFetching } = useGetStatesQuery(
    visible ? { countryCode: 'IN' } : undefined,
    { skip: !visible }
  );

  const statesList = ((statesResponse as any)?.data || []) as any[];
  const selectedState = stateId ? statesList.find((s) => s?.s_no === stateId) : null;
  const selectedStateCode = (selectedState?.iso_code || selectedState?.state_code || null) as string | null;

  const { data: citiesResponse, isFetching: isCitiesFetching } = useGetCitiesQuery(
    { stateCode: selectedStateCode as string },
    { skip: !visible || !selectedStateCode }
  );

  const citiesList = ((citiesResponse as any)?.data || []) as any[];

  useEffect(() => {
    if (effectiveUser && visible) {
      setName(effectiveUser.name || '');
      setEmail(effectiveUser.email || '');
      setPhone(effectiveUser.phone || '');
      setAddress(effectiveUser.address || '');
      setGender(effectiveUser.gender || '');
      setStateId(effectiveUser.state_id || null);
      setCityId(effectiveUser.city_id || null);
      setProfileImages(effectiveUser.profile_images ? [effectiveUser.profile_images] : []);

      setPhoneVerifiedFor(null);
      setShowPhoneOtpModal(false);
      setOtp('');
      setOtpError('');
      setOtpPhone('');
    }
  }, [effectiveUser, visible]);

  useEffect(() => {
    if (!stateId) {
      setCityId(null);
    }
  }, [stateId]);

  const validate = () => {
    const newErrors: any = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Construct full phone number with country code for validation
    const fullPhoneNumber = phone && selectedCountry ? `${selectedCountry.phoneCode} ${phone}` : phone;
    
    if (fullPhoneNumber && !/^\+\d{1,3}\s\d{8,10}$/.test(fullPhoneNumber)) {
      newErrors.phone = 'Phone number format is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizePhone = (value: any) => String(value || '').trim();

  const digitsOnly = (value: any) => String(value || '').replace(/\D/g, '');

  const buildFullPhoneNumber = () => {
    return phone && selectedCountry ? `${selectedCountry.phoneCode} ${phone}`.trim() : String(phone || '').trim();
  };

  const originalPhone = normalizePhone(effectiveUser?.phone);
  const nextPhone = normalizePhone(buildFullPhoneNumber());
  const originalDigits = digitsOnly(originalPhone);
  const nextDigits = digitsOnly(nextPhone);
  const isPhoneChanging = !!nextDigits && nextDigits !== originalDigits;
  const isPhoneVerified = !isPhoneChanging || phoneVerifiedFor === nextPhone;

  const handleSendPhoneOtp = async () => {
    const candidate = normalizePhone(buildFullPhoneNumber());
    if (!candidate) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    setOtpLoading(true);
    try {
      await sendSignupOtp({ phone: candidate }).unwrap();
      setOtpPhone(candidate);
      setShowPhoneOtpModal(true);
      showSuccessAlert('OTP sent to your phone number');
    } catch (error: any) {
      showErrorAlert(error, 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 4) {
      setOtpError('Please enter valid 4-digit OTP');
      return;
    }
    if (!otpPhone) return;

    setOtpLoading(true);
    try {
      await verifySignupOtp({ phone: otpPhone, otp: otp.trim() }).unwrap();
      setPhoneVerifiedFor(otpPhone);
      setShowPhoneOtpModal(false);
      setOtp('');
      setOtpError('');
      showSuccessAlert('Phone number verified successfully');
    } catch (error: any) {
      showErrorAlert(error, 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate() || !effectiveUser) return;

    const fullPhoneNumber = buildFullPhoneNumber();
    if (normalizePhone(fullPhoneNumber) && isPhoneChanging && phoneVerifiedFor !== normalizePhone(fullPhoneNumber)) {
      setErrors((prev: any) => ({ ...prev, phone: 'Please verify your phone number' }));
      Alert.alert('Verification required', 'Please verify your new phone number before saving.');
      return;
    }

    try {
      setLoading(true);
      // Construct full phone number with country code
      const fullPhoneNumber = buildFullPhoneNumber();
      
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: fullPhoneNumber?.trim() || undefined,
        address: address.trim() || undefined,
        gender: gender || undefined,
        state_id: stateId,
        city_id: cityId,
        profile_images: profileImages.length > 0 ? profileImages[0] : null,
      };
      
      console.log('=== FRONTEND DEBUG ===');
      console.log('Sending payload to backend:', payload);
      console.log('profileImages array:', profileImages);
      console.log('profileImages.length:', profileImages.length);
      console.log('profile_images field value:', payload.profile_images);
      console.log('=== END FRONTEND DEBUG ===');

      const response = await updateUserProfileMutation({ userId: effectiveUser.s_no, data: payload }).unwrap();
      
      showSuccessAlert(response)

      // Ensure profile query is up-to-date for all consumers
      if (effectiveUser?.s_no) {
        refetchProfile();
      }
      
      // Call parent callback to refresh user data
      onProfileUpdated?.();
      
      onClose();
    } catch (error: any) {
      showErrorAlert(error, 'Error')
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setPhoneVerifiedFor(null);
    setShowPhoneOtpModal(false);
    setOtp('');
    setOtpError('');
    setOtpPhone('');
    onClose();
  };

  if (!user) return null;

  return (
    <>
      <SlideBottomModal
        visible={visible}
        onClose={handleClose}
        title="Edit Profile"
        subtitle="Update your personal information"
        onSubmit={handleSave}
        onCancel={handleClose}
        submitLabel="Save Changes"
        cancelLabel="Cancel"
        isLoading={loading}
      >
      {isProfileFetching && !effectiveUser ? (
        <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={{ marginTop: 12, color: Theme.colors.text.secondary }}>Loading profile...</Text>
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 0, paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Name */}
        <InputField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          error={errors.name}
          required={true}
          prefixIcon="person-outline"
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Email */}
        <InputField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          error={errors.email}
          required={true}
          prefixIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Phone */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: Theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Phone Number
          </Text>
          <CountryPhoneSelector
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            phoneValue={phone}
            onPhoneChange={setPhone}
          />
          {isPhoneChanging ? (
            <View style={{ marginTop: 8 }}>
              {isPhoneVerified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '700' }}>✓ Verified</Text>
                  <Text style={{ marginLeft: 8, fontSize: 12, color: Theme.colors.text.tertiary }}>
                    {nextPhone}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleSendPhoneOtp}
                  disabled={otpLoading || loading}
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: Theme.colors.primary,
                    opacity: otpLoading || loading ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                    {otpLoading ? 'Sending...' : 'Verify New Number'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          {errors.phone && (
            <Text style={{ color: Theme.colors.danger, fontSize: 12, marginTop: 4 }}>
              {errors.phone}
            </Text>
          )}
        </View>

        {/* Address */}
        <InputField
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
          error={errors.address}
          prefixIcon="location-outline"
          multiline
          numberOfLines={3}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Gender */}
        <OptionSelector
          label="Gender"
          options={GENDER_OPTIONS}
          selectedValue={gender || null}
          onSelect={(value) => setGender((value || '') as 'MALE' | 'FEMALE' | '')}
          error={errors.gender}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* State */}
        <View style={{ marginBottom: 16 }}>
          <SearchableDropdown
            label="State"
            items={statesList.map((state) => ({
              id: state.s_no,
              label: state.state_name || state.name,
              value: state.s_no,
              isoCode: state.iso_code,
            }))}
            selectedValue={stateId}
            onSelect={(item) => setStateId(item.value)}
            placeholder="Select state"
            loading={isStatesFetching}
            error={errors.stateId}
          />
        </View>

        {/* City */}
        <View style={{ marginBottom: 16 }}>
          <SearchableDropdown
            label="City"
            items={citiesList.map((city) => ({
              id: city.s_no,
              label: city.city_name || city.name,
              value: city.s_no,
            }))}
            selectedValue={cityId}
            onSelect={(item) => setCityId(item.value)}
            placeholder="Select city"
            loading={isCitiesFetching}
            disabled={!stateId || !selectedStateCode}
            error={errors.cityId}
          />
        </View>

        {/* Profile Image */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: Theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Profile Image
          </Text>
          <ImageUploadS3
            images={profileImages}
            onImagesChange={setProfileImages}
            maxImages={1}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </SlideBottomModal>

    {/* OTP Verification Modal */}
    <SlideBottomModal
      visible={showPhoneOtpModal}
      onClose={() => {
        setShowPhoneOtpModal(false);
        setOtp('');
        setOtpError('');
      }}
      title="Verify Phone Number"
      subtitle="Enter the 4-digit OTP sent to your phone"
      onSubmit={handleVerifyPhoneOtp}
      onCancel={() => {
        setShowPhoneOtpModal(false);
        setOtp('');
        setOtpError('');
      }}
      submitLabel="Verify OTP"
      cancelLabel="Cancel"
      isLoading={otpLoading}
    >
      <View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 16, textAlign: 'center' }}>
          Phone: {otpPhone}
        </Text>

        <OTPInput
          length={4}
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            setOtpError('');
          }}
          error={!!otpError}
          autoFocus
        />

        {otpError ? (
          <Text style={{ marginTop: 10, fontSize: 12, color: Theme.colors.danger, textAlign: 'center' }}>{otpError}</Text>
        ) : null}

        <View style={{ marginTop: Theme.spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, textAlign: 'center' }}>
            Didn't receive OTP?{' '}
            <Text
              style={{ color: Theme.colors.primary, fontWeight: '600' }}
              onPress={handleSendPhoneOtp}
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
