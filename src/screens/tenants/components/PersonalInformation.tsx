import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../components/Card';
import { Theme } from '../../../theme';
import { Tenant } from '@/services/api/tenantsApi';

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
          marginBottom: 12,
        }}
      >
        👤 Personal Information
      </Text>

      <View style={{ gap: 12 }}>
        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Phone</Text>
          <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
            {na(tenant.phone_no)}
          </Text>
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
      </View>
    </Card>
  );
};
