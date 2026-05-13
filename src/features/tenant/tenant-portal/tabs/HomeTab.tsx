import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge, InfoRow, SectionCard, CardHeader, EmptyState } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { TenantProfileData } from '@/services/api/tenantPortalApi';

const C = Theme.colors;

interface HomeTabProps {
  raw: TenantProfileData;
  isPaid: boolean;
  isPending: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ raw, isPaid, isPending }) => {
  const { formatDate, formatAmount } = useFormatters();

  return (
    <>
      {/* Hero Status Card */}
      <LinearGradient
        colors={isPaid ? ['#059669', '#10b981'] : isPending ? ['#ea580c', '#f97316'] : ['#dc2626', '#ef4444']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Hello, {raw?.name?.split(' ')[0] ?? 'Tenant'} 👋</Text>
            <Text style={styles.heroSub}>{raw?.pg_locations?.location_name ?? 'My PG'}</Text>
          </View>
          <View style={styles.heroAvatarWrap}>
            <Text style={styles.heroAvatar}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View>
            <Text style={styles.heroAmountLabel}>Due Amount</Text>
            <Text style={styles.heroAmount}>{formatAmount(raw?.rent_due_amount ?? 0)}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name={isPaid ? 'checkmark-circle' : 'time'} size={14} color="#fff" />
            <Text style={styles.heroBadgeText}>{raw?.payment_status ?? 'N/A'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: C.background.blueLight }]}>
          <Ionicons name="bed-outline" size={16} color={C.primary} />
          <Text style={[styles.statText, { color: C.primary }]}>{raw?.rooms?.room_no ?? 'N/A'}</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#f0fdf4' }]}>
          <Ionicons name="key-outline" size={16} color={C.secondary} />
          <Text style={[styles.statText, { color: C.secondary }]}>{raw?.beds?.bed_no ?? 'N/A'}</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#fdf4ff' }]}>
          <Ionicons name="cash-outline" size={16} color="#9333ea" />
          <Text style={[styles.statText, { color: '#9333ea' }]}>{formatAmount(raw?.beds?.bed_price)}/mo</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#fff7ed' }]}>
          <Ionicons name="calendar-outline" size={16} color={C.warning} />
          <Text style={[styles.statText, { color: C.warning }]}>{formatDate(raw?.check_in_date)}</Text>
        </View>
      </View>

      {/* Unpaid Alert */}
      {raw?.unpaid_months && raw.unpaid_months.length > 0 ? (
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Ionicons name="warning" size={20} color={C.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Unpaid Month</Text>
            {raw.unpaid_months.map((m: any, i: number) => (
              <Text key={i} style={styles.alertSub}>
                {formatDate(m.cycle_start)} – {formatDate(m.cycle_end)}
              </Text>
            ))}
          </View>
          <StatusBadge status="PENDING" />
        </View>
      ) : null}

      {/* PG Details */}
      <SectionCard>
        <CardHeader icon="business" title="My PG" />
        <InfoRow icon="location-outline" label="Address" value={raw?.pg_locations?.address ?? 'N/A'} />
        <InfoRow icon="map-outline" label="City" value={raw?.pg_locations?.city?.name ?? 'N/A'} />
        <InfoRow icon="refresh-outline" label="Cycle Type" value={raw?.pg_locations?.rent_cycle_type ?? 'N/A'} />
        <InfoRow icon="log-in-outline" label="Check-in" value={formatDate(raw?.check_in_date)} />
      </SectionCard>

      {/* Recent Payments */}
      <SectionCard>
        <CardHeader icon="receipt-outline" title="Recent Payments" />
        {!raw?.rent_payments?.length ? (
          <EmptyState icon="receipt-outline" message="No payments yet" />
        ) : (
          raw.rent_payments.slice(0, 3).map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: p.payment_method === 'GPAY' ? '#e0f2fe' : '#f0fdf4' }]}>
                <Ionicons name={p.payment_method === 'GPAY' ? 'phone-portrait-outline' : 'cash-outline'} size={16} color={p.payment_method === 'GPAY' ? '#0284c7' : '#16a34a'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}</Text>
                <Text style={styles.payMeta}>{p.payment_method} · {formatDate(p.payment_date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.payAmount}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
};

const styles = StyleSheet.create({
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: C.primaryDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  heroAvatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  heroAvatar: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  heroAmount: { fontSize: 28, fontWeight: '900', color: '#fff' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statText: { fontSize: 12, fontWeight: '600' },

  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff1f2', borderRadius: 14, padding: 14, marginBottom: 16, gap: 12, borderLeftWidth: 4, borderLeftColor: C.danger },
  alertIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.dangerDark },
  alertSub: { fontSize: 12, color: C.darkSecondary, marginTop: 2 },

  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  payMethodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },
});
