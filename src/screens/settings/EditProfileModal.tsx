import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { User } from '../../types';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { CountryPhoneSelector, COUNTRIES } from '../../components/CountryPhoneSelector';
import { OptionSelector } from '../../components/OptionSelector';
import { InputField } from '../../components/InputField';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import axiosInstance from '../../services/core/axiosInstance';
import userService from '../../services/userService';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

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

  // Dropdown data
  const [stateData, setStateData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchStates();
    }
  }, [visible]);

  useEffect(() => {
    if (user && visible) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setGender(user.gender || '');
      setStateId(user.state_id || null);
      setCityId(user.city_id || null);
      setProfileImages(user.profile_images ? [user.profile_images] : []);
    }
  }, [user, visible]);

  useEffect(() => {
    if (stateId) {
      const selectedState = stateData.find(s => s.s_no === stateId);
      if (selectedState) {
        fetchCities(selectedState.iso_code);
      }
    } else {
      setCityData([]);
      setCityId(null);
    }
  }, [stateId, stateData]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await axiosInstance.get('/location/states', {
        params: { countryCode: 'IN' },
      });
      if (response.data.success) {
        setStateData(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await axiosInstance.get('/location/cities', {
        params: { stateCode },
      });
      if (response.data.success) {
        setCityData(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

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

  const handleSave = async () => {
    if (!validate() || !user) return;

    try {
      setLoading(true);
      // Construct full phone number with country code
      const fullPhoneNumber = phone && selectedCountry ? `${selectedCountry.phoneCode} ${phone}` : phone;
      
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
      
      const response = await userService.updateUserProfile(user.s_no, payload);
      
      showSuccessAlert(response, 'Success')
      
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
    onClose();
  };

  if (!user) return null;

  return (
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
            items={stateData.map(state => ({
              id: state.s_no,
              label: state.state_name,
              value: state.s_no,
              isoCode: state.iso_code
            }))}
            selectedValue={stateId}
            onSelect={(item) => setStateId(item.value)}
            placeholder="Select state"
            loading={loadingStates}
            error={errors.stateId}
          />
        </View>

        {/* City */}
        <View style={{ marginBottom: 16 }}>
          <SearchableDropdown
            label="City"
            items={cityData.map(city => ({
              id: city.s_no,
              label: city.city_name,
              value: city.s_no
            }))}
            selectedValue={cityId}
            onSelect={(item) => setCityId(item.value)}
            placeholder="Select city"
            loading={loadingCities}
            disabled={!stateId}
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
  );
};
