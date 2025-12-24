import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { useCreateTenantMutation } from '@/services/api/tenantsApi';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { DatePicker } from '../../components/DatePicker';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import axiosInstance from '../../services/core/axiosInstance';
import { getFolderConfig } from '../../config/aws.config';
import { CONTENT_COLOR } from '@/constant';

interface AddTenantScreenProps {
  navigation: any;
  route?: any;
}

interface OptionType {
  label: string;
  value: string;
}

interface StateData {
  s_no: number;
  name: string;
  iso_code: string;
}

interface CityData {
  s_no: number;
  name: string;
}

export const AddTenantScreen: React.FC<AddTenantScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { user } = useSelector((state: RootState) => state.auth);
  const [createTenantMutation] = useCreateTenantMutation();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  
  // Check if we're in edit mode
  const tenantId = route?.params?.tenantId;
  const isEditMode = !!tenantId;
  
  // Check if we're coming from bed screen with pre-selected bed and room
  const preSelectedBedId = route?.params?.bed_id;
  const preSelectedRoomId = route?.params?.room_id;

  // Dropdown data
  const [roomList, setRoomList] = useState<OptionType[]>([]);
  const [bedsList, setBedsList] = useState<OptionType[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone_no: '',
    whatsapp_number: '',
    email: '',
    occupation: '',
    tenant_address: '',
    room_id: null as number | null,
    bed_id: null as number | null,
    check_in_date: '',
    check_out_date: '',
    city_id: null as number | null,
    state_id: null as number | null,
    status: 'ACTIVE',
  });

  const [tenantImages, setTenantImages] = useState<string[]>([]);
  const [proofDocuments, setProofDocuments] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 });

  // Fetch tenant data if in edit mode
  useEffect(() => {
    if (isEditMode && tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  // Pre-fill room and bed if coming from bed screen
  useEffect(() => {
    if (preSelectedRoomId && preSelectedBedId) {
      setFormData(prev => ({
        ...prev,
        room_id: preSelectedRoomId,
        bed_id: preSelectedBedId,
      }));
    }
  }, [preSelectedRoomId, preSelectedBedId]);

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch rooms when PG location is selected
  useEffect(() => {
    if (selectedPGLocationId) {
      fetchRooms();
    }
  }, [selectedPGLocationId]);

  // Fetch beds when room is selected
  useEffect(() => {
    if (formData.room_id) {
      fetchBeds(formData.room_id.toString());
    } else {
      setBedsList([]);
      // Only reset bed_id if it wasn't pre-selected from bed screen
      if (!preSelectedBedId) {
        setFormData(prev => ({ ...prev, bed_id: null }));
      }
    }
  }, [formData.room_id, preSelectedBedId]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (formData.state_id) {
      const selectedState = stateData.find(s => s.s_no === formData.state_id);
      if (selectedState) {
        fetchCities(selectedState.iso_code);
      }
    } else {
      setCityData([]);
      setFormData(prev => ({ ...prev, city_id: null }));
    }
  }, [formData.state_id, stateData]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await axiosInstance.get('/location/states', {
        params: { countryCode: 'IN' },
      });
      if (response.data.success) {
        // Handle nested data structure: { success: true, data: { data: [...] } }
        const statesData = response.data.data?.data || response.data.data || [];
        setStateData(statesData);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      Alert.alert('Error', 'Failed to load states');
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
        // Handle nested data structure: { success: true, data: { data: [...] } }
        const citiesData = response.data.data?.data || response.data.data || [];
        setCityData(citiesData);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await axiosInstance.get('/rooms', {
        params: {
          pg_id: selectedPGLocationId,
        },
      });
      if (response.data.success) {
        // Handle nested data structure: { success: true, data: { data: [...] } }
        const rooms = response.data.data?.data || response.data.data || [];
        // Remove duplicates based on s_no
        const uniqueRooms = Array.from(new Map(rooms.map((room: any) => [room.s_no, room])).values());
        setRoomList(
          uniqueRooms.map((room: any) => ({
            label: `Room ${room.room_no}`,
            value: room.s_no.toString(),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchBeds = async (roomId: string) => {
    setLoadingBeds(true);
    try {
      const response = await axiosInstance.get('/beds', {
        params: {
          room_id: roomId,
          // Only show unoccupied beds when creating new tenant
          // When editing, show all beds so user can see current bed
          only_unoccupied: !isEditMode,
        },
      });
      if (response.data.success) {
        // Handle nested data structure: { success: true, data: { data: [...] } }
        const beds = response.data.data?.data || response.data.data || [];
        setBedsList(
          beds.map((bed: any) => ({
            label: `Bed ${bed.bed_no}`,
            value: bed.s_no.toString(),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      Alert.alert('Error', 'Failed to load beds');
    } finally {
      setLoadingBeds(false);
    }
  };

  const fetchTenantData = async () => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/tenants/${tenantId}`);
      // Handle nested data structure: { success: true, data: { data: tenant } }
      const tenant = response.data.data?.data || response.data.data || response.data;
      
      setFormData({
        name: tenant.name || '',
        phone_no: tenant.phone_no || '',
        whatsapp_number: tenant.whatsapp_number || '',
        email: tenant.email || '',
        occupation: tenant.occupation || '',
        tenant_address: tenant.tenant_address || '',
        room_id: tenant.room_id || null,
        bed_id: tenant.bed_id || null,
        check_in_date: tenant.check_in_date ? new Date(tenant.check_in_date).toISOString().split('T')[0] : '',
        check_out_date: tenant.check_out_date ? new Date(tenant.check_out_date).toISOString().split('T')[0] : '',
        city_id: tenant.city_id || null,
        state_id: tenant.state_id || null,
        status: tenant.status || 'ACTIVE',
      });
      
      if (tenant.images) {
        setTenantImages(Array.isArray(tenant.images) ? tenant.images : []);
      }
      if (tenant.proof_documents) {
        setProofDocuments(Array.isArray(tenant.proof_documents) ? tenant.proof_documents : []);
      }
      
      // Fetch cities if state is selected
      if (tenant.state_id) {
        fetchCities(tenant.state_id);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load tenant data');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone_no.trim()) {
      newErrors.phone_no = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_no.trim())) {
      newErrors.phone_no = 'Phone number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.room_id) {
      newErrors.room_id = 'Room is required';
    }

    if (!formData.bed_id) {
      newErrors.bed_id = 'Bed is required';
    }

    if (!formData.check_in_date) {
      newErrors.check_in_date = 'Check-in date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    if (!selectedPGLocationId) {
      Alert.alert('Error', 'Please select a PG location first');
      return;
    }

    try {
      setLoading(true);

      const tenantData = {
        name: formData.name.trim(),
        phone_no: formData.phone_no.trim(),
        whatsapp_number: formData.whatsapp_number.trim() || formData.phone_no.trim(),
        email: formData.email.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        tenant_address: formData.tenant_address.trim() || undefined,
        pg_id: selectedPGLocationId,
        room_id: formData.room_id || undefined,
        bed_id: formData.bed_id || undefined,
        check_in_date: formData.check_in_date,
        city_id: formData.city_id || undefined,
        state_id: formData.state_id || undefined,
        images: tenantImages, // Always send array, even if empty, so backend can clear removed images
        proof_documents: proofDocuments, // Always send array, even if empty, so backend can clear removed documents
        status: formData.status as 'ACTIVE' | 'INACTIVE',
      };

      if (isEditMode) {
        // Update existing tenant
        // Backend will handle S3 deletion for removed images
        await axiosInstance.put(`/tenants/${tenantId}`, tenantData);
        Alert.alert('Success', 'Tenant updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Trigger refresh on tenant list screen
              navigation.navigate('Tenants', { refresh: true });
            },
          },
        ]);
      } else {
        // Create new tenant
        // tenantsApi.createTenant does not currently accept custom headers here.
        // Base API headers (auth, pg context) are expected to be applied globally.
        await createTenantMutation(tenantData as any).unwrap();

        Alert.alert('Success', 'Tenant created successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Trigger refresh on tenant list screen
              navigation.navigate('Tenants', { refresh: true });
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title={isEditMode ? 'Edit Tenant' : 'Add New Tenant'}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading tenant data...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={isEditMode ? 'Edit Tenant' : 'Add New Tenant'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

     <View  style={{ flex: 1, backgroundColor: CONTENT_COLOR,  }}>
       <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={{ padding: 16 }}>
          {/* Personal Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              👤 Personal Information
            </Text>

            {/* Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Full Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter full name"
                style={{
                  borderWidth: 1,
                  borderColor: errors.name ? '#EF4444' : Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                }}
              />
              {errors.name && (
                <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.name}</Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Phone Number <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <CountryPhoneSelector
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                phoneValue={formData.phone_no}
                onPhoneChange={(phone) => updateField('phone_no', phone)}
                size="medium"
              />
              {errors.phone_no && (
                <Text style={{ fontSize: 11, color: '#EF4444', marginTop: -8, marginBottom: 8 }}>{errors.phone_no}</Text>
              )}
            </View>

            {/* WhatsApp Number */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                WhatsApp Number
              </Text>
              <CountryPhoneSelector
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                phoneValue={formData.whatsapp_number}
                onPhoneChange={(phone) => updateField('whatsapp_number', phone)}
                size="medium"
              />
             
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Email Address
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Enter email address (optional)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: errors.email ? '#EF4444' : Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                }}
              />
              {errors.email && (
                <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.email}</Text>
              )}
            </View>

            {/* Occupation */}
            <View style={{ marginBottom: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Occupation
              </Text>
              <TextInput
                value={formData.occupation}
                onChangeText={(value) => updateField('occupation', value)}
                placeholder="Enter occupation (optional)"
                style={{
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                }}
              />
            </View>
          </Card>

          {/* Address Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              📍 Address Information
            </Text>

            {/* State Select */}
            <SearchableDropdown
              label="State"
              placeholder="Select a state"
              items={stateData.map(state => ({
                id: state.s_no,
                label: state.name,
                value: state.iso_code,
              }))}
              selectedValue={formData.state_id}
              onSelect={(item) => setFormData(prev => ({ ...prev, state_id: item.id }))}
              loading={loadingStates}
              required={false}
            />

            {/* City Select */}
            <SearchableDropdown
              label="City"
              placeholder="Select a city"
              items={cityData.map(city => ({
                id: city.s_no,
                label: city.name,
                value: city.s_no,
              }))}
              selectedValue={formData.city_id}
              onSelect={(item) => setFormData(prev => ({ ...prev, city_id: item.id }))}
              loading={loadingCities}
              disabled={!formData.state_id}
              required={false}
            />

            {/* Address */}
            <View style={{ marginBottom: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Address
              </Text>
              <TextInput
                value={formData.tenant_address}
                onChangeText={(value) => updateField('tenant_address', value)}
                placeholder="Enter full address (optional)"
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </Card>

          {/* Accommodation Details */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              🏠 Accommodation Details
            </Text>

            {/* Room Select */}
            <SearchableDropdown
              label="Room"
              placeholder="Select a room"
              items={roomList.map(room => ({
                id: parseInt(room.value),
                label: room.label,
                value: room.value,
              }))}
              selectedValue={formData.room_id}
              onSelect={(item) => setFormData(prev => ({ ...prev, room_id: item.id }))}
              loading={loadingRooms}
              disabled={!isEditMode}
              error={errors.room_id}
              required={true}
            />

            {/* Bed Select */}
            <SearchableDropdown
              label="Bed"
              placeholder="Select a bed"
              items={bedsList.map(bed => ({
                id: parseInt(bed.value),
                label: bed.label,
                value: bed.value,
              }))}
              selectedValue={formData.bed_id}
              onSelect={(item) => setFormData(prev => ({ ...prev, bed_id: item.id }))}
              loading={loadingBeds}
              disabled={!isEditMode || !formData.room_id}
              error={errors.bed_id}
              required={true}
            />

            {/* Check-in Date */}
            <View style={{ marginBottom: 0 }}>
              {!isEditMode && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '600', marginLeft: 2 }}>
                  Check-in Date <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => updateField('check_in_date', new Date().toISOString().split('T')[0])}
                  style={{
                    backgroundColor: Theme.colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Today</Text>
                </TouchableOpacity>
              </View>
            )}
            {isEditMode && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '600', marginLeft: 2 }}>
                  Check-in Date <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
              </View>
            )}
              <DatePicker
                label=""
                value={formData.check_in_date}
                onChange={(date) => updateField('check_in_date', date)}
                error={errors.check_in_date}
                required={false}
              />
            </View>
          </Card>

          {/* Tenant Images */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              📷 Tenant Images
            </Text>
            <ImageUploadS3
              images={tenantImages}
              onImagesChange={setTenantImages}
              maxImages={5}
              label="Tenant Photos"
              folder={getFolderConfig().tenants.images}
              useS3={true}
              entityId={isEditMode ? tenantId?.toString() : undefined}
              autoSave={false}
            />
          </Card>

          {/* Proof Documents */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              📄 Proof Documents
            </Text>
            <ImageUploadS3
              images={proofDocuments}
              onImagesChange={setProofDocuments}
              maxImages={5}
              label="ID Proof / Documents"
              folder={getFolderConfig().tenants.documents}
              useS3={true}
              entityId={isEditMode ? tenantId?.toString() : undefined}
              autoSave={false}
            />
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 8 }}>
              Upload Aadhaar, PAN, Driving License, or other ID proofs
            </Text>
          </Card>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9CA3AF' : Theme.colors.primary,
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {isEditMode ? 'Update Tenant' : 'Create Tenant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
     </View>
    </ScreenLayout>
  );
};
