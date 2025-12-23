import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface ErrorBannerProps {
  error: string | null;
  onRetry: () => void;
  title?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ 
  error, 
  onRetry, 
  title = 'Error Loading Data' 
}) => {
  if (!error) return null;

  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      padding: 12,
      backgroundColor: '#FEE2E2',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: Theme.colors.danger,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Ionicons name="alert-circle-outline" size={20} color={Theme.colors.danger} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 14, color: Theme.colors.danger, fontWeight: '600' }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: Theme.colors.danger, marginTop: 2 }}>
          {error}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: Theme.colors.danger,
          borderRadius: 6,
        }}
      >
        <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
};
