import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../theme';
import { Card } from '../../../../components/Card';
import { AnimatedPressableCard } from '../../../../components/AnimatedPressableCard';
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
    <View style={{ flex: 1, minWidth: 80, alignItems: 'center', paddingVertical: 8, backgroundColor: Theme.withOpacity(color, 0.08), borderRadius: 8, marginRight: 6, marginBottom: 6 }}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={{ color: color, fontSize: 16, fontWeight: '900', marginTop: 2 }}>{value}</Text>
      <Text style={{ color: Theme.colors.text.secondary, fontSize: 10, fontWeight: '600', marginTop: 1 }} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
  );

  const TicketItem: React.FC<{ ticket: DashboardTicket; showTenant?: boolean }> = ({ ticket, showTenant = false }) => (
    <AnimatedPressableCard
      onPress={() => (navigation as any).navigate('PgTenantTicketDetail', { ticketId: ticket.s_no })}
    >
      <Card
        shadowColor="shadow-none"
        style={{
          padding: 10,
          borderWidth: 1,
          borderColor: Theme.withOpacity(getStatusColor(ticket.status), 0.18),
          backgroundColor: Theme.withOpacity(getStatusColor(ticket.status), 0.08),
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary }} numberOfLines={1}>
              {ticket.title}
            </Text>
            {showTenant && ticket.tenants && (
              <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginTop: 1 }}>
                {ticket.tenants.name}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="chatbubble-outline" size={12} color={Theme.colors.text.secondary} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.colors.text.primary }}>{ticket._count.tenant_ticket_comments}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, backgroundColor: `${getStatusColor(ticket.status)}20` }}>
                <Text style={{ fontSize: 9, color: getStatusColor(ticket.status), fontWeight: '500' }} numberOfLines={1} adjustsFontSizeToFit>{ticket.status}</Text>
              </View>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, backgroundColor: `${getPriorityColor(ticket.priority)}20` }}>
                <Text style={{ fontSize: 9, color: getPriorityColor(ticket.priority), fontWeight: '500' }} numberOfLines={1} adjustsFontSizeToFit>{ticket.priority}</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </AnimatedPressableCard>
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
        <AnimatedPressableCard onPress={() => navigation.navigate('PgTenantTickets' as never)}>
          <Text style={{ fontSize: 12, color: Theme.colors.primary, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>View All</Text>
        </AnimatedPressableCard>
      </View>

      {/* Overview Stats */}
      <Card
        shadowColor="shadow-none"
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          backgroundColor: Theme.colors.background.secondary,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatItem label="Total" value={overview.total} color={Theme.colors.dark} icon="layers" />
          <StatItem label="Open" value={overview.open} color={Theme.colors.danger} icon="alert-circle" />
          <StatItem label="In Progress" value={overview.inProgress} color={Theme.colors.warning} icon="time" />
          <StatItem label="Resolved" value={overview.resolved} color={Theme.colors.info} icon="checkmark-circle" />
          <StatItem label="Closed" value={overview.closed} color={Theme.colors.secondary} icon="close-circle" />
          <StatItem label="High" value={overview.highPriority} color={Theme.colors.danger} icon="flag" />
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
          <AnimatedPressableCard
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
            <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'recent' ? '#fff' : Theme.colors.text.primary }} numberOfLines={1} adjustsFontSizeToFit>
              Recent
            </Text>
          </AnimatedPressableCard>
          {unreadTickets.count > 0 && (
            <AnimatedPressableCard
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
              <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'unread' ? '#fff' : Theme.colors.text.primary }} numberOfLines={1} adjustsFontSizeToFit>
                Unread ({unreadTickets.count})
              </Text>
            </AnimatedPressableCard>
          )}
        </View>

        <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'recent' ? (
            recentTickets.length > 0 ? (
              recentTickets.map((ticket) => <TicketItem key={ticket.s_no} ticket={ticket} showTenant />)
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>No tickets yet</Text>
              </View>
            )
          ) : (
            unreadTickets.tickets.length > 0 ? (
              unreadTickets.tickets.map((ticket) => <TicketItem key={ticket.s_no} ticket={ticket} showTenant />)
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>No unread tickets</Text>
              </View>
            )
          )}
        </ScrollView>
      </Card>
    </View>
  );
};
