import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Theme } from '../../theme';

interface LegalWebViewScreenProps {
  navigation: any;
  route: any;
}

export const LegalWebViewScreen: React.FC<LegalWebViewScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);

  const title = String(route?.params?.title || 'Document');

  const url = useMemo(() => {
    return String(route?.params?.url || '').trim();
  }, [route?.params?.url]);

  useEffect(() => {
    if (!url) {
      Alert.alert('Link not available', 'This document link is not available right now.');
      navigation.goBack();
    }
  }, [url, navigation]);

  if (!url) return null;

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.primary}>
      <ScreenHeader title={title} showBackButton onBackPress={() => navigation.goBack()} />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : null}

        <WebView
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webview}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            Alert.alert(title, `Failed to load page.\n\n${nativeEvent?.description || ''}`);
          }}
          onHttpError={() => {
            Alert.alert(title, 'Page returned an error. Please try again.');
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
