import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/theme';
import { Card } from '@/components/Card';
import { useNavigation } from '@react-navigation/native';
import type { TicketOverview, Ticket, UnreadTickets } from '../api/tenantPortalApi';

interface TicketStatsCardProps {
  overview: TicketOverview;
  recentTickets: Ticket[];
  unreadTickets: UnreadTickets;
  isLoading?: boolean;
}

export const TicketStatsCard: React.FC<TicketStatsCardProps> = ({
  overview,
  recentTickets,
  unreadTickets,
  isLoading = false,
}) => {
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.colors.lightSecondary }} />
          <View style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: Theme.colors.lightSecondary, marginLeft: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={{ width: '30%', padding: 12, borderRadius: 8, backgroundColor: Theme.colors.lightSecondary }} />
          ))}
        </View>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return Theme.colors.danger;
      case 'IN_PROGRESS':
        return Theme.colors.warning;
      case 'RESOLVED':
        return Theme.colors.info;
      case 'CLOSED':
        return Theme.colors.secondary;
      default:
        return Theme.colors.dark;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return Theme.colors.danger;
      case 'MEDIUM':
        return Theme.colors.warning;
      case 'LOW':
        return Theme.colors.secondary;
      default:
        return Theme.colors.dark;
    }
  };

  const StatItem: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <View style={{ flex: 1, minWidth: '30%', alignItems: 'center', padding: 12, backgroundColor: Theme.colors.lightSecondary, borderRadius: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: Theme.colors.darkSecondary, marginTop: 4 }}>{label}</Text>
    </View>
  );

  const TicketItem: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <TouchableOpacity
      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.lightSecondary }}
      onPress={() => (navigation as any).navigate('TenantTicketDetail', { ticketId: ticket.s_no })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.dark, marginBottom: 4 }} numberOfLines={1}>
            {ticket.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: `${getStatusColor(ticket.status)}20` }}>
              <Text style={{ fontSize: 10, color: getStatusColor(ticket.status), fontWeight: '500' }}>{ticket.status}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: `${getPriorityColor(ticket.priority)}20` }}>
              <Text style={{ fontSize: 10, color: getPriorityColor(ticket.priority), fontWeight: '500' }}>{ticket.priority}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Ionicons name="chatbubble-outline" size={16} color={Theme.colors.darkSecondary} />
          <Text style={{ fontSize: 10, color: Theme.colors.darkSecondary }}>{ticket._count.tenant_ticket_comments}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Card style={{ padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="ticket-outline" size={24} color={Theme.colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.dark, marginLeft: 12 }}>My Tickets</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('TenantTickets' as never)}>
          <Text style={{ fontSize: 14, color: Theme.colors.primary }}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <StatItem label="Total" value={overview.total} color={Theme.colors.dark} />
        <StatItem label="Open" value={overview.open} color={Theme.colors.danger} />
        <StatItem label="In Progress" value={overview.inProgress} color={Theme.colors.warning} />
        <StatItem label="Resolved" value={overview.resolved} color={Theme.colors.info} />
        <StatItem label="Closed" value={overview.closed} color={Theme.colors.secondary} />
        <StatItem label="High Priority" value={overview.highPriority} color={Theme.colors.danger} />
      </View>

      {/* Unread Tickets */}
      {unreadTickets.count > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.dark }}>
              Unread ({unreadTickets.count})
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {unreadTickets.tickets.slice(0, 5).map((ticket) => (
              <View key={ticket.s_no} style={{ marginRight: 12, width: 200 }}>
                <TicketItem ticket={ticket} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Tickets */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.dark, marginBottom: 8 }}>
          Recent Tickets
        </Text>
        <View style={{ backgroundColor: Theme.colors.lightSecondary, borderRadius: 8 }}>
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => <TicketItem key={ticket.s_no} ticket={ticket} />)
          ) : (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: Theme.colors.darkSecondary }}>No tickets yet</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};
