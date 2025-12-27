import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { CONTENT_COLOR } from '@/constant';
import {
  useGetUserPermissionsQuery,
  useListPermissionsGroupedQuery,
  useListUserPermissionOverridesQuery,
  useBulkUpsertUserPermissionOverridesMutation,
  useRemoveUserPermissionOverrideMutation,
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

  const { data: employeePerms, refetch: refetchEmployeePerms } = useGetUserPermissionsQuery(employeeId);

  const [bulkUpsertOverrides, { isLoading: saving }] = useBulkUpsertUserPermissionOverridesMutation();
  const [removeOverride, { isLoading: removing }] = useRemoveUserPermissionOverrideMutation();
  const { refresh: refreshMyPermissions } = useRefreshMyPermissions({ ttlMs: 0, enableAppResume: false });

  const [pending, setPending] = useState<Record<number, Effect>>({});

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

  const permissionsMap = (employeePerms as any)?.permissions_map ?? {};

  const buildPermissionKey = (p: PermissionItem) => {
    return `${p.screen_name}_${String(p.action).toLowerCase()}`;
  };

  const onSet = async (permission: PermissionItem, effect: Effect) => {
    try {
      setPending((prev) => ({ ...prev, [permission.s_no]: effect }));
    } catch (e: any) {
      showErrorAlert(e, 'Override Error');
    }
  };

  const onSaveBulk = async () => {
    const entries = Object.entries(pending);
    if (entries.length === 0) {
      showSuccessAlert('No pending changes');
      return;
    }

    try {
      await bulkUpsertOverrides({
        overrides: entries.map(([permissionId, effect]) => ({
          user_id: employeeId,
          permission_id: Number(permissionId),
          effect: effect as any,
        })),
      }).unwrap();

      setPending({});
      showSuccessAlert('Overrides saved');
      await refetchOverrides();
      await refetchEmployeePerms();
      await refreshMyPermissions();
    } catch (e: any) {
      showErrorAlert(e, 'Bulk Save Error');
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
                  const current = pending[p.s_no] ?? (overrideByPermissionId.get(p.s_no)?.effect as any);
                  const permissionKey = buildPermissionKey(p);
                  const hasAccess = Boolean((permissionsMap as any)[permissionKey]);

                  const pendingEffect = pending[p.s_no];
                  const savedEffect = overrideByPermissionId.get(p.s_no)?.effect as any;
                  const effectiveEffect = pendingEffect ?? savedEffect;

                  const sourceLabel = effectiveEffect
                    ? `Override (${String(effectiveEffect)})${pendingEffect ? ' - Pending' : ''}`
                    : hasAccess
                      ? 'Role'
                      : 'None';

                  const statusLabel = hasAccess ? 'HAS ACCESS' : 'NO ACCESS';
                  const statusBg = hasAccess ? '#DCFCE7' : '#FEE2E2';
                  const statusFg = hasAccess ? '#166534' : '#991B1B';
                  return (
                    <View key={p.s_no} style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border + '40' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 999,
                            backgroundColor: statusBg,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: statusFg }}>
                            {statusLabel}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.text.secondary }}>
                          {sourceLabel}
                        </Text>
                      </View>

                      <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
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
              disabled={saving || removing || Object.keys(pending).length === 0}
              onPress={onSaveBulk}
              style={{
                marginTop: 4,
                alignSelf: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: Object.keys(pending).length ? Theme.colors.primary : '#6B7280',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {saving ? 'Saving...' : `Save Changes (${Object.keys(pending).length})`}
              </Text>
            </TouchableOpacity>

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
