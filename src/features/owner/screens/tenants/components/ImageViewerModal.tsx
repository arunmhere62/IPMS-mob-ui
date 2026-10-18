import React, { useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Image,
  Modal,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.5;

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUri,
  onClose }) => {
  const insets = useSafeAreaInsets();
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const prevVisible = useRef(visible);

  // Reset drag state synchronously during render (not in an effect) so the
  // reopened modal never paints a frame with the image still off-screen
  // from the previous gesture dismiss.
  if (prevVisible.current !== visible) {
    prevVisible.current = visible;
    if (visible) {
      isClosing.current = false;
      dragY.stopAnimation();
      dragY.setValue(0);
    }
  }

  const dismissWithGesture = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.timing(dragY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim the responder on touch down: move-based negotiation inside a
      // Modal is unreliable on Android/new architecture, and nothing inside
      // this area needs taps anyway.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        // Downward drag follows the finger; upward drag is resisted.
        dragY.setValue(gestureState.dy > 0 ? gestureState.dy : gestureState.dy / 3);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > DISMISS_DISTANCE || gestureState.vy > DISMISS_VELOCITY) {
          dismissWithGesture();
          return;
        }
        Animated.spring(dragY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const backdropOpacity = dragY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const imageScale = dragY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* collapsable={false} stops view flattening so this View keeps
            receiving responder events on the new architecture. */}
        <View
          style={styles.gestureArea}
          collapsable={false}
          {...panResponder.panHandlers}
        >
          {/* Full Screen Image */}
          {imageUri && (
            <Animated.View
              style={[
                styles.imageContainer,
                { transform: [{ translateY: dragY }, { scale: imageScale }] },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>

        {/* Close Button — tucked just below the status bar */}
        <Animated.View
          style={[
            styles.closeButtonWrap,
            { top: (insets?.top ?? 0) + 8, opacity: backdropOpacity },
          ]}
        >
          <AnimatedPressableCard
            onPress={onClose}
            accessibilityLabel="Close image viewer"
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </AnimatedPressableCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  gestureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButtonWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 18,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
});
