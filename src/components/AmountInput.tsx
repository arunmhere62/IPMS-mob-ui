import React from 'react';
import { View, Text, TextInput, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface AmountInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  prefix?: string;
  maxLength?: number;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = 'Enter amount',
  error,
  required = false,
  disabled = false,
  containerStyle,
  prefix = '₹',
  maxLength = 10,
}) => {
  const handleChange = (text: string) => {
    // Prevent negative numbers
    if (text.startsWith('-')) {
      return;
    }
    
    // Prevent multiple decimal points
    const decimalPoints = (text.match(/\./g) || []).length;
    if (decimalPoints > 1) {
      // Remove all but the first decimal point
      const parts = text.split('.');
      const newText = parts[0] + '.' + parts.slice(1).join('');
      onChangeText(newText);
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={containerStyle}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: error ? '#EF4444' : Theme.colors.border,
        borderRadius: 12,
        backgroundColor: disabled ? '#F9FAFB' : '#fff',
        paddingHorizontal: 12,
        opacity: disabled ? 0.6 : 1,
      }}>
        <MaterialIcons
          name="currency-rupee"
          size={15}
          color={Theme.colors.text.tertiary}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 16,
            color: Theme.colors.text.primary,
          }}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.text.tertiary}
          keyboardType="numeric"
          value={value}
          onChangeText={handleChange}
          maxLength={maxLength}
          editable={!disabled}
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
