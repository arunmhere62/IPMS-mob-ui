import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { Theme } from '@/theme';
import {
  useSubscribeToPlanMutation,
  useUpgradePlanMutation,
  useValidateCouponMutation,
  type CouponValidationResponse,
} from '@/features/owner/api/subscriptionApi';

interface SubscriptionConfirmScreenProps {
  navigation: any;
  route: any;
}

export const SubscriptionConfirmScreen: React.FC<SubscriptionConfirmScreenProps> = ({ navigation, route }) => {
  const {
    title,
    paymentUrl: initialPaymentUrl,
    orderId: initialOrderId,
    subscriptionId: initialSubscriptionId,
    plan,
    pricing: initialPricing,
    isUpgrade,
  } = route.params || {};

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Re-initiated payment state (after coupon applied)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [currentPaymentUrl, setCurrentPaymentUrl] = useState(initialPaymentUrl);
  const [currentOrderId, setCurrentOrderId] = useState(initialOrderId);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState(initialSubscriptionId);
  const [currentPricing, setCurrentPricing] = useState(initialPricing);
  const [reinitiating, setReinitiating] = useState(false);

  const [validateCoupon] = useValidateCouponMutation();
  const [subscribeToPlan] = useSubscribeToPlanMutation();
  const [upgradePlan] = useUpgradePlanMutation();

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

  // ─── Coupon validation ──────────────────────────────────────
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidating(true);
    setCouponError(null);
    setCouponValidation(null);

    try {
      const result = await validateCoupon({
        code: couponCode.trim(),
        planId: plan?.s_no,
      }).unwrap();

      if (result?.valid) {
        setCouponValidation(result);
        setAppliedCoupon(null); // validated but not yet applied
      } else {
        setCouponError(result?.message || 'Invalid coupon code');
      }
    } catch (error: any) {
      const msg = error?.data?.message || error?.data?.data?.message || 'Failed to validate coupon';
      setCouponError(msg);
    } finally {
      setValidating(false);
    }
  };

  // ─── Re-initiate subscription with coupon ───────────────────
  const handleApplyCouponAndReinitiate = async () => {
    if (!couponValidation?.valid) return;

    setReinitiating(true);
    try {
      const mutation = isUpgrade ? upgradePlan : subscribeToPlan;
      const result = await mutation({
        planId: plan?.s_no,
        couponCode: couponCode.trim(),
      }).unwrap();

      const payload: any = (result as any)?.data ?? result;
      const newPaymentUrl =
        payload?.payment_url ?? payload?.data?.payment_url ?? payload?.data?.data?.payment_url;
      const newOrderId =
        payload?.order_id ?? payload?.data?.order_id ?? payload?.data?.data?.order_id;
      const subscription =
        payload?.subscription ?? payload?.data?.subscription ?? payload?.data?.data?.subscription;
      const newSubscriptionId = subscription?.s_no ?? subscription?.id;
      const newPricing =
        payload?.pricing ?? payload?.data?.pricing ?? payload?.data?.data?.pricing;

      if (newPaymentUrl) {
        setCurrentPaymentUrl(newPaymentUrl);
        setCurrentOrderId(newOrderId);
        setCurrentSubscriptionId(newSubscriptionId);
        if (newPricing) setCurrentPricing(newPricing);
        setAppliedCoupon(couponCode.trim().toUpperCase());
      }
    } catch (error: any) {
      const msg = error?.data?.message || error?.data?.data?.message || 'Failed to apply coupon';
      setCouponError(msg);
    } finally {
      setReinitiating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
    setAppliedCoupon(null);
    setCouponError(null);
    // Revert to original pricing
    setCurrentPaymentUrl(initialPaymentUrl);
    setCurrentOrderId(initialOrderId);
    setCurrentSubscriptionId(initialSubscriptionId);
    setCurrentPricing(initialPricing);
  };

  // ─── Pricing display ────────────────────────────────────────
  const currency = currentPricing?.currency ?? plan?.currency;
  const basePrice = currentPricing?.base_price;
  const discountAmount = currentPricing?.discount_amount;
  const finalBasePrice = currentPricing?.final_base_price;
  const cgstAmount = currentPricing?.cgst_amount ?? plan?.gst_breakdown?.cgst_amount;
  const sgstAmount = currentPricing?.sgst_amount ?? plan?.gst_breakdown?.sgst_amount;
  const total = currentPricing?.total_price_including_gst ?? plan?.gst_breakdown?.total_price_including_gst ?? (plan?.price ? Number(plan.price) : undefined);
  const hasDiscount = appliedCoupon != null && discountAmount != null && Number(discountAmount) > 0;

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.secondary}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={title || 'Confirm'}
        subtitle="Review plan details before payment"
        backgroundColor={Theme.colors.background.blue}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ─── Plan Details ─── */}
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

        {/* ─── Coupon Input ─── */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="ticket-outline" size={20} color={Theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary }}>
              Have a Coupon Code?
            </Text>
          </View>

          {appliedCoupon ? (
            // ── Coupon applied state ──
            <View style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#BBF7D0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#15803D' }}>
                      {appliedCoupon}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>
                      You saved {formatCurrencyAmount(discountAmount, currency)}
                    </Text>
                  </View>
                </View>
                <AnimatedPressableCard
                  onPress={handleRemoveCoupon}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </AnimatedPressableCard>
              </View>
            </View>
          ) : (
            // ── Coupon input state ──
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text.toUpperCase());
                    setCouponError(null);
                    setCouponValidation(null);
                  }}
                  placeholder="Enter coupon code"
                  placeholderTextColor={Theme.colors.text.tertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: couponError ? '#EF4444' : Theme.colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: '700',
                    color: Theme.colors.text.primary,
                    backgroundColor: '#fff',
                  }}
                />
                <AnimatedPressableCard
                  onPress={handleValidateCoupon}
                  disabled={validating || !couponCode.trim()}
                  style={{
                    backgroundColor: (validating || !couponCode.trim()) ? Theme.colors.border : Theme.colors.primary,
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {validating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                      Validate
                    </Text>
                  )}
                </AnimatedPressableCard>
              </View>

              {couponError ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, color: '#EF4444' }}>{couponError}</Text>
                </View>
              ) : null}

              {couponValidation?.valid ? (
                <View style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>
                      Coupon valid! Discount: {formatCurrencyAmount(couponValidation.pricing?.discount_amount, currency)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#16A34A', marginBottom: 8 }}>
                    New total: {formatCurrencyAmount(couponValidation.pricing?.total_price_including_gst, currency)}
                  </Text>
                  <AnimatedPressableCard
                    onPress={handleApplyCouponAndReinitiate}
                    disabled={reinitiating}
                    style={{
                      backgroundColor: reinitiating ? Theme.colors.border : '#16A34A',
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {reinitiating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="pricetag" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
                          Apply & Update Price
                        </Text>
                      </>
                    )}
                  </AnimatedPressableCard>
                </View>
              ) : null}
            </>
          )}
        </Card>

        {/* ─── GST Breakdown ─── */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary, marginBottom: 12 }}>
            Price Breakdown
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>Base Amount</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
              {formatCurrencyAmount(basePrice, currency)}
            </Text>
          </View>

          {hasDiscount ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#16A34A', fontWeight: '600' }}>
                <Ionicons name="pricetag" size={12} color="#16A34A" /> Discount ({appliedCoupon})
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#16A34A' }}>
                −{formatCurrencyAmount(discountAmount, currency)}
              </Text>
            </View>
          ) : null}

          {hasDiscount && finalBasePrice != null ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>Discounted Base</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary }}>
                {formatCurrencyAmount(finalBasePrice, currency)}
              </Text>
            </View>
          ) : null}

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

        <AnimatedPressableCard
          onPress={() => {
            navigation.navigate('PaymentWebView', {
              plan,
              paymentUrl: currentPaymentUrl,
              orderId: currentOrderId,
              subscriptionId: currentSubscriptionId,
            });
          }}
          disabled={!currentPaymentUrl || reinitiating}
          style={{
            backgroundColor: currentPaymentUrl && !reinitiating ? Theme.colors.primary : Theme.colors.border,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          {reinitiating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', marginRight: 8 }}>
                Proceed to Payment
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </AnimatedPressableCard>
      </ScrollView>
    </ScreenLayout>
  );
};
