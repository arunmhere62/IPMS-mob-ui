import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge, InfoRow, SectionCard, CardHeader } from '../components';
import { useFormatters } from '../hooks/useFormatters';
import Theme from '@/theme';
import { TenantProfileData } from '@/features/tenant/api/tenantPortalApi';

const C = Theme.colors;

interface ProfileTabProps {
  raw: TenantProfileData;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ raw, onLogout }) => {
  const { formatDate, formatAmount } = useFormatters();

  return (
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

      <SectionCard>
        <CardHeader icon="business" title="PG Details" />
        <InfoRow icon="business-outline" label="PG Name" value={raw?.pg_locations?.location_name ?? 'N/A'} />
        <InfoRow icon="location-outline" label="Address" value={raw?.pg_locations?.address ?? 'N/A'} />
        <InfoRow icon="bed-outline" label="Room" value={raw?.rooms?.room_no ?? 'N/A'} />
        <InfoRow icon="key-outline" label="Bed" value={raw?.beds?.bed_no ?? 'N/A'} />
        <InfoRow icon="cash-outline" label="Bed Price" value={formatAmount(raw?.beds?.bed_price)} />
        <InfoRow icon="calendar-outline" label="Rent Cycle" value={raw?.pg_locations?.rent_cycle_type ?? 'N/A'} />
      </SectionCard>

      {raw?.tenant_allocations?.length ? (
        <SectionCard>
          <CardHeader icon="key-outline" title="Allocation History" />
          {raw.tenant_allocations.map((a: any) => (
            <View key={a.s_no} style={styles.allocationRow}>
              <View style={[styles.allocationIcon, { backgroundColor: C.background.blueLight }]}>
                <Ionicons name="bed-outline" size={16} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.allocationTitle}>{a.rooms?.room_no} · {a.beds?.bed_no}</Text>
                <Text style={styles.allocationMeta}>From {formatDate(a.effective_from)}{a.effective_to ? ` to ${formatDate(a.effective_to)}` : ' (current)'}</Text>
              </View>
              <Text style={styles.allocationAmount}>{formatAmount(a.bed_price_snapshot)}/mo</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <LinearGradient colors={[C.danger, C.dangerDark]} style={styles.logoutGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  profileHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, gap: 8, shadowColor: C.primaryDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  profileAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  profileAvatarText: { fontSize: 30, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  photo: { width: 110, height: 130, borderRadius: 14, marginRight: 10, backgroundColor: C.lightSecondary },

  allocationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  allocationIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  allocationTitle: { fontSize: 13, fontWeight: '600', color: C.dark },
  allocationMeta: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
  allocationAmount: { fontSize: 14, fontWeight: '800', color: C.dark },

  logoutBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 24 },
  logoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
