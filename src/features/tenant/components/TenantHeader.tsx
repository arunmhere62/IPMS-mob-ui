import React from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme';

interface TenantHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onLogout?: () => void;
}

export const TenantHeader: React.FC<TenantHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  onLogout }) => {
  // Set status bar style
  React.useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(Theme.colors.primary, true);
    }
  }, []);

  return (
    <View
      style={{
        backgroundColor: Theme.colors.primary,
        padding: 14,
        paddingTop: 60,
        paddingBottom: 14 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Back Button */}
        {showBackButton && onBackPress && (
          <AnimatedPressableCard
            onPress={onBackPress}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </AnimatedPressableCard>
        )}

        {/* Title and Subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                marginTop: 2 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Logout Button */}
        {onLogout && (
          <AnimatedPressableCard
            onPress={onLogout}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center' }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </AnimatedPressableCard>
        )}
      </View>
    </View>
  );
};
