import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, BackHandler, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Theme } from '../../theme';

interface PaymentWebViewScreenProps {
  navigation: any;
  route: any;
}

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ navigation, route }) => {
  const { paymentUrl, orderId, subscriptionId, paymentMethod } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // JavaScript to inject for auto-selecting UPI apps
  const injectedJavaScript = `
    (function() {
      // Wait for page to load
      setTimeout(function() {
        try {
          // Try to find and click Google Pay button
          const gpayButton = document.querySelector('[data-app="gpay"], [alt*="Google Pay"], [title*="Google Pay"]');
          if (gpayButton) {
            console.log('Found Google Pay button, clicking...');
            gpayButton.click();
            return;
          }

          // Try to find and click PhonePe button
          const phonepeButton = document.querySelector('[data-app="phonepe"], [alt*="PhonePe"], [title*="PhonePe"]');
          if (phonepeButton) {
            console.log('Found PhonePe button, clicking...');
            phonepeButton.click();
            return;
          }

          // Try to find and click Paytm button
          const paytmButton = document.querySelector('[data-app="paytm"], [alt*="Paytm"], [title*="Paytm"]');
          if (paytmButton) {
            console.log('Found Paytm button, clicking...');
            paytmButton.click();
            return;
          }

          // Look for any UPI app icons by image source
          const upiImages = document.querySelectorAll('img[src*="gpay"], img[src*="phonepe"], img[src*="paytm"]');
          if (upiImages.length > 0) {
            console.log('Found UPI app image, clicking...');
            upiImages[0].click();
          }
        } catch (e) {
          console.log('Auto-click error:', e);
        }
      }, 2000); // Wait 2 seconds for page to fully load
    })();
    true;
  `;

  const handleNavigationStateChange = (navState: any) => {
    console.log('📍 Navigation URL:', navState.url);

    // Check if payment is successful or cancelled
    if (
      navState.url.includes('/payment/callback') ||
      navState.url.includes('/api/v1/subscription/payment/callback') ||
      navState.url.includes('payment/success')
    ) {
      // Payment successful
      Alert.alert(
        'Payment Successful',
        'Your subscription has been activated!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Settings' }],
              });
            },
          },
        ]
      );
    } else if (
      navState.url.includes('/payment/cancel') ||
      navState.url.includes('/api/v1/subscription/payment/cancel') ||
      navState.url.includes('payment/failed')
    ) {
      // Payment cancelled or failed
      Alert.alert(
        'Payment Cancelled',
        'Your payment was not completed. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
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
          // Inject JavaScript to auto-click UPI apps
          injectedJavaScript={paymentMethod === 'upi' ? injectedJavaScript : undefined}
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
            Alert.alert(
              'Payment Error',
              `Failed to load: ${nativeEvent?.url || 'unknown URL'}\n\nThis usually happens when the payment gateway redirects to a callback URL that is not reachable. Please verify backend CCAVENUE_REDIRECT_URL / CCAVENUE_CANCEL_URL (should be your public API domain and typically include /api/v1/subscription/payment/callback).`
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView HTTP error:', nativeEvent);
            Alert.alert('Error', 'Payment page returned an error. Please try again.');
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
