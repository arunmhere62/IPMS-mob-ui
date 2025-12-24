import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Theme } from '../theme';
import { SearchableDropdown } from './SearchableDropdown';
import { DatePicker } from './DatePicker';
import { SlideBottomModal } from './SlideBottomModal';
import visitorService, { Visitor } from '../services/visitors/visitorService';
import { useGetAllRoomsQuery, useGetAllBedsQuery } from '../services/api/roomsApi';
import axiosInstance from '../services/core/axiosInstance';
import { CountryPhoneSelector } from './CountryPhoneSelector';
import { COUNTRIES } from './CountryPhoneSelector';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';

interface VisitorFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitorId?: number; // For edit mode
}

export const VisitorFormModal: React.FC<VisitorFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  visitorId,
}) => {
  const isEditMode = !!visitorId;
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to India
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
  } = useGetAllRoomsQuery({ page: 1, limit: 100 });

  const {
    data: bedsResponse,
    isFetching: isBedsFetching,
    refetch: refetchBeds,
  } = useGetAllBedsQuery(
    selectedRoomId
      ? {
          room_id: selectedRoomId,
          page: 1,
          limit: 100,
        }
      : (undefined as any),
    { skip: !selectedRoomId }
  );

  useEffect(() => {
    if (visible) {
      refetchRooms();
      fetchStates();
      
      if (isEditMode) {
        loadVisitorData();
      } else {
        resetForm();
      }
    }
  }, [visible, isEditMode]);

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
  }, [selectedStateId]);

  const handleStateChange = (stateId: number) => {
    const selectedState = states.find(s => s.s_no === stateId);
    if (selectedState) {
      setSelectedStateId(stateId);
      setSelectedCityId(null);
      setCities([]);
      fetchCities(selectedState.iso_code);
    }
  };

  const resetForm = () => {
    setVisitorName('');
    setPhoneNo('');
    setPurpose('');
    setCustomPurpose('');
    setVisitedDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setConvertedToTenant(false);
    setSelectedRoomId(null);
    setSelectedBedId(null);
    setSelectedStateId(null);
    setSelectedCityId(null);
  };

  const loadVisitorData = async () => {
    try {
      setLoadingData(true);
      const visitor: Visitor = await visitorService.getVisitorById(visitorId!);
      
      setVisitorName(visitor.visitor_name || '');
      setPhoneNo(visitor.phone_no || '');
      const visitorPurpose = visitor.purpose || '';
      const predefinedPurpose = purposeOptions.find(p => p.value === visitorPurpose);
      if (predefinedPurpose) {
        setPurpose(visitorPurpose);
      } else if (visitorPurpose) {
        setPurpose('Other');
        setCustomPurpose(visitorPurpose);
      }
      setVisitedDate(visitor.visited_date || new Date().toISOString().split('T')[0]);
      setRemarks(visitor.remarks || '');
      setConvertedToTenant(visitor.convertedTo_tenant || false);
      setSelectedRoomId(visitor.visited_room_id || null);
      setSelectedBedId(visitor.visited_bed_id || null);
      setSelectedStateId(visitor.state_id || null);
      setSelectedCityId(visitor.city_id || null);
    } catch (error: any) {
      console.error('Error loading visitor data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await axiosInstance.get('/location/states', {
        params: { countryCode: 'IN' },
      });
      if (response.data.success) {
        const statesData = response.data.data || [];
        setStates(statesData);
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
        const citiesData = response.data.data || [];
        setCities(citiesData);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      alert('Please enter visitor name');
      return;
    }

    if (!phoneNo.trim()) {
      alert('Please enter phone number');
      return;
    }

    try {
      setLoading(true);
      
      const finalPurpose = purpose === 'Other' ? customPurpose : purpose;
      
      const data = {
        visitor_name: visitorName,
        phone_no: selectedCountry.phoneCode + phoneNo,
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
        const response = await visitorService.updateVisitor(visitorId!, data);
        showSuccessAlert(response);
      } else {
        const response = await visitorService.createVisitor(data);
        showSuccessAlert(response);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      showErrorAlert(error, 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={onClose}
      title={isEditMode ? 'Edit Visitor' : 'Add Visitor'}
      subtitle={isEditMode ? 'Update visitor information' : 'Enter visitor details'}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel={isEditMode ? 'Update Visitor' : 'Add Visitor'}
      cancelLabel="Cancel"
      isLoading={loading}
    >
      {loadingData ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading visitor data...</Text>
        </View>
      ) : (
        <>
          {/* Basic Information */}
                  <View style={{ marginBottom: 24 }}>
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
                      <CountryPhoneSelector
                        selectedCountry={selectedCountry}
                        onSelectCountry={setSelectedCountry}
                        phoneValue={phoneNo}
                        onPhoneChange={setPhoneNo}
                        size="medium"
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
                  </View>

                  {/* Room & Bed Information */}
                  <View style={{ marginBottom: 24 }}>
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
                  </View>

                  {/* Location Information */}
                  <View style={{ marginBottom: 24 }}>
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
                      onSelect={(item) => {
                        if (item.id === 0 || !item.id) {
                          setSelectedStateId(null);
                          setSelectedCityId(null);
                          setCities([]);
                        } else {
                          handleStateChange(item.id);
                        }
                      }}
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
                        onSelect={(item) => {
                          if (item.id === 0 || !item.id) {
                            setSelectedCityId(null);
                          } else {
                            setSelectedCityId(item.id);
                          }
                        }}
                        loading={loadingCities}
                        disabled={!selectedStateId}
                        required={false}
                      />
                    )}
                  </View>

                  {/* Additional Information */}
                  <View style={{ marginBottom: 24 }}>
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
                  </View>
                </>
              )}
    </SlideBottomModal>
  );
};
