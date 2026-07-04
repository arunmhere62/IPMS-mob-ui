import React from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components';
import Theme from '@/theme';
import { TenantTicket } from '@/features/tenant/api/tenantTicketsApi';

const C = Theme.colors;

interface TicketsTabProps {
  tickets: TenantTicket[];
  isLoading: boolean;
  navigation: any;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  IN_PROGRESS: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  RESOLVED: { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  CLOSED: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' } };

const CATEGORY_ICONS: Record<string, string> = {
  MAINTENANCE: 'construct-outline',
  COMPLAINT: 'alert-circle-outline',
  REQUEST: 'hand-left-outline',
  OTHER: 'help-circle-outline' };

export const TicketsTab: React.FC<TicketsTabProps> = ({ tickets, isLoading, navigation }) => {
  return (
    <>
      <View style={styles.ticketsHeader}>
        <Text style={styles.title}>My Tickets</Text>
        <AnimatedPressableCard
          style={styles.ticketsAddBtn}
          onPress={() => navigation.navigate('TenantCreateTicket')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.ticketsAddText} numberOfLines={1} adjustsFontSizeToFit>New</Text>
        </AnimatedPressableCard>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginVertical: 24 }} />
      ) : tickets.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <EmptyState icon="ticket-outline" message="No tickets raised yet" />
          <AnimatedPressableCard
            style={[styles.ticketsAddBtn, { marginTop: 16 }]}
            onPress={() => navigation.navigate('TenantCreateTicket')}
          >
            <Text style={styles.ticketsAddText} numberOfLines={1} adjustsFontSizeToFit>Raise a Ticket</Text>
          </AnimatedPressableCard>
        </View>
      ) : (
        tickets.map((item: TenantTicket) => {
          const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.OPEN;
          const icon = CATEGORY_ICONS[item.category] ?? 'help-circle-outline';
          return (
            <AnimatedPressableCard
              key={item.s_no}
              style={styles.ticketCard}
              onPress={() => navigation.navigate('TenantTicketDetail', { ticketId: item.s_no })}
            >
              <View style={styles.ticketCardRow}>
                <View style={[styles.ticketIconBox, { backgroundColor: sc.bg }]}>
                  <Ionicons name={icon as any} size={18} color={sc.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.ticketCategory}>{item.category}</Text>
                </View>
                <View style={[styles.ticketBadge, { backgroundColor: sc.bg }]}>
                  <View style={[styles.ticketDot, { backgroundColor: sc.dot }]} />
                  <Text style={[styles.ticketBadgeText, { color: sc.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.ticketFooter}>
                <Ionicons name="flag-outline" size={12} color={C.darkTertiary} />
                <Text style={styles.ticketFooterText}>{item.priority}</Text>
                <Text style={[styles.ticketFooterText, { marginLeft: 'auto' }]}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </AnimatedPressableCard>
          );
        })
      )}
    </>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: C.dark, flex: 1 },
  ticketsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  ticketsAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ticketsAddText: { fontSize: 13, fontWeight: '600', color: '#fff', flexShrink: 1 },
  ticketCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  ticketCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ticketIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ticketTitle: { fontSize: 14, fontWeight: '600', color: C.dark },
  ticketCategory: { fontSize: 11, color: C.darkTertiary, marginTop: 1 },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  ticketDot: { width: 5, height: 5, borderRadius: 3 },
  ticketBadgeText: { fontSize: 10, fontWeight: '700' },
  ticketFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ticketFooterText: { fontSize: 11, color: C.darkTertiary } });
