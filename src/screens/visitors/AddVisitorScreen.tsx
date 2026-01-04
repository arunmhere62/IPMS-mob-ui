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
import { DatePicker } from '../../components/DatePicker';
import { useCreateVisitorMutation, useUpdateVisitorMutation, useGetVisitorByIdQuery } from '../../services/api/visitorsApi';
import { useGetAllBedsQuery, useGetAllRoomsQuery } from '../../services/api/roomsApi';
import { useLazyGetCitiesQuery, useLazyGetStatesQuery } from '../../services/api/locationApi';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';

interface AddVisitorScreenProps {
  navigation: any;
  route?: any;
}

export default function AddVisitorScreen({ navigation, route }: AddVisitorScreenProps) {
  const { visitorId } = route?.params || {};
  const isEditMode = Boolean(visitorId);

  const { isAdmin, isSuperAdmin } = usePermissions();
  const canManageVisitors = isAdmin || isSuperAdmin;

  useEffect(() => {
    if (canManageVisitors) return;
    Alert.alert('Access Denied', 'Only Admin/Super Admin can manage Visitors.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [canManageVisitors, navigation]);

  const [createVisitor, { isLoading: isCreating }] = useCreateVisitorMutation();
  const [updateVisitor, { isLoading: isUpdating }] = useUpdateVisitorMutation();
  const loading = isCreating || isUpdating;

  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);

  const [fetchStatesTrigger] = useLazyGetStatesQuery();
  const [fetchCitiesTrigger] = useLazyGetCitiesQuery();
  
  const { data: visitorData, isLoading: loadingData } = useGetVisitorByIdQuery(visitorId, { skip: !isEditMode });
  
  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [convertedToTenant, setConvertedToTenant] = useState(false);
  
  // Predefined purpose options
  const purposeOptions = [
    { id: 1, label: 'Room Inquiry', value: 'Room Inquiry' },
    { id: 2, label: 'Property Visit', value: 'Property Visit' },
    { id: 3, label: 'Meeting', value: 'Meeting' },
    { id: 4, label: 'Inspection', value: 'Inspection' },
    { id: 5, label: 'Maintenance', value: 'Maintenance' },
    { id: 6, label: 'Document Submission', value: 'Document Submission' },
    { id: 7, label: 'Payment', value: 'Payment' },
    { id: 8, label: 'Other', value: 'Other' },
  ];
  
  // Dropdowns
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const {
    data: roomsResponse,
    isFetching: isRoomsFetching,
    refetch: refetchRooms,
  } = useGetAllRoomsQuery(
    selectedPGLocationId ? { page: 1, limit: 100, pg_id: selectedPGLocationId } : (undefined as any),
    { skip: !selectedPGLocationId }
  );

  const {
    data: bedsResponse,
    isFetching: isBedsFetching,
    refetch: refetchBeds,
  } = useGetAllBedsQuery(
    selectedRoomId && selectedPGLocationId
      ? { room_id: selectedRoomId, page: 1, limit: 100, pg_id: selectedPGLocationId }
      : (undefined as any),
    { skip: !selectedRoomId || !selectedPGLocationId }
  );

  useEffect(() => {
    if (selectedPGLocationId) {
      refetchRooms();
    }
    fetchStates();
    
    // Removed loadVisitorData - handled by RTK Query
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      refetchBeds();
    } else {
      setBeds([]);
      setSelectedBedId(null);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    setLoadingRooms(isRoomsFetching);
  }, [isRoomsFetching]);

  useEffect(() => {
    setLoadingBeds(isBedsFetching);
  }, [isBedsFetching]);

  useEffect(() => {
    setRooms((roomsResponse as any)?.data || []);
  }, [roomsResponse]);

  useEffect(() => {
    if (!selectedRoomId) return;
    setBeds((bedsResponse as any)?.data || []);
  }, [bedsResponse, selectedRoomId]);

  useEffect(() => {
    if (selectedStateId) {
      const selectedState = states.find(s => s.s_no === selectedStateId);
      if (selectedState) {
        fetchCities(selectedState.iso_code);
      }
    } else {
      setCities([]);
      setSelectedCityId(null);
    }
  }, [selectedStateId, states]);

  // Populate form when visitor data loads
  React.useEffect(() => {
    if (visitorData && isEditMode) {
      setVisitorName(visitorData.visitor_name || '');
      setPhoneNo(visitorData.phone_no || '');
      const visitorPurpose = visitorData.purpose || '';
      const predefinedPurpose = purposeOptions.find(p => p.value === visitorPurpose);
      if (predefinedPurpose) {
        setPurpose(visitorPurpose);
      } else if (visitorPurpose) {
        setPurpose('Other');
        setCustomPurpose(visitorPurpose);
      }
      setVisitedDate(visitorData.visited_date || new Date().toISOString().split('T')[0]);
      setRemarks(visitorData.remarks || '');
      setConvertedToTenant(visitorData.convertedTo_tenant || false);
      setSelectedRoomId(visitorData.visited_room_id || null);
      setSelectedBedId(visitorData.visited_bed_id || null);
      setSelectedCityId(visitorData.city_id || null);
      setSelectedStateId(visitorData.state_id || null);
    }
  }, [visitorData, isEditMode]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetchStatesTrigger({ countryCode: 'IN' }).unwrap();
      if (response?.success) {
        const items = (response as any)?.data;
        setStates(Array.isArray(items) ? items : []);
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
      const response = await fetchCitiesTrigger({ stateCode }).unwrap();
      if (response?.success) {
        const items = (response as any)?.data;
        setCities(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      Alert.alert('Validation Error', 'Please enter visitor name');
      return;
    }

    if (!phoneNo.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return;
    }

    try {
      // setLoading(true); // Loading now managed by RTK hooks
      
      const finalPurpose = purpose === 'Other' ? customPurpose : purpose;
      
      const data = {
        visitor_name: visitorName,
        phone_no: phoneNo,
        purpose: finalPurpose || undefined,
        visited_date: visitedDate || undefined,
        visited_room_id: selectedRoomId || undefined,
        visited_bed_id: selectedBedId || undefined,
        city_id: selectedCityId || undefined,
        state_id: selectedStateId || undefined,
        remarks: remarks || undefined,
        convertedTo_tenant: convertedToTenant,
      };

      if (isEditMode) {
        const res = await updateVisitor({ id: visitorId, data }).unwrap();
        showSuccessAlert(res);
      } else {
        const res = await createVisitor(data).unwrap();
        showSuccessAlert(res);
      }
      
      navigation.goBack();
    } catch (error: any) {
      showErrorAlert(error, 'Error');
    }
  };

  if (loadingData) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader 
          title={isEditMode ? 'Edit Visitor' : 'Add Visitor'} 
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading visitor data...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader 
        title={isEditMode ? 'Edit Visitor' : 'Add Visitor'} 
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
          {/* Basic Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
              👤 Basic Information
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Visitor Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                }}
                placeholder="Enter visitor name"
                value={visitorName}
                onChangeText={setVisitorName}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Phone Number <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                }}
                placeholder="Enter phone number"
                value={phoneNo}
                onChangeText={setPhoneNo}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <SearchableDropdown
                label="Purpose of Visit"
                placeholder="Select purpose"
                items={purposeOptions}
                selectedValue={purposeOptions.find(p => p.value === purpose)?.id || null}
                onSelect={(item) => {
                  setPurpose(item.value);
                  if (item.value !== 'Other') {
                    setCustomPurpose('');
                  }
                }}
                loading={false}
                required={false}
              />
            </View>

            {/* Custom Purpose Input (shown when 'Other' is selected) */}
            {purpose === 'Other' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                  Specify Purpose
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: Theme.colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    backgroundColor: '#fff',
                  }}
                  placeholder="Enter custom purpose"
                  value={customPurpose}
                  onChangeText={setCustomPurpose}
                />
              </View>
            )}

            <View style={{ marginBottom: 0 }}>
              <DatePicker
                label="Visit Date"
                value={visitedDate}
                onChange={setVisitedDate}
                required={false}
              />
            </View>
          </Card>

          {/* Room & Bed Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
              🏠 Room & Bed Information
            </Text>

            <SearchableDropdown
              label="Room"
              placeholder="Select a room"
              items={rooms.map(room => ({
                id: room.s_no,
                label: `Room ${room.room_no}`,
                value: room.s_no,
              }))}
              selectedValue={selectedRoomId}
              onSelect={(item) => setSelectedRoomId(item.id)}
              loading={loadingRooms}
              required={false}
            />

            {selectedRoomId && (
              <SearchableDropdown
                label="Bed"
                placeholder="Select a bed"
                items={beds.map(bed => ({
                  id: bed.s_no,
                  label: `Bed ${bed.bed_no}`,
                  value: bed.s_no,
                }))}
                selectedValue={selectedBedId}
                onSelect={(item) => setSelectedBedId(item.id)}
                loading={loadingBeds}
                disabled={!selectedRoomId}
                required={false}
              />
            )}
          </Card>

          {/* Location Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
              📍 Location Information
            </Text>

            <SearchableDropdown
              label="State"
              placeholder="Select a state"
              items={states.map(state => ({
                id: state.s_no,
                label: state.name,
                value: state.iso_code,
              }))}
              selectedValue={selectedStateId}
              onSelect={(item) => setSelectedStateId(item.id)}
              loading={loadingStates}
              required={false}
            />

            {selectedStateId && (
              <SearchableDropdown
                label="City"
                placeholder="Select a city"
                items={cities.map(city => ({
                  id: city.s_no,
                  label: city.name,
                  value: city.s_no,
                }))}
                selectedValue={selectedCityId}
                onSelect={(item) => setSelectedCityId(item.id)}
                loading={loadingCities}
                disabled={!selectedStateId}
                required={false}
              />
            )}
          </Card>

          {/* Additional Information */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 16 }}>
              📝 Additional Information
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
                Remarks
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: '#fff',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter any additional notes"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={{ marginBottom: 0 }}>
              <TouchableOpacity
                onPress={() => setConvertedToTenant(!convertedToTenant)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 8,
                }}
              >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: convertedToTenant ? Theme.colors.primary : Theme.colors.border,
                backgroundColor: convertedToTenant ? Theme.colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {convertedToTenant && (
                  <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                )}
              </View>
                <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
                  Converted to Tenant
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {isEditMode ? 'Update Visitor' : 'Add Visitor'}
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
