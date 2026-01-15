import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';

interface SubscriptionConfirmScreenProps {
  navigation: any;
  route: any;
}

export const SubscriptionConfirmScreen: React.FC<SubscriptionConfirmScreenProps> = ({ navigation, route }) => {
  const {
    title,
    paymentUrl,
    orderId,
    subscriptionId,
    plan,
    pricing,
  } = route.params || {};

  const formatCurrencyAmount = (amount: number | string | null | undefined, currency?: string) => {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0);
    if (!Number.isFinite(num)) {
      return '—';
    }
    if (currency && currency.toUpperCase() !== 'INR') {
      return `${currency.toUpperCase()} ${num.toLocaleString()}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDuration = (days: number) => {
    if (days === 30) return 'Monthly';
    if (days === 90) return 'Quarterly';
    if (days === 180) return 'Half-Yearly';
    if (days === 365) return 'Yearly';
    return `${days} Days`;
  };

  const currency = pricing?.currency ?? plan?.currency;
  const basePrice = pricing?.base_price;
  const cgstAmount = pricing?.cgst_amount ?? plan?.gst_breakdown?.cgst_amount;
  const sgstAmount = pricing?.sgst_amount ?? plan?.gst_breakdown?.sgst_amount;
  const total = pricing?.total_price_including_gst ?? plan?.gst_breakdown?.total_price_including_gst ?? (plan?.price ? Number(plan.price) : undefined);

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.secondary}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={title || 'Confirm'}
        subtitle="Review plan details before payment"
        backgroundColor={Theme.colors.background.blue}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary, marginBottom: 8 }}>
            Plan Details
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
              Plan
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text.primary }}>
              {plan?.name || '—'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Duration
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
                {plan?.duration ? formatDuration(plan.duration) : '—'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Total (incl. GST)
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.colors.primary }}>
                {formatCurrencyAmount(total, currency)}
              </Text>
            </View>
          </View>

          {plan?.description ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginBottom: 4 }}>
                Description
              </Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.primary, lineHeight: 20 }}>
                {plan.description}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card style={{ padding: 18, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary, marginBottom: 12 }}>
            GST Breakdown (18%)
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>Base Amount</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
              {formatCurrencyAmount(basePrice, currency)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>CGST (9%)</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
              {formatCurrencyAmount(cgstAmount, currency)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>SGST (9%)</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
              {formatCurrencyAmount(sgstAmount, currency)}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: Theme.colors.border, marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text.primary }}>Total Payable</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: Theme.colors.text.primary }}>
              {formatCurrencyAmount(total, currency)}
            </Text>
          </View>
        </Card>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate('PaymentWebView', {
              paymentUrl,
              orderId,
              subscriptionId,
              paymentMethod: 'ccavenue',
            });
          }}
          disabled={!paymentUrl}
          style={{
            backgroundColor: paymentUrl ? Theme.colors.primary : Theme.colors.border,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', marginRight: 8 }}>
            Proceed to Payment
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
};
