import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Theme } from '../theme';

export interface SlideBottomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  enableFullHeightDrag?: boolean;
  enableFlexibleHeightDrag?: boolean;
  minHeightPercent?: number;
  maxHeightPercent?: number;
}

export const SlideBottomModal: React.FC<SlideBottomModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  enableFullHeightDrag = false,
  enableFlexibleHeightDrag = false,
  minHeightPercent = 0.85,
  maxHeightPercent = 1,
}) => {
  const [panY] = useState(new Animated.Value(0));
  const [backdropOpacity] = useState(new Animated.Value(0));
  const [slideY] = useState(new Animated.Value(500));
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const screenH = Dimensions.get('window').height;
  const clampedMinPercent = Math.min(1, Math.max(0.2, minHeightPercent));
  const clampedMaxPercent = Math.min(1, Math.max(clampedMinPercent, maxHeightPercent));
  const minH = Math.max(200, Math.round(screenH * clampedMinPercent));
  const maxH = Math.max(minH, Math.round(screenH * clampedMaxPercent));
  const [sheetHeight] = useState(new Animated.Value(minH));
  const [startHeight, setStartHeight] = useState(minH);

  React.useEffect(() => {
    if (visible) {
      // Reset animated values when modal opens.
      // IMPORTANT: if parent sets visible=false, React Native may unmount <Modal>
      // before the close animation completes, leaving slideY at 0. So we always
      // force the starting (hidden) position here.
      panY.setValue(0);
      slideY.setValue(500);
      backdropOpacity.setValue(0);
      sheetHeight.setValue(minH);
      setStartHeight(minH);
      
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: !enableFlexibleHeightDrag,
        }),
      ]).start();
    } else {
      if (isExpanded) setIsExpanded(false);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 500,
          duration: 300,
          useNativeDriver: !enableFlexibleHeightDrag,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, slideY, panY, isExpanded, sheetHeight, minH, enableFlexibleHeightDrag]);

  const headerPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond to vertical swipes on header (avoid accidental small movements)
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDraggingHeader(true);
        if (enableFlexibleHeightDrag) {
          setStartHeight((sheetHeight as any).__getValue?.() ?? minH);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (enableFlexibleHeightDrag) {
          // dy < 0 => drag up => increase height
          // dy > 0 => drag down => decrease height
          const next = Math.max(minH, Math.min(maxH, startHeight - gestureState.dy));
          sheetHeight.setValue(next);
          return;
        }

        if (gestureState.dy > 0) {
          // dragging down
          panY.setValue(gestureState.dy);
          return;
        }

        // dragging up (expand)
        if (enableFullHeightDrag && !isExpanded && gestureState.dy < 0) {
          // allow a small negative pull to indicate expansion
          const clamped = Math.max(gestureState.dy, -80);
          panY.setValue(clamped);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDraggingHeader(false);

        if (enableFlexibleHeightDrag) {
          const currentH = (sheetHeight as any).__getValue?.() ?? minH;

          // Close if user is near collapsed and flicks down
          if (currentH <= minH + 10 && gestureState.vy > 1.2) {
            onClose();
            return;
          }

          // Let user stop anywhere (clamped)
          const clamped = Math.max(minH, Math.min(maxH, currentH));
          Animated.spring(sheetHeight, {
            toValue: clamped,
            useNativeDriver: false,
          }).start();
          return;
        }

        // Expand to full height if swiped up enough
        if (enableFullHeightDrag && !isExpanded && gestureState.dy < -60) {
          setIsExpanded(true);
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Collapse back to normal height if expanded and swiped down a bit
        if (enableFullHeightDrag && isExpanded && gestureState.dy > 60) {
          setIsExpanded(false);
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Close if swiped down more than 100 pixels (only when not expanded)
        if (!isExpanded && gestureState.dy > 100) {
          onClose();
          return;
        }

        // Snap back to original position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: !enableFlexibleHeightDrag,
        }).start();
      },
    })
  ).current;

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit();
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: Theme.colors.canvas,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: enableFlexibleHeightDrag ? undefined : isExpanded ? '100%' : '85%',
              height: enableFlexibleHeightDrag ? sheetHeight : undefined,
              flex: enableFlexibleHeightDrag ? 0 : 1,
              flexDirection: 'column',
              overflow: 'hidden',
              transform: [
                { translateY: slideY },
                { translateY: panY },
              ],
            }}
          >
            {/* Drag Indicator & Header Container */}
            <View
              {...headerPanResponder.panHandlers}
              style={{
                alignItems: 'center',
                paddingTop: 12,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#D1D5DB',
                }}
              />
            </View>

            {/* Header */}
            <View
              {...headerPanResponder.panHandlers}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: Theme.colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: Theme.colors.text.primary }}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 4 }}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                disabled={isLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 12,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '600', color: Theme.colors.text.primary }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 20, flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {children}
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: Theme.colors.border,
                backgroundColor: Theme.colors.canvas,
              }}
            >
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isLoading}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderColor: Theme.colors.border,
                  borderWidth: 1,
                  backgroundColor: Theme.colors.light,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
              {onSubmit && (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: Theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                      {submitLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
