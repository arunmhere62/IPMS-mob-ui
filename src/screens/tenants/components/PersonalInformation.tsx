import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../components/Card';
import { Theme } from '../../../theme';
import { Tenant } from '@/services/api/tenantsApi';

interface PersonalInformationProps {
  tenant: Tenant;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ tenant }) => {
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
        {tenant.phone_no && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Phone</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.phone_no}
            </Text>
          </View>
        )}

        {tenant.whatsapp_number && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>WhatsApp</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.whatsapp_number}
            </Text>
          </View>
        )}

        {tenant.email && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Email</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.email}
            </Text>
          </View>
        )}

        {tenant.occupation && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Occupation</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.occupation}
            </Text>
          </View>
        )}

        {tenant.tenant_address && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Address</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.tenant_address}
            </Text>
          </View>
        )}

        {(tenant.city || tenant.state) && (
          <View>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Location</Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.primary }}>
              {tenant.city?.name}
              {tenant.city && tenant.state && ', '}
              {tenant.state?.name}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};
