import React, { useState, useRef, useEffect } from 'react';
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

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ navigation, route }) => {
  const { paymentUrl, orderId, subscriptionId, paymentMethod } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // JavaScript to inject for auto-selecting UPI apps on CCAvenue page
  const injectedJavaScript = `
    (function() {
      function tryClickUPI() {
        try {
          // CCAvenue uses radio buttons and labels for payment options
          // Try multiple strategies to find UPI option

          // Strategy 1: Look for text containing UPI/Google Pay
          var allElements = document.querySelectorAll('label, div, span, a, li, input[type="radio"]');
          for (var i = 0; i < allElements.length; i++) {
            var el = allElements[i];
            var text = (el.textContent || el.innerText || '').toLowerCase().trim();
            if (text === 'upi' || text === 'google pay' || text === 'gpay' || text === 'phonepe' || text === 'paytm' || text === 'amazon pay') {
              // If it's a radio button, select it
              if (el.tagName === 'INPUT' && el.type === 'radio') {
                el.checked = true;
                el.click();
                console.log('Clicked radio for: ' + text);
                return true;
              }
              // Otherwise click the element or its parent label
              var radio = el.querySelector('input[type="radio"]') || el.closest('label')?.querySelector('input[type="radio"]');
              if (radio) {
                radio.checked = true;
                radio.click();
                console.log('Clicked radio via parent for: ' + text);
                return true;
              }
              // Just click the element
              el.click();
              console.log('Clicked element for: ' + text);
              return true;
            }
          }

          // Strategy 2: Look for images with UPI-related alt/src
          var imgs = document.querySelectorAll('img');
          for (var i = 0; i < imgs.length; i++) {
            var alt = (imgs[i].alt || '').toLowerCase();
            var src = (imgs[i].src || '').toLowerCase();
            if (alt.indexOf('upi') >= 0 || alt.indexOf('gpay') >= 0 || alt.indexOf('google pay') >= 0 ||
                src.indexOf('upi') >= 0 || src.indexOf('gpay') >= 0 || src.indexOf('google') >= 0) {
              var parent = imgs[i].closest('label, a, div, li');
              if (parent) {
                parent.click();
                console.log('Clicked image parent for: ' + alt);
                return true;
              }
            }
          }

          // Strategy 3: Look for payment option tabs/buttons with UPI
          var tabs = document.querySelectorAll('[class*="payment"], [class*="option"], [id*="payment"], [id*="upi"]');
          for (var i = 0; i < tabs.length; i++) {
            var tabText = (tabs[i].textContent || tabs[i].innerText || '').toLowerCase();
            if (tabText.indexOf('upi') >= 0) {
              tabs[i].click();
              console.log('Clicked tab/div for UPI');
              return true;
            }
          }

          return false;
        } catch (e) {
          console.log('Auto-click error:', e);
          return false;
        }
      }

      // Try multiple times as the page may load dynamically
      var attempts = 0;
      var maxAttempts = 10;
      var interval = setInterval(function() {
        attempts++;
        if (tryClickUPI() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 1000);
    })();
    true;
  `;

  const handleDeepLink = (url: string) => {
    console.log('� Deep link received:', url);
    const parsed = new URL(url);
    const status = parsed.searchParams.get('status');

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
                routes: [{ name: 'Settings' }],
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
