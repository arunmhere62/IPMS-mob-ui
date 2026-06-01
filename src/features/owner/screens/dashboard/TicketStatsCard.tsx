import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../theme';
import { Card } from '../../../../components/Card';
import { useNavigation } from '@react-navigation/native';
import type { TicketOverview, DashboardTicket, UnreadTickets } from '../../api/dashboardApi';

interface TicketStatsCardProps {
  overview: TicketOverview;
  recentTickets: DashboardTicket[];
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
  const [activeTab, setActiveTab] = useState<'unread' | 'recent'>('recent');

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <Card
          style={{
            padding: 14,
            borderWidth: 1,
            borderColor: Theme.colors.border,
            backgroundColor: Theme.colors.background.secondary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.colors.lightSecondary }} />
            <View style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: Theme.colors.lightSecondary, marginLeft: 12 }} />
          </View>
          <View>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: Theme.colors.lightSecondary }} />
                  <View style={{ width: 60, height: 14, borderRadius: 4, backgroundColor: Theme.colors.lightSecondary }} />
                </View>
                <View style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: Theme.colors.lightSecondary }} />
              </View>
            ))}
          </View>
        </Card>
      </View>
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

  const StatItem: React.FC<{ label: string; value: number; color: string; icon: string }> = ({ label, value, color, icon }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Theme.withOpacity(color, 0.08), borderRadius: 8, marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={{ color: Theme.colors.text.primary, fontSize: 12, fontWeight: '900' }}>{label}</Text>
      </View>
      <Text style={{ color: color, fontSize: 18, fontWeight: '900' }}>{value}</Text>
    </View>
  );

  const TicketItem: React.FC<{ ticket: DashboardTicket; showTenant?: boolean }> = ({ ticket, showTenant = false }) => (
    <TouchableOpacity
      onPress={() => (navigation as any).navigate('PgTenantTicketDetail', { ticketId: ticket.s_no })}
      activeOpacity={0.85}
    >
      <Card
        shadowColor="shadow-none"
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: Theme.withOpacity(getStatusColor(ticket.status), 0.18),
          backgroundColor: Theme.withOpacity(getStatusColor(ticket.status), 0.08),
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 4 }} numberOfLines={2}>
              {ticket.title}
            </Text>
            {showTenant && ticket.tenants && (
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                {ticket.tenants.name}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="chatbubble-outline" size={16} color={Theme.colors.text.secondary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>{ticket._count.tenant_ticket_comments}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: `${getStatusColor(ticket.status)}20` }}>
            <Text style={{ fontSize: 10, color: getStatusColor(ticket.status), fontWeight: '500' }}>{ticket.status}</Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: `${getPriorityColor(ticket.priority)}20` }}>
            <Text style={{ fontSize: 10, color: getPriorityColor(ticket.priority), fontWeight: '500' }}>{ticket.priority}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <Text style={{ color: Theme.colors.text.primary, fontSize: 16, fontWeight: '800' }}>
            Tickets
          </Text>
          <Text style={{ color: Theme.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
            Track and manage support tickets
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('PgTenantTickets' as never)}>
          <Text style={{ fontSize: 12, color: Theme.colors.primary, fontWeight: '900' }}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Stats */}
      <Card
        shadowColor="shadow-none"
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          backgroundColor: Theme.colors.background.secondary,
          marginBottom: 16,
        }}
      >
        <View>
          <StatItem label="Total" value={overview.total} color={Theme.colors.dark} icon="layers" />
          <StatItem label="Open" value={overview.open} color={Theme.colors.danger} icon="alert-circle" />
          <StatItem label="In Progress" value={overview.inProgress} color={Theme.colors.warning} icon="time" />
          <StatItem label="Resolved" value={overview.resolved} color={Theme.colors.info} icon="checkmark-circle" />
          <StatItem label="Closed" value={overview.closed} color={Theme.colors.secondary} icon="close-circle" />
          <StatItem label="High Priority" value={overview.highPriority} color={Theme.colors.danger} icon="flag" />
        </View>
      </Card>

      {/* Tickets Tab */}
      <Card
        shadowColor="shadow-none"
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          backgroundColor: Theme.colors.background.secondary,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('recent')}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: activeTab === 'recent' ? Theme.colors.primary : 'transparent',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'recent' ? '#fff' : Theme.colors.text.primary }}>
              Recent
            </Text>
          </TouchableOpacity>
          {unreadTickets.count > 0 && (
            <TouchableOpacity
              onPress={() => setActiveTab('unread')}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: activeTab === 'unread' ? Theme.colors.warning : 'transparent',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'unread' ? '#fff' : Theme.colors.text.primary }}>
                Unread ({unreadTickets.count})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'recent' ? (
            recentTickets.length > 0 ? (
              recentTickets.map((ticket) => <TicketItem key={ticket.s_no} ticket={ticket} showTenant />)
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>No tickets yet</Text>
              </View>
            )
          ) : (
            unreadTickets.tickets.length > 0 ? (
              unreadTickets.tickets.map((ticket) => <TicketItem key={ticket.s_no} ticket={ticket} showTenant />)
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>No unread tickets</Text>
              </View>
            )
          )}
        </ScrollView>
      </Card>
    </View>
  );
};
