import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/theme';
import { usePreparePaymentMutation } from '@/features/owner/api/subscriptionApi';

interface PaymentOptionsScreenProps {
  navigation: any;
  route: any;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  description: string;
  recommended?: boolean;
}

export const PaymentOptionsScreen: React.FC<PaymentOptionsScreenProps> = ({ navigation, route }) => {
  const { plan, paymentUrl, orderId, subscriptionId } = route.params;
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [preparePayment, { isLoading: isPreparing }] = usePreparePaymentMutation();

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      name: 'UPI',
      icon: 'logo-google',
      description: 'Google Pay, PhonePe, Paytm & more',
      recommended: true },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'card',
      description: 'Visa, Mastercard, Rupay, Amex' },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: 'business',
      description: 'All major banks supported' },
    {
      id: 'wallet',
      name: 'Wallets',
      icon: 'wallet',
      description: 'Paytm, PhonePe, Amazon Pay' },
  ];

  const handleProceedToPay = async () => {
    try {
      const result = await preparePayment({
        orderId,
        paymentMethod: selectedMethod,
      }).unwrap();

      const payload: any = (result as any)?.data ?? result;
      const preparedPaymentUrl =
        payload?.payment_url ??
        payload?.data?.payment_url;

      if (!preparedPaymentUrl) {
        throw new Error('Failed to prepare payment URL');
      }

      navigation.navigate('PaymentWebView', {
        paymentUrl: preparedPaymentUrl,
        orderId,
        subscriptionId,
        paymentMethod: selectedMethod });
    } catch (error: unknown) {
      console.error('❌ Prepare payment error, falling back to original URL:', error);
      navigation.navigate('PaymentWebView', {
        paymentUrl,
        orderId,
        subscriptionId,
        paymentMethod: selectedMethod });
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.secondary}>
      <ScreenHeader
        title="Payment Options"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={24} color={Theme.colors.primary} />
            <Text style={styles.summaryTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{plan.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{plan.duration} days</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order ID</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>{orderId}</Text>
          </View>
          
          {/* Plan Features */}
          {plan.features && plan.features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What's Included:</Text>
              {plan.features.slice(0, 3).map((feature: string, index: number) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Theme.colors.secondary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatPrice(plan.price)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsContainer}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <AnimatedPressableCard
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <View style={[
                  styles.iconContainer,
                  selectedMethod === method.id && styles.iconContainerSelected,
                ]}>
                  <Ionicons 
                    name={method.icon as any} 
                    size={24} 
                    color={selectedMethod === method.id ? Theme.colors.primary : Theme.colors.text.secondary} 
                  />
                </View>
                
                <View style={styles.methodInfo}>
                  <View style={styles.methodNameRow}>
                    <Text style={[
                      styles.methodName,
                      selectedMethod === method.id && styles.methodNameSelected,
                    ]}>
                      {method.name}
                    </Text>
                    {method.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              
              <View style={[
                styles.radioButton,
                selectedMethod === method.id && styles.radioButtonSelected,
              ]}>
                {selectedMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </AnimatedPressableCard>
          ))}
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={Theme.colors.secondary} />
          <Text style={styles.securityText}>
            Your payment is secured with 256-bit SSL encryption
          </Text>
        </View>

        {/* UPI Payment Note */}
        {selectedMethod === 'upi' && (
          <View style={styles.upiNote}>
            <Ionicons name="information-circle" size={18} color={Theme.colors.info} />
            <Text style={styles.upiNoteText}>
              If Google Pay is not detected, please select another UPI app (PhonePe, Paytm, etc.) or use Card/Net Banking option.
            </Text>
          </View>
        )}

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>Important Information:</Text>
          <Text style={styles.termsText}>• Payment will be processed securely via CCAvenue</Text>
          <Text style={styles.termsText}>• Subscription activates immediately after successful payment</Text>
          <Text style={styles.termsText}>• Refunds are subject to our refund policy</Text>
          <Text style={styles.termsText}>• For support, contact us at support@example.com</Text>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.payLabel}>Amount to pay</Text>
          <Text style={styles.payAmount}>{formatPrice(plan.price)}</Text>
        </View>
        
        <AnimatedPressableCard
          style={styles.proceedButton}
          onPress={handleProceedToPay}
          disabled={isPreparing}
        >
          {isPreparing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </AnimatedPressableCard>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2 },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16 },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginLeft: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12 },
  summaryLabel: {
    fontSize: 14,
    color: Theme.colors.text.secondary },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primary },
  methodsContainer: {
    marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: 12 },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Theme.colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2 },
  methodCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.background.blueLight,
    elevation: 3 },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12 },
  iconContainerSelected: {
    backgroundColor: Theme.colors.background.blueLight },
  methodInfo: {
    flex: 1 },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4 },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text.primary },
  methodNameSelected: {
    color: Theme.colors.primary },
  recommendedBadge: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8 },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff' },
  methodDescription: {
    fontSize: 12,
    color: Theme.colors.text.secondary },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center' },
  radioButtonSelected: {
    borderColor: Theme.colors.primary },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.blueLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20 },
  securityText: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginLeft: 8,
    flex: 1 },
  bottomContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12 },
  payLabel: {
    fontSize: 14,
    color: Theme.colors.text.secondary },
  payAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text.primary },
  proceedButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8 },
  featuresContainer: {
    marginTop: 12,
    marginBottom: 8 },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6 },
  featureText: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginLeft: 8,
    flex: 1 },
  termsContainer: {
    backgroundColor: Theme.colors.background.blueLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20 },
  termsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: 8 },
  termsText: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 16 },
  upiNote: {
    backgroundColor: Theme.withOpacity(Theme.colors.info, 0.1),
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start' },
  upiNoteText: {
    fontSize: 12,
    color: Theme.colors.info,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18 } });
