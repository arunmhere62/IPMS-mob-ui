import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../../../components/Card';
import { CopyableText } from '../../../../../components/CopyableText';
import { Theme } from '../../../../../theme';
import { Tenant } from '@/features/owner/api/tenantsApi';

interface PersonalInformationProps {
  tenant: Tenant;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ tenant }) => {
  const na = (value: any) => {
    const v = typeof value === 'string' ? value.trim() : value;
    return v ? String(v) : 'N/A';
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
        <CopyableText label="Phone" value={tenant.phone_no} />

        <CopyableText label="WhatsApp" value={tenant.whatsapp_number} />

        <CopyableText label="Email" value={tenant.email} />

        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Occupation</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.occupation)}
          </Text>
        </View>

        <CopyableText label="Address" value={tenant.tenant_address} layout="block" />

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
