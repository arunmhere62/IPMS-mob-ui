import React from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import {
  View,
  Text,
  ScrollView,
  ViewStyle,
  TextStyle,
  StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CollapsibleSectionTheme {
  // Header styles
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerBorderColor?: string;
  
  // Container styles
  containerBorderColor?: string;
  containerBackgroundColor?: string;
  containerShadowColor?: string;
  
  // Icon colors
  iconColor?: string;
  chevronColor?: string;
  
  // Content area
  contentBackgroundColor?: string;
  
  // Accent color for highlights
  accentColor?: string;
}

export const THEME_PRESETS = {
  // Light theme (default)
  light: {
    headerBackgroundColor: '#F3F4F6',
    headerTextColor: '#1F2937',
    headerBorderColor: '#E5E7EB',
    containerBorderColor: '#E5E7EB',
    containerBackgroundColor: '#FFFFFF',
    containerShadowColor: '#000000',
    iconColor: '#6B7280',
    chevronColor: '#6B7280',
    contentBackgroundColor: '#FFFFFF',
    accentColor: '#1F2937' } as CollapsibleSectionTheme,
  
  // Light blue theme
  lightBlue: {
    headerBackgroundColor: '#EFF6FF',
    headerTextColor: '#1E40AF',
    headerBorderColor: '#BFDBFE',
    containerBorderColor: '#BFDBFE',
    containerBackgroundColor: '#FFFFFF',
    containerShadowColor: '#000000',
    iconColor: '#3B82F6',
    chevronColor: '#3B82F6',
    contentBackgroundColor: '#FFFFFF',
    accentColor: '#1E40AF' } as CollapsibleSectionTheme,
  
  // Light green theme
  lightGreen: {
    headerBackgroundColor: '#F0FDF4',
    headerTextColor: '#166534',
    headerBorderColor: '#BBEF63',
    containerBorderColor: '#BBEF63',
    containerBackgroundColor: '#FFFFFF',
    containerShadowColor: '#000000',
    iconColor: '#10B981',
    chevronColor: '#10B981',
    contentBackgroundColor: '#FFFFFF',
    accentColor: '#166534' } as CollapsibleSectionTheme,
  
  // Light orange theme
  lightOrange: {
    headerBackgroundColor: '#FEF3C7',
    headerTextColor: '#92400E',
    headerBorderColor: '#FCD34D',
    containerBorderColor: '#FCD34D',
    containerBackgroundColor: '#FFFFFF',
    containerShadowColor: '#000000',
    iconColor: '#F59E0B',
    chevronColor: '#F59E0B',
    contentBackgroundColor: '#FFFFFF',
    accentColor: '#92400E' } as CollapsibleSectionTheme,
  
  // Light purple theme
  lightPurple: {
    headerBackgroundColor: '#F3E8FF',
    headerTextColor: '#6B21A8',
    headerBorderColor: '#E9D5FF',
    containerBorderColor: '#E9D5FF',
    containerBackgroundColor: '#FFFFFF',
    containerShadowColor: '#000000',
    iconColor: '#A855F7',
    chevronColor: '#A855F7',
    contentBackgroundColor: '#FFFFFF',
    accentColor: '#6B21A8' } as CollapsibleSectionTheme };

interface CollapsibleSectionProps {
  // Content
  title: string;
  icon?: string;
  itemCount?: number;
  children: React.ReactNode;
  
  // State
  expanded: boolean;
  onToggle: () => void;
  
  // Theming
  theme?: CollapsibleSectionTheme | keyof typeof THEME_PRESETS;
  
  // Customization
  containerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  
  // Behavior
  maxHeight?: number;
  showShadow?: boolean;
  borderRadius?: number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  itemCount,
  children,
  expanded,
  onToggle,
  theme = 'light',
  containerStyle,
  headerStyle,
  titleStyle,
  contentStyle,
  maxHeight = 600,
  showShadow = true,
  borderRadius = 8 }) => {
  // Resolve theme
  const resolvedTheme = typeof theme === 'string' 
    ? THEME_PRESETS[theme as keyof typeof THEME_PRESETS]
    : theme;

  const {
    headerBackgroundColor = '#000000',
    headerTextColor = '#FFFFFF',
    headerBorderColor = '#333333',
    containerBorderColor = '#E5E7EB',
    containerBackgroundColor = '#FFFFFF',
    containerShadowColor = '#000000',
    iconColor = '#FFFFFF',
    chevronColor = '#FFFFFF',
    contentBackgroundColor = '#FFFFFF' } = resolvedTheme;

  return (
    <View
      style={[
        {
          marginBottom: 16,
          marginHorizontal: 16,
          borderWidth: 1,
          borderColor: containerBorderColor,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: containerBackgroundColor,
          ...(showShadow && {
            shadowColor: containerShadowColor,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3 }) },
        containerStyle,
      ]}
    >
      {/* Header */}
      <AnimatedPressableCard
        onPress={onToggle}
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: headerBackgroundColor,
            borderBottomWidth: expanded ? 1 : 0,
            borderBottomColor: headerBorderColor },
          headerStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={18}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              {
                fontSize: 16,
                fontWeight: '700',
                color: headerTextColor },
              titleStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit minimumFontScale={0.85}
          >
            {title}
            {itemCount !== undefined && ` (${itemCount})`}
          </Text>
        </View>

        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={chevronColor}
        />
      </AnimatedPressableCard>

      {/* Content */}
      {expanded && (
        <ScrollView
          style={[
            {
              maxHeight,
              paddingVertical: 10,
              backgroundColor: contentBackgroundColor },
            contentStyle,
          ]}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};
