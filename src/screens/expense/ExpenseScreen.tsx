import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { Expense, PaymentMethod, useDeleteExpenseMutation, useLazyGetExpensesQuery } from '../../services/api/expensesApi';
import { AddEditExpenseModal } from './AddEditExpenseModal';
import { ActionButtons } from '../../components/ActionButtons';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface ExpenseScreenProps {
  navigation: any;
}

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

export const ExpenseScreen: React.FC<ExpenseScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();
  const canCreateExpense = can(Permission.CREATE_EXPENSE);
  const canEditExpense = can(Permission.EDIT_EXPENSE);
  const canDeleteExpense = can(Permission.DELETE_EXPENSE);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);

  const flatListRef = React.useRef<any>(null);
  const scrollPositionRef = React.useRef(0);

  const [fetchExpensesTrigger] = useLazyGetExpensesQuery();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState<number | null>(null);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);
  const [draftMonth, setDraftMonth] = useState<number | null>(null);
  const [draftYear, setDraftYear] = useState<number | null>(null);

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const getSelectedMonthLabel = (month: number | null) => {
    if (!month) return '';
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  const openFilters = () => {
    setDraftMonth(appliedMonth);
    setDraftYear(appliedYear);
    setFilterModalVisible(true);
  };

  const fetchExpenses = useCallback(async (
    pageNum: number = 1,
    append: boolean = false,
    monthOverride?: number | null,
    yearOverride?: number | null,
  ) => {
    
    if (!selectedPGLocationId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!append) setLoading(true);

      const monthToUse = monthOverride !== undefined ? monthOverride : appliedMonth;
      const yearToUse = yearOverride !== undefined ? yearOverride : appliedYear;

      const response = await fetchExpensesTrigger({
        page: pageNum,
        limit: 20,
        month: monthToUse || undefined,
        year: yearToUse || undefined,
      }).unwrap();

      const serverData = response?.data || [];
      const pagination = response?.pagination;
      const totalPages = pagination?.totalPages || 0;

      if (response.success) {
        if (append) {
          setExpenses(prev => [...prev, ...serverData]);
        } else {
          setExpenses(serverData);
        }
        setPagination(pagination || null);
        setHasMore(totalPages ? pageNum < totalPages : false);
        setPage(pageNum);

        if (flatListRef.current && pageNum === 1 && !append) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      }
    } catch (error: any) {
      showErrorAlert(error, 'Expenses Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPGLocationId, appliedMonth, appliedYear]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setExpenses([]);
    setPagination(null);
    setHasMore(true);
    fetchExpenses(1);
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExpenses(nextPage, true);
  };

  const handleAddExpense = () => {
    if (!canCreateExpense) {
      Alert.alert('Access Denied', "You don't have permission to create expenses");
      return;
    }
    setEditingExpense(null);
    setShowAddModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    if (!canEditExpense) {
      Alert.alert('Access Denied', "You don't have permission to edit expenses");
      return;
    }
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (!canDeleteExpense) {
      Alert.alert('Access Denied', "You don't have permission to delete expenses");
      return;
    }
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this expense of ₹${expense.amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense.s_no).unwrap();
              showSuccessAlert('Expense deleted successfully');
              onRefresh();
            } catch (error) {
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  const handleSaveExpense = async () => {
    setShowAddModal(false);
    onRefresh();
  };

  const clearFilters = () => {
    setAppliedMonth(null);
    setAppliedYear(null);
    setDraftMonth(null);
    setDraftYear(null);
    setFilterModalVisible(false);
    setExpenses([]);
    setPage(1);
    setHasMore(true);
    setPagination(null);
    setRefreshing(true);
    fetchExpenses(1, false, null, null);
  };

  const applyFilters = () => {
    setAppliedMonth(draftMonth);
    setAppliedYear(draftYear);
    setFilterModalVisible(false);
    setExpenses([]);
    setPage(1);
    setHasMore(true);
    setPagination(null);
    setRefreshing(true);
    fetchExpenses(1, false, draftMonth, draftYear);
  };

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index || 0;
      setVisibleItemsCount(lastVisibleIndex + 1);
    }
  }, []);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.GPAY:
        return 'logo-google';
      case PaymentMethod.PHONEPE:
        return 'phone-portrait-outline';
      case PaymentMethod.CASH:
        return 'cash-outline';
      case PaymentMethod.BANK_TRANSFER:
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.GPAY:
        return '#4285F4';
      case PaymentMethod.PHONEPE:
        return '#5F259F';
      case PaymentMethod.CASH:
        return '#10B981';
      case PaymentMethod.BANK_TRANSFER:
        return '#F59E0B';
      default:
        return Theme.colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show error if no PG Location selected
  if (!selectedPGLocationId && !loading) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Expenses"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CONTENT_COLOR, padding: 40 }}>
          <Ionicons name="alert-circle-outline" size={64} color={Theme.colors.text.tertiary} />
          <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
            No PG Location Found
          </Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary, marginTop: 8, textAlign: 'center' }}>
            Please select a PG location from the dashboard to view expenses
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (loading && expenses.length === 0) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Expenses"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, padding: 16, paddingTop: 12 }}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <Card key={idx} style={{ marginBottom: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <SkeletonLoader width={34} height={34} borderRadius={10} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width={160} height={14} style={{ marginBottom: 6 }} />
                    <SkeletonLoader width={120} height={10} />
                  </View>
                </View>
                <SkeletonLoader width={70} height={14} borderRadius={6} />
              </View>

              <View style={{ marginTop: 10 }}>
                <SkeletonLoader width="80%" height={10} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="55%" height={10} />
              </View>
            </Card>
          ))}
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        title="Expenses"
        showBackButton
        onBackPress={() => navigation.goBack()}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={openFilters}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: Theme.colors.border,
                backgroundColor: '#fff',
              }}
            >
              <Ionicons name="options-outline" size={18} color={Theme.colors.text.secondary} />
              <Text style={{ marginLeft: 8, fontSize: 13, color: Theme.colors.text.primary, fontWeight: '600' }}>
                Filters
              </Text>
            </TouchableOpacity>

            {(appliedMonth || appliedYear) ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                  {appliedMonth ? getSelectedMonthLabel(appliedMonth) : 'All months'}
                  {appliedYear ? `, ${appliedYear}` : ''}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                No filters
              </Text>
            )}
          </View>
        </View>

        {/* Scroll Position Indicator */}
        {visibleItemsCount > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 160,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#fff',
              textAlign: 'center',
            }}>
              {visibleItemsCount} of {pagination?.total || expenses.length}
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#fff',
              opacity: 0.8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {(pagination?.total || expenses.length) - visibleItemsCount} remaining
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={expenses}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
                  No expenses found
                </Text>
                <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary, marginTop: 8, textAlign: 'center' }}>
                  Tap the + button to add your first expense
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: expense }) => (
            <Card key={expense.s_no} style={{ marginBottom: 10, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 2 }}>
                    {expense.expense_type}
                  </Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                    Paid to: {expense.paid_to}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.danger }}>
                  {formatAmount(Number(expense.amount))}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: expense.remarks ? 6 : 2 }}>
                <Ionicons
                  name={getPaymentMethodIcon(expense.payment_method)}
                  size={14}
                  color={getPaymentMethodColor(expense.payment_method)}
                />
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                  {expense.payment_method}
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginLeft: 10 }}>
                  • {formatDate(expense.paid_date)}
                </Text>
              </View>

              {expense.remarks && (
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, fontStyle: 'italic' }}>
                  {expense.remarks}
                </Text>
              )}

              <ActionButtons
                onEdit={() => handleEditExpense(expense)}
                onDelete={() => handleDeleteExpense(expense)}
                containerStyle={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}
                showView={false}
                disableEdit={!canEditExpense}
                disableDelete={!canDeleteExpense}
                blockPressWhenDisabled
              />
            </Card>
          )}
          ListFooterComponent={
            loading && page > 1 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: Theme.colors.text.secondary }}>
                  Loading more...
                </Text>
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={(event) => {
            scrollPositionRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleAddExpense}
        disabled={!canCreateExpense}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          opacity: canCreateExpense ? 1 : 0.45,
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <AddEditExpenseModal
        visible={showAddModal}
        expense={editingExpense}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />

      {/* Filter Modal */}
      <SlideBottomModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title="Filter Expenses"
        subtitle="Filter by paid month"
        submitLabel="Apply"
        cancelLabel="Clear"
        onSubmit={applyFilters}
        onCancel={clearFilters}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 10 }}>
          Month
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setDraftMonth(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: draftMonth === null ? Theme.colors.primary : '#F3F4F6',
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: draftMonth === null ? '#fff' : Theme.colors.text.primary,
            }}>
              All
            </Text>
          </TouchableOpacity>

          {MONTHS.map(m => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setDraftMonth(m.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: draftMonth === m.value ? Theme.colors.primary : '#F3F4F6',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: draftMonth === m.value ? '#fff' : Theme.colors.text.primary,
              }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 10 }}>
          Year
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setDraftYear(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: draftYear === null ? Theme.colors.primary : '#F3F4F6',
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: draftYear === null ? '#fff' : Theme.colors.text.primary,
            }}>
              All
            </Text>
          </TouchableOpacity>

          {years.map((y: number) => (
            <TouchableOpacity
              key={y}
              onPress={() => setDraftYear(y)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: draftYear === y ? Theme.colors.primary : '#F3F4F6',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: draftYear === y ? '#fff' : Theme.colors.text.primary,
              }}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SlideBottomModal>
    </ScreenLayout>
  );
};
