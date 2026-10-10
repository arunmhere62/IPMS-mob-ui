import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../theme';
import { Card } from '../../../../components/Card';
import { CopyableText } from '../../../../components/CopyableText';
import { AnimatedPressableCard } from '../../../../components/AnimatedPressableCard';
import { ImageViewerModal } from '../tenants/components';

interface PaymentQRCardProps {
  qrImageUrl?: string | null;
  upiId?: string | null;
  isLoading?: boolean;
  onConfigure?: () => void;
}

export const PaymentQRCard: React.FC<PaymentQRCardProps> = ({
  qrImageUrl,
  upiId,
  isLoading = false,
  onConfigure,
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading payment QR...</Text>
        </View>
      </Card>
    );
  }

  if (!qrImageUrl) {
    return (
      <Card style={styles.card}>
        <View style={styles.noQRContainer}>
          <Ionicons name="qr-code-outline" size={32} color={Theme.colors.darkTertiary} />
          <Text style={styles.noQRTitle}>No Payment QR Code</Text>
          <Text style={styles.noQRSubtitle}>
            Set up your UPI QR code so tenants can scan and pay rent instantly
          </Text>
          {onConfigure && (
            <AnimatedPressableCard
              onPress={onConfigure}
              style={styles.configureButton}
            >
              <Ionicons name="settings-outline" size={14} color={Theme.colors.primary} />
              <Text style={styles.configureButtonText}>Configure Payment QR</Text>
            </AnimatedPressableCard>
          )}
        </View>
      </Card>
    );
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="qr-code" size={16} color={Theme.colors.primary} />
            <Text style={styles.headerTitle}>Payment QR Code</Text>
          </View>
          {onConfigure && (
            <TouchableOpacity onPress={onConfigure} style={styles.editButton}>
              <Ionicons name="create-outline" size={14} color={Theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.qrContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View payment QR code full-screen"
            activeOpacity={0.8}
            onPress={() => setImageViewerVisible(true)}
          >
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {upiId && (
          <View style={styles.upiContainer}>
            <Text style={styles.upiLabel}>UPI ID</Text>
            <CopyableText value={upiId} fontSize={16} color={Theme.colors.dark} />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={12} color={Theme.colors.darkTertiary} />
          <Text style={styles.infoText}>
            Tap the QR code to view it full-screen and share it with tenants
          </Text>
        </View>
      </Card>

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUri={qrImageUrl}
        onClose={() => setImageViewerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  noQRContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  noQRTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    textAlign: 'center',
  },
  noQRSubtitle: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Theme.colors.background.blueLight,
    borderWidth: 1,
    borderColor: Theme.withOpacity(Theme.colors.primary, 0.3),
    marginTop: 8,
  },
  configureButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  editButton: {
    padding: 6,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  upiContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  upiLabel: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  upiValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: Theme.colors.background.blueLight,
    borderRadius: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 10,
    color: Theme.colors.text.secondary,
    lineHeight: 12,
  },
});