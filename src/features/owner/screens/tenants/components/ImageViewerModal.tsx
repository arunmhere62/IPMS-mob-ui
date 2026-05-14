import React from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 40,
            right: 20,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            borderRadius: 22,
            width: 44,
            height: 44,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>×</Text>
        </TouchableOpacity>

        {/* Full Screen Image */}
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
};
