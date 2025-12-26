import React, { useState } from 'react';
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
import { ActionButtons } from '../../components/ActionButtons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { EmployeeSalary, PaymentMethod, useDeleteEmployeeSalaryMutation, useGetEmployeeSalariesQuery } from '../../services/api/employeeSalaryApi';
import { AddEditEmployeeSalaryModal } from '@/screens/employee-salary/AddEditEmployeeSalaryModal';
import { SlideBottomModal } from '../../components/SlideBottomModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface EmployeeSalaryScreenProps {
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

export const EmployeeSalaryScreen: React.FC<EmployeeSalaryScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();
  const canCreateSalary = can(Permission.CREATE_EMPLOYEE_SALARY);
  const canEditSalary = can(Permission.EDIT_EMPLOYEE_SALARY);
  const canDeleteSalary = can(Permission.DELETE_EMPLOYEE_SALARY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);

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

  const {
    data: salariesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetEmployeeSalariesQuery(
    {
      page: 1,
      limit: 50,
      month: appliedMonth || undefined,
      year: appliedYear || undefined,
    },
    {
      skip: !selectedPGLocationId,
    }
  );

  const [deleteSalary] = useDeleteEmployeeSalaryMutation();

  const salaries = salariesResponse?.data || [];
  const totalSalaries = salariesResponse?.pagination?.total || 0;
  const loading = isLoading || isFetching;
  const refreshing = isFetching;

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const getSelectedMonthLabel = (month: number | null) => {
    if (!month) return '';
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  const clearFilters = () => {
    setAppliedMonth(defaultMonthYear.month);
    setAppliedYear(defaultMonthYear.year);
    setDraftMonth(defaultMonthYear.month);
    setDraftYear(defaultMonthYear.year);
    setFilterModalVisible(false);
    refetch();
  };

  const applyFilters = () => {
    setAppliedMonth(draftMonth);
    setAppliedYear(draftYear);
    setFilterModalVisible(false);
  };

  const openFilters = () => {
    setDraftMonth(appliedMonth);
    setDraftYear(appliedYear);
    setFilterModalVisible(true);
  };

  const onRefresh = () => {
    refetch();
  };

  const handleAddSalary = () => {
    if (!canCreateSalary) {
      Alert.alert('Access Denied', "You don't have permission to create employee salary records");
      return;
    }
    setEditingSalary(null);
    setShowAddModal(true);
  };

  const handleEditSalary = (salary: EmployeeSalary) => {
    if (!canEditSalary) {
      Alert.alert('Access Denied', "You don't have permission to edit employee salary records");
      return;
    }
    setEditingSalary(salary);
    setShowAddModal(true);
  };

  const handleSaveSalary = async () => {
    setShowAddModal(false);
    onRefresh();
  };

  const handleDeleteSalary = (salary: EmployeeSalary) => {
    if (!canDeleteSalary) {
      Alert.alert('Access Denied', "You don't have permission to delete employee salary records");
      return;
    }
    Alert.alert(
      'Delete Salary Record',
      `Are you sure you want to delete this salary record of ₹${salary.salary_amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSalary(salary.s_no).unwrap();
              showSuccessAlert('Salary record deleted successfully');
              onRefresh();
            } catch (error) {
              console.error('Error deleting salary:', error);
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
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

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
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
          title="Employee Salaries"
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
            Please select a PG location from the dashboard
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (loading && salaries.length === 0) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Employee Salaries"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CONTENT_COLOR }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading salaries...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Employee Salaries"
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
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Summary Card */}
          <Card style={{ margin: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                  Total Records
                </Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: Theme.colors.text.primary }}>
                  {totalSalaries}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                  Total Amount
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: Theme.colors.primary }}>
                  {formatAmount(salaries.reduce((sum, sal) => sum + Number(sal.salary_amount), 0))}
                </Text>
              </View>
            </View>
          </Card>

          {/* Salaries List */}
          {salaries.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="wallet-outline" size={64} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
                No salary records found
              </Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.tertiary, marginTop: 8, textAlign: 'center' }}>
                Add salary records from your admin panel
              </Text>
            </View>
          ) : (
            salaries.map((salary) => (
              <Card key={salary.s_no} style={{ marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
                      {salary.users?.name || 'Unknown Employee'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="calendar-outline" size={14} color={Theme.colors.text.secondary} />
                      <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                        {formatMonth(salary.month)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.colors.primary }}>
                    {formatAmount(Number(salary.salary_amount))}
                  </Text>
                </View>

                {salary.paid_date && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: salary.remarks ? 6 : 0 }}>
                    {salary.payment_method && (
                      <>
                        <Ionicons
                          name={getPaymentMethodIcon(salary.payment_method) as any}
                          size={14}
                          color={getPaymentMethodColor(salary.payment_method)}
                        />
                        <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                          {salary.payment_method}
                        </Text>
                        <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginLeft: 8 }}>
                          • Paid on {formatDate(salary.paid_date)}
                        </Text>
                      </>
                    )}
                  </View>
                )}

                {salary.remarks && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="document-text-outline" size={14} color={Theme.colors.text.tertiary} />
                    <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginLeft: 6, fontStyle: 'italic' }}>
                      {salary.remarks}
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
                  <ActionButtons
                    onEdit={() => handleEditSalary(salary)}
                    onDelete={() => handleDeleteSalary(salary)}
                    showEdit={true}
                    showDelete={true}
                    showView={false}
                    disableEdit={!canEditSalary}
                    disableDelete={!canDeleteSalary}
                    blockPressWhenDisabled
                  />
                </View>
              </Card>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          onPress={canCreateSalary ? handleAddSalary : undefined}
          disabled={!canCreateSalary}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: Theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: canCreateSalary ? 1 : 0.45,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>

        <SlideBottomModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          title="Filter Salaries"
          subtitle="Filter by salary month"
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
      </View>

      {/* Add/Edit Modal */}
      <AddEditEmployeeSalaryModal
        visible={showAddModal}
        salary={editingSalary}
        onClose={() => {
          setShowAddModal(false);
          setEditingSalary(null);
        }}
        onSave={handleSaveSalary}
      />
    </ScreenLayout>
  );
};
