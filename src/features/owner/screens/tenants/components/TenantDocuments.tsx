import React from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../../../components/Card';
import { Theme } from '../../../../../theme';
import { Tenant } from '@/features/owner/api/tenantsApi';

interface TenantDocumentsProps {
  tenant: Tenant;
  onOpenMedia: (uri: string) => void;
}

export const TenantDocuments: React.FC<TenantDocumentsProps> = ({ tenant, onOpenMedia }) => {
  const tenantImage = tenant.images && Array.isArray(tenant.images) && tenant.images.length > 0 ? tenant.images[0] : null;
  const proofDocs = tenant.proof_documents && Array.isArray(tenant.proof_documents) ? tenant.proof_documents : [];

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 16 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: Theme.colors.text.primary,
          marginBottom: 12 }}
      >
        📄 Documents
      </Text>

      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: Theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: Theme.colors.border }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="images-outline" size={16} color={Theme.colors.text.secondary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
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
              <AnimatedPressableCard
                onPress={() => onOpenMedia(tenantImage)}
                style={{
                  width: 92,
                  height: 92,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  overflow: 'hidden' }}
              >
                <Image source={{ uri: tenantImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </AnimatedPressableCard>
            ) : null}

            {proofDocs.map((doc: string, index: number) => (
              <AnimatedPressableCard
                key={index}
                onPress={() => onOpenMedia(doc)}
                style={{
                  width: 92,
                  height: 92,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  overflow: 'hidden' }}
              >
                <Image source={{ uri: doc }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </AnimatedPressableCard>
            ))}
          </ScrollView>
        ) : (
          <View style={{ marginTop: 10, paddingVertical: 10 }}>
            <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>No documents uploaded</Text>
          </View>
        )}
      </View>
    </Card>
  );
};
