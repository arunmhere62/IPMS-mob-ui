import React, { useState } from 'react';
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
import { useGeneratePayrollRunMutation, useLazyGetPayrollRunsQuery, type PayrollRun } from '@/services/api/payrollApi';
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
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();
  const canCreateSalary = can(Permission.CREATE_EMPLOYEE_SALARY);
  const [generatePayrollRun, { isLoading: isGeneratingPayroll }] = useGeneratePayrollRunMutation();
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateMonth, setGenerateMonth] = useState<number>(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState<number>(new Date().getFullYear());

  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [pagination, setPagination] = React.useState<any>(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [triggerRuns] = useLazyGetPayrollRunsQuery();

  const loadRuns = React.useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!selectedPGLocationId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!append) setLoading(true);

        const resp = await triggerRuns({ page: pageNum, limit: 20 }).unwrap();
        const serverData = resp?.data || [];
        const pg = resp?.pagination;
        const totalPages = pg?.totalPages || 0;

        if (resp?.success) {
          setRuns((prev) => (append ? [...prev, ...serverData] : serverData));
          setPagination(pg || null);
          setHasMore(totalPages ? pageNum < totalPages : false);
          setPage(pageNum);
        }
      } catch (error: any) {
        showErrorAlert(error, 'Payroll Runs Error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPGLocationId, triggerRuns],
  );

  React.useEffect(() => {
    loadRuns(1, false);
  }, [loadRuns]);

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const buildMonthString = (year: number, month: number) => {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
  };

  const getSelectedMonthLabel = (month: number | null) => {
    if (!month) return '';
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  const onRefresh = () => {
    setRefreshing(true);
    setRuns([]);
    setPagination(null);
    setHasMore(true);
    setPage(1);
    loadRuns(1, false);
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadRuns(nextPage, true);
  };

  const handleGenerateSalary = () => {
    if (!selectedPGLocationId) {
      Alert.alert('No PG Selected', 'Please select a PG location first');
      return;
    }

    setGenerateMonth(new Date().getMonth() + 1);
    setGenerateYear(new Date().getFullYear());
    setGenerateModalVisible(true);
  };

  const submitGeneratePayroll = async () => {
    try {
      const monthString = buildMonthString(generateYear, generateMonth);
      const res = await generatePayrollRun({ month: monthString }).unwrap();
      const runId = (res as any)?.data?.run_id ?? (res as any)?.run_id;
      showSuccessAlert('Payroll generated successfully');
      setGenerateModalVisible(false);

      if (runId) {
        navigation.navigate('PayrollRunDetails', { runId });
      } else {
        navigation.navigate('PayrollRuns');
      }
    } catch (error: any) {
      showErrorAlert(error, 'Generate Salary Error');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'LOCKED') return '#10B981';
    if (status === 'CANCELLED') return '#EF4444';
    return '#3B82F6';
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: PayrollRun }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PayrollRunDetails', { runId: item.s_no })}
      activeOpacity={0.7}
    >
      <Card style={{ marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
              {formatMonth(item.month)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: Theme.withOpacity(getStatusColor(item.status), 0.12),
                  borderWidth: 1,
                  borderColor: Theme.withOpacity(getStatusColor(item.status), 0.25),
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: getStatusColor(item.status) }}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Theme.colors.text.tertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

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

  if (loading && runs.length === 0) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Employee Salaries"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Theme.colors.background.blue}
          syncMobileHeaderBg={true}
        />
        <View style={{ flex: 1, backgroundColor: CONTENT_COLOR, padding: 16, paddingTop: 12 }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
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
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            onPress={handleGenerateSalary}
            disabled={isGeneratingPayroll || !canCreateSalary}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: Theme.colors.primary,
              opacity: isGeneratingPayroll || !canCreateSalary ? 0.7 : 1,
            }}
          >
            <Ionicons name="flash-outline" size={18} color="#fff" />
            <Text style={{ marginLeft: 8, fontSize: 13, color: '#fff', fontWeight: '700' }}>
              Generate
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={runs}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16, textAlign: 'center' }}>
                  No payroll runs found
                </Text>
              </View>
            ) : null
          }
          renderItem={renderItem}
          ListFooterComponent={
            hasMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      <SlideBottomModal
        visible={generateModalVisible}
        onClose={() => {
          if (!isGeneratingPayroll) setGenerateModalVisible(false);
        }}
        title="Generate Salary"
        subtitle="Select month to generate"
        onSubmit={submitGeneratePayroll}
        submitLabel={isGeneratingPayroll ? 'Generating...' : 'Generate'}
        cancelLabel="Cancel"
        isLoading={isGeneratingPayroll}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Month
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MONTHS.map((m) => {
              const selected = generateMonth === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setGenerateMonth(m.value)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: selected ? Theme.colors.primary : Theme.colors.border,
                    backgroundColor: selected ? Theme.withOpacity(Theme.colors.primary, 0.12) : '#fff',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: selected ? '700' : '600',
                    color: selected ? Theme.colors.primary : Theme.colors.text.primary,
                  }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
            Year
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {years.map((y) => {
              const selected = generateYear === y;
              return (
                <TouchableOpacity
                  key={String(y)}
                  onPress={() => setGenerateYear(y)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: selected ? Theme.colors.primary : Theme.colors.border,
                    backgroundColor: selected ? Theme.withOpacity(Theme.colors.primary, 0.12) : '#fff',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: selected ? '700' : '600',
                    color: selected ? Theme.colors.primary : Theme.colors.text.primary,
                  }}>
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Card style={{ marginTop: 12, padding: 12 }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 4 }}>
            Selected
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text.primary }}>
            {getSelectedMonthLabel(generateMonth)}, {generateYear}
          </Text>
        </Card>
      </SlideBottomModal>
      </View>
    </ScreenLayout>
  );
};
