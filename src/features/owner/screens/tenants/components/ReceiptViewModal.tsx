import React, { useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
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
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';
import type { ReceiptData } from '@/services/receipt/receiptTypes';

interface ReceiptViewModalProps {
  visible: boolean;
  receiptData: ReceiptData | null;
  receiptRef: React.RefObject<View | null>;
  onClose: () => void;
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    backgroundColor: 'white',
  },
  receiptContainer: {
    backgroundColor: 'white',
    padding: 16,
    opacity: 1,
  },
  modalContainer: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 10
  },
  modalContent: {
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 20, 
    width: '100%', 
    maxWidth: 500, 
    maxHeight: '90%'
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center', 
    padding: 5
  },
  receiptWrapper: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 20
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  closeButtonText: {
    color: '#6B7280', 
    fontWeight: '600',
    fontSize: 16,
  },
  shareButtonText: {
    color: 'white', 
    fontWeight: '600',
    fontSize: 16,
  },
});

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  visible,
  receiptData,
  receiptRef,
  onClose,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const baseReceiptWidth = 320;
  const modalHorizontalPadding = 20;
  const modalMaxWidth = screenWidth * 0.9;
  const availableReceiptWidth = Math.max(0, modalMaxWidth - modalHorizontalPadding * 2);
  const receiptScale = Math.min(1, availableReceiptWidth / baseReceiptWidth);

  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = useCallback(async () => {
    if (!receiptRef.current || !receiptData) return;
    
    setIsSharing(true);
    
    try {
      // Wait for the view to be ready
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased delay
      
      // Get the dimensions of the receipt content
      return new Promise((resolve) => {
        receiptRef.current?.measure((x, y, width, height) => {
          // Use a fixed width that matches the receipt's natural width
          const receiptWidth = 320; // Match this with your receipt's natural width
          const scale = 2; // Scale factor for better quality
          
          // Calculate height based on aspect ratio
          const receiptHeight = (height / width) * receiptWidth;
          
          // Capture the receipt with high quality and proper dimensions
          captureRef(receiptRef, {
            format: 'png',
            quality: 1, // Maximum quality
            result: 'tmpfile',
            width: receiptWidth * scale,
            height: receiptHeight * scale,
            // Note: Background color should be set on the view itself, not in capture options
          }).then(uri => {
            // Share the captured image
            Share.share({
              url: `file://${uri}`,
              title: 'Rent Receipt',
            }).then(resolve).catch(resolve);
            
            // Clean up the temporary file after a delay
            setTimeout(async () => {
              try {
                await FileSystem.deleteAsync(uri, { idempotent: true });
              } catch (e) {
                console.warn('Failed to clean up temporary file:', e);
              }
            }, 60000); // 1 minute
          }).catch(resolve);
        });
      });
      
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }, [receiptData]);

  return (
    <>
      {/* Hidden view for capturing receipt */}
      {receiptData && (
        <View style={styles.hiddenContainer}>
          <View 
            style={{
              backgroundColor: '#FFFFFF', // Use hex for consistency
              padding: 0, // Remove padding to prevent content shifting
              width: 320, // Fixed width to match receipt design
              opacity: 1,
              // Add shadow and border for better visual feedback (not captured in the image)
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            collapsable={false}
            ref={receiptRef}
          >
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          </View>
        </View>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              contentInsetAdjustmentBehavior="automatic"
            >
              {receiptData && (
                <View style={[
                  styles.receiptWrapper, 
                  { 
                    width: 320, // Match the hidden view width
                    transform: [{ scale: receiptScale }]
                  }
                ]}>
                  <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, styles.closeButton]}
                disabled={isSharing}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.button, styles.shareButton]}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.shareButtonText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </>
  );
};
