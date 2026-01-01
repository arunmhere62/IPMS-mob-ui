import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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
                <Ionicons name="document-text-outline" size={16} color={Theme.colors.text.secondary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Proof Documents
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                {tenant.proof_documents && Array.isArray(tenant.proof_documents) ? tenant.proof_documents.length : 0}
              </Text>
            </View>

            {tenant.proof_documents && Array.isArray(tenant.proof_documents) && tenant.proof_documents.length > 0 ? (
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {tenant.proof_documents.slice(0, 4).map((doc: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOpenMedia(doc)}
                    style={{
                      width: '48%',
                      aspectRatio: 1,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image source={{ uri: doc }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 10, paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>No documents uploaded</Text>
              </View>
            )}
          </View>

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
                <Ionicons name="image-outline" size={16} color={Theme.colors.text.secondary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }}>
                  Tenant Images
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                {tenant.images && Array.isArray(tenant.images) ? tenant.images.length : 0}
              </Text>
            </View>

            {tenant.images && Array.isArray(tenant.images) && tenant.images.length > 0 ? (
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {tenant.images.slice(0, 4).map((image: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOpenMedia(image)}
                    style={{
                      width: '48%',
                      aspectRatio: 1,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 10, paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>No images uploaded</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};
