import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import expenseService, { Expense, PaymentMethod } from '../../services/expenses/expenseService';
import { AddEditExpenseModal } from '@/screens/expense/AddEditExpenseModal';
import { DatePicker } from '@/components/DatePicker';
import { ActionButtons } from '../../components/ActionButtons';

interface ExpenseScreenProps {
  navigation: any;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | null>(null);

  // Debug user data
  useEffect(() => {
  }, [user, selectedPGLocationId]);

  const fetchExpenses = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    
    if (!selectedPGLocationId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!append) setLoading(true);
      // Note: Filters will be applied via headers and query params in future API update
      const response = await expenseService.getExpenses(pageNum, 10);
      
      // Apply client-side filters for now
      let filteredData = response.data.data || [];
      
      if (startDate) {
        filteredData = filteredData.filter((exp: Expense) => 
          new Date(exp.paid_date) >= new Date(startDate)
        );
      }
      
      if (endDate) {
        filteredData = filteredData.filter((exp: Expense) => 
          new Date(exp.paid_date) <= new Date(endDate)
        );
      }
      
      if (expenseTypeFilter) {
        filteredData = filteredData.filter((exp: Expense) => 
          exp.expense_type === expenseTypeFilter
        );
      }
      
      if (paymentMethodFilter) {
        filteredData = filteredData.filter((exp: Expense) => 
          exp.payment_method === paymentMethodFilter
        );
      }
      
      if (response.success) {
        if (append) {
          setExpenses(prev => [...prev, ...filteredData]);
        } else {
          setExpenses(filteredData);
        }
        setHasMore(response.data.pagination?.hasMore || false);
        setTotalExpenses(response.data.pagination?.total || filteredData.length);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPGLocationId, startDate, endDate, expenseTypeFilter, paymentMethodFilter]);

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
              await expenseService.deleteExpense(expense.s_no);
              Alert.alert('Success', 'Expense deleted successfully');
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
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
    setStartDate('');
    setEndDate('');
    setExpenseTypeFilter(null);
    setPaymentMethodFilter(null);
  };

  const getFilterCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (expenseTypeFilter) count++;
    if (paymentMethodFilter) count++;
    return count;
  };

  // Quick date range filters
  const applyQuickDateFilter = (filter: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
        break;
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        setStartDate(last7.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        setStartDate(last30.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      case 'thisMonth':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDayThisMonth.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      case 'lastMonth':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(firstDayLastMonth.toISOString().split('T')[0]);
        setEndDate(lastDayLastMonth.toISOString().split('T')[0]);
        break;
    }
  };

  // Get unique expense types from expenses
  const expenseTypes = React.useMemo(() => {
    const types = [...new Set(expenses.map(exp => exp.expense_type))];
    return types.sort();
  }, [expenses]);

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
      
      {/* Filter Button */}
      <View style={{ padding: 12, backgroundColor: CONTENT_COLOR, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{
            backgroundColor: getFilterCount() > 0 ? Theme.colors.primary : Theme.colors.light,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="filter" size={18} color={getFilterCount() > 0 ? '#fff' : Theme.colors.text.primary} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: getFilterCount() > 0 ? '#fff' : Theme.colors.text.primary }}>
            Filters
          </Text>
          {getFilterCount() > 0 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary }}>
                {getFilterCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
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
                This Month
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
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: SCREEN_HEIGHT * 0.75,
              }}
            >
              {/* Handle Bar */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: Theme.colors.border,
                    borderRadius: 2,
                  }}
                />
              </View>

              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: Theme.colors.border,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary }}>
                    Filter Expenses
                  </Text>
                  {getFilterCount() > 0 && (
                    <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 2 }}>
                      {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} active
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Theme.colors.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Filter Content */}
              <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }} contentContainerStyle={{ padding: 20 }}>
                {/* Date Range Filter */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                    Date Range
                  </Text>
                  
                  {/* Quick Date Filters */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('today')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        Today
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('yesterday')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        Yesterday
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('last7days')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        Last 7 Days
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('last30days')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        Last 30 Days
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('thisMonth')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        This Month
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => applyQuickDateFilter('lastMonth')}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: Theme.colors.background.blueLight,
                        borderWidth: 1,
                        borderColor: Theme.colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>
                        Last Month
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Custom Date Pickers */}
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    maximumDate={endDate ? new Date(endDate) : new Date()}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    minimumDate={startDate ? new Date(startDate) : undefined}
                    maximumDate={new Date()}
                  />
                </View>

                {/* Expense Type Filter */}
                {expenseTypes.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                      Expense Type
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setExpenseTypeFilter(null)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: expenseTypeFilter === null ? Theme.colors.primary : '#fff',
                          borderWidth: 1,
                          borderColor: expenseTypeFilter === null ? Theme.colors.primary : Theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: expenseTypeFilter === null ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          All Types
                        </Text>
                      </TouchableOpacity>
                      {expenseTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setExpenseTypeFilter(type)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: expenseTypeFilter === type ? Theme.colors.primary : '#fff',
                            borderWidth: 1,
                            borderColor: expenseTypeFilter === type ? Theme.colors.primary : Theme.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: expenseTypeFilter === type ? '#fff' : Theme.colors.text.secondary,
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Payment Method Filter */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 12 }}>
                    Payment Method
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setPaymentMethodFilter(null)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: paymentMethodFilter === null ? Theme.colors.primary : '#fff',
                        borderWidth: 1,
                        borderColor: paymentMethodFilter === null ? Theme.colors.primary : Theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: paymentMethodFilter === null ? '#fff' : Theme.colors.text.secondary,
                        }}
                      >
                        All Methods
                      </Text>
                    </TouchableOpacity>
                    {[PaymentMethod.GPAY, PaymentMethod.PHONEPE, PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER].map((method) => (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setPaymentMethodFilter(method)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: paymentMethodFilter === method ? getPaymentMethodColor(method) : '#fff',
                          borderWidth: 1,
                          borderColor: paymentMethodFilter === method ? getPaymentMethodColor(method) : Theme.colors.border,
                        }}
                      >
                        <Ionicons
                          name={getPaymentMethodIcon(method) as any}
                          size={16}
                          color={paymentMethodFilter === method ? '#fff' : getPaymentMethodColor(method)}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: paymentMethodFilter === method ? '#fff' : Theme.colors.text.secondary,
                          }}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Footer Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 20,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: Theme.colors.border,
                }}
              >
                {getFilterCount() > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: Theme.colors.light,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: Theme.colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
};
