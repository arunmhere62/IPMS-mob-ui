import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { AddEditExpenseModal } from '@/screens/expense/AddEditExpenseModal';
import { ActionButtons } from '../../components/ActionButtons';
import { SlideBottomModal } from '../../components/SlideBottomModal';

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
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [fetchExpensesTrigger] = useLazyGetExpensesQuery();
  const [deleteExpense] = useDeleteExpenseMutation();

  const defaultMonthYear = React.useMemo(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      month: lastMonthDate.getMonth() + 1,
      year: lastMonthDate.getFullYear(),
    };
  }, []);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState<number | null>(defaultMonthYear.month);
  const [appliedYear, setAppliedYear] = useState<number | null>(defaultMonthYear.year);
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
        limit: 10,
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
        setTotalExpenses(pagination?.total || serverData.length);
        setHasMore(totalPages ? pageNum < totalPages : false);
        setPage(pageNum);
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
    fetchExpenses(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExpenses(nextPage, true);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowAddModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
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
    setAppliedMonth(defaultMonthYear.month);
    setAppliedYear(defaultMonthYear.year);
    setDraftMonth(defaultMonthYear.month);
    setDraftYear(defaultMonthYear.year);
    setFilterModalVisible(false);
    setExpenses([]);
    setPage(1);
    setHasMore(true);
    setRefreshing(true);
    fetchExpenses(1, false, defaultMonthYear.month, defaultMonthYear.year);
  };

  const applyFilters = () => {
    setAppliedMonth(draftMonth);
    setAppliedYear(draftYear);
    setFilterModalVisible(false);
    setExpenses([]);
    setPage(1);
    setHasMore(true);
    setRefreshing(true);
    fetchExpenses(1, false, draftMonth, draftYear);
  };

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CONTENT_COLOR }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading expenses...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Expenses"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
        {/* Summary Card */}
        <Card style={{ margin: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Total Expenses
              </Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Theme.colors.text.primary }}>
                {totalExpenses}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                {appliedMonth ? getSelectedMonthLabel(appliedMonth) : 'Total'}
                {appliedYear ? ` ${appliedYear}` : ''}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '600', color: Theme.colors.danger }}>
                {formatAmount(expenses.reduce((sum, exp) => sum + Number(exp.amount), 0))}
              </Text>
            </View>
          </View>
        </Card>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={64} color={Theme.colors.text.tertiary} />
            <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
              No expenses found
            </Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary, marginTop: 8, textAlign: 'center' }}>
              Tap the + button to add your first expense
            </Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.s_no} style={{ marginHorizontal: 16, marginBottom: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }}>
                    {expense.expense_type}
                  </Text>
                  <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
                    Paid to: {expense.paid_to}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.danger }}>
                  {formatAmount(Number(expense.amount))}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons
                  name={getPaymentMethodIcon(expense.payment_method)}
                  size={16}
                  color={getPaymentMethodColor(expense.payment_method)}
                />
                <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                  {expense.payment_method}
                </Text>
                <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary, marginLeft: 12 }}>
                  • {formatDate(expense.paid_date)}
                </Text>
              </View>

              {expense.remarks && (
                <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary, fontStyle: 'italic', marginBottom: 8 }}>
                  {expense.remarks}
                </Text>
              )}

              <ActionButtons
                onEdit={() => handleEditExpense(expense)}
                onDelete={() => handleDeleteExpense(expense)}
                containerStyle={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}
                showView={false}
              />
            </Card>
          ))
        )}

        {loading && expenses.length > 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleAddExpense}
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
