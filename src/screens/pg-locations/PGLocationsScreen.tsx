import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { setSelectedPGLocation } from '../../store/slices/pgLocationSlice';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { AnimatedButton } from '../../components/AnimatedButton';
import { ActionButtons } from '../../components/ActionButtons';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { ImageUploadS3 } from '../../components/ImageUploadS3';
import { OptionSelector } from '../../components/OptionSelector';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { getFolderConfig } from '../../config/aws.config';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { useGetStatesQuery, useLazyGetCitiesQuery } from '../../services/api/locationApi';
import {
  useLazyGetPGLocationsQuery,
  useCreatePGLocationMutation,
  useUpdatePGLocationMutation,
  useDeletePGLocationMutation,
} from '../../services/api/pgLocationsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface PGLocationsScreenProps {
  navigation: any;
}

interface PGLocation {
  s_no: number;
  location_name: string;
  address: string;
  pincode?: string;
  status: 'ACTIVE' | 'INACTIVE';
  images?: string[] | null;
  city_id?: number;
  state_id?: number;
  city?: {
    s_no: number;
    name: string;
    state_code?: string;
  };
  state?: {
    s_no: number;
    name: string;
    iso_code?: string;
  };
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

interface FormData {
  locationName: string;
  address: string;
  pincode: string;
  stateId: number | null;
  cityId: number | null;
  images: string[];
  rentCycleStart: number | null;
  rentCycleEnd: number | null;
  rentCycleType: 'CALENDAR' | 'MIDMONTH';
  pgType: 'COLIVING' | 'MENS' | 'WOMENS';
}

export const PGLocationsScreen: React.FC<PGLocationsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const route = useRoute<any>();
  const { can } = usePermissions();

  const canCreate = can(Permission.CREATE_PG_LOCATION);
  const canEdit = can(Permission.EDIT_PG_LOCATION);
  const canDelete = can(Permission.DELETE_PG_LOCATION);
  const [pgLocations, setPgLocations] = useState<PGLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPG, setSelectedPG] = useState<PGLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    locationName: '',
    address: '',
    pincode: '',
    stateId: null,
    cityId: null,
    images: [],
    rentCycleStart: null,
    rentCycleEnd: null,
    rentCycleType: 'CALENDAR',
    pgType: 'COLIVING',
  });

  // Dropdown data
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const { data: statesResponse, isFetching: isFetchingStates } = useGetStatesQuery({ countryCode: 'IN' });
  const [fetchCitiesTrigger] = useLazyGetCitiesQuery();

  const [fetchPGLocationsTrigger] = useLazyGetPGLocationsQuery();
  const [createPGLocation] = useCreatePGLocationMutation();
  const [updatePGLocation] = useUpdatePGLocationMutation();
  const [deletePGLocation] = useDeletePGLocationMutation();

  useEffect(() => {
    loadPGLocations();
  }, []);

  useEffect(() => {
    const editPgId = route?.params?.editPgId;
    if (!editPgId) return;
    const target = pgLocations.find((p) => p.s_no === Number(editPgId));
    if (!target) return;
    openEditModal(target);
    navigation.setParams({ editPgId: undefined });
  }, [route?.params?.editPgId, pgLocations]);

  useEffect(() => {
    setLoadingStates(isFetchingStates);
  }, [isFetchingStates]);

  useEffect(() => {
    if (statesResponse?.success) {
      setStates(statesResponse.data);
    }
  }, [statesResponse]);

  const loadPGLocations = async () => {
    setLoading(true);
    try {
      const response = await fetchPGLocationsTrigger({ _t: Date.now() }).unwrap();
      const unwrapArray = (v: any): PGLocation[] => {
        if (Array.isArray(v)) return v as PGLocation[];
        if (Array.isArray(v?.data)) return v.data as PGLocation[];
        if (Array.isArray(v?.data?.data)) return v.data.data as PGLocation[];
        if (Array.isArray(v?.data?.data?.data)) return v.data.data.data as PGLocation[];
        return [] as PGLocation[];
      };

      const items = unwrapArray(response);
      setPgLocations(items);
      return items;
    } catch (error) {
      Alert.alert('Error', 'Failed to load PG locations');
      setPgLocations([]);
      return [] as PGLocation[];
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await fetchCitiesTrigger({ stateCode }).unwrap();
      if (response.success) {
        setCities(response.data);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStateChange = (stateId: number) => {
    const selectedState = states.find(s => s.s_no === stateId);
    if (selectedState) {
      setFormData({ ...formData, stateId, cityId: null });
      setCities([]);
      loadCities(selectedState.iso_code);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPGLocations();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    if (!canCreate) {
      Alert.alert('Access Denied', "You don't have permission to create PG locations");
      return;
    }
    setEditMode(false);
    setSelectedPG(null);
    setFormData({
      locationName: '',
      address: '',
      pincode: '',
      stateId: null,
      cityId: null,
      images: [],
      rentCycleStart: null,
      rentCycleEnd: null,
      rentCycleType: 'CALENDAR',
      pgType: 'COLIVING',
    });
    setCities([]);
    setModalVisible(true);
  };

  const openEditModal = (pg: PGLocation) => {
    if (!canEdit) {
      Alert.alert('Access Denied', "You don't have permission to edit PG locations");
      return;
    }
    setEditMode(true);
    setSelectedPG(pg);
    setFormData({
      locationName: pg.location_name,
      address: pg.address,
      pincode: pg.pincode || '',
      stateId: pg.state_id || null,
      cityId: pg.city_id || null,
      images: pg.images || [],
      rentCycleStart: (pg as any).rent_cycle_start || null,
      rentCycleEnd: (pg as any).rent_cycle_end || null,
      rentCycleType: ((pg as any).rent_cycle_type || 'CALENDAR') as 'CALENDAR' | 'MIDMONTH',
      pgType: ((pg as any).pg_type || 'COLIVING') as 'COLIVING' | 'MENS' | 'WOMENS',
    });
    
    // Load cities for the selected state
    if (pg.state?.iso_code) {
      loadCities(pg.state.iso_code);
    }
    
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({
      locationName: '',
      address: '',
      pincode: '',
      stateId: null,
      cityId: null,
      images: [],
      rentCycleStart: null,
      rentCycleEnd: null,
      rentCycleType: 'CALENDAR',
      pgType: 'COLIVING',
    });
    setCities([]);
  };

  const validateForm = () => {
    if (!formData.locationName.trim()) {
      Alert.alert('Error', 'Please enter PG location name');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter address');
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        locationName: formData.locationName,
        address: formData.address,
        stateId: formData.stateId!,
        cityId: formData.cityId!,
        images: formData.images,
        rentCycleType: formData.rentCycleType,
        pgType: formData.pgType,
      };

      // Only include pincode if it has a value
      if (formData.pincode && formData.pincode.trim()) {
        payload.pincode = formData.pincode.trim();
      }

      // Only include rent cycle dates if rent cycle type is MIDMONTH
      if (formData.rentCycleType === 'MIDMONTH') {
        if (formData.rentCycleStart !== null) {
          payload.rentCycleStart = formData.rentCycleStart;
        }
        if (formData.rentCycleEnd !== null) {
          payload.rentCycleEnd = formData.rentCycleEnd;
        }
      }

      if (editMode && selectedPG) {
        // Update
        await updatePGLocation({ id: selectedPG.s_no, data: payload }).unwrap();
        showSuccessAlert('PG location updated successfully');
        await loadPGLocations();
        closeModal();
      } else {
        // Create
        await createPGLocation(payload).unwrap();
        showSuccessAlert('PG location created successfully');
        await loadPGLocations();
        closeModal();
      }
    } catch (error: any) {
       showErrorAlert(error, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (pg: PGLocation) => {
    if (!canDelete) {
      Alert.alert('Access Denied', "You don't have permission to delete PG locations");
      return;
    }
    showDeleteConfirmation({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete',
      itemName: pg.location_name,
      onConfirm: async () => {
        try {
          await deletePGLocation(pg.s_no).unwrap();
          const wasSelected = selectedPGLocationId === pg.s_no;
          const updatedLocations = await loadPGLocations();

          if (wasSelected) {
            if (updatedLocations.length > 0) {
              dispatch(setSelectedPGLocation(updatedLocations[0].s_no));
            } else {
              dispatch(setSelectedPGLocation(null));
            }
          }

          showSuccessAlert('PG location deleted successfully');
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
        }
      },
    });
  };

  const renderPGCard = (pg: PGLocation) => (
    <Card key={pg.s_no} className="mb-4">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.text.primary, marginBottom: 4 }}>
            {pg.location_name}
          </Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 8 }}>
            {pg.address}
          </Text>
          
          {pg.city && pg.state && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                📍 {pg.city.name}, {pg.state.name}
              </Text>
              {pg.pincode && (
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginLeft: 8 }}>
                  • {pg.pincode}asdasd
                </Text>
              )}
            </View>
          )}

          {/* Images Preview */}
          {pg.images && pg.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {pg.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
              ))}
            </ScrollView>
          )}

          <View
            style={{
              backgroundColor: pg.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              alignSelf: 'flex-start',
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: pg.status === 'ACTIVE' ? '#059669' : '#DC2626',
              }}
            >
              {pg.status}
            </Text>
          </View>
        </View>

        <ActionButtons
          onView={() => navigation.navigate('PGDetails', { pgId: pg.s_no })}
          onEdit={() => openEditModal(pg)}
          onDelete={() => handleDelete(pg)}
          showView={true}
          showEdit={true}
          showDelete={true}
          disableEdit={!canEdit}
          disableDelete={!canDelete}
          blockPressWhenDisabled
        />
      </View>
    </Card>
  );

  return (
    <>
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader 
          title="PG Locations" 
          subtitle="Manage your PG locations"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1, backgroundColor: Theme.colors.light }}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {loading ? (
              <View style={{ paddingTop: 8 }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Card key={idx} style={{ marginBottom: 12, padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <SkeletonLoader width={36} height={36} borderRadius={10} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                          <SkeletonLoader width={180} height={14} style={{ marginBottom: 6 }} />
                          <SkeletonLoader width={140} height={10} />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <SkeletonLoader width={28} height={28} borderRadius={8} />
                        <SkeletonLoader width={28} height={28} borderRadius={8} />
                      </View>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <SkeletonLoader width="85%" height={10} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width="60%" height={10} />
                    </View>
                  </Card>
                ))}
              </View>
            ) : pgLocations.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🏢</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.text.primary, marginBottom: 8 }}>
                  No PG Locations Yet
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, textAlign: 'center' }}>
                  Add your first PG location to get started
                </Text>
              </View>
            ) : (
              pgLocations.map(renderPGCard)
            )}
          </ScrollView>

          {/* Floating Add Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 90,
              right: 20,
              backgroundColor: Theme.colors.primary,
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              opacity: canCreate ? 1 : 0.45,
            }}
            onPress={openCreateModal}
            disabled={!canCreate}
          >
            <Text style={{ fontSize: 32, color: 'white', lineHeight: 32 }}>+</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>

      {/* Form Modal */}
      <SlideBottomModal
        visible={modalVisible}
        onClose={closeModal}
        title={editMode ? 'Edit PG Location' : 'Add PG Location'}
        subtitle={editMode ? selectedPG?.location_name : 'Create a new PG location'}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        submitLabel={editMode ? 'Update' : 'Create'}
        cancelLabel="Cancel"
        isLoading={submitting}
      >
        {/* Location Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Location Name <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: Theme.colors.light,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            placeholder="Enter PG location name"
            value={formData.locationName}
            onChangeText={(text) => setFormData({ ...formData, locationName: text })}
            editable={!submitting}
          />
        </View>

        {/* Address */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Address <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: Theme.colors.light,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Enter complete address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
            editable={!submitting}
          />
        </View>

        {/* State */}
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
              if (item.id === 0 || !item.id) {
                setFormData({ ...formData, stateId: null, cityId: null });
              } else {
                handleStateChange(item.id);
              }
            }}
            loading={loadingStates}
            required
          />
        </View>

        {/* City */}
        {formData.stateId && (
          <View style={{ marginBottom: 16 }}>
            <SearchableDropdown
              label="City"
              placeholder="Select a city"
              items={cities.map(city => ({
                id: city.s_no,
                label: city.name,
                value: city.s_no,
              }))}
              selectedValue={formData.cityId}
              onSelect={(item) => {
                if (item.id === 0 || !item.id) {
                  setFormData({ ...formData, cityId: null });
                } else {
                  setFormData({ ...formData, cityId: item.id });
                }
              }}
              loading={loadingCities}
              required
            />
          </View>
        )}

        {/* Pincode */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Pincode
          </Text>
          <TextInput
            style={{
              backgroundColor: Theme.colors.light,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            placeholder="Enter pincode (optional)"
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text })}
            keyboardType="numeric"
            editable={!submitting}
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
            onPress={() => setFormData(prev => ({
              ...prev,
              rentCycleType: 'CALENDAR',
              rentCycleStart: 1,
              rentCycleEnd: 30,
            }))}
            disabled={submitting}
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
            onPress={() => setFormData(prev => ({
              ...prev,
              rentCycleType: 'MIDMONTH',
              rentCycleStart: 1,
              rentCycleEnd: 30,
            }))}
            disabled={submitting}
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

        {/* Conditional Info Box for MIDMONTH */}
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

        {/* PG Type */}
        <OptionSelector
          label="PG Type"
          description="Type of accommodation"
          options={[
            { label: 'COLIVING', value: 'COLIVING', icon: '👥' },
            { label: 'MENS', value: 'MENS', icon: '👨' },
            { label: 'WOMENS', value: 'WOMENS', icon: '👩' },
          ]}
          selectedValue={formData.pgType}
          onSelect={(value) => setFormData({ ...formData, pgType: value as 'COLIVING' | 'MENS' | 'WOMENS' })}
          required={true}
          disabled={submitting}
          containerStyle={{ marginBottom: 16 }}
        />

        {/* Images */}
        <View style={{ marginBottom: 16 }}>
          <ImageUploadS3
            images={formData.images}
            onImagesChange={(images: string[]) => setFormData((prev) => ({ ...prev, images }))}
            maxImages={2}
            label="PG Location Images"
            disabled={submitting}
            folder={getFolderConfig().pgLocations?.images || 'pg-locations/images'}
            useS3={true}
            entityId={selectedPG?.s_no?.toString()}
            autoSave={false}
          />
        </View>
      </SlideBottomModal>
    </>
  );
};
