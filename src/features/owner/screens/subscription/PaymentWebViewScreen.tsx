import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, BackHandler, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/theme';
import { showErrorAlert } from '@/utils/errorHandler';

interface PaymentWebViewScreenProps {
  navigation: any;
  route: any;
}

/**
 * CCAvenue requires a POST form submission with encRequest and access_code
 * as form fields. Loading the payment URL directly (GET) results in a blank page.
 * This function parses the payment URL and builds an auto-submitting HTML form.
 */
const buildPaymentFormHtml = (paymentUrl: string): string => {
  try {
    const urlObj = new URL(paymentUrl);
    const encVal = urlObj.searchParams.get('enc_val') || urlObj.searchParams.get('encRequest') || '';
    const accessCode = urlObj.searchParams.get('access_code') || '';
    // Reconstruct the action URL: keep any gateway query params (e.g. command) but
    // remove the form fields (enc_val & access_code) which are submitted via POST.
    const actionParams = new URLSearchParams(urlObj.search);
    actionParams.delete('enc_val');
    actionParams.delete('encRequest');
    actionParams.delete('access_code');
    const actionQuery = actionParams.toString();
    const actionUrl = `${urlObj.origin}${urlObj.pathname}${actionQuery ? '?' + actionQuery : ''}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .loader { text-align: center; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3B82F6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Redirecting to payment gateway...</p>
  </div>
  <form id="paymentForm" method="POST" action="${actionUrl}">
    <input type="hidden" name="encRequest" value="${encVal}">
    <input type="hidden" name="access_code" value="${accessCode}">
  </form>
  <script>
    document.getElementById('paymentForm').submit();
  </script>
</body>
</html>
    `;
  } catch (e) {
    console.error('❌ Failed to parse payment URL:', e);
    return '';
  }
};

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ navigation, route }) => {
  const { paymentUrl, orderId, subscriptionId } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const paymentFormHtml = useMemo(() => buildPaymentFormHtml(paymentUrl), [paymentUrl]);

  const handleDeepLink = (url: string) => {
    console.log('� Deep link received:', url);
    const statusMatch = url.match(/[?&]status=([^&]+)/);
    const status = statusMatch ? decodeURIComponent(statusMatch[1]) : '';

    if (status === 'Success') {
      Alert.alert(
        'Payment Successful',
        'Your subscription has been activated!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Settings' } }],
              });
            },
          },
        ]
      );
    } else {
      const message = status === 'Aborted'
        ? 'Your payment was cancelled.'
        : 'Your payment was not completed. Please try again.';
      Alert.alert(
        status === 'Aborted' ? 'Payment Cancelled' : 'Payment Failed',
        message,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('📍 Navigation URL:', navState.url);

    if (navState.url.startsWith('pgapp://payment-result')) {
      handleDeepLink(navState.url);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.primary}>
      <ScreenHeader
        title="Payment"
        showBackButton
        onBackPress={handleBackPress}
      />
      
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          style={styles.webview}
          // Enhanced settings for payment gateway
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // User agent to help with UPI detection
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
          // Handle external links (UPI apps)
          onShouldStartLoadWithRequest={(request) => {
            // Handle deep link payment result
            if (request.url.startsWith('pgapp://payment-result')) {
              handleDeepLink(request.url);
              return false;
            }
            // Allow UPI intent URLs to open in external apps
            if (request.url.startsWith('upi://') || 
                request.url.startsWith('tez://') || 
                request.url.startsWith('phonepe://') ||
                request.url.startsWith('paytm://') ||
                request.url.startsWith('gpay://') ||
                request.url.includes('intent://')) {
              // Try to open in external app
              Linking.canOpenURL(request.url)
                .then((supported) => {
                  if (supported) {
                    Linking.openURL(request.url);
                  } else {
                    Alert.alert(
                      'App Not Found',
                      'Please install the required payment app or try another payment method.',
                      [{ text: 'OK' }]
                    );
                  }
                })
                .catch((err) => console.error('Error opening UPI app:', err));
              return false;
            }
            return true;
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            showErrorAlert(null, 'Payment Load Error');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView HTTP error:', nativeEvent);
            showErrorAlert(null, 'Payment Page Error');
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
