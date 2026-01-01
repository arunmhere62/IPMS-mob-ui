import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/theme';
import { CONTENT_COLOR } from '@/constant';
import { Card } from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { showErrorAlert } from '@/utils/errorHandler';
import { useLazyGetPayrollRunsQuery, type PayrollRun } from '@/services/api/payrollApi';

interface PayrollRunsScreenProps {
  navigation: any;
}

export const PayrollRunsScreen: React.FC<PayrollRunsScreenProps> = ({ navigation }) => {
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [pagination, setPagination] = React.useState<any>(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [triggerRuns] = useLazyGetPayrollRunsQuery();

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const loadRuns = React.useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
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
    [triggerRuns],
  );

  React.useEffect(() => {
    loadRuns(1, false);
  }, [loadRuns]);

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

  const getStatusColor = (status: string) => {
    if (status === 'LOCKED') return '#10B981';
    if (status === 'CANCELLED') return '#EF4444';
    return '#3B82F6';
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

  if (loading && runs.length === 0) {
    return (
      <ScreenLayout backgroundColor={Theme.colors.background.blue}>
        <ScreenHeader
          title="Payroll Runs"
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
        title="Payroll Runs"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        <FlatList
          data={runs}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
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
          ListFooterComponent={
            hasMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
      </View>
    </ScreenLayout>
  );
};
