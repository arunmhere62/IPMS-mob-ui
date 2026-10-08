import React from 'react';
import { Clipboard, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from '../../../../../components/AnimatedPressableCard';
import { Card } from '../../../../../components/Card';
import { Theme } from '../../../../../theme';
import { showSuccessAlert } from '../../../../../utils/errorHandler';
import { Tenant } from '@/features/owner/api/tenantsApi';

interface PersonalInformationProps {
  tenant: Tenant;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ tenant }) => {
  const na = (value: any) => {
    const v = typeof value === 'string' ? value.trim() : value;
    return v ? String(v) : 'N/A';
  };

  const handleCopyPhone = async () => {
    const phone = tenant.phone_no?.trim();
    if (!phone) return;
    await Clipboard.setString(phone);
    showSuccessAlert('Phone number copied to clipboard');
  };

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 16 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: Theme.colors.text.primary,
          marginBottom: 12 }}
      >
        👤 Personal Information
      </Text>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Phone</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {na(tenant.phone_no)}
            </Text>
          </View>
          {!!tenant.phone_no?.trim() && (
            <AnimatedPressableCard
              onPress={handleCopyPhone}
              accessibilityLabel='Copy phone number'
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: Theme.colors.background.secondary,
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <Ionicons name='copy-outline' size={15} color={Theme.colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.primary }}>Copy</Text>
            </AnimatedPressableCard>
          )}
        </View>

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>WhatsApp</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.whatsapp_number)}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Email</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.email)}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Occupation</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.occupation)}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Address</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.tenant_address)}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Location</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na([tenant.city?.name, tenant.state?.name].filter(Boolean).join(', '))}
          </Text>
        </View>

        <View
          style={{
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: Theme.colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Created</Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
              {tenant.created_at
                ? new Date(tenant.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Updated</Text>
            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
              {tenant.updated_at
                ? new Date(tenant.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};
