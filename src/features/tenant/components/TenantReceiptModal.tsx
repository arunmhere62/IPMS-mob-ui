import React, { useCallback, useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Modal,
  Text,
  ScrollView,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import type { ReceiptData } from '@/services/receipt/receiptTypes';

interface TenantReceiptModalProps {
  visible: boolean;
  receiptData: ReceiptData | null;
  onClose: () => void;
}

/**
 * Tenant-facing receipt modal.
 * Shows the receipt preview and provides Share + Download (save to device) buttons.
 */
export const TenantReceiptModal: React.FC<TenantReceiptModalProps> = ({
  visible,
  receiptData,
  onClose,
}) => {
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const screenWidth = Dimensions.get('window').width;
  const baseReceiptWidth = 600;
  const modalHorizontalPadding = 20;
  const modalMaxWidth = Math.min(screenWidth * 0.92, 640);
  const availableReceiptWidth = Math.max(0, modalMaxWidth - modalHorizontalPadding * 2);
  const receiptScale = Math.min(1, availableReceiptWidth / baseReceiptWidth);

  const captureReceipt = useCallback(async (): Promise<string> => {
    if (!receiptRef.current) throw new Error('Receipt view not ready');
    // Wait for layout
    await new Promise((r) => setTimeout(r, 600));
    return new Promise((resolve, reject) => {
      receiptRef.current?.measure((_x, _y, width, height) => {
        const receiptWidth = baseReceiptWidth;
        const scale = 3;
        const receiptHeight = (height / width) * receiptWidth;
        captureRef(receiptRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          width: receiptWidth * scale,
          height: receiptHeight * scale,
        })
          .then(resolve)
          .catch(reject);
      });
    });
  }, []);

  const handleShare = useCallback(async () => {
    if (!receiptData) return;
    setIsSharing(true);
    try {
      const uri = await captureReceipt();
      // Use expo-sharing if available (better cross-platform), fallback to RN Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Receipt',
        });
      } else {
        await Share.share({ url: `file://${uri}`, title: 'Receipt' });
      }
      // Cleanup
      setTimeout(() => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}), 60000);
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }, [receiptData, captureReceipt]);

  const handleDownload = useCallback(async () => {
    if (!receiptData) return;
    setIsDownloading(true);
    try {
      const uri = await captureReceipt();
      const fileName = `${receiptData.receiptNumber}.png`;
      const dest = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      Alert.alert('Saved', `Receipt saved to app documents:\n${fileName}`);
      // Cleanup temp
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [receiptData, captureReceipt]);

  return (
    <>
      {/* Hidden view for high-res capture */}
      {receiptData && (
        <View style={styles.hiddenContainer} pointerEvents="none">
          <View
            style={{ backgroundColor: '#FFFFFF', width: baseReceiptWidth }}
            collapsable={false}
            ref={receiptRef}
          >
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          </View>
        </View>
      )}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Receipt</Text>
              <AnimatedPressableCard onPress={onClose} style={styles.closeIcon}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </AnimatedPressableCard>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
            >
              {receiptData && (
                <View
                  style={[
                    styles.receiptWrapper,
                    { width: baseReceiptWidth, transform: [{ scale: receiptScale }] },
                  ]}
                >
                  <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <AnimatedPressableCard
                onPress={handleDownload}
                style={[styles.button, styles.downloadButton]}
                disabled={isDownloading || isSharing}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Save</Text>
                  </>
                )}
              </AnimatedPressableCard>
              <AnimatedPressableCard
                onPress={handleShare}
                style={[styles.button, styles.shareButton]}
                disabled={isSharing || isDownloading}
              >
                {isSharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Share</Text>
                  </>
                )}
              </AnimatedPressableCard>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    backgroundColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flexGrow: 0 },
  scrollContent: { alignItems: 'center', padding: 4 },
  receiptWrapper: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
  },
  downloadButton: { backgroundColor: '#0F4C81' },
  shareButton: { backgroundColor: '#3B82F6' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
