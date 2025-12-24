import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { OptionSelector } from '../../components/OptionSelector';
import { CountryPhoneSelector } from '../../components/CountryPhoneSelector';
import { useCreateEmployeeMutation, useLazyGetEmployeeByIdQuery, UserGender, useUpdateEmployeeMutation } from '../../services/api/employeesApi';
import { useGetStatesQuery, useLazyGetCitiesQuery } from '../../services/api/locationApi';
import { useGetPGLocationsQuery } from '../../services/api/pgLocationsApi';
import { useLazyGetRolesQuery } from '../../services/api/rolesApi';
import { getFolderConfig } from '../../config/aws.config';
import { CONTENT_COLOR } from '@/constant';

interface AddEmployeeScreenProps {
  navigation: any;
  route?: any;
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

interface RoleData {
  s_no: number;
  role_name: string;
}

export const AddEmployeeScreen: React.FC<AddEmployeeScreenProps> = ({ navigation, route }) => {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const [fetchEmployeeById] = useLazyGetEmployeeByIdQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  
  // Check if we're in edit mode
  const employeeId = route?.params?.employeeId;
  const isEditMode = !!employeeId;

  // Dropdown data
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>({ code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: null as number | null,
    pg_id: null as number | null,
    gender: '' as UserGender | '',
    address: '',
    city_id: null as number | null,
    state_id: null as number | null,
    pincode: '',
    country: 'India',
  });

  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [proofDocuments, setProofDocuments] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [fetchRolesTrigger] = useLazyGetRolesQuery();

  const { data: statesResponse, isFetching: isFetchingStates } = useGetStatesQuery({ countryCode: 'IN' });
  const [fetchCitiesTrigger] = useLazyGetCitiesQuery();

  const { data: pgLocationsResponse } = useGetPGLocationsQuery(undefined, {
    skip: false,
  });

  // Fetch employee data if in edit mode
  useEffect(() => {
    if (isEditMode && employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setLoadingStates(isFetchingStates);
  }, [isFetchingStates]);

  useEffect(() => {
    if (statesResponse?.success) {
      setStateData(statesResponse.data);
    }
  }, [statesResponse]);

  useEffect(() => {
    if (!isEditMode && selectedPGLocationId) {
      setFormData(prev => ({ ...prev, pg_id: selectedPGLocationId }));
    }
  }, [isEditMode, selectedPGLocationId]);

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

  const fetchEmployeeData = async () => {
    try {
      setInitialLoading(true);
      const employee = await fetchEmployeeById(employeeId).unwrap();
      
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Don't populate password in edit mode
        phone: employee.phone || '',
        role_id: employee.role_id || null,
        pg_id: employee.pg_id || null,
        gender: employee.gender || '',
        address: employee.address || '',
        city_id: employee.city_id || null,
        state_id: employee.state_id || null,
        pincode: employee.pincode || '',
        country: employee.country || 'India',
      });
      
      // Load cities if state is set
      if (employee.state_id && stateData.length > 0) {
        const selectedState = stateData.find(s => s.s_no === employee.state_id);
        if (selectedState) {
          await fetchCities(selectedState.iso_code);
        }
      }
      
      if (employee.profile_images) {
        setProfileImages(Array.isArray(employee.profile_images) ? employee.profile_images : 
          typeof employee.profile_images === 'string' ? JSON.parse(employee.profile_images) : []);
      }
      if (employee.proof_documents) {
        setProofDocuments(Array.isArray(employee.proof_documents) ? employee.proof_documents : 
          typeof employee.proof_documents === 'string' ? JSON.parse(employee.proof_documents) : []);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load employee data');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCities = async (stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await fetchCitiesTrigger({ stateCode }).unwrap();
      if (response.success) {
        setCityData(response.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetchRolesTrigger().unwrap();
      const roles = (response as any)?.data || [];
      setRoleData(Array.isArray(roles) ? roles : []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      Alert.alert('Error', 'Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const safeLocations = Array.isArray((pgLocationsResponse as any)?.data) ? (pgLocationsResponse as any).data : [];

  const selectedPGLocation = selectedPGLocationId
    ? safeLocations.find((loc: any) => loc.s_no === selectedPGLocationId)
    : null;

  const updateField = (field: string, value: any) => {
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

    if (!isEditMode) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }

      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    try {
      setLoading(true);

      const employeeData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role_id: formData.role_id!,
        pg_id: (selectedPGLocationId || formData.pg_id) || undefined,
        gender: formData.gender as UserGender,
        address: formData.address.trim() || undefined,
        city_id: formData.city_id || undefined,
        state_id: formData.state_id || undefined,
        pincode: formData.pincode.trim() || undefined,
        country: formData.country.trim() || undefined,
        profile_images: profileImages, // Always send array, even if empty, so backend can clear removed images
        proof_documents: proofDocuments, // Always send array, even if empty, so backend can clear removed documents
      };

      if (isEditMode) {
        // Update existing employee
        await updateEmployee({ id: employeeId, data: employeeData }).unwrap();
        Alert.alert('Success', 'Employee updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Create new employee
        employeeData.email = formData.email.trim();
        employeeData.password = formData.password.trim();
        
        await createEmployee(employeeData).unwrap();
        Alert.alert('Success', 'Employee created successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title={isEditMode ? 'Edit Employee' : 'Add New Employee'}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading employee data...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={isEditMode ? 'Edit Employee' : 'Add New Employee'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
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
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
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

                {/* Email (only in create mode) */}
                {!isEditMode && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                      Email Address <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={formData.email}
                      onChangeText={(value) => updateField('email', value)}
                      placeholder="Enter email address"
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
                )}

                {/* Password (only in create mode) */}
                {!isEditMode && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                      Password <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={formData.password}
                      onChangeText={(value) => updateField('password', value)}
                      placeholder="Enter password (min 6 characters)"
                      secureTextEntry
                      style={{
                        borderWidth: 1,
                        borderColor: errors.password ? '#EF4444' : Theme.colors.border,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        backgroundColor: '#fff',
                      }}
                    />
                    {errors.password && (
                      <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.password}</Text>
                    )}
                  </View>
                )}

                {/* Phone Number */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Phone Number <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <CountryPhoneSelector
                    selectedCountry={selectedCountry}
                    onSelectCountry={setSelectedCountry}
                    phoneValue={formData.phone}
                    onPhoneChange={(value) => updateField('phone', value)}
                    size="medium"
                  />
                  {errors.phone && (
                    <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.phone}</Text>
                  )}
                </View>

                {/* Gender */}
                <OptionSelector
                  label="Gender"
                  options={[
                    { label: 'Male', value: 'MALE', icon: '👨' },
                    { label: 'Female', value: 'FEMALE', icon: '👩' },
                  ]}
                  selectedValue={formData.gender || null}
                  onSelect={(value) => updateField('gender', value as UserGender)}
                  required={true}
                  containerStyle={{ marginBottom: 16 }}
                />
                {errors.gender && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: -10, marginBottom: 16 }}>
                    {errors.gender}
                  </Text>
                )}
              </Card>

              {/* Work Information */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                  💼 Work Information
                </Text>

                {/* Role */}
                <SearchableDropdown
                  label="Role"
                  placeholder="Select a role"
                  items={roleData.map(role => ({
                    id: role.s_no,
                    label: role.role_name,
                    value: role.s_no,
                  }))}
                  selectedValue={formData.role_id}
                  onSelect={(item) => updateField('role_id', item.id)}
                  loading={loadingRoles}
                  error={errors.role_id}
                  required={true}
                />

                {/* <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Current PG
                  </Text>
                  <View
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <Text style={{ color: Theme.colors.text.primary, fontSize: 14 }}>
                      {selectedPGLocation?.location_name || 'No PG selected'}
                    </Text>
                  </View>
                </View> */}
              </Card>

              {/* Address Information */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
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
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Address
                  </Text>
                  <TextInput
                    value={formData.address}
                    onChangeText={(value) => updateField('address', value)}
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

                {/* Pincode */}
                <View style={{ marginBottom: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                    Pincode
                  </Text>
                  <TextInput
                    value={formData.pincode}
                    onChangeText={(value) => updateField('pincode', value)}
                    placeholder="Enter pincode (optional)"
                    keyboardType="number-pad"
                    maxLength={6}
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

              {/* Profile Images */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                  📷 Profile Image
                </Text>
                <ImageUploadS3
                  images={profileImages}
                  onImagesChange={setProfileImages}
                  maxImages={1}
                  label="Profile Photo"
                  disabled={loading}
                  folder={getFolderConfig().employees.images}
                  useS3={true}
                  entityId={employeeId?.toString()}
                  autoSave={false}
                />
              </Card>

              {/* Proof Documents */}
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
                  📄 Proof Documents
                </Text>
                <ImageUploadS3
                  images={proofDocuments}
                  onImagesChange={setProofDocuments}
                  maxImages={3}
                  label="ID Proof / Documents"
                  disabled={loading}
                  folder={getFolderConfig().employees.documents}
                  useS3={true}
                  entityId={employeeId?.toString()}
                  autoSave={false}
                />
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 8 }}>
                  Upload Aadhaar, PAN, Driving License, or other ID proofs (max 3 documents)
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
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
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
