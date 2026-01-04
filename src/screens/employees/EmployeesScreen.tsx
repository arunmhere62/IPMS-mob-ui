import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { Ionicons } from '@expo/vector-icons';
import { Employee, useDeleteEmployeeMutation, useLazyGetEmployeesQuery } from '../../services/api/employeesApi';
import { CONTENT_COLOR } from '@/constant';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

interface EmployeesScreenProps {
  navigation: any;
}

export const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ navigation }) => {
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { can } = usePermissions();
  const canEditEmployee = can(Permission.EDIT_EMPLOYEE);
  const canDeleteEmployee = can(Permission.DELETE_EMPLOYEE);
  const canViewEmployee = can(Permission.VIEW_EMPLOYEE);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const isFetchingRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  const flatListRef = React.useRef<any>(null);
  const scrollPositionRef = React.useRef(0);

  const [fetchEmployees] = useLazyGetEmployeesQuery();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const loadEmployees = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await fetchEmployees({
        page: pageNum,
        limit: 20,
        pg_id: selectedPGLocationId || undefined,
      }).unwrap();

      if (response.success) {
        if (append) {
          setEmployees(prev => [...prev, ...response.data]);
        } else {
          setEmployees(response.data);
        }
        setPagination(response.pagination || null);
        const totalPages = response.pagination?.totalPages || 0;
        setHasMore(totalPages ? pageNum < totalPages : Boolean(response.pagination?.hasMore));
        setPage(pageNum);

        if (flatListRef.current && pageNum === 1 && !append) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      }
    } catch (error: any) {
      showErrorAlert(error, 'Employees Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [fetchEmployees, selectedPGLocationId]);

  useEffect(() => {
    loadEmployees(1, false);
  }, [selectedPGLocationId, loadEmployees]);

  useFocusEffect(
    useCallback(() => {
      // When coming back from AddEmployee (create/update) refresh the list
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      loadEmployees(1, false);
    }, [loadEmployees])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setEmployees([]);
    setPagination(null);
    setHasMore(true);
    setPage(1);
    loadEmployees(1, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadEmployees(nextPage, true);
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

  const handleDelete = (employee: Employee) => {
    showDeleteConfirmation({
      title: 'Delete Employee',
      message: 'Are you sure you want to delete',
      itemName: employee.name,
      onConfirm: async () => {
        try {
          await deleteEmployee(employee.s_no).unwrap();
          showSuccessAlert('Employee deleted successfully');
          loadEmployees(1, false);
        } catch (error: any) {
          showErrorAlert(error, 'Delete Error');
        }
      },
    });
  };

  const renderEmployeeCard = (employee: Employee) => (
    <Card key={employee.s_no} style={{ marginBottom: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, flex: 1 }}>
              {employee.name}
            </Text>
            <View
              style={{
                backgroundColor: employee.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 6,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: employee.status === 'ACTIVE' ? '#16A34A' : '#DC2626',
                }}
              >
                {employee.status}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="briefcase-outline" size={14} color={Theme.colors.text.secondary} />
            <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginLeft: 6 }}>
              {employee.roles?.role_name || 'N/A'}
            </Text>
          </View>

          {employee.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="mail-outline" size={14} color={Theme.colors.text.secondary} />
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                {employee.email}
              </Text>
            </View>
          )}

          {employee.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="call-outline" size={14} color={Theme.colors.text.secondary} />
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginLeft: 6 }}>
                {employee.phone}
              </Text>
            </View>
          )}
        </View>

        <ActionButtons
          onEdit={() => navigation.navigate('AddEmployee', { employeeId: employee.s_no })}
          onDelete={() => handleDelete(employee)}
          onView={() => navigation.navigate('EmployeeDetails', { employeeId: employee.s_no })}
          showEdit={true}
          showDelete={true}
          showView={true}
          disableEdit={!canEditEmployee}
          disableDelete={!canDeleteEmployee}
          disableView={!canViewEmployee}
          blockPressWhenDisabled
        />
      </View>

    </Card>
  );

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
        title="Employees"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {/* Employee List */}
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
              {visibleItemsCount} of {pagination?.total || employees.length}
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#fff',
              opacity: 0.8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {(pagination?.total || employees.length) - visibleItemsCount} remaining
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={employees}
          renderItem={({ item }) => renderEmployeeCard(item)}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            loading && page === 1 && employees.length === 0 ? (
              <View>
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
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <SkeletonLoader width={28} height={28} borderRadius={8} />
                        <SkeletonLoader width={28} height={28} borderRadius={8} />
                      </View>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <SkeletonLoader width="70%" height={10} style={{ marginBottom: 6 }} />
                      <SkeletonLoader width="55%" height={10} />
                    </View>
                  </Card>
                ))}
              </View>
            ) : employees.length === 0 && !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="people-outline" size={64} color={Theme.colors.text.tertiary} />
                <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16 }}>
                  No employees found
                </Text>
              </View>
            ) : null
          }
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

        {/* Add Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEmployee')}
          style={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            backgroundColor: Theme.colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};
