import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/theme';
import { CONTENT_COLOR } from '@/constant';

interface InvoiceViewerScreenProps {
  navigation: any;
  route: { params?: { html?: string; invoiceNumber?: string } };
}

export const InvoiceViewerScreen: React.FC<InvoiceViewerScreenProps> = ({ navigation, route }) => {
  const html = route.params?.html || '';
  const invoiceNumber = route.params?.invoiceNumber || 'Invoice';

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePdf = async () => {
      if (!html) {
        setError('No invoice data received');
        setLoading(false);
        return;
      }

      try {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        setPdfUri(uri);
      } catch (e: any) {
        setError(e?.message || 'Failed to generate PDF');
      } finally {
        setLoading(false);
      }
    };

    generatePdf();
  }, [html]);

  const handleShare = async () => {
    if (!pdfUri) return;
    try {
      setSharing(true);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Invoice', `PDF generated at: ${pdfUri}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to share invoice');
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={invoiceNumber}
        subtitle="Invoice PDF"
        backgroundColor={Theme.colors.background.blue}
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {loading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 12, fontSize: 14, color: Theme.colors.text.secondary }}>
              Generating PDF...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Ionicons name="alert-circle-outline" size={48} color={Theme.colors.danger} />
            <Text style={{ marginTop: 12, fontSize: 14, color: Theme.colors.danger, textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        {pdfUri && !loading && (
          <View style={{ flex: 1 }}>
            <WebView
              source={Platform.OS === 'ios' ? { uri: pdfUri } : { html }}
              style={{ flex: 1, backgroundColor: CONTENT_COLOR }}
              originWhitelist={['*']}
              allowFileAccess
              allowFileAccessFromFileURLs
              allowUniversalAccessFromFileURLs
            />

            {/* Share / Download bar */}
            <View style={{
              flexDirection: 'row',
              padding: 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: Theme.colors.border,
            }}>
              <AnimatedPressableCard
                onPress={handleShare}
                disabled={sharing}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: sharing ? Theme.colors.background.secondary : Theme.colors.primary,
                  gap: 6,
                }}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="share-outline" size={18} color="#fff" />
                )}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  {sharing ? 'Opening...' : 'Share / Download'}
                </Text>
              </AnimatedPressableCard>
            </View>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};
