import React from 'react';
import { View, Text, TextInput, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

export interface InputFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}

/**
 * Reusable Input Field Component
 * Used for text inputs with prefix icons and error handling
 * Provides consistent styling across the app
 */
export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  disabled = false,
  containerStyle,
  prefixIcon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  ...textInputProps
}) => {
  return (
    <View style={containerStyle}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: disabled ? '#F9FAFB' : Theme.colors.input.background,
          borderWidth: 1,
          borderColor: error ? '#EF4444' : Theme.colors.input.border,
          borderRadius: 8,
          paddingHorizontal: 16,
          opacity: disabled ? 0.6 : 1,
          minHeight: multiline ? 80 : 48,
        }}
      >
        {prefixIcon && (
          <Ionicons
            name={prefixIcon}
            size={20}
            color={Theme.colors.text.tertiary}
            style={{ marginRight: 12, marginTop: multiline ? 12 : 0 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            paddingVertical: multiline ? 12 : 12,
            paddingHorizontal: prefixIcon ? 0 : 12,
            fontSize: 16,
            color: Theme.colors.text.primary,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 56 : 24,
          }}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={Theme.colors.input.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          {...textInputProps}
        />
      </View>

      {error && (
        <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
