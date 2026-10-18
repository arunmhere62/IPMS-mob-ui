import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Theme } from '../../../../theme';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { Card } from '../../../../components/Card';
import { AnimatedPressableCard } from '../../../../components/AnimatedPressableCard';
import { CONTENT_COLOR } from '@/constant';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useGetUserPermissionsQuery,
  useListPermissionsGroupedQuery,
  useListUserPermissionOverridesQuery,
  useBulkUpsertUserPermissionOverridesMutation,
  useRemoveUserPermissionOverrideMutation,
} from '../../api/rbacApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { useRefreshMyPermissions } from '@/hooks/useRefreshMyPermissions';
import {
  PermissionGroupCard,
  Effect,
  PendingChange,
  PermissionItem,
  buildPermissionKey,
} from './components/PermissionGroupCard';

const EmployeePermissionOverridesScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { employeeId } = route.params;
  const { isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (isSuperAdmin) return;
    Alert.alert('Access Denied', 'Only Super Admin can manage employee access settings.', [
      {
        text: 'OK',
        onPress: () => (navigation as any).goBack(),
      },
    ]);
  }, [isSuperAdmin, navigation]);

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

  const [pending, setPending] = useState<Record<number, PendingChange>>({});

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

  const onToggleAccess = (permission: PermissionItem, allow: boolean) => {
    const savedEffect = overrideByPermissionId.get(permission.s_no)?.effect as Effect | undefined;
    const hasAccess = Boolean(permissionsMap[buildPermissionKey(permission)]);
    const roleDefault =
      savedEffect === 'ALLOW' ? false : savedEffect === 'DENY' ? true : hasAccess;

    setPending((prev) => {
      const next = { ...prev };
      if (allow === roleDefault) {
        // Desired access matches the role default -> the override (if any) should be removed
        if (savedEffect) next[permission.s_no] = 'CLEAR';
        else delete next[permission.s_no];
      } else {
        const desired: Effect = allow ? 'ALLOW' : 'DENY';
        // Matches the already-saved override -> nothing to change
        if (desired === savedEffect) delete next[permission.s_no];
        else next[permission.s_no] = desired;
      }
      return next;
    });
  };

  const onSaveBulk = async () => {
    const entries = Object.entries(pending);
    if (entries.length === 0) {
      showSuccessAlert('No pending changes');
      return;
    }

    try {
      const upserts = entries
        .filter(([, change]) => change !== 'CLEAR')
        .map(([permissionId, effect]) => ({
          user_id: employeeId,
          permission_id: Number(permissionId),
          effect: effect as Effect,
        }));
      const clears = entries
        .filter(([, change]) => change === 'CLEAR')
        .map(([permissionId]) => Number(permissionId));

      if (upserts.length) {
        await bulkUpsertOverrides({ overrides: upserts }).unwrap();
      }
      if (clears.length) {
        await Promise.all(
          clears.map((permissionId) =>
            removeOverride({ user_id: employeeId, permission_id: permissionId }).unwrap(),
          ),
        );
      }

      setPending({});
      showSuccessAlert('Changes saved');
      await refetchOverrides();
      await refetchEmployeePerms();
      await refreshMyPermissions();
    } catch (e: any) {
      showErrorAlert(e, 'Save Error');
    }
  };

  const loading = loadingCatalog || loadingOverrides;

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Access Settings"
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
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 100,
              width: '100%',
              maxWidth: 720,
              alignSelf: 'center',
            }}
          >
            <Card style={{ padding: 14, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text.primary }}>
                Manage Employee Access
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
                This screen lets you fine-tune permissions for one employee without changing their role.
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.colors.text.secondary, lineHeight: 16 }}>
                Turn the switch on to allow access or off to block it. Switching back to the role default removes the custom setting.
              </Text>
            </Card>

           <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
             <AnimatedPressableCard
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
            </AnimatedPressableCard>

            <AnimatedPressableCard
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
            </AnimatedPressableCard>
           </View>

            {groups.map(([groupName, perms]) => (
              <PermissionGroupCard
                key={groupName}
                groupName={groupName}
                permissions={perms as PermissionItem[]}
                permissionsMap={permissionsMap}
                overrideByPermissionId={overrideByPermissionId}
                pending={pending}
                saving={saving}
                removing={removing}
                onToggleAccess={onToggleAccess}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
};

export default EmployeePermissionOverridesScreen;
