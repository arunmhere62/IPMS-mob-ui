import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import { CompactReceiptGenerator } from '@/services/receipt/compactReceiptGenerator';

interface ReceiptViewModalProps {
  visible: boolean;
  receiptData: any;
  receiptRef: React.RefObject<View | null>;
  onClose: () => void;
  onShare: () => Promise<void>;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  visible,
  receiptData,
  receiptRef,
  onClose,
  onShare,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 20, maxWidth: '90%' }}>
          {receiptData && (
            <CompactReceiptGenerator.ReceiptComponent data={receiptData} />
          )}
          
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
            
            <TouchableOpacity
              onPress={onShare}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#3B82F6',
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
