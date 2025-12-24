import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';

interface ReceiptViewModalProps {
  visible: boolean;
  receiptData: any;
  receiptRef: React.RefObject<View | null>;
  onClose: () => void;
}

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '90%', maxHeight: '85%' }}>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            {receiptData && (
              <View style={{ width: baseReceiptWidth, transform: [{ scale: receiptScale }] }}>
                <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
              </View>
            )}
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
