import React from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import { Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  textStyle,
  icon,
  iconPosition = 'left' }) => {
  // Size configurations
  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      borderRadius: 6 },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      borderRadius: 8 },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      borderRadius: 10 } };

 const getVariantStyles = (): { container: ViewStyle; text: TextStyle; loader: string } => {
  const isDisabled = disabled && !loading;

  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: isDisabled ? Theme.colors.button.disabled : Theme.colors.button.primary,
          borderWidth: 1,
          borderColor: isDisabled ? '#D1D5DB' : Theme.colors.primaryDark },
        text: {
          color: isDisabled ? Theme.colors.button.disabledText : Theme.colors.button.primaryText },
        loader: Theme.colors.button.primaryText };

    case 'secondary':
      return {
        container: {
          backgroundColor: isDisabled ? Theme.colors.button.disabled : Theme.colors.button.secondary,
          borderWidth: 1,
          borderColor: isDisabled ? '#D1D5DB' : '#D1D5DB' },
        text: {
          color: isDisabled ? Theme.colors.button.disabledText : Theme.colors.button.secondaryText },
        loader: Theme.colors.button.secondaryText };

    case 'danger':
      return {
        container: {
          backgroundColor: isDisabled ? Theme.colors.button.disabled : Theme.colors.danger,
          borderWidth: 1,
          borderColor: isDisabled ? '#D1D5DB' : '#DC2626' },
        text: {
          color: isDisabled ? Theme.colors.button.disabledText : '#FFFFFF' },
        loader: '#FFFFFF' };

    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: isDisabled ? Theme.colors.border : Theme.colors.primary },
        text: {
          color: isDisabled ? Theme.colors.button.disabledText : Theme.colors.primary },
        loader: Theme.colors.primary };

    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent' },
        text: {
          color: isDisabled ? Theme.colors.button.disabledText : Theme.colors.primary },
        loader: Theme.colors.primary };

    default:
      return {
        container: {
          backgroundColor: Theme.colors.button.primary,
          borderWidth: 1,
          borderColor: Theme.colors.primaryDark },
        text: {
          color: Theme.colors.button.primaryText },
        loader: Theme.colors.button.primaryText };
  }
};


  const variantStyles = getVariantStyles();
  const currentSize = sizeStyles[size];

  return (
    <AnimatedPressableCard
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled && !loading ? 0.5 : 1 },
        variantStyles.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.loader} size={size === 'sm' ? 'small' : 'small'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            style={[
              {
                fontSize: currentSize.fontSize,
                fontWeight: '600',
                textAlign: 'center',
                marginLeft: icon && iconPosition === 'left' ? 8 : 0,
                marginRight: icon && iconPosition === 'right' ? 8 : 0 },
              variantStyles.text,
              textStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </AnimatedPressableCard>
  );
};
