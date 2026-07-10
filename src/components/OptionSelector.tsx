import React from "react";
import { AnimatedPressableCard } from './AnimatedPressableCard';
import { View, Text, ViewStyle } from "react-native";
import { Theme } from '../theme';

export interface Option {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

export interface OptionSelectorProps {
  label: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  description?: string;
  error?: string;
}

/**
 * Reusable Option Selector Component
 * Used for selecting between multiple options (e.g., PG Type, Gender)
 * Displays options as horizontal buttons with icons
 */
export const OptionSelector: React.FC<OptionSelectorProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  required = false,
  disabled = false,
  containerStyle,
  description,
  error }) => {
  return (
    <View style={containerStyle}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>

      {description && (
        <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, marginBottom: 12 }}>
          {description}
        </Text>
      )}

      <View style={{ flexDirection: 'row', columnGap : 10, rowGap : 8, flexWrap: 'wrap' }}>
        {options.map((option) => (
          <AnimatedPressableCard
            key={option.value}
            onPress={() => onSelect(selectedValue === option.value ? null : option.value)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: selectedValue === option.value ? Theme.colors.primary : '#D1D5DB',
              backgroundColor: selectedValue === option.value ? 'rgba(59, 130, 246, 0.1)' : '#F9FAFB',
              alignItems: 'center',
              justifyContent: 'center' }}
            disabled={disabled}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedValue === option.value ? '600' : '500',
                color: selectedValue === option.value ? Theme.colors.primary : Theme.colors.text.primary }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.icon && `${option.icon} `}
              {option.label}
            </Text>
          </AnimatedPressableCard>
        ))}
      </View>

      {error && (
        <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
