import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../theme';
import { TenantHeader } from './TenantHeader';
import { TenantBottomNav } from './TenantBottomNav';

interface TenantLayoutProps {
  children: React.ReactNode;
  navigation: any;
  currentRoute: string;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onLogout?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
}

export const TenantLayout: React.FC<TenantLayoutProps> = ({
  children,
  navigation,
  currentRoute,
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  onLogout,
  refreshing = false,
  onRefresh,
  scrollable = true,
}) => {
  const content = (
    <View style={styles.contentContainer}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TenantHeader
        title={title}
        subtitle={subtitle}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        onLogout={onLogout}
      />
      <View style={styles.mainContent}>
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Theme.colors.primary]}
                  tintColor={Theme.colors.primary}
                />
              ) : undefined
            }
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
      <View style={styles.bottomNavSpacer} />
      <TenantBottomNav navigation={navigation} currentRoute={currentRoute} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  mainContent: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  contentContainer: {
    padding: Theme.spacing.md,
  },
  bottomNavSpacer: {
    height: 70,
  },
});
