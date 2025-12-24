import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenSlideUpModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const FullScreenSlideUpModal: React.FC<FullScreenSlideUpModalProps> = ({ visible, onClose, children }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [mounted, setMounted] = useState(false);

  const animateIn = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = (cb?: () => void) => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) cb?.();
    });
  };

  const handleRequestClose = () => {
    animateOut(() => {
      setMounted(false);
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SCREEN_HEIGHT);
      requestAnimationFrame(animateIn);
    } else if (mounted) {
      animateOut(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const modalVisible = useMemo(() => visible || mounted, [visible, mounted]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleRequestClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={handleRequestClose} />
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            transform: [{ translateY }],
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => null}>
            {children}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};
