import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { setToastHandler, ToastPayload, ToastVariant } from '../utils/toastService';

type InternalToast = ToastPayload & { id: number };

const variantColors: Record<ToastVariant, { accent: string; bg: string; text: string; subtext: string; border: string }> = {
  success: {
    accent: Theme.colors.secondary,
    bg: Theme.colors.canvas,
    text: Theme.colors.text.primary,
    subtext: Theme.colors.text.secondary,
    border: Theme.colors.border,
  },
  error: {
    accent: Theme.colors.danger,
    bg: Theme.colors.canvas,
    text: Theme.colors.text.primary,
    subtext: Theme.colors.text.secondary,
    border: Theme.colors.border,
  },
  info: {
    accent: Theme.colors.primary,
    bg: Theme.colors.canvas,
    text: Theme.colors.text.primary,
    subtext: Theme.colors.text.secondary,
    border: Theme.colors.border,
  },
  warning: {
    accent: Theme.colors.warning,
    bg: Theme.colors.canvas,
    text: Theme.colors.text.primary,
    subtext: Theme.colors.text.secondary,
    border: Theme.colors.border,
  },
};

const variantGlyph: Record<ToastVariant, string> = {
  success: '✓',
  error: '!',
  info: 'i',
  warning: '!',
};

export const ToastHost: React.FC = () => {
  const [toast, setToast] = useState<InternalToast | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get('window').width;

  const style = useMemo(() => {
    if (!toast) return null;
    const variant: ToastVariant = toast.variant ?? 'info';
    const colors = variantColors[variant];
    return { colors, glyph: variantGlyph[variant], maxWidth: Math.min(screenWidth - 24, 520) };
  }, [toast, screenWidth]);

  const hide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  };

  const show = (payload: ToastPayload) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    const next: InternalToast = { ...payload, id: Date.now() + Math.floor(Math.random() * 1000) };
    setToast(next);

    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      const durationMs = payload.durationMs ?? 2200;
      hideTimer.current = setTimeout(() => hide(), durationMs);
    });
  };

  useEffect(() => {
    setToastHandler(show);
    return () => {
      setToastHandler(null);
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toast || !style) return null;

  const { colors, glyph, maxWidth } = style;
  const topOffset = Math.max(10, insets.top + 8);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={hide}
        style={[
          styles.toast,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            maxWidth,
            marginTop: topOffset,
          },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: colors.accent }]} />
        <View style={styles.contentRow}>
          <View
            style={[
              styles.iconBubble,
              {
                borderColor: Theme.withOpacity(colors.accent, 0.25),
                backgroundColor: Theme.withOpacity(colors.accent, 0.10),
              },
            ]}
          >
            <Text style={[styles.iconText, { color: colors.accent }]}>{glyph}</Text>
          </View>
          <View style={styles.textCol}>
            {toast.title ? <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{toast.title}</Text> : null}
            <Text style={[styles.message, { color: toast.title ? colors.subtext : colors.text }]} numberOfLines={3}>
              {toast.message}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 6,
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '800',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
