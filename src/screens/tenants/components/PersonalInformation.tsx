import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { Theme } from '../../../theme';
import { Tenant } from '@/services/api/tenantsApi';

interface PersonalInformationProps {
  tenant: Tenant;
  onOpenMedia: (uri: string) => void;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({ tenant, onOpenMedia }) => {
  const na = (value: any) => {
    const v = typeof value === 'string' ? value.trim() : value;
    return v ? String(v) : 'N/A';
  };

  const tenantImage = tenant.images && Array.isArray(tenant.images) && tenant.images.length > 0 ? tenant.images[0] : null;
  const proofDocs = tenant.proof_documents && Array.isArray(tenant.proof_documents) ? tenant.proof_documents : [];

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

        <View
          style={{
            marginTop: 4,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: Theme.colors.border,
            gap: 12,
          }}
        >
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: Theme.colors.background.secondary,
              borderWidth: 1,
              borderColor: Theme.colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="images-outline" size={16} color={Theme.colors.text.secondary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Tenant Image & Proof Documents
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                {(tenantImage ? 1 : 0) + (proofDocs?.length || 0)}
              </Text>
            </View>

            {tenantImage || (proofDocs && proofDocs.length > 0) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingTop: 10 }}
              >
                {tenantImage ? (
                  <TouchableOpacity
                    onPress={() => onOpenMedia(tenantImage)}
                    style={{
                      width: 92,
                      height: 92,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: tenantImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ) : null}

                {proofDocs.map((doc: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOpenMedia(doc)}
                    style={{
                      width: 92,
                      height: 92,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: doc }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ marginTop: 10, paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>No documents uploaded</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};
