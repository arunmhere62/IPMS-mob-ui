import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useGetVisitorByIdQuery, useDeleteVisitorMutation } from '../../services/api/visitorsApi';
import { Theme } from '../../theme';
import { showErrorAlert } from '../../utils/errorHandler';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { CONTENT_COLOR } from '@/constant';
import { usePermissions } from '@/hooks/usePermissions';

interface VisitorDetailsScreenProps {
  route: {
    params: {
      visitorId: number;
    };
  };
  navigation: any;
}

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

export default function VisitorDetailsScreen({ route, navigation }: VisitorDetailsScreenProps) {
  const { visitorId } = route.params;
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canManageVisitors = isAdmin || isSuperAdmin;
  const canEditVisitor = canManageVisitors;
  const canDeleteVisitor = canManageVisitors;
  const { data: visitor, isLoading, error, refetch } = useGetVisitorByIdQuery(visitorId);
  const [deleteVisitorMutation] = useDeleteVisitorMutation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (canManageVisitors) return;
    Alert.alert('Access Denied', 'Only Admin/Super Admin can access Visitors.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [canManageVisitors, navigation]);

  const handleRefresh = async () => {
    refetch();
  };

  const handleEditVisitor = () => {
    if (!canEditVisitor) {
      Alert.alert('Access Denied', "You don't have permission to edit visitors");
      return;
    }
    navigation.navigate('AddVisitor', { visitorId });
  };

  const handleDelete = async () => {
    if (!canDeleteVisitor) {
      Alert.alert('Access Denied', "You don't have permission to delete visitors");
      return;
    }
    Alert.alert(
      'Delete Visitor',
      'Are you sure you want to delete this visitor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVisitorMutation(visitorId).unwrap();
              navigation.goBack();
            } catch (error) {
              showErrorAlert('Failed to delete visitor');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Visitor Details"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
              Loading visitor details...
            </Text>
          </View>
        ) : !visitor ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Theme.colors.text.primary, fontSize: 16 }}>
              Visitor not found
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary }} numberOfLines={1}>
                      {visitor.visitor_name || 'N/A'}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: Theme.colors.text.secondary }}>
                      {visitor.phone_no || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: visitor.convertedTo_tenant ? '#DCFCE7' : '#FEE2E2',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: visitor.convertedTo_tenant ? '#166534' : '#991B1B',
                      }}
                    >
                      {visitor.convertedTo_tenant ? 'Converted' : 'Not Converted'}
                    </Text>
                  </View>
                  <ActionButtons
                    onEdit={handleEditVisitor}
                    onDelete={handleDelete}
                    showView={false}
                    disableEdit={!canEditVisitor}
                    disableDelete={!canDeleteVisitor}
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
                shadowColor: '#00000010',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
                Visit Information
              </Text>
              <DetailRow label="Purpose" value={visitor.purpose} />
              <DetailRow
                label="Visit Date"
                value={visitor.visited_date ? new Date(visitor.visited_date).toLocaleDateString('en-IN') : 'N/A'}
              />
              <DetailRow label="PG" value={visitor.pg_locations?.location_name ?? 'N/A'} isLast={true} />
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
                Location
              </Text>
              <DetailRow label="City" value={visitor.city?.name ?? 'N/A'} />
              <DetailRow label="State" value={visitor.state?.name ?? 'N/A'} />
              <DetailRow label="Address" value={visitor.address} />
              <DetailRow label="Room" value={visitor.rooms?.room_no ?? visitor.visited_room_id ?? 'N/A'} />
              <DetailRow label="Bed" value={visitor.beds?.bed_no ?? visitor.visited_bed_id ?? 'N/A'} />
              <DetailRow label="Bed Price" value={visitor.beds?.bed_price ?? 'N/A'} isLast={true} />
            </Card>
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
};
