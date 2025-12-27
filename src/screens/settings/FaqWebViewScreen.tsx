import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Theme } from '../../theme';
import { FAQ_WEB_URL } from '../../config/support.config';

interface FaqWebViewScreenProps {
  navigation: any;
}

export const FaqWebViewScreen: React.FC<FaqWebViewScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  const faqUrl = useMemo(() => {
    return (FAQ_WEB_URL || '').trim();
  }, []);

  useEffect(() => {
    if (!faqUrl) {
      Alert.alert('FAQ URL not configured', 'Please set FAQ_WEB_URL in src/config/support.config.ts');
      navigation.goBack();
    }
  }, [faqUrl, navigation]);

  if (!faqUrl) return null;

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.primary}>
      <ScreenHeader title="FAQ" showBackButton onBackPress={() => navigation.goBack()} />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : null}

        <WebView
          source={{ uri: faqUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webview}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            Alert.alert('FAQ Error', `Failed to load FAQ page.\n\n${nativeEvent?.description || ''}`);
          }}
          onHttpError={() => {
            Alert.alert('FAQ Error', 'FAQ page returned an error. Please try again.');
          }}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});
