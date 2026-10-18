import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../../theme';
import { Card } from '../../../../../components/Card';
import { AnimatedPressableCard } from '../../../../../components/AnimatedPressableCard';

export type Effect = 'ALLOW' | 'DENY';

export type PendingChange = Effect | 'CLEAR';

export type PermissionItem = {
  s_no: number;
  screen_name: string;
  action: string;
  description?: string | null;
};

export const buildPermissionKey = (p: PermissionItem) =>
  `${p.screen_name}_${String(p.action).toLowerCase()}`;

interface PermissionGroupCardProps {
  groupName: string;
  permissions: PermissionItem[];
  permissionsMap: Record<string, any>;
  overrideByPermissionId: Map<number, { effect: string }>;
  pending: Record<number, PendingChange>;
  saving: boolean;
  removing: boolean;
  defaultExpanded?: boolean;
  onToggleAccess: (permission: PermissionItem, allow: boolean) => void;
}

export const PermissionGroupCard: React.FC<PermissionGroupCardProps> = ({
  groupName,
  permissions,
  permissionsMap,
  overrideByPermissionId,
  pending,
  saving,
  removing,
  defaultExpanded = false,
  onToggleAccess,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h !== contentHeight) setContentHeight(h);
  };

  const allowedCount = permissions.reduce(
    (sum, p) => sum + (Boolean(permissionsMap[buildPermissionKey(p)]) ? 1 : 0),
    0,
  );
  const blockedCount = permissions.length - allowedCount;
  const pendingCount = permissions.reduce((sum, p) => sum + (pending[p.s_no] ? 1 : 0), 0);

  return (
    <Card
      style={{
        padding: 0,
        borderRadius: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <AnimatedPressableCard
        onPress={() => setExpanded((v) => !v)}
        accessibilityLabel={`${groupName} group`}
        accessibilityHint={expanded ? 'Collapse group' : 'Expand group'}
        style={{ padding: 2 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: Theme.colors.text.primary,
              flexShrink: 1,
              paddingRight: 8,
            }}
          >
            {groupName}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: '#DCFCE7',
              }}
            >
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: '#166534' }}>
                Allowed: {allowedCount}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: '#FEE2E2',
              }}
            >
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: '#991B1B' }}>
                Blocked: {blockedCount}
              </Text>
            </View>
            {pendingCount ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: '#FEF3C7',
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: '#92400E' }}>
                  Pending: {pendingCount}
                </Text>
              </View>
            ) : null}
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={18} color={Theme.colors.text.secondary} />
            </Animated.View>
          </View>
        </View>
      </AnimatedPressableCard>

      <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
        <View onLayout={onContentLayout} style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          {permissions.map((p) => {
            const permissionKey = buildPermissionKey(p);
            const hasAccess = Boolean(permissionsMap[permissionKey]);
            const savedEffect = overrideByPermissionId.get(p.s_no)?.effect as Effect | undefined;
            const pendingChange = pending[p.s_no];

            // When an override exists, the role default is inferred as the
            // opposite of the override effect; otherwise it equals current access.
            const roleDefault =
              savedEffect === 'ALLOW' ? false : savedEffect === 'DENY' ? true : hasAccess;

            const allowed =
              pendingChange === 'ALLOW'
                ? true
                : pendingChange === 'DENY'
                  ? false
                  : pendingChange === 'CLEAR'
                    ? roleDefault
                    : hasAccess;

            const statusColor = allowed ? '#166534' : '#991B1B';
            const statusLabel = allowed ? 'Allowed' : 'Blocked';

            const hint = pendingChange
              ? pendingChange === 'CLEAR'
                ? 'Will follow role default · pending save'
                : `Will be ${pendingChange === 'ALLOW' ? 'allowed' : 'blocked'} · pending save`
              : savedEffect
                ? 'Custom override'
                : 'Follows role default';

            return (
              <View
                key={p.s_no}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: Theme.colors.border + '40',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: Theme.colors.text.primary,
                      }}
                    >
                      {p.screen_name}_{String(p.action).toLowerCase()}
                    </Text>
                    {p.description ? (
                      <Text
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: Theme.colors.text.secondary,
                        }}
                      >
                        {p.description}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: Theme.colors.text.secondary,
                      }}
                    >
                      {hint}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'center' }}>
                    <Switch
                      value={allowed}
                      onValueChange={(v) => onToggleAccess(p, v)}
                      disabled={saving || removing}
                      trackColor={{ false: '#FECACA', true: Theme.colors.primary }}
                      thumbColor="#fff"
                      ios_backgroundColor="#FECACA"
                    />
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        fontWeight: '800',
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </Card>
  );
};
