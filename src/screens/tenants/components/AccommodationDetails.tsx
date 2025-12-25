import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/Card';
import { Theme } from '../../../theme';
import { Tenant } from '@/services/api/tenantsApi';


interface AccommodationDetailsProps {
  tenant: Tenant;
}

export const AccommodationDetails: React.FC<AccommodationDetailsProps> = ({
  tenant,
}) => {
  const na = (value: any) => {
    const v = typeof value === 'string' ? value.trim() : value;
    return v ? String(v) : 'N/A';
  };

  const rentPrice = tenant.rooms?.rent_price;
  const rentText =
    rentPrice === null || rentPrice === undefined || String(rentPrice).trim() === ''
      ? 'N/A'
      : `₹${rentPrice}/month`;

  const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
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
        🏠 Accommodation Details
      </Text>

      <View style={{ gap: 12 }}>
        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
            PG Location
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}
          >
            {na(tenant.pg_locations?.location_name)}
          </Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
            {na(tenant.pg_locations?.address)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Room</Text>
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.primary }}
            >
              {na(tenant.rooms?.room_no)}
            </Text>

          </View>


          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Bed</Text>
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.primary }}
            >
              {na(tenant.beds?.bed_no)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: 4 }}>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.text.tertiary,
              marginRight: 6,
            }}
          >
            Rent:
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: Theme.colors.text.primary,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {rentText}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>Check-in Date</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
            {formatDate(tenant.check_in_date)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
            Check-out Date
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
            {formatDate(tenant.check_out_date)}
          </Text>
        </View>
      </View>
    </Card>
  );
};
