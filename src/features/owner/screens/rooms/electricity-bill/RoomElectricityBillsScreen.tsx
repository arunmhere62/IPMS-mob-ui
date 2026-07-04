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
import { CreateElectricityBillModal } from './CreateElectricityBillModal';
import { RecordPaymentModal } from './RecordPaymentModal';

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

    return (
      <Card style={{ marginHorizontal: 12, marginBottom: 12, padding: 14, borderRadius: 16 }}>
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

        {bill.meter_reading_start !== undefined && bill.meter_reading_end !== undefined && (
          <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginTop: 8 }}>
            Reading: {bill.meter_reading_start} → {bill.meter_reading_end}
            {bill.rate_per_unit ? ` · Rate: ${formatCurrency(Number(bill.rate_per_unit))}/unit` : ''}
          </Text>
        )}

        <View style={{ marginTop: 12, gap: 8 }}>
          {items.map((item) => {
            const isPaid = item.status === 'PAID';
            const isPartial = item.status === 'PARTIAL';
            return (
              <View
                key={item.s_no}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Theme.colors.border }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }}>
                    {item.tenants?.name ?? 'Tenant'}
                  </Text>
                  <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 2 }}>
                    Share: {formatCurrency(Number(item.share_amount))}
                    {item.billing_days ? ` · ${item.billing_days} days` : ''}
                  </Text>
                  {(isPaid || isPartial) && (
                    <Text style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                      Paid: {formatCurrency(Number(item.paid_amount))}
                    </Text>
                  )}
                </View>
                {!isPaid && (
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
                )}
                {isPaid && (
                  <View
                    style={{
                      backgroundColor: '#DCFCE7',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8 }}
                  >
                    <Text style={{ color: '#059669', fontSize: 12, fontWeight: '600' }}>Paid</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {remaining > 0 && (
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 10, textAlign: 'right' }}>
            Pending: {formatCurrency(remaining)}
          </Text>
        )}
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

      <CreateElectricityBillModal
        visible={createModalVisible}
        roomId={roomId}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <RecordPaymentModal
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
