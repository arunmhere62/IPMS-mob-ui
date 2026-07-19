import React, { useState, useEffect, useCallback } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetElectricityBillsQuery,
  useDeleteElectricityBillMutation,
  type ElectricityBill,
  type ElectricityBillItem } from '@/features/owner/api/electricityBillApi';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { formatCurrency } from '@/utils/formatCurrency';
import { CreateElectricityBillForm } from './CreateElectricityBillForm';
import { RecordPaymentForm } from './RecordPaymentForm';

interface RoomElectricityBillsScreenProps {
  navigation: any;
  route: any;
}

const formatDate = (dateStr: string) => {
  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr: string) => {
  const [datePart, timePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = (timePart || '').split(':').map(Number);
  const date = new Date(year, month - 1, day, hours || 0, minutes || 0);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const TimestampRow: React.FC<{ createdAt?: string; updatedAt?: string }> = ({ createdAt, updatedAt }) => {
  if (!createdAt && !updatedAt) return null;
  const isModified = createdAt && updatedAt && createdAt !== updatedAt;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {createdAt && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="create-outline" size={11} color={Theme.colors.text.tertiary} />
          <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>
            {formatDateTime(createdAt)}
          </Text>
        </View>
      )}
      {isModified && updatedAt && (
        <>
          <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="pencil-outline" size={11} color={Theme.colors.text.tertiary} />
            <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>
              {formatDateTime(updatedAt)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export const RoomElectricityBillsScreen: React.FC<RoomElectricityBillsScreenProps> = ({
  navigation,
  route }) => {
  const { roomId, roomNo } = route.params || {};
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ElectricityBillItem | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const {
    data: billsResponse,
    refetch: refetchBills,
    isFetching } = useGetElectricityBillsQuery({ room_id: roomId }, { skip: !roomId });

  const [deleteBillMutation] = useDeleteElectricityBillMutation();

  useEffect(() => {
    const items = (billsResponse as any)?.data?.data ?? (billsResponse as any)?.data ?? [];
    setBills(Array.isArray(items) ? items : []);
  }, [billsResponse]);

  useFocusEffect(
    useCallback(() => {
      if (roomId) refetchBills();
    }, [roomId, refetchBills])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchBills();
    } finally {
      setRefreshing(false);
    }
  }, [refetchBills]);

  const handleCreateSuccess = useCallback(() => {
    setCreateModalVisible(false);
    refetchBills();
  }, [refetchBills]);

  const handlePaymentSuccess = useCallback(() => {
    setSelectedItem(null);
    setSelectedBillId(null);
    refetchBills();
  }, [refetchBills]);

  const handleDeleteBill = useCallback(
    (billId: number) => {
      Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBillMutation(billId).unwrap();
              showSuccessAlert('Bill deleted successfully');
              refetchBills();
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            }
          } },
      ]);
    },
    [deleteBillMutation, refetchBills]
  );

  const renderBillItem = ({ item: bill }: { item: ElectricityBill }) => {
    const items = bill.electricity_bill_items || [];
    const totalPaid = items.reduce((sum, it) => sum + Number(it.paid_amount || 0), 0);
    const remaining = Number(bill.total_amount) - totalPaid;
    const statusColor =
      bill.status === 'PAID' ? '#059669' : bill.status === 'PARTIAL' ? '#D97706' : Theme.colors.primary;
    const allocationLabel = (basis: string | null | undefined) => {
      if (!basis) return null;
      const map: Record<string, string> = {
        RENT_CYCLE_DAYS: 'Rent Cycle Days',
        EQUAL_SPLIT: 'Equal Split',
        CUSTOM: 'Custom',
      };
      return map[basis] || basis;
    };

    return (
      <Card style={{ marginHorizontal: 12, marginBottom: 12, padding: 14, borderRadius: 16 }}>
        {/* Header: Period + Status + Delete */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
              {formatDate(bill.bill_period_start)} to {formatDate(bill.bill_period_end)}
            </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
              Total: {formatCurrency(Number(bill.total_amount))}
              {bill.units_consumed ? ` · ${bill.units_consumed} units` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: statusColor + '15',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: statusColor }}>{bill.status}</Text>
            </View>
            <AnimatedPressableCard onPress={() => handleDeleteBill(bill.s_no)}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </AnimatedPressableCard>
          </View>
        </View>

        {/* Bill meta details */}
        <View style={{ marginTop: 10, gap: 4 }}>
          {(bill as any).rooms?.room_no && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="home-outline" size={13} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Room {(bill as any).rooms.room_no}
                {(bill as any).pg_locations?.location_name ? ` · ${(bill as any).pg_locations.location_name}` : ''}
              </Text>
            </View>
          )}
          {bill.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={13} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Due: {formatDate(bill.due_date)}
              </Text>
            </View>
          )}
          {bill.meter_reading_start != null && bill.meter_reading_end != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="speedometer-outline" size={13} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Reading: {bill.meter_reading_start} → {bill.meter_reading_end}
                {bill.rate_per_unit ? ` · Rate: ${formatCurrency(Number(bill.rate_per_unit))}/unit` : ''}
              </Text>
            </View>
          )}
          {(bill as any).created_at && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="create-outline" size={13} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Created: {formatDateTime(bill.created_at)}
              </Text>
            </View>
          )}
          {bill.updated_at && bill.updated_at !== bill.created_at && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="pencil-outline" size={13} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                Updated: {formatDateTime(bill.updated_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: Theme.colors.border, marginVertical: 10 }} />

        {/* Tenant breakdown */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 8 }}>
          Tenant Breakdown
        </Text>
        <View style={{ gap: 8 }}>
          {items.map((item) => {
            const isPaid = item.status === 'PAID';
            const isPartial = item.status === 'PARTIAL';
            const itemStatusColor =
              isPaid ? '#059669' : isPartial ? '#D97706' : Theme.colors.primary;
            const allocLabel = allocationLabel((item as any).allocation_basis);
            return (
              <View
                key={item.s_no}
                style={{
                  padding: 10,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Theme.colors.border }}
              >
                {/* Row 1: Name + Pay/Paid button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                      {item.tenants?.name ?? 'Tenant'}
                    </Text>
                    {(item as any).tenants?.phone_no && (
                      <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 1 }}>
                        {(item as any).tenants.phone_no}
                      </Text>
                    )}
                  </View>
                  {!isPaid ? (
                    <AnimatedPressableCard
                      onPress={() => {
                        setSelectedItem(item);
                        setSelectedBillId(bill.s_no);
                      }}
                      style={{
                        backgroundColor: Theme.colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Pay</Text>
                    </AnimatedPressableCard>
                  ) : (
                    <View
                      style={{
                        backgroundColor: isPartial ? '#FEF3C7' : '#DCFCE7',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8 }}
                    >
                      <Text style={{ color: itemStatusColor, fontSize: 12, fontWeight: '600' }}>
                        {isPartial ? 'Partial' : 'Paid'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Row 2: Share details */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: '#3730A3', fontWeight: '600' }}>
                      Share: {formatCurrency(Number(item.share_amount))}
                    </Text>
                  </View>
                  {(item as any).share_percentage && (
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>
                        {(item as any).share_percentage}%
                      </Text>
                    </View>
                  )}
                  {item.billing_days != null && (
                    <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#9A3412', fontWeight: '600' }}>
                        {item.billing_days} days
                      </Text>
                    </View>
                  )}
                  {allocLabel && (
                    <View style={{ backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#5B21B6', fontWeight: '600' }}>
                        {allocLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Row 3: Payment info (if paid/partial) */}
                {(isPaid || isPartial) && (
                  <View style={{ marginTop: 6, gap: 2 }}>
                    <Text style={{ fontSize: 11, color: '#059669' }}>
                      Paid: {formatCurrency(Number(item.paid_amount))}
                      {isPartial && ` of ${formatCurrency(Number(item.share_amount))}`}
                    </Text>
                    {(item as any).payment_date && (
                      <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                        Paid on: {formatDate((item as any).payment_date)}
                        {(item as any).payment_method ? ` · ${(item as any).payment_method}` : ''}
                      </Text>
                    )}
                  </View>
                )}

                {/* Timestamps */}
                <TimestampRow createdAt={item.created_at} updatedAt={item.updated_at} />
              </View>
            );
          })}
        </View>

        {/* Footer: Pending summary */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            Paid: {formatCurrency(totalPaid)} / {formatCurrency(Number(bill.total_amount))}
          </Text>
          {remaining > 0 && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
              Pending: {formatCurrency(remaining)}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (isFetching && !bills.length) {
      return (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={180} borderRadius={16} />
          ))}
        </View>
      );
    }
    if (!bills.length) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⚡</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
            No electricity bills yet
          </Text>
          <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 6, textAlign: 'center' }}>
            Tap the button below to add the first bill for this room
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title={`Room ${roomNo ?? roomId} · Bills`}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg
      />
      <View style={{ flex: 1, backgroundColor: Theme.colors.background.primary }}>
        <FlatList
          data={bills}
          keyExtractor={(item) => String(item.s_no)}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={renderBillItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={isFetching ? <ActivityIndicator style={{ margin: 20 }} /> : null}
        />

        <AnimatedPressableCard
          onPress={() => setCreateModalVisible(true)}
          style={{
            position: 'absolute',
            bottom: 80,
            right: 20,
            backgroundColor: Theme.colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </AnimatedPressableCard>
      </View>

      <CreateElectricityBillForm
        visible={createModalVisible}
        roomId={roomId}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <RecordPaymentForm
        visible={!!selectedItem}
        item={selectedItem}
        billId={selectedBillId}
        onClose={() => {
          setSelectedItem(null);
          setSelectedBillId(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </ScreenLayout>
  );
};
