import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { Theme } from '@/theme';
import { showErrorAlert, showSuccessAlert } from '@/utils/errorHandler';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { SearchableDropdown } from '@/components/SearchableDropdown';
import { OptionSelector } from '@/components/OptionSelector';
import { ImageUploadS3 } from '@/components/ImageUploadS3';
import {
  useGetPaymentConfigsQuery,
  useCreatePaymentConfigMutation,
  useUpdatePaymentConfigMutation,
  useDeletePaymentConfigMutation,
  type OwnerPaymentConfig,
  type PaymentConfigScopeType,
  type CreatePaymentConfigDto,
} from '@/features/owner/api/paymentConfigApi';
import { useLazyGetPGLocationsQuery } from '@/features/owner/api/pgLocationsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/rbac.config';

const C = Theme.colors;

interface PaymentConfigScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

export const PaymentConfigScreen: React.FC<PaymentConfigScreenProps> = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { can } = usePermissions();
  const canCreateConfig = can(Permission.CREATE_PAYMENT);
  const canEditConfig = can(Permission.EDIT_PAYMENT);
  const canDeleteConfig = can(Permission.DELETE_PAYMENT);
  const { data: configsResponse, isLoading, refetch } = useGetPaymentConfigsQuery();
  const [fetchPGLocationsTrigger] = useLazyGetPGLocationsQuery();
  const [createConfig] = useCreatePaymentConfigMutation();
  const [updateConfig] = useUpdatePaymentConfigMutation();
  const [deleteConfig] = useDeletePaymentConfigMutation();

  const configs = configsResponse?.data ?? [];
  const [pgLocations, setPgLocations] = useState<any[]>([]);
  const [loadingPGs, setLoadingPGs] = useState(false);

  // Load PG locations on mount
  React.useEffect(() => {
    loadPGLocations();
  }, []);

  const loadPGLocations = async () => {
    setLoadingPGs(true);
    try {
      const response = await fetchPGLocationsTrigger({ _t: Date.now() }).unwrap();
      console.log('PG Locations Response:', response);
      // API returns: { success: true, data: [...], message, statusCode, timestamp }
      // The transformResponse in pgLocationsApi should handle this, but let's be safe
      const items = Array.isArray(response?.data) ? response.data : 
                   Array.isArray(response) ? response : [];
      console.log('Extracted PG Locations:', items);
      setPgLocations(items);
    } catch (error) {
      console.error('Error loading PG locations:', error);
      setPgLocations([]);
    } finally {
      setLoadingPGs(false);
    }
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<OwnerPaymentConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [scopeType, setScopeType] = useState<PaymentConfigScopeType>('ALL_PG');
  const [selectedPgId, setSelectedPgId] = useState<number | null>(null);
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // PG picker items for SearchableDropdown
  const pgItems = pgLocations.map((pg: any) => ({
    id: pg.s_no,
    label: pg.location_name,
    value: pg.s_no,
  }));

  const resetForm = () => {
    setScopeType('ALL_PG');
    setSelectedPgId(null);
    setUpiId('');
    setUpiQrUrl('');
    setAccountHolderName('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setPaymentInstructions('');
  };

  const openCreateModal = () => {
    if (!canCreateConfig) return;
    setEditingConfig(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (config: OwnerPaymentConfig) => {
    if (!canEditConfig) return;
    setEditingConfig(config);
    setScopeType(config.scope_type);
    setSelectedPgId(config.pg_id);
    setUpiId(config.upi_id);
    setUpiQrUrl(config.upi_qr_image_url || '');
    setAccountHolderName(config.account_holder_name || '');
    setBankName(config.bank_name || '');
    setAccountNumber(config.account_number || '');
    setIfscCode(config.ifsc_code || '');
    setPaymentInstructions(config.payment_instructions || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!(editingConfig ? canEditConfig : canCreateConfig)) return;
    if (!upiId.trim()) {
      Alert.alert('Validation Error', 'UPI ID is required');
      return;
    }
    if (scopeType === 'SPECIFIC_PG' && !selectedPgId) {
      Alert.alert('Validation Error', 'Please select a PG location');
      return;
    }

    setSaving(true);
    try {
      if (editingConfig) {
        const result = await updateConfig({
          id: editingConfig.s_no,
          body: {
            upi_id: upiId.trim(),
            upi_qr_image_url: upiQrUrl.trim() || undefined,
            account_holder_name: accountHolderName.trim() || undefined,
            bank_name: bankName.trim() || undefined,
            account_number: accountNumber.trim() || undefined,
            ifsc_code: ifscCode.trim() || undefined,
            payment_instructions: paymentInstructions.trim() || undefined,
          },
        }).unwrap();
        showSuccessAlert(result?.message || 'Payment config updated successfully');
      } else {
        const dto: CreatePaymentConfigDto = {
          scope_type: scopeType,
          upi_id: upiId.trim(),
          upi_qr_image_url: upiQrUrl.trim() || undefined,
          account_holder_name: accountHolderName.trim() || undefined,
          bank_name: bankName.trim() || undefined,
          account_number: accountNumber.trim() || undefined,
          ifsc_code: ifscCode.trim() || undefined,
          payment_instructions: paymentInstructions.trim() || undefined,
        };
        if (scopeType === 'SPECIFIC_PG' && selectedPgId) {
          dto.pg_id = selectedPgId;
        }
        const result = await createConfig(dto).unwrap();
        showSuccessAlert(result?.message || 'Payment config created successfully');
      }
      setModalVisible(false);
      refetch();
    } catch (error: any) {
      const msg = error?.data?.message || error?.data?.error?.details || 'Failed to save payment config';
      showErrorAlert(null, msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (config: OwnerPaymentConfig) => {
    if (!canDeleteConfig) return;
    Alert.alert(
      'Deactivate Payment Config',
      `Are you sure you want to deactivate this ${config.scope_type === 'ALL_PG' ? 'ALL PG' : 'specific PG'} payment config?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConfig(config.s_no).unwrap();
              showSuccessAlert('Payment config deactivated');
              refetch();
            } catch (error: any) {
              showErrorAlert(error, 'Failed to deactivate');
            }
          },
        },
      ],
    );
  };

  const handleActivate = (config: OwnerPaymentConfig) => {
    if (!canEditConfig) return;
    Alert.alert(
      'Activate Payment Config',
      `Activate this ${config.scope_type === 'ALL_PG' ? 'ALL PG' : 'specific PG'} payment config?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              await updateConfig({ id: config.s_no, body: { is_active: true } }).unwrap();
              showSuccessAlert('Payment config activated');
              refetch();
            } catch (error: any) {
              showErrorAlert(error, 'Failed to activate');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <ScreenHeader title="Payment Settings" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenHeader
        title="Payment Settings"
        subtitle="UPI / QR config for tenant payments"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={canCreateConfig ? (
          <AnimatedPressableCard
            onPress={openCreateModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: Theme.withOpacity('#000000', 0.4),
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add</Text>
          </AnimatedPressableCard>
        ) : null}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={C.primary} />
          <Text style={styles.infoText}>
            Tenants will see these UPI details when paying rent. You can set one config for all PGs or specific configs per PG.
          </Text>
        </View>

        {configs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="card-outline" size={48} color={C.darkTertiary} />
            <Text style={styles.emptyTitle}>No Payment Config</Text>
            <Text style={styles.emptySubtitle}>Add your UPI ID so tenants can pay rent</Text>
            {canCreateConfig && <Button title="Add Payment Config" onPress={openCreateModal} icon={<Ionicons name="add" size={18} color={C.button.primaryText} />} />}
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.s_no} style={styles.configCard}>
              <View style={styles.configHeader}>
                <View style={[styles.scopeBadge, { backgroundColor: config.scope_type === 'ALL_PG' ? C.background.blueLight : '#FEF3C7' }]}>
                  <Ionicons name={config.scope_type === 'ALL_PG' ? 'business-outline' : 'location-outline'} size={14} color={config.scope_type === 'ALL_PG' ? C.primary : C.warningDark} />
                  <Text style={[styles.scopeText, { color: config.scope_type === 'ALL_PG' ? C.primary : C.warningDark }]}>
                    {config.scope_type === 'ALL_PG' ? 'All PGs' : config.pg_locations?.location_name || `PG #${config.pg_id}`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.is_active ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: config.is_active ? C.secondaryDark : C.danger }]}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.configBody}>
                <View style={styles.upiRow}>
                  <Ionicons name="cash-outline" size={20} color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upiLabel}>UPI ID</Text>
                    <Text style={styles.upiValue}>{config.upi_id}</Text>
                  </View>
                </View>

                {config.account_holder_name ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Holder</Text>
                    <Text style={styles.detailValue}>{config.account_holder_name}</Text>
                  </View>
                ) : null}

                {config.bank_name ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank</Text>
                    <Text style={styles.detailValue}>{config.bank_name}</Text>
                  </View>
                ) : null}

                {config.payment_instructions ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Instructions</Text>
                    <Text style={styles.detailValue}>{config.payment_instructions}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.configActions}>
                {canEditConfig && (
                  <AnimatedPressableCard onPress={() => openEditModal(config)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={16} color={C.primary} />
                    <Text style={[styles.actionText, { color: C.primary }]}>Edit</Text>
                  </AnimatedPressableCard>
                )}
                {canDeleteConfig && config.is_active && (
                  <AnimatedPressableCard onPress={() => handleDelete(config)} style={[styles.actionBtn, { borderColor: '#FECACA' }]}>
                    <Ionicons name="trash-outline" size={16} color={C.danger} />
                    <Text style={[styles.actionText, { color: C.danger }]}>Deactivate</Text>
                  </AnimatedPressableCard>
                )}
                {canEditConfig && !config.is_active && (
                  <AnimatedPressableCard onPress={() => handleActivate(config)} style={[styles.actionBtn, { borderColor: '#A7F3D0' }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={C.secondaryDark} />
                    <Text style={[styles.actionText, { color: C.secondaryDark }]}>Activate</Text>
                  </AnimatedPressableCard>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Form — using SlideBottomModal */}
      <SlideBottomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingConfig ? 'Edit Payment Config' : 'Add Payment Config'}
        subtitle="Set up UPI details for tenant payments"
        onSubmit={handleSave}
        submitLabel={editingConfig ? 'Update' : 'Create'}
        isLoading={saving}
        enableFlexibleHeightDrag
        minHeightPercent={0.7}
        maxHeightPercent={0.95}
      >
        {/* Scope Type — only for create mode */}
        {!editingConfig && (
          <OptionSelector
            label="Scope"
            required
            description="Choose whether this config applies to all PGs or a specific PG"
            selectedValue={scopeType}
            onSelect={(val) => setScopeType((val as PaymentConfigScopeType) || 'ALL_PG')}
            options={[
              { label: 'All PGs', value: 'ALL_PG', icon: '🏢' },
              { label: 'Specific PG', value: 'SPECIFIC_PG', icon: '📍' },
            ]}
            containerStyle={{ marginBottom: 16 }}
          />
        )}

        {/* PG Selector — only for SPECIFIC_PG and create mode */}
        {!editingConfig && scopeType === 'SPECIFIC_PG' && (
          <SearchableDropdown
            label="Select PG"
            placeholder="Select a PG location"
            items={pgItems}
            selectedValue={selectedPgId}
            onSelect={(item) => setSelectedPgId(item.id)}
            loading={loadingPGs}
            required
          />
        )}

        <Input
          label="UPI ID *"
          placeholder="owner@upi"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          keyboardType="email-address"
          containerClassName="mb-3"
          style={styles.compactInput}
        />

        {/* QR Code Image Upload — uploaded to S3, stored as URL */}
        <View style={{ marginBottom: 12 }}>
          <ImageUploadS3
            images={upiQrUrl ? [upiQrUrl] : []}
            onImagesChange={(imgs) => setUpiQrUrl(imgs[0] || '')}
            maxImages={1}
            label="UPI QR Code (optional)"
            folder="payment-config/qr"
            usageHint="Upload your UPI QR code image — tenants will scan this to pay"
          />
        </View>

        <Input
          label="Account Holder Name (optional)"
          placeholder="John Doe"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          containerClassName="mb-3"
          style={styles.compactInput}
        />

        <Input
          label="Bank Name (optional)"
          placeholder="HDFC Bank"
          value={bankName}
          onChangeText={setBankName}
          containerClassName="mb-3"
          style={styles.compactInput}
        />

        <Input
          label="Account Number (optional)"
          placeholder="1234567890"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          containerClassName="mb-3"
          style={styles.compactInput}
        />

        <Input
          label="IFSC Code (optional)"
          placeholder="HDFC0001234"
          value={ifscCode}
          onChangeText={setIfscCode}
          autoCapitalize="characters"
          containerClassName="mb-3"
          style={styles.compactInput}
        />

        <Input
          label="Payment Instructions (optional)"
          placeholder="Pay to the UPI ID above and enter the transaction ID"
          value={paymentInstructions}
          onChangeText={setPaymentInstructions}
          multiline
          numberOfLines={3}
          containerClassName="mb-3"
          style={styles.compactTextarea}
        />
      </SlideBottomModal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.background.blueLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: C.darkSecondary, lineHeight: 18 },

  emptyCard: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  emptySubtitle: { fontSize: 13, color: C.darkTertiary, marginBottom: 16, textAlign: 'center' },

  configCard: { padding: 16, marginBottom: 12 },
  configHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scopeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scopeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  configBody: { gap: 10 },
  upiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, backgroundColor: C.background.secondary, borderRadius: 10, paddingHorizontal: 12 },
  upiLabel: { fontSize: 11, color: C.darkTertiary, fontWeight: '600' },
  upiValue: { fontSize: 16, fontWeight: '800', color: C.dark },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: C.darkTertiary, fontWeight: '600' },
  detailValue: { fontSize: 13, color: C.dark, fontWeight: '500', flex: 1, textAlign: 'right' },

  configActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  actionText: { fontSize: 13, fontWeight: '600' },

  // Compact input overrides — smaller height & padding than Input default (48px)
  compactInput: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 12, fontSize: 13, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#F9FAFB' },
  compactTextarea: { minHeight: 54, paddingVertical: 8, paddingHorizontal: 12, fontSize: 13, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#F9FAFB' },
});
