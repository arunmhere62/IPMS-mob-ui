import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/theme';

const C = Theme.colors;

export const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const isPaid = status === 'PAID';
  const isPending = status === 'PENDING';
  const bg = isPaid ? '#d1fae5' : isPending ? '#fff7ed' : '#fee2e2';
  const color = isPaid ? '#065f46' : isPending ? '#c2410c' : '#991b1b';
  const dot = isPaid ? '#10b981' : isPending ? '#f97316' : '#ef4444';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: dot }]} />
      <Text
        style={[styles.badgeText, { color }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {status || 'N/A'}
      </Text>
    </View>
  );
};

export const InfoRow = ({ label, value, valueColor, icon }: { label: string; value: string; valueColor?: string; icon?: string }) => (
  <View style={styles.infoRow}>
    {icon ? <Ionicons name={icon as any} size={14} color={C.darkTertiary} style={{ marginRight: 6 }} /> : null}
    <Text style={styles.infoLabel} numberOfLines={2} ellipsizeMode="tail">{label}</Text>
    <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
  </View>
);

export const SectionCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const CardHeader = ({ icon, title, color, right }: { icon: string; title: string; color?: string; right?: React.ReactNode }) => (
  <View style={styles.cardHeader}>
    <View style={[styles.cardIconWrap, { backgroundColor: (color || C.primary) + '18' }]}>
      <Ionicons name={icon as any} size={18} color={color || C.primary} />
    </View>
    <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
    {right ? <View style={{ marginLeft: 'auto' }}>{right}</View> : null}
  </View>
);

export const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon as any} size={32} color={C.darkTertiary} />
    </View>
    <Text style={styles.emptyText} numberOfLines={2} ellipsizeMode="tail">{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 13, color: C.darkTertiary, flex: 1, paddingRight: 6 },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.dark, flex: 1.2, textAlign: 'right', paddingLeft: 6 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.dark, flex: 1 },
  
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.lightSecondary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: C.darkTertiary, fontWeight: '500' },
});
