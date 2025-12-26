import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { CONTENT_COLOR } from '@/constant';
import {
  useListPermissionsGroupedQuery,
  useListUserPermissionOverridesQuery,
  useRemoveUserPermissionOverrideMutation,
  useUpsertUserPermissionOverrideMutation,
} from '../../services/api/rbacApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useRefreshMyPermissions } from '@/hooks/useRefreshMyPermissions';

const EFFECTS = ['ALLOW', 'DENY'] as const;

type Effect = (typeof EFFECTS)[number];

type PermissionItem = {
  s_no: number;
  screen_name: string;
  action: string;
  description?: string | null;
};

const EmployeePermissionOverridesScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { employeeId } = route.params;

  const { data: groupedPermissions, isLoading: loadingCatalog, refetch: refetchCatalog } =
    useListPermissionsGroupedQuery();

  const {
    data: overrides,
    isLoading: loadingOverrides,
    refetch: refetchOverrides,
  } = useListUserPermissionOverridesQuery({ user_id: employeeId });

  const [upsertOverride, { isLoading: saving }] = useUpsertUserPermissionOverrideMutation();
  const [removeOverride, { isLoading: removing }] = useRemoveUserPermissionOverrideMutation();
  const { refresh: refreshMyPermissions } = useRefreshMyPermissions({ ttlMs: 0, enableAppResume: false });

  const overrideByPermissionId = useMemo(() => {
    const map = new Map<number, { effect: string }>();
    (overrides ?? []).forEach((o) => {
      map.set(o.permission_id, { effect: o.effect });
    });
    return map;
  }, [overrides]);

  const groups = useMemo(() => {
    const entries = Object.entries(groupedPermissions ?? {});
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [groupedPermissions]);

  const onSet = async (permission: PermissionItem, effect: Effect) => {
    try {
      await upsertOverride({
        user_id: employeeId,
        permission_id: permission.s_no,
        effect,
      }).unwrap();
      showSuccessAlert('Override saved');
      await refreshMyPermissions();
    } catch (e: any) {
      showErrorAlert(e, 'Override Error');
    }
  };

  const onClear = async (permission: PermissionItem) => {
    Alert.alert('Remove Override', 'Remove this override?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeOverride({ user_id: employeeId, permission_id: permission.s_no }).unwrap();
            showSuccessAlert('Override removed');
            await refreshMyPermissions();
          } catch (e: any) {
            showErrorAlert(e, 'Override Error');
          }
        },
      },
    ]);
  };

  const loading = loadingCatalog || loadingOverrides;

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Permission Overrides"
        showBackButton={true}
        onBackPress={() => (navigation as any).goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 12, color: Theme.colors.text.secondary }}>
              Loading permissions...
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            <Card style={{ padding: 14, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>
                Employee ID: {employeeId}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.tertiary }}>
                Use ALLOW/DENY to override the employee’s role defaults. Clear removes the override.
              </Text>
            </Card>

            {groups.map(([groupName, perms]) => (
              <Card
                key={groupName}
                style={{ padding: 14, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                  {groupName}
                </Text>

                {(perms as PermissionItem[]).map((p) => {
                  const current = overrideByPermissionId.get(p.s_no)?.effect;
                  return (
                    <View key={p.s_no} style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border + '40' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                        {p.screen_name}_{String(p.action).toLowerCase()}
                      </Text>
                      {p.description ? (
                        <Text style={{ marginTop: 4, fontSize: 12, color: Theme.colors.text.secondary }}>
                          {p.description}
                        </Text>
                      ) : null}

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        {EFFECTS.map((e) => {
                          const selected = current === e;
                          return (
                            <TouchableOpacity
                              key={e}
                              disabled={saving || removing}
                              onPress={() => onSet(p, e)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: selected ? Theme.colors.primary : '#F3F4F6',
                              }}
                            >
                              <Text style={{ color: selected ? '#fff' : Theme.colors.text.primary, fontWeight: '700', fontSize: 12 }}>
                                {e}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}

                        <TouchableOpacity
                          disabled={saving || removing || !current}
                          onPress={() => onClear(p)}
                          style={{
                            marginLeft: 'auto',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: current ? '#FEE2E2' : '#F3F4F6',
                          }}
                        >
                          <Text style={{ color: current ? '#991B1B' : Theme.colors.text.tertiary, fontWeight: '700', fontSize: 12 }}>
                            Clear
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </Card>
            ))}

            <TouchableOpacity
              onPress={() => {
                refetchCatalog();
                refetchOverrides();
              }}
              style={{
                marginTop: 4,
                alignSelf: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: '#111827',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Refresh</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
};

export default EmployeePermissionOverridesScreen;
