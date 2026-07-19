import React from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import { Theme } from '../theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  right?: number;
  /** Distance above the bottom edge (safe area + bottom nav are added automatically). */
  bottomOffset?: number;
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  disabled = false,
  icon = 'add',
  size = 60,
  right = 20,
  bottomOffset = 100,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <AnimatedPressableCard
      onPress={onPress}
      disabled={disabled}
      style={{
        position: 'absolute',
        right,
        bottom: insets.bottom + bottomOffset,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      <Ionicons name={icon} size={size * 0.45} color="#fff" />
    </AnimatedPressableCard>
  );
};
