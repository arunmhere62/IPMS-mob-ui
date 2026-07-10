import React, { useState } from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import { View, TextInput, Text } from 'react-native';
import { Theme } from '../theme';

export interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  editable?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Enter password',
  placeholderTextColor = '#9CA3AF',
  label,
  error = false,
  errorMessage,
  editable = true }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.colors.text.primary, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: 8,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#E5E7EB' }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 12,
            fontSize: 14,
            color: Theme.colors.text.primary }}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          editable={editable}
        />
        
        <AnimatedPressableCard
          onPress={() => setShowPassword(!showPassword)}
          style={{
            padding: 8,
            marginLeft: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 18, color: Theme.colors.text.secondary }}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </AnimatedPressableCard>
      </View>

      {error && errorMessage && (
        <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
};
