import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCreateTenantMutation, useGetTenantByIdQuery, useUpdateTenantMutation } from '@/services/api/tenantsApi';
import { useGetAllBedsQuery, useGetAllRoomsQuery } from '@/services/api/roomsApi';
import { useGetStatesQuery, useLazyGetCitiesQuery } from '@/services/api/locationApi';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { DatePicker } from '../../components/DatePicker';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { getFolderConfig } from '../../config/aws.config';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

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
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [createTenantMutation] = useCreateTenantMutation();
  const [updateTenantMutation] = useUpdateTenantMutation();
  const [loading, setLoading] = useState(false);
  const { can } = usePermissions();
  
  // Check if we're in edit mode
  const tenantId = route?.params?.tenantId;
  const isEditMode = !!tenantId;

  const {
    data: tenantByIdResponse,
    isFetching: tenantByIdFetching,
    error: tenantByIdError,
  } = useGetTenantByIdQuery(Number(tenantId), { skip: !isEditMode });

  const tenantInEdit = (tenantByIdResponse as any)?.data;
  const lockTenancyFacts =
    isEditMode &&
    !!tenantInEdit &&
    (
      (Array.isArray(tenantInEdit?.rent_payments) && tenantInEdit.rent_payments.length > 0)
      || (Array.isArray(tenantInEdit?.advance_payments) && tenantInEdit.advance_payments.length > 0)
      || (Array.isArray(tenantInEdit?.refund_payments) && tenantInEdit.refund_payments.length > 0)
      || (Array.isArray(tenantInEdit?.current_bills) && tenantInEdit.current_bills.length > 0)
      || (Array.isArray(tenantInEdit?.payment_cycle_summaries) && tenantInEdit.payment_cycle_summaries.length > 0)
    );
  
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
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState({ code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 });
  const [selectedWhatsappCountry, setSelectedWhatsappCountry] = useState({ code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 });

  const pendingStateKeyRef = useRef<any>(null);
  const pendingCityKeyRef = useRef<any>(null);
  const pendingBedKeyRef = useRef<any>(null);

  const toDigits = (value: string) => (value || '').replace(/\D/g, '');

  const toNumberOrNull = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const toLocalNumber = (value: string) => {
    const digits = toDigits(value);
    // For safety, keep last 10 digits (India) when a country code was stored
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  const withCountryCode = (countryPhoneCode: string, value: string) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) return trimmed;
    const digits = toDigits(trimmed);
    if (!digits) return '';
    const code = (countryPhoneCode || '').startsWith('+') ? countryPhoneCode : `+${countryPhoneCode}`;
    return `${code}${digits}`;
  };

  // Hydrate form data in edit mode from RTK Query
  useEffect(() => {
    if (!isEditMode) return;
    if (tenantByIdError) {
      showErrorAlert(tenantByIdError as any, 'Failed to load tenant data');
      navigation.goBack();
      return;
    }

    const tenant = (tenantByIdResponse as any)?.data;
    if (!tenant) return;

    pendingStateKeyRef.current = tenant.state_id ?? tenant.state?.iso_code ?? tenant.state?.name ?? null;
    pendingCityKeyRef.current = tenant.city_id ?? tenant.city?.name ?? null;
    pendingBedKeyRef.current = tenant.bed_id ?? tenant.beds?.bed_no ?? null;

    setFormData({
      name: tenant.name || '',
      phone_no: toLocalNumber(tenant.phone_no || ''),
      whatsapp_number: toLocalNumber(tenant.whatsapp_number || ''),
      email: tenant.email || '',
      occupation: tenant.occupation || '',
      tenant_address: tenant.tenant_address || '',
      room_id: toNumberOrNull(tenant.room_id),
      bed_id: toNumberOrNull(tenant.bed_id),
      check_in_date: tenant.check_in_date ? new Date(tenant.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: tenant.check_out_date ? new Date(tenant.check_out_date).toISOString().split('T')[0] : '',
      city_id: toNumberOrNull(tenant.city_id),
      state_id: toNumberOrNull(tenant.state_id),
      status: tenant.status || 'ACTIVE',
    });

    setTenantImages(Array.isArray(tenant.images) ? tenant.images : []);
    setProofDocuments(Array.isArray(tenant.proof_documents) ? tenant.proof_documents : []);
  }, [isEditMode, tenantByIdResponse, tenantByIdError]);

  useEffect(() => {
    if (!isEditMode) return;
    if (formData.state_id) return;
    if (!pendingStateKeyRef.current) return;
    if (!stateData || stateData.length === 0) return;

    const key = pendingStateKeyRef.current;
    const resolved = stateData.find((s) => s.s_no === Number(key))
      ?? stateData.find((s) => s.iso_code === String(key))
      ?? stateData.find((s) => s.name === String(key));

    if (resolved) {
      setFormData((prev) => ({ ...prev, state_id: resolved.s_no }));
    }
  }, [isEditMode, formData.state_id, stateData]);

  useEffect(() => {
    if (!isEditMode) return;
    if (formData.city_id) return;
    if (!pendingCityKeyRef.current) return;
    if (!cityData || cityData.length === 0) return;

    const key = pendingCityKeyRef.current;
    const resolved = cityData.find((c) => c.s_no === Number(key))
      ?? cityData.find((c) => c.name === String(key));

    if (resolved) {
      setFormData((prev) => ({ ...prev, city_id: resolved.s_no }));
    }
  }, [isEditMode, formData.city_id, cityData]);

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

  const {
    data: statesResponse,
    isFetching: loadingStates,
    error: statesError,
  } = useGetStatesQuery({ countryCode: 'IN' });

  useEffect(() => {
    if (statesError) {
      showErrorAlert(statesError as any, 'Failed to load states');
      return;
    }
    if (statesResponse?.data) {
      setStateData(statesResponse.data as any);
    }
  }, [statesResponse, statesError]);

  const [triggerCities, { data: citiesResponse, isFetching: loadingCities, error: citiesError }] = useLazyGetCitiesQuery();

  useEffect(() => {
    if (citiesError) {
      showErrorAlert(citiesError as any, 'Failed to load cities');
      return;
    }
    if (citiesResponse?.data) {
      setCityData(citiesResponse.data as any);
    }
  }, [citiesResponse, citiesError]);

  const {
    data: roomsResponse,
    isFetching: loadingRooms,
    error: roomsError,
  } = useGetAllRoomsQuery(selectedPGLocationId ? ({ pg_id: selectedPGLocationId } as any) : (undefined as any), {
    skip: !selectedPGLocationId,
  });

  useEffect(() => {
    if (roomsError) {
      showErrorAlert(roomsError as any, 'Failed to load rooms');
      return;
    }
    const rooms = (roomsResponse as any)?.data || [];
    // Remove duplicates based on s_no
    const uniqueRooms = Array.from(new Map(rooms.map((room: any) => [room.s_no, room])).values());
    setRoomList(
      uniqueRooms.map((room: any) => ({
        label: `Room ${room.room_no}`,
        value: room.s_no.toString(),
      }))
    );
  }, [roomsResponse, roomsError]);

  const {
    data: bedsResponse,
    isFetching: loadingBeds,
    error: bedsError,
  } = useGetAllBedsQuery(
    formData.room_id
      ? (({
          room_id: Number(formData.room_id),
          ...(!isEditMode ? { only_unoccupied: true } : {}),
        } as any))
      : (undefined as any),
    { skip: !formData.room_id }
  );

  useEffect(() => {
    if (bedsError) {
      showErrorAlert(bedsError as any, 'Failed to load beds');
      return;
    }
    const beds = (bedsResponse as any)?.data || [];
    setBedsList(
      beds.map((bed: any) => ({
        label: `Bed ${bed.bed_no}`,
        value: bed.s_no.toString(),
      }))
    );
  }, [bedsResponse, bedsError]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!formData.room_id) return;

    const beds = (bedsResponse as any)?.data || [];
    if (!beds || beds.length === 0) return;

    const currentSelected = formData.bed_id;
    const hasSelectedInList = currentSelected ? beds.some((b: any) => Number(b.s_no) === Number(currentSelected)) : false;
    if (hasSelectedInList) return;

    const key = pendingBedKeyRef.current;
    if (!key) return;

    const resolved = beds.find((b: any) => Number(b.s_no) === Number(key))
      ?? beds.find((b: any) => String(b.bed_no) === String(key));

    if (resolved?.s_no) {
      setFormData((prev) => ({ ...prev, bed_id: Number(resolved.s_no) }));
    }
  }, [isEditMode, formData.room_id, formData.bed_id, bedsResponse]);

  // Fetch beds when room is selected
  useEffect(() => {
    if (formData.room_id) {
      // handled by RTK query above
    } else {
      setBedsList([]);
      // Only reset bed_id if it wasn't pre-selected from bed screen
      if (!preSelectedBedId) {
        setFormData(prev => ({ ...prev, bed_id: null }));
      }
    }
  }, [formData.room_id, preSelectedBedId]);

  useEffect(() => {
    if (formData.state_id) {
      const selectedState = stateData.find(s => s.s_no === formData.state_id);
      if (selectedState) {
        triggerCities({ stateCode: selectedState.iso_code });
      }
    } else {
      setCityData([]);
      setFormData(prev => ({ ...prev, city_id: null }));
    }
  }, [formData.state_id, stateData, triggerCities]);

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

    if (!toDigits(formData.phone_no).trim()) {
      newErrors.phone_no = 'Phone number is required';
    } else if (!/^\d{10}$/.test(toDigits(formData.phone_no))) {
      newErrors.phone_no = 'Phone number must be 10 digits';
    }

    if (formData.whatsapp_number && !/^\d{10}$/.test(toDigits(formData.whatsapp_number))) {
      newErrors.whatsapp_number = 'WhatsApp number must be 10 digits';
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
    if (isEditMode && !can(Permission.EDIT_TENANT)) {
      Alert.alert('Access Denied', "You don't have permission to edit tenants");
      return;
    }
    if (!isEditMode && !can(Permission.CREATE_TENANT)) {
      Alert.alert('Access Denied', "You don't have permission to create tenants");
      return;
    }

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
        phone_no: withCountryCode(selectedPhoneCountry.phoneCode, formData.phone_no),
        whatsapp_number: formData.whatsapp_number.trim()
          ? withCountryCode(selectedWhatsappCountry.phoneCode, formData.whatsapp_number)
          : '',
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
        const res = await updateTenantMutation({ id: Number(tenantId), data: tenantData as any }).unwrap();
        showSuccessAlert(res);
        navigation.navigate('Tenants', { refresh: true });
      } else {
        // Create new tenant
        // tenantsApi.createTenant does not currently accept custom headers here.
        // Base API headers (auth, pg context) are expected to be applied globally.
        const res = await createTenantMutation(tenantData as any).unwrap();

        showSuccessAlert(res);
        navigation.navigate('Tenants', { refresh: true });
      }
    } catch (error: any) {
      showErrorAlert(error, 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (tenantByIdFetching) {
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
                selectedCountry={selectedPhoneCountry}
                onSelectCountry={setSelectedPhoneCountry}
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
                selectedCountry={selectedWhatsappCountry}
                onSelectCountry={setSelectedWhatsappCountry}
                phoneValue={formData.whatsapp_number}
                onPhoneChange={(phone) => updateField('whatsapp_number', phone)}
                size="medium"
              />
              {errors.whatsapp_number && (
                <Text style={{ fontSize: 11, color: '#EF4444', marginTop: -8, marginBottom: 8 }}>{errors.whatsapp_number}</Text>
              )}
             
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

            {lockTenancyFacts && (
              <View
                style={{
                  marginBottom: 12,
                  padding: 10,
                  backgroundColor: Theme.colors.background.blueLight,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
                  Once rent is generated or any payment exists, Check-in date, Room, and Bed cannot be changed.
                </Text>
              </View>
            )}

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
              disabled={!isEditMode || lockTenancyFacts}
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
              disabled={!isEditMode || !formData.room_id || lockTenancyFacts}
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
                disabled={lockTenancyFacts}
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
