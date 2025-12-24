import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { showErrorAlert } from '../../utils/errorHandler';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import { useLazyGetTicketsQuery, useDeleteTicketMutation } from '@/services/api/ticketsApi';

interface TicketsScreenProps {
  navigation: any;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return { bg: '#FEE2E2', text: '#EF4444', icon: '🔴' };
    case 'HIGH': return { bg: '#FED7AA', text: '#F59E0B', icon: '🟠' };
    case 'MEDIUM': return { bg: '#FEF3C7', text: '#EAB308', icon: '🟡' };
    case 'LOW': return { bg: '#D1FAE5', text: '#10B981', icon: '🟢' };
    default: return { bg: '#F3F4F6', text: '#6B7280', icon: '⚪' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return { bg: '#DBEAFE', text: '#3B82F6', icon: '🔵' };
    case 'IN_PROGRESS': return { bg: '#E9D5FF', text: '#8B5CF6', icon: '🟣' };
    case 'RESOLVED': return { bg: '#D1FAE5', text: '#10B981', icon: '🟢' };
    case 'CLOSED': return { bg: '#F3F4F6', text: '#6B7280', icon: '⚫' };
    default: return { bg: '#F3F4F6', text: '#6B7280', icon: '⚪' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'BUG': return '🐛';
    case 'FEATURE_REQUEST': return '✨';
    case 'SUPPORT': return '🆘';
    case 'OTHER': return '📌';
    default: return '📋';
  }
};

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ navigation }) => {
  const [triggerTickets, { isFetching }] = useLazyGetTicketsQuery();
  const [deleteTicketMutation] = useDeleteTicketMutation();

  const [tickets, setTickets] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const loading = isFetching;

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MY_TICKETS' | 'OPEN' | 'RESOLVED'>('ALL');

  const flatListRef = React.useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [filterStatus, searchQuery])
  );

  const buildFilters = (page: number) => {
    const filters: any = {
      page,
      limit: 20,
      search: searchQuery || undefined,
    };

    if (filterStatus === 'MY_TICKETS') {
      filters.my_tickets = true;
    } else if (filterStatus !== 'ALL') {
      filters.status = filterStatus;
    }

    return filters;
  };

  const loadTickets = async () => {
    try {
      const filters = buildFilters(1);
      const res = await triggerTickets(filters).unwrap();
      setTickets(res.data || []);
      setPagination(res.pagination || null);
      setCurrentPage(1);
    } catch (error: any) {
      showErrorAlert(error, 'Load Tickets Error');
    }
  };

  const loadMoreTickets = async () => {
    if (loading || !pagination?.hasMore) return;
    try {
      const nextPage = currentPage + 1;
      const res = await triggerTickets(buildFilters(nextPage)).unwrap();
      setTickets((prev) => [...prev, ...(res.data || [])]);
      setPagination(res.pagination || null);
      setCurrentPage(nextPage);
    } catch (error: any) {
      showErrorAlert(error, 'Load More Error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleDeleteTicket = (ticketId: number, ticketNumber: string) => {
    Alert.alert(
      'Delete Ticket',
      `Are you sure you want to delete ticket ${ticketNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTicketMutation(ticketId).unwrap();
              Alert.alert('Success', 'Ticket deleted successfully');
              loadTickets();
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  const renderTicketCard = ({ item }: { item: any }) => {
    const priorityColor = getPriorityColor(item.priority);
    const statusColor = getStatusColor(item.status);
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TicketDetails', { ticketId: item.s_no })}
      >
        <Card style={{ marginBottom: 12, padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, marginRight: 4 }}>{categoryIcon}</Text>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, fontWeight: '600' }}>
                  {item.ticket_number}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                {item.title}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: priorityColor.bg,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: priorityColor.text }}>
                {priorityColor.icon} {item.priority}
              </Text>
            </View>
          </View>

          {/* Description Preview */}
          <Text
            style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 12 }}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          {/* Status & Info */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: statusColor.bg,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor.text }}>
                {statusColor.icon} {item.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout   backgroundColor={Theme.colors.background.blue}>
      <ScreenHeader
       onBackPress={() => navigation.goBack()}
        title="Support Tickets"
        subtitle={`${pagination?.total || 0} total`}
        showPGSelector={false}
        showBackButton={true}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
      {/* Search & Filter Bar */}
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Theme.colors.background.secondary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
            }}
            placeholder="Search tickets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadTickets}
          />
          <TouchableOpacity
            onPress={loadTickets}
            style={{
              backgroundColor: Theme.colors.primary,
              borderRadius: 8,
              paddingHorizontal: 16,
              justifyContent: 'center',
            }}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['ALL', 'MY_TICKETS', 'OPEN', 'RESOLVED'].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setFilterStatus(filter as any)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: filterStatus === filter ? Theme.colors.primary : '#F3F4F6',
                borderWidth: 1,
                borderColor: filterStatus === filter ? Theme.colors.primary : Theme.colors.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: filterStatus === filter ? '#fff' : Theme.colors.text.secondary,
              }}>
                {filter === 'MY_TICKETS' ? 'My Tickets' : filter.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tickets List */}
      {loading && tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={tickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🎫</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>No Tickets Found</Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                Create your first support ticket
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && currentPage > 1 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: Theme.colors.text.secondary }}>
                  Loading more...
                </Text>
              </View>
            ) : null
          }
          onEndReached={loadMoreTickets}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Floating Add Ticket Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateTicket')}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 80,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '300' }}>+</Text>
      </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};
