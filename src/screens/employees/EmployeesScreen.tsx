import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { ActionButtons } from '../../components/ActionButtons';
import { Theme } from '../../theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { showDeleteConfirmation } from '../../components/DeleteConfirmationDialog';
import { Ionicons } from '@expo/vector-icons';
import employeeService, { Employee } from '../../services/employees/employeeService';
import { CONTENT_COLOR } from '@/constant';

interface EmployeesScreenProps {
  navigation: any;
}

export const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  const loadEmployees = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await employeeService.getEmployees(
        pageNum,
        20,
        selectedPGLocationId || undefined,
        undefined,
        search || undefined,
      );

      if (response.success) {
        if (append) {
          setEmployees(prev => [...prev, ...response.data]);
        } else {
          setEmployees(response.data);
        }
        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [selectedPGLocationId, search]);

  useEffect(() => {
    loadEmployees(1, false);
  }, [selectedPGLocationId, search, loadEmployees]);

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
    loadEmployees(1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadEmployees(page + 1, true);
    }
  };

  const handleDelete = (employee: Employee) => {
    showDeleteConfirmation({
      title: 'Delete Employee',
      message: 'Are you sure you want to delete',
      itemName: employee.name,
      onConfirm: async () => {
        try {
          await employeeService.deleteEmployee(employee.s_no);
          Alert.alert('Success', 'Employee deleted successfully');
          loadEmployees(1, false);
        } catch (error: any) {
          Alert.alert('Error', error?.response?.data?.message || 'Failed to delete employee');
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
        {/* Search Bar */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: Theme.colors.border,
            }}
          >
            <Ionicons name="search" size={20} color={Theme.colors.text.tertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search employees..."
              style={{
                flex: 1,
                padding: 12,
                fontSize: 14,
                color: Theme.colors.text.primary,
              }}
            />
          </View>
        </View>

        {/* Employee List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}
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
          {employees.length === 0 && !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="people-outline" size={64} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, marginTop: 16 }}>
                No employees found
              </Text>
            </View>
          ) : (
            employees.map(renderEmployeeCard)
          )}

          {loading && page === 1 && (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />
          )}

          {loading && page > 1 && (
            <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginVertical: 16 }} />
          )}
        </ScrollView>

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
