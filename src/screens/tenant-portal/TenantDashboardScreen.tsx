import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../../store';
import { tenantLogout, setTenantData } from '../../store/slices/tenantAuthSlice';
import { Theme } from '../../theme';
import { useGetTenantProfileQuery } from '../../services/api/tenantPortalApi';
import { BottomNav } from '../../components/BottomNav';

interface TenantDashboardScreenProps {
  navigation: any;
}

const C = Theme.colors;

const tenantTabs = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'payments', label: 'Payments', icon: 'card' },
  { name: 'tickets', label: 'Tickets', icon: 'ticket-outline' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAmount = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const isPaid = status === 'PAID';
  const isPending = status === 'PENDING';
  const bg = isPaid ? '#d1fae5' : isPending ? '#fff7ed' : '#fee2e2';
  const color = isPaid ? '#065f46' : isPending ? '#c2410c' : '#991b1b';
  const dot = isPaid ? '#10b981' : isPending ? '#f97316' : '#ef4444';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: dot }]} />
      <Text style={[styles.badgeText, { color }]}>{status || 'N/A'}</Text>
    </View>
  );
};

const InfoRow = ({ label, value, valueColor, icon }: { label: string; value: string; valueColor?: string; icon?: string }) => (
  <View style={styles.infoRow}>
    {icon && <Ionicons name={icon as any} size={14} color={C.darkTertiary} style={{ marginRight: 6 }} />}
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </View>
);

const SectionCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const CardHeader = ({ icon, title, color, right }: { icon: string; title: string; color?: string; right?: React.ReactNode }) => (
  <View style={styles.cardHeader}>
    <View style={[styles.cardIconWrap, { backgroundColor: (color || C.primary) + '18' }]}>
      <Ionicons name={icon as any} size={18} color={color || C.primary} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    {right && <View style={{ marginLeft: 'auto' }}>{right}</View>}
  </View>
);

const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon as any} size={32} color={C.darkTertiary} />
    </View>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export const TenantDashboardScreen: React.FC<TenantDashboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { tenant, pg, accessToken } = useSelector((state: RootState) => state.tenantAuth);
  const [activeTab, setActiveTab] = useState('home');

  const { data: profileData, isLoading, error, refetch } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });

  const raw = profileData?.data;

  useEffect(() => {
    if (raw) {
      dispatch(setTenantData({
        tenant: {
          tenant_id: raw.s_no,
          name: raw.name,
          phone: raw.phone_no,
          email: raw.email,
          status: raw.status,
          check_in_date: raw.check_in_date,
        },
        pg: raw.pg_locations ? {
          pg_id: raw.pg_locations.s_no,
          location_name: raw.pg_locations.location_name,
          address: raw.pg_locations.address,
          city: raw.pg_locations.city?.name,
          state: raw.pg_locations.state?.name,
          rent_cycle_type: raw.pg_locations.rent_cycle_type,
        } : null,
        room_no: raw.rooms?.room_no,
        bed_no: raw.beds?.bed_no,
        bed_price: raw.beds?.bed_price,
        payment_status: raw.payment_status,
        rent_due_amount: raw.rent_due_amount,
        pending_months: raw.pending_months,
        rentCycles: raw.tenant_rent_cycles,
        recentPayments: raw.rent_payments,
      }));
    }
  }, [profileData]);

  const handleLogout = () => dispatch(tenantLogout());

  const isPaid = raw?.payment_status === 'PAID';
  const isPending = raw?.payment_status === 'PENDING';

  // ── HOME TAB ──────────────────────────────────────────────
  const renderHome = () => (
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
      {raw?.unpaid_months && raw.unpaid_months.length > 0 && (
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
      )}

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

  // ── PAYMENTS TAB ──────────────────────────────────────────
  const renderPayments = () => (
    <>
      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: C.background.blueLight }]}>
          <Text style={styles.summaryChipVal}>{raw?.rent_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: C.primary }]}>Rent</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#fdf4ff' }]}>
          <Text style={styles.summaryChipVal}>{raw?.advance_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: '#9333ea' }]}>Advance</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.summaryChipVal}>{raw?.refund_payments?.length ?? 0}</Text>
          <Text style={[styles.summaryChipLabel, { color: C.secondary }]}>Refunds</Text>
        </View>
      </View>

      <SectionCard>
        <CardHeader icon="cash-outline" title="Rent Payments" color={C.primary} />
        {!raw?.rent_payments?.length ? <EmptyState icon="cash-outline" message="No rent payments found" /> :
          raw.rent_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: p.payment_method === 'GPAY' ? '#e0f2fe' : '#f0fdf4' }]}>
                <Ionicons name={p.payment_method === 'GPAY' ? 'phone-portrait-outline' : 'cash-outline'} size={16} color={p.payment_method === 'GPAY' ? '#0284c7' : '#16a34a'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}</Text>
                <Text style={styles.payMeta}>{p.payment_method} · {formatDate(p.payment_date)}</Text>
                {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.payAmount}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard>
        <CardHeader icon="wallet-outline" title="Advance Payments" color="#9333ea" />
        {!raw?.advance_payments?.length ? <EmptyState icon="wallet-outline" message="No advance payments" /> :
          raw.advance_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: '#fdf4ff' }]}>
                <Ionicons name="wallet-outline" size={16} color="#9333ea" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.payment_date)}</Text>
                <Text style={styles.payMeta}>{p.payment_method}</Text>
                {p.remarks ? <Text style={styles.payRemark}>"{p.remarks}"</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.payAmount, { color: '#9333ea' }]}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>

      <SectionCard>
        <CardHeader icon="return-down-back-outline" title="Refunds" color={C.secondary} />
        {!raw?.refund_payments?.length ? <EmptyState icon="return-down-back-outline" message="No refunds found" /> :
          raw.refund_payments.map((p: any) => (
            <View key={p.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="return-down-back-outline" size={16} color={C.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{formatDate(p.payment_date)}</Text>
                <Text style={styles.payMeta}>{p.payment_method}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.payAmount, { color: C.secondary }]}>{formatAmount(p.amount_paid)}</Text>
                <StatusBadge status={p.status} />
              </View>
            </View>
          ))}
      </SectionCard>
    </>
  );

  // ── DUES SECTION (inside payments tab) ───────────────────
  const renderDues = () => (
    <>
      {/* Due amounts */}
      <View style={styles.dueGrid}>
        <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.dueGridItem} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="alert-circle-outline" size={22} color="#fff" />
          <Text style={styles.dueGridAmt}>{formatAmount(raw?.rent_due_amount ?? 0)}</Text>
          <Text style={styles.dueGridLabel}>Total Due</Text>
        </LinearGradient>
        <LinearGradient colors={['#ea580c', '#f97316']} style={styles.dueGridItem} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="time-outline" size={22} color="#fff" />
          <Text style={styles.dueGridAmt}>{formatAmount(raw?.pending_due_amount ?? 0)}</Text>
          <Text style={styles.dueGridLabel}>Pending</Text>
        </LinearGradient>
      </View>

      <SectionCard>
        <CardHeader icon="information-circle-outline" title="Payment Flags" />
        <InfoRow icon="checkmark-circle-outline" label="Rent Paid" value={raw?.is_rent_paid ? '✓ Yes' : '✗ No'} valueColor={raw?.is_rent_paid ? C.secondary : C.danger} />
        <InfoRow icon="checkmark-circle-outline" label="Advance Paid" value={raw?.is_advance_paid ? '✓ Yes' : '✗ No'} valueColor={raw?.is_advance_paid ? C.secondary : C.danger} />
        <InfoRow icon="checkmark-circle-outline" label="Is Partial" value={raw?.is_rent_partial ? 'Yes' : 'No'} valueColor={raw?.is_rent_partial ? C.warning : C.secondary} />
        <InfoRow icon="receipt-outline" label="Partial Due" value={formatAmount(raw?.partial_due_amount ?? 0)} valueColor={(raw?.partial_due_amount ?? 0) > 0 ? C.warning : C.secondary} />
      </SectionCard>

      <SectionCard>
        <CardHeader icon="calendar-outline" title="Rent Cycles" />
        {!raw?.tenant_rent_cycles?.length ? <EmptyState icon="calendar-outline" message="No rent cycles" /> :
          raw.tenant_rent_cycles.map((c: any, i: number) => {
            const paid = raw.rent_payments?.some((p: any) => p.cycle_id === c.s_no && p.status === 'PAID');
            return (
              <View key={c.s_no} style={styles.cycleRow}>
                <View style={[styles.cycleNum, { backgroundColor: paid ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={[styles.cycleNumText, { color: paid ? '#065f46' : '#991b1b' }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle}>{formatDate(c.cycle_start)} – {formatDate(c.cycle_end)}</Text>
                  <Text style={styles.payMeta}>{c.cycle_type}</Text>
                </View>
                <StatusBadge status={paid ? 'PAID' : 'PENDING'} />
              </View>
            );
          })}
      </SectionCard>
    </>
  );

  // ── PROFILE TAB ───────────────────────────────────────────
  const renderProfile = () => (
    <>
      {/* Profile Hero */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.profileHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{raw?.name ?? 'N/A'}</Text>
        <Text style={styles.profilePhone}>{raw?.phone_no ?? 'N/A'}</Text>
        <StatusBadge status={raw?.status} />
      </LinearGradient>

      {/* Photos */}
      {raw?.images && raw.images.length > 0 && (
        <SectionCard>
          <CardHeader icon="image-outline" title="My Photos" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {raw.images.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        </SectionCard>
      )}

      {/* Docs */}
      {raw?.proof_documents && raw.proof_documents.length > 0 && (
        <SectionCard>
          <CardHeader icon="document-text-outline" title="ID / Proof Documents" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {raw.proof_documents.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        </SectionCard>
      )}

      <SectionCard>
        <CardHeader icon="person-outline" title="Personal Details" />
        <InfoRow icon="call-outline" label="Phone" value={raw?.phone_no ?? 'N/A'} />
        <InfoRow icon="logo-whatsapp" label="WhatsApp" value={raw?.whatsapp_number ?? 'N/A'} />
        <InfoRow icon="mail-outline" label="Email" value={raw?.email ?? 'N/A'} />
        <InfoRow icon="briefcase-outline" label="Occupation" value={raw?.occupation ?? 'N/A'} />
        <InfoRow icon="location-outline" label="City" value={raw?.city?.name ?? 'N/A'} />
        <InfoRow icon="map-outline" label="State" value={raw?.state?.name ?? 'N/A'} />
        <InfoRow icon="home-outline" label="Address" value={raw?.tenant_address ?? 'N/A'} />
        <InfoRow icon="log-in-outline" label="Check-in" value={formatDate(raw?.check_in_date)} />
        <InfoRow icon="log-out-outline" label="Check-out" value={formatDate(raw?.check_out_date)} />
      </SectionCard>

      {raw?.tenant_allocations?.length ? (
        <SectionCard>
          <CardHeader icon="key-outline" title="Allocation History" />
          {raw.tenant_allocations.map((a: any) => (
            <View key={a.s_no} style={styles.payRow}>
              <View style={[styles.payMethodIcon, { backgroundColor: C.background.blueLight }]}>
                <Ionicons name="bed-outline" size={16} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{a.rooms?.room_no} · {a.beds?.bed_no}</Text>
                <Text style={styles.payMeta}>From {formatDate(a.effective_from)}{a.effective_to ? ` to ${formatDate(a.effective_to)}` : ' (current)'}</Text>
              </View>
              <Text style={styles.payAmount}>{formatAmount(a.bed_price_snapshot)}/mo</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <LinearGradient colors={[C.danger, C.dangerDark]} style={styles.logoutGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  // ── TICKETS TAB ───────────────────────────────────────────
  const renderTickets = () => (
    <SectionCard>
      <CardHeader icon="ticket-outline" title="My Tickets" />
      <EmptyState icon="ticket-outline" message="No tickets raised yet" />
    </SectionCard>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'payments': return <>{renderPayments()}{renderDues()}</>;
      case 'tickets': return renderTickets();
      case 'profile': return renderProfile();
      default: return renderHome();
    }
  };

  const ST = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Custom Header */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={[styles.header, { paddingTop: ST + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <Text style={styles.headerTitle}>Tenant Portal</Text>
          <Text style={styles.headerSub}>Welcome back, {raw?.name?.split(' ')[0] ?? tenant?.name ?? 'Tenant'}</Text>
        </View>
        <TouchableOpacity style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[C.primary]} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="wifi-outline" size={16} color={C.dangerDark} />
            <Text style={styles.errorText}>Could not load data. Pull down to retry.</Text>
          </View>
        )}
        {renderContent()}
      </ScrollView>

      <BottomNav tabs={tenantTabs} activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background.secondary },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },

  // Hero Card
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

  // Quick stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statText: { fontSize: 12, fontWeight: '600' },

  // Alert
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff1f2', borderRadius: 14, padding: 14, marginBottom: 16, gap: 12, borderLeftWidth: 4, borderLeftColor: C.danger },
  alertIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.dangerDark },
  alertSub: { fontSize: 12, color: C.darkSecondary, marginTop: 2 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.dark, flex: 1 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontSize: 13, color: C.darkTertiary, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.dark, flex: 1.2, textAlign: 'right' },

  // Payment rows
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  payMethodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  payMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  payRemark: { fontSize: 11, color: C.darkTertiary, fontStyle: 'italic', marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Summary chips
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  summaryChipVal: { fontSize: 22, fontWeight: '800', color: C.dark },
  summaryChipLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Dues grid
  dueGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dueGridItem: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  dueGridAmt: { fontSize: 20, fontWeight: '900', color: '#fff' },
  dueGridLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Cycle row
  cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  cycleNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleNumText: { fontSize: 13, fontWeight: '800' },

  // Profile Hero
  profileHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, gap: 8, shadowColor: C.primaryDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  profileAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  profileAvatarText: { fontSize: 30, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  // Photos
  photo: { width: 110, height: 130, borderRadius: 14, marginRight: 10, backgroundColor: C.lightSecondary },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.lightSecondary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: C.darkTertiary, fontWeight: '500' },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  errorText: { fontSize: 12, color: C.dangerDark, flex: 1, fontWeight: '500' },

  // Logout
  logoutBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 24 },
  logoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
