import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import userService from '../../services/userService';
import { updateUser } from '../../store/slices/authSlice';
import axiosInstance from '../../services/core/axiosInstance';

interface UserProfileScreenProps {
  navigation: any;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [stateName, setStateName] = useState<string>('');
  const [cityName, setCityName] = useState<string>('');
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // Fetch fresh profile data on component mount
    if (user?.s_no) {
      fetchProfileData();
    }
  }, [user?.s_no]);

  const fetchProfileData = async () => {
    try {
      if (user?.s_no) {
        const profileResponse = await userService.getUserProfile(user.s_no);

        // Handle the nested API response structure
        const data = profileResponse.data?.data || profileResponse.data;

        if (data && (profileResponse.success || data.success)) {
          // Store complete profile data in local state
          setProfileData(data);

          // Update Redux store with basic user data (excluding nested objects)
          dispatch(updateUser({
            name: data.name,
            email: data.email,
            phone: data.phone,
            role_id: data.role_id,
            role_name: data.role_name,
            organization_id: data.organization_id,
            organization_name: data.organization_name,
            pg_id: data.pg_id,
            status: data.status,
            address: data.address,
            city_id: data.city_id,
            state_id: data.state_id,
            gender: data.gender,
            profile_images: data.profile_images,
          }));

          // Update state and city names from the fresh data
          if (data.state_name) {
            setStateName(data.state_name);
          }
          if (data.city_name) {
            setCityName(data.city_name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fallback to existing methods on error
      if (user?.state_id) {
        fetchStateName(user.state_id);
      }
      if (user?.city_id) {
        fetchCityName(user.city_id);
      }
    }
  };

  useEffect(() => {
    if (user?.state_id) {
      fetchStateName(user.state_id);
    }
    if (user?.city_id) {
      fetchCityName(user.city_id);
    }
  }, [user?.state_id, user?.city_id]);

  const fetchStateName = async (stateId: number) => {
    try {
      const response = await axiosInstance.get('/location/states', {
        params: { countryCode: 'IN' },
      });
      if (response.data.success) {
        const states = response.data.data || [];
        const state = states.find((s: any) => s.s_no === stateId);
        if (state) {
          setStateName(state.name);
        }
      }
    } catch (error) {
      console.error('Error fetching state name:', error);
    }
  };

  const fetchCityName = async (cityId: number) => {
    try {
      // We need to get the state code first to fetch cities
      if (user?.state_id) {
        const stateResponse = await axiosInstance.get('/location/states', {
          params: { countryCode: 'IN' },
        });
        if (stateResponse.data.success) {
          const states = stateResponse.data.data || [];
          const state = states.find((s: any) => s.s_no === user.state_id);
          if (state) {
            const cityResponse = await axiosInstance.get('/location/cities', {
              params: { stateCode: state.iso_code },
            });
            if (cityResponse.data.success) {
              const cities = cityResponse.data.data || [];
              const city = cities.find((c: any) => c.s_no === cityId);
              if (city) {
                setCityName(city.name);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching city name:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.s_no) {
        // Fetch fresh profile data from API
        const profileResponse = await userService.getUserProfile(user.s_no);

        // Handle the nested API response structure
        const data = profileResponse.data?.data || profileResponse.data;

        if (data && (profileResponse.success || data.success)) {
          // Store complete profile data in local state
          setProfileData(data);

          // Update Redux store with basic user data (excluding nested objects)
          dispatch(updateUser({
            name: data.name,
            email: data.email,
            phone: data.phone,
            role_id: data.role_id,
            role_name: data.role_name,
            organization_id: data.organization_id,
            organization_name: data.organization_name,
            pg_id: data.pg_id,
            status: data.status,
            address: data.address,
            city_id: data.city_id,
            state_id: data.state_id,
            gender: data.gender,
            profile_images: data.profile_images,
          }));

          // Update state and city names from the fresh data
          if (data.state_name) {
            setStateName(data.state_name);
          }
          if (data.city_name) {
            setCityName(data.city_name);
          }
        }
      }

      // Fallback to existing methods if needed
      if (user?.state_id && !stateName) {
        await fetchStateName(user.state_id);
      }
      if (user?.city_id && !cityName) {
        await fetchCityName(user.city_id);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // Fallback to existing methods on error
      if (user?.state_id) {
        await fetchStateName(user.state_id);
      }
      if (user?.city_id) {
        await fetchCityName(user.city_id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      if (!user) return;

      await userService.changePassword(user.s_no, data);

      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    return status === 'ACTIVE' ? '#10B981' : '#EF4444';
  };

  const getStatusBgColor = (status?: string) => {
    return status === 'ACTIVE' ? '#ECFDF5' : '#FEE2E2';
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return { bg: '#EFF6FF', color: '#3B82F6' };
      case 'ADMIN':
        return { bg: '#F3E8FF', color: '#A855F7' };
      case 'MANAGER':
        return { bg: '#FEF3C7', color: '#F59E0B' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const userData = user;
  const roleBadge = getRoleBadgeColor(userData?.role_name);

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="My Profile"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: CONTENT_COLOR }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header Card */}
        <Card
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 20,
            padding: 20,
            backgroundColor: Theme.colors.canvas,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Profile Image */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Theme.colors.background.secondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 2,
                borderColor: Theme.colors.border,
              }}
            >
              {userData?.profile_images ? (
                <Image
                  source={{ uri: userData.profile_images }}
                  style={{ width: 76, height: 76, borderRadius: 38 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{
                  color: Theme.colors.text.secondary,
                  fontSize: 28,
                  fontWeight: '600'
                }}>
                  {getInitials(userData?.name || 'User')}
                </Text>
              )}
            </View>

            {/* User Info */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: Theme.colors.text.primary,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                {userData?.name}
              </Text>

              {/* Role and Status Row */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8
              }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: roleBadge.bg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: roleBadge.color,
                    }}
                  >
                    {userData?.role_name?.replace('_', ' ') || 'User'}
                  </Text>
                </View>

                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: userData?.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                  }}
                />

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: Theme.colors.text.tertiary,
                  }}
                >
                  {userData?.status || 'ACTIVE'}
                </Text>
              </View>
            </View>

            {/* Organization */}
            {(userData?.organization_name || profileData?.organization_name) && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{
                  fontSize: 11,
                  color: Theme.colors.text.tertiary,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Organization
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: Theme.colors.text.primary,
                  marginBottom: 2,
                }}>
                  {profileData?.organization_name || userData?.organization_name}
                </Text>
                {profileData?.organization_description && (
                  <Text style={{
                    fontSize: 12,
                    color: Theme.colors.text.secondary,
                    fontStyle: 'italic',
                  }}>
                    {profileData.organization_description}
                  </Text>
                )}
              </View>
            )}

            {/* Location Information */}
            {(profileData?.city_name || profileData?.state_name || cityName || stateName) && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{
                  fontSize: 11,
                  color: Theme.colors.text.tertiary,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Location
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Ionicons name="location-outline" size={14} color={Theme.colors.text.tertiary} />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: Theme.colors.text.primary,
                    marginLeft: 4,
                  }}>
                    {(profileData?.city_name && profileData?.state_name)
                      ? `${profileData.city_name}, ${profileData.state_name}`
                      : (profileData?.city_name || profileData?.state_name || cityName || stateName || 'Not provided')
                    }
                  </Text>
                </View>
              </View>
            )}

            {/* PG Location */}
            {profileData?.pg_location && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{
                  fontSize: 11,
                  color: Theme.colors.text.tertiary,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  PG Location
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: Theme.colors.text.primary,
                  marginBottom: 2,
                }}>
                  {profileData.pg_location.location_name}
                </Text>
                {profileData.pg_location.address && (
                  <Text style={{
                    fontSize: 12,
                    color: Theme.colors.text.secondary,
                    marginBottom: 4,
                  }}>
                    {profileData.pg_location.address}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    backgroundColor: '#EFF6FF',
                    borderRadius: 4,
                    marginRight: 6,
                    marginBottom: 4,
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: '#3B82F6',
                      fontWeight: '500',
                    }}>
                      {profileData.pg_location.pg_type}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    backgroundColor: '#F0FDF4',
                    borderRadius: 4,
                    marginRight: 6,
                    marginBottom: 4,
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: '#16A34A',
                      fontWeight: '500',
                    }}>
                      {profileData.pg_location.rent_cycle_type}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Stats */}
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-around',
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: Theme.colors.primary,
                  marginBottom: 2
                }}>
                  {userData?.s_no || '--'}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: Theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  ID
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: Theme.colors.primary,
                  marginBottom: 2
                }}>
                  {userData?.pg_id || '--'}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: Theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  PG ID
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: Theme.colors.primary,
                  marginBottom: 2
                }}>
                  {userData?.role_id || '--'}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: Theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Role ID
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="mail" size={20} color={Theme.colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginLeft: 8,
              }}
            >
              Contact Information
            </Text>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="mail-outline" size={16} color={Theme.colors.text.tertiary} />
              <Text
                style={{
                  fontSize: 12,
                  color: Theme.colors.text.tertiary,
                  marginLeft: 6,
                }}
              >
                Email Address
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: Theme.colors.text.primary,
                marginLeft: 22,
              }}
            >
              {userData?.email || 'Not provided'}
            </Text>
          </View>

          {/* Phone */}
          {userData?.phone && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="call-outline" size={16} color={Theme.colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 12,
                    color: Theme.colors.text.tertiary,
                    marginLeft: 6,
                  }}
                >
                  Phone Number
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Theme.colors.text.primary,
                  marginLeft: 22,
                }}
              >
                {userData.phone}
              </Text>
            </View>
          )}

          {/* Address */}
          {userData?.address && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="home-outline" size={16} color={Theme.colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 12,
                    color: Theme.colors.text.tertiary,
                    marginLeft: 6,
                  }}
                >
                  Address
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Theme.colors.text.primary,
                  marginLeft: 22,
                  lineHeight: 22,
                }}
              >
                {userData.address}
              </Text>
            </View>
          )}
        </Card>

        {/* Personal Details */}
        <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="person" size={20} color={Theme.colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: Theme.colors.text.primary,
                marginLeft: 8,
              }}
            >
              Personal Details
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            {/* Gender */}
            {userData?.gender && (
              <View>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginBottom: 4 }}>
                  Gender
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {userData.gender}
                </Text>
              </View>
            )}

            {/* User ID */}
            <View>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginBottom: 4 }}>
                User ID
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                #{userData?.s_no}
              </Text>
            </View>

            {/* Joined Date */}
            {(userData?.created_at || profileData?.created_at) && (
              <View>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginBottom: 4 }}>
                  Member Since
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {new Date(profileData?.created_at || userData?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Account Settings */}
        <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings" size={20} color={Theme.colors.primary} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: Theme.colors.text.primary,
                  marginLeft: 8,
                }}
              >
                Account Settings
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: Theme.colors.border,
            }}
            onPress={() => setShowEditModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="create-outline" size={20} color={Theme.colors.text.secondary} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: Theme.colors.text.primary,
                  marginLeft: 12,
                }}
              >
                Edit Profile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: Theme.colors.border,
            }}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.text.secondary} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: Theme.colors.text.primary,
                  marginLeft: 12,
                }}
              >
                Change Password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
            onPress={() => {
              // Navigate to privacy settings
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.text.secondary} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: Theme.colors.text.primary,
                  marginLeft: 12,
                }}
              >
                Privacy & Security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        user={userData}
        onClose={() => setShowEditModal(false)}
        onProfileUpdated={onRefresh}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSave={handleChangePassword}
      />
    </ScreenLayout>
  );
};
