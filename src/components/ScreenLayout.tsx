import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme';

export const ScreenLayoutContext = React.createContext<{
  backgroundColor: string;
  contentBackgroundColor: string;
}>({
  backgroundColor: Theme.colors.background.primary,
  contentBackgroundColor: Theme.colors.background.primary,
});

interface ScreenLayoutProps {
  children?: React.ReactNode;
  /** Background color for the SafeAreaView */
  backgroundColor?: string;
  /** Background color for the content area */
  contentBackgroundColor?: string;
  style?: ViewStyle;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  backgroundColor = Theme.colors.background.primary,
  contentBackgroundColor,
  style,
}) => {
  const effectiveContentBackgroundColor = contentBackgroundColor ?? backgroundColor;

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor }} 
      edges={['left', 'right', ]}
    >
      <ScreenLayoutContext.Provider
        value={{ backgroundColor, contentBackgroundColor: effectiveContentBackgroundColor }}
      >
        <View style={[{ flex: 1, backgroundColor: effectiveContentBackgroundColor }, style]}>
          {children}
        </View>
      </ScreenLayoutContext.Provider>
    </SafeAreaView>
  );
};
