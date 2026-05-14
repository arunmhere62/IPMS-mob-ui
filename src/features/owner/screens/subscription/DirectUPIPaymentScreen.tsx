import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Theme } from '@/theme';

interface DirectUPIPaymentScreenProps {
  navigation: any;
  route: any;
}

interface UPIApp {
  id: string;
  name: string;
  icon: any;
  packageName: string;
  upiScheme: string;
}

export const DirectUPIPaymentScreen: React.FC<DirectUPIPaymentScreenProps> = ({ navigation, route }) => {
  const { plan, orderId, amount, merchantVPA } = route.params;
  const [selectedApp, setSelectedApp] = useState<string>('');

  // Popular UPI apps with their deep link schemes
  const upiApps: UPIApp[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      icon: 'logo-google',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      upiScheme: 'tez://upi/pay',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: 'phone-portrait',
      packageName: 'com.phonepe.app',
      upiScheme: 'phonepe://pay',
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: 'wallet',
      packageName: 'net.one97.paytm',
      upiScheme: 'paytmmp://upi/pay',
    },
    {
      id: 'bhim',
      name: 'BHIM',
      icon: 'card',
      packageName: 'in.org.npci.upiapp',
      upiScheme: 'upi://pay',
    },
  ];

  const generateUPILink = (app: UPIApp) => {
    // Generate UPI payment link
    const upiParams = new URLSearchParams({
      pa: merchantVPA || 'merchant@upi', // Merchant VPA
      pn: 'PG Management', // Merchant name
      am: amount.toString(), // Amount
      cu: 'INR', // Currency
      tn: `Subscription - ${plan.name}`, // Transaction note
      tr: orderId, // Transaction reference
    });

    // Different apps use different URL formats
    if (app.id === 'gpay') {
      return `${app.upiScheme}?${upiParams.toString()}`;
    } else if (app.id === 'phonepe') {
      return `${app.upiScheme}?${upiParams.toString()}`;
    } else {
      return `upi://pay?${upiParams.toString()}`;
    }
  };

  const handlePayWithUPI = async (app: UPIApp) => {
    try {
      setSelectedApp(app.id);
      const upiLink = generateUPILink(app);
      
      console.log('Opening UPI app:', app.name);
      console.log('UPI Link:', upiLink);

      // Check if app can be opened
      const canOpen = await Linking.canOpenURL(upiLink);
      
      if (canOpen) {
        await Linking.openURL(upiLink);
        
        // Show waiting message
        Alert.alert(
          'Complete Payment',
          `Please complete the payment in ${app.name} and return to this app.`,
          [
            {
              text: 'Payment Done',
              onPress: () => {
                // Navigate to payment verification
                navigation.navigate('PaymentVerification', {
                  orderId,
                  subscriptionId: route.params.subscriptionId,
                });
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setSelectedApp(''),
            },
          ]
        );
      } else {
        Alert.alert(
          `${app.name} Not Found`,
          `Please install ${app.name} or try another UPI app.`,
          [{ text: 'OK', onPress: () => setSelectedApp('') }]
        );
      }
    } catch (error) {
      console.error('Error opening UPI app:', error);
      Alert.alert(
        'Error',
        'Failed to open UPI app. Please try another payment method.',
        [{ text: 'OK', onPress: () => setSelectedApp('') }]
      );
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.secondary}>
      <ScreenHeader
        title="Pay with UPI"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Details</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>{plan.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={[styles.value, { fontSize: 12 }]}>{orderId}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount to Pay</Text>
            <Text style={styles.totalAmount}>{formatPrice(amount)}</Text>
          </View>
        </Card>

        {/* UPI Apps */}
        <View style={styles.appsContainer}>
          <Text style={styles.sectionTitle}>Choose UPI App</Text>
          
          {upiApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={[
                styles.appCard,
                selectedApp === app.id && styles.appCardSelected,
              ]}
              onPress={() => handlePayWithUPI(app)}
              activeOpacity={0.7}
              disabled={selectedApp !== '' && selectedApp !== app.id}
            >
              <View style={styles.appLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={app.icon as any} 
                    size={28} 
                    color={Theme.colors.primary} 
                  />
                </View>
                <Text style={styles.appName}>{app.name}</Text>
              </View>
              
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={Theme.colors.text.tertiary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Theme.colors.info} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoDescription}>
              1. Select your UPI app{'\n'}
              2. App will open automatically{'\n'}
              3. Enter your UPI PIN{'\n'}
              4. Payment will be processed instantly
            </Text>
          </View>
        </View>

        {/* Alternative Payment */}
        <TouchableOpacity
          style={styles.alternativeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.alternativeText}>
            Use Card or Net Banking Instead
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  appsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: 12,
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.background.blueLight,
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.background.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  infoCard: {
    backgroundColor: Theme.withOpacity(Theme.colors.info, 0.1),
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.info,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 12,
    color: Theme.colors.info,
    lineHeight: 18,
  },
  alternativeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
