import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, ScrollView, Image, Modal, Pressable } from 'react-native';
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
  onDeleteAccount?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ raw, onLogout, onDeleteAccount }) => {
  const { formatDate, formatAmount } = useFormatters();
  const [deleteInfoVisible, setDeleteInfoVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleOpenDeleteInfo = () => setDeleteInfoVisible(true);
  const handleCloseDeleteInfo = () => setDeleteInfoVisible(false);
  const handleOpenDeleteConfirm = () => {
    setDeleteInfoVisible(false);
    setDeleteConfirmVisible(true);
  };
  const handleCloseDeleteConfirm = () => setDeleteConfirmVisible(false);
  const handleConfirmDelete = () => {
    onDeleteAccount?.();
    handleCloseDeleteConfirm();
  };

  return (
    <>
      {/* Profile Hero */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.profileHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileAvatarText}>{(raw?.name?.[0] ?? 'T').toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.name ?? 'N/A'}</Text>
        <Text style={styles.profilePhone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{raw?.phone_no ?? 'N/A'}</Text>
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
                <Text style={styles.allocationTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{a.rooms?.room_no} · {a.beds?.bed_no}</Text>
                <Text style={styles.allocationMeta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>From {formatDate(a.effective_from)}{a.effective_to ? ` to ${formatDate(a.effective_to)}` : ' (current)'}</Text>
              </View>
              <Text style={styles.allocationAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{formatAmount(a.bed_price_snapshot)}/mo</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <AnimatedPressableCard style={styles.logoutBtn} onPress={onLogout}>
        <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.logoutGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Logout</Text>
        </LinearGradient>
      </AnimatedPressableCard>

      <AnimatedPressableCard style={styles.deleteBtn} onPress={handleOpenDeleteInfo}>
        <View style={styles.deleteInner}>
          <Ionicons name="trash-outline" size={20} color={C.danger} />
          <Text style={styles.deleteText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Delete Account</Text>
        </View>
      </AnimatedPressableCard>

      <Modal
        visible={deleteInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteInfo}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseDeleteInfo} />
          <View style={styles.modalCard}>
            <View style={styles.modalCardInner}>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalText}>
                Your account is linked to your PG profile, payments, dues, and support tickets. Account deletion requires verification from your PG owner.
              </Text>
              <Text style={styles.modalText}>
                We will send a deletion request to your PG owner. They will review and confirm the deletion. This helps us maintain data integrity and prevent unauthorized account removal.
              </Text>
              <View style={styles.modalButtonGroup}>
                <AnimatedPressableCard style={styles.modalSecondaryBtn} onPress={handleCloseDeleteInfo}>
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </AnimatedPressableCard>
                <AnimatedPressableCard style={styles.modalPrimaryBtn} onPress={handleOpenDeleteConfirm}>
                  <Text style={styles.modalPrimaryText}>Request Deletion</Text>
                </AnimatedPressableCard>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteConfirm}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseDeleteConfirm} />
          <View style={styles.modalCard}>
            <View style={styles.modalCardInner}>
              <Text style={styles.modalTitle}>Confirm Deletion Request</Text>
              <Text style={styles.modalText}>
                Are you sure you want to request account deletion? Your PG owner will be notified and must approve this request.
              </Text>
              <Text style={styles.modalWarning}>
                ⚠️ This action cannot be undone once approved by the owner.
              </Text>
              <View style={styles.modalButtonGroup}>
                <AnimatedPressableCard style={styles.modalSecondaryBtn} onPress={handleCloseDeleteConfirm}>
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </AnimatedPressableCard>
                <AnimatedPressableCard style={styles.modalDangerBtn} onPress={handleConfirmDelete}>
                  <Text style={styles.modalDangerText}>Request Deletion</Text>
                </AnimatedPressableCard>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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

  logoutBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  logoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { borderRadius: 16, marginTop: 8, marginBottom: 24, borderWidth: 1.5, borderColor: C.danger, backgroundColor: C.canvas, overflow: 'hidden' },
  deleteInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  deleteText: { color: C.danger, fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalCard: { width: '85%', maxWidth: 360, backgroundColor: C.canvas, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  modalCardInner: { padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.dark, marginBottom: 12 },
  modalText: { fontSize: 14, color: C.darkSecondary, marginBottom: 8, lineHeight: 20 },
  modalWarning: { fontSize: 13, color: C.danger, marginBottom: 16, lineHeight: 18, fontWeight: '500' },
  modalButtonGroup: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalSecondaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.lightSecondary, alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { color: C.dark, fontSize: 14, fontWeight: '700' },
  modalPrimaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalDangerBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
  modalDangerText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
