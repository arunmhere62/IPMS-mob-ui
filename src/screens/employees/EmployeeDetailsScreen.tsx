import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { CONTENT_COLOR } from '@/constant';
import { useDeleteEmployeeMutation, useGetEmployeeByIdQuery } from '../../services/api/employeesApi';
import { useGetUserPermissionsQuery } from '../../services/api/rbacApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

const DetailRow = ({
  label,
  value,
  isLast,
}: {
  label: string;
  value?: string | number | null;
  isLast?: boolean;
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: Theme.colors.border + '40',
      gap: 12,
    }}
  >
    <Text style={{ flex: 1, fontSize: 13, color: Theme.colors.text.secondary }}>
      {label}
    </Text>
    <Text
      style={{
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: Theme.colors.text.primary,
        textAlign: 'right',
      }}
    >
      {value === null || value === undefined || value === '' ? 'N/A' : String(value)}
    </Text>
  </View>
);

interface Role {
  s_no: number;
  role_name: string;
}

interface City {
  s_no: number;
  name: string;
}

interface State {
  s_no: number;
  name: string;
}

interface Employee {
  s_no: number;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  role_id: number | null;
  organization_id: number;
  gender: string;
  address: string | null;
  city_id: number | null;
  state_id: number | null;
  pincode: string | null;
  country: string | null;
  proof_documents: string | null;
  profile_images: string | string[] | null;
  created_at: string;
  updated_at: string;
  roles?: Role | null;
  city?: City | null;
  state?: State | null;
}

const EmployeeDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { employeeId } = route.params;
  const { can, isAdmin, isSuperAdmin } = usePermissions();
  const canEditEmployee = can(Permission.EDIT_EMPLOYEE);
  const canDeleteEmployee = can(Permission.DELETE_EMPLOYEE);
  const {
    data: employee,
    isLoading: loading,
    isFetching: refreshing,
    refetch,
    error,
  } = useGetEmployeeByIdQuery(employeeId);

  const { data: employeePerms } = useGetUserPermissionsQuery(employeeId);

  const [deleteEmployee] = useDeleteEmployeeMutation();

  const profileImageUri = (() => {
    const raw = employee?.profile_images;
    if (!raw) return null;

    let candidate: unknown = raw;

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (!trimmed) return null;

      // Some APIs store arrays as JSON strings
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          candidate = parsed;
        } catch {
          // fall through and treat as plain string
          candidate = trimmed;
        }
      } else {
        candidate = trimmed;
      }
    }

    const uri = Array.isArray(candidate) ? (candidate[0] as any) : (candidate as any);
    if (typeof uri !== 'string') return null;

    const finalUri = uri.trim();
    if (!finalUri) return null;

    // RN Image requires a valid URI scheme (http/https/file/content)
    if (!/^(https?:\/\/|file:\/\/|content:\/\/)/i.test(finalUri)) return null;
    return finalUri;
  })();

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = useCallback(() => {
    if (!canEditEmployee) {
      Alert.alert('Access Denied', "You don't have permission to edit employees");
      return;
    }
    (navigation as any).navigate('AddEmployee', { employeeId });
  }, [navigation, employeeId, canEditEmployee]);

  const handleDelete = () => {
    if (!canDeleteEmployee) {
      Alert.alert('Access Denied', "You don't have permission to delete employees");
      return;
    }
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employee?.name || 'this employee'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(employeeId).unwrap();
              showSuccessAlert('Employee deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              console.error('Error deleting employee:', error);
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Employee Details"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
              Loading employee details...
            </Text>
          </View>
        ) : !employee ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 16 }}>
              Employee not found
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <Card
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#fff',
                shadowColor: '#00000015',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  {profileImageUri ? (
                    <Image 
                      source={{ uri: profileImageUri }} 
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        backgroundColor: Theme.colors.primary + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary }} numberOfLines={1}>
                      {employee.name || 'N/A'}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.secondary }}>
                      {employee.phone || 'N/A'}
                    </Text>
                    {employee.roles && (
                      <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.primary }}>
                        Role:{employee.roles.role_name}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: employee.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: employee.status === 'ACTIVE' ? '#166534' : '#991B1B',
                      }}
                    >
                      {employee.status}
                    </Text>
                  </View>
                  <ActionButtons
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showView={false}
                    disableEdit={!canEditEmployee}
                    disableDelete={!canDeleteEmployee}
                    blockPressWhenDisabled
                  />
                </View>
              </View>
            </Card>

            <Card
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#fff',
                shadowColor: '#00000015',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                Operations
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.secondary }}>
                Allowed operations for this employee (role + overrides)
              </Text>

              {(employeePerms?.permissions ?? []).length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.primary, marginTop: 6, lineHeight: 18 }}>
                    {(employeePerms?.permissions ?? []).join('\n')}
                  </Text>
                </View>
              ) : (
                <Text style={{ marginTop: 10, fontSize: 12, color: Theme.colors.text.tertiary }}>
                  No permissions found
                </Text>
              )}
            </Card>

            {(canEditEmployee || isAdmin || isSuperAdmin) && (
              <Card
                style={{
                  marginBottom: 12,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: '#fff',
                  shadowColor: '#00000010',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text.primary }}>
                  Permission Overrides
                </Text>
                <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
                  Manage this employee’s access by setting per-permission overrides. You can choose:
                </Text>
                <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
                  ALLOW (force access), DENY (block access), or Clear (use role default).
                </Text>

                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('EmployeePermissionOverrides', { employeeId })}
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: Theme.colors.primary,
                    alignSelf: 'flex-end',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                    Open Overrides
                  </Text>
                </TouchableOpacity>
              </Card>
            )}

            <Card
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#fff',
                shadowColor: '#00000010',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                Contact Information
              </Text>
              <DetailRow label="Email" value={employee.email} />
              <DetailRow label="Phone" value={employee.phone} />
              <DetailRow label="Gender" value={employee.gender} isLast={true} />
            </Card>

            <Card
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#fff',
                shadowColor: '#00000010',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                Address Information
              </Text>
              <DetailRow label="Address" value={employee.address} />
              <DetailRow label="City" value={employee.city?.name} />
              <DetailRow label="State" value={employee.state?.name} />
              <DetailRow label="Pincode" value={employee.pincode} />
              <DetailRow label="Country" value={employee.country} isLast={true} />
            </Card>

            <Card
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#fff',
                shadowColor: '#00000010',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                Additional Information
              </Text>
              <DetailRow label="Employee ID" value={employee.s_no} />
              <DetailRow label="Proof Documents" value={employee.proof_documents ? 'Available' : 'Not uploaded'} />
              <DetailRow 
                label="Created At" 
                value={employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-IN') : 'N/A'} 
              />
              <DetailRow 
                label="Updated At" 
                value={employee.updated_at ? new Date(employee.updated_at).toLocaleDateString('en-IN') : 'N/A'} 
                isLast={true} 
              />
            </Card>
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
};

export default EmployeeDetailsScreen;
