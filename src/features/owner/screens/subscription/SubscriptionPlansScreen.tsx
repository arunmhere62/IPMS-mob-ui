import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Theme } from '@/theme';
import { CONTENT_COLOR } from '@/constant';
import { showSuccessAlert, showErrorAlert } from '@/utils/errorHandler';
import {
  SubscriptionPlan,
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
  useSubscribeToPlanMutation,
  useUpgradePlanMutation,
} from '@/features/owner/api/subscriptionApi';

interface SubscriptionPlansScreenProps {
  navigation: any;
}

export const SubscriptionPlansScreen: React.FC<SubscriptionPlansScreenProps> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedGst, setCollapsedGst] = useState<Record<number, boolean>>({});

  const {
    data: plansResponse,
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetPlansQuery();

  const {
    data: subscriptionStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGetSubscriptionStatusQuery();

  const [subscribeToPlan, { isLoading: subscribing }] = useSubscribeToPlanMutation();
  const [upgradePlan, { isLoading: upgrading }] = useUpgradePlanMutation();

  const plans = plansResponse?.data || [];

  const ss = subscriptionStatus;

  const lastSubscription = ss?.last_subscription;
  const lastPlan: any = (lastSubscription as any)?.plan ?? (lastSubscription as any)?.subscription_plans;
  const isFreePlanExpired =
    Boolean(ss) &&
    !ss?.has_active_subscription &&
    Boolean(lastPlan?.is_free) &&
    (lastSubscription as any)?.status === 'EXPIRED';

  useEffect(() => {
    const err: any = plansError || statusError;
    if (!err) {
      setFetchError(null);
      return;
    }

    const maybeData = (err as any)?.data;
    const message =
      (maybeData && (maybeData.message || maybeData.error)) ||
      (err as any)?.error ||
      'Unable to load subscription plans. Please try again.';
    setFetchError(message);
  }, [plansError, statusError]);
  
  useEffect(() => {
  }, [plans, plansLoading, statusLoading]);

  useFocusEffect(
    useCallback(() => {
      refetchPlans();
      refetchStatus();
    }, [])
  );

  const handleSubscribe = async (planId: number) => {
    try {
      setSelectedPlan(planId);
      const result = await subscribeToPlan({ planId }).unwrap();
      
      console.log('💳 Subscribe result:', result);
      
      const payload: any = (result as any)?.data ?? result;
      const paymentUrl =
        payload?.payment_url ??
        payload?.data?.payment_url ??
        payload?.data?.data?.payment_url;
      const orderId =
        payload?.order_id ??
        payload?.data?.order_id ??
        payload?.data?.data?.order_id;
      const subscription =
        payload?.subscription ??
        payload?.data?.subscription ??
        payload?.data?.data?.subscription;
      const subscriptionId = subscription?.s_no ?? subscription?.id;

      const responsePlan =
        payload?.plan ??
        payload?.data?.plan ??
        payload?.data?.data?.plan;
      const responsePricing =
        payload?.pricing ??
        payload?.data?.pricing ??
        payload?.data?.data?.pricing;

      if (paymentUrl) {
        navigation.navigate('SubscriptionConfirm', {
          title: 'Confirm Subscription',
          paymentUrl,
          orderId,
          subscriptionId,
          plan: responsePlan,
          pricing: responsePricing,
        });
      } else {
        showSuccessAlert('Subscription initiated successfully!');
      }
    } catch (error: unknown) {
      console.error('❌ Subscribe error:', error);
      showErrorAlert(error, 'Subscribe Error');
    }
  };

  const handleUpgrade = async (planId: number) => {
    try {
      setSelectedPlan(planId);
      const result = await upgradePlan({ planId }).unwrap();

      console.log('💳 Upgrade result:', result);

      const payload: any = (result as any)?.data ?? result;
      const paymentUrl =
        payload?.payment_url ??
        payload?.data?.payment_url ??
        payload?.data?.data?.payment_url;
      const orderId =
        payload?.order_id ??
        payload?.data?.order_id ??
        payload?.data?.data?.order_id;
      const subscription =
        payload?.subscription ??
        payload?.data?.subscription ??
        payload?.data?.data?.subscription;
      const subscriptionId = subscription?.s_no ?? subscription?.id;

      const responsePlan =
        payload?.plan ??
        payload?.data?.plan ??
        payload?.data?.data?.plan;
      const responsePricing =
        payload?.pricing ??
        payload?.data?.pricing ??
        payload?.data?.data?.pricing;

      if (paymentUrl) {
        navigation.navigate('SubscriptionConfirm', {
          title: 'Confirm Upgrade',
          paymentUrl,
          orderId,
          subscriptionId,
          plan: responsePlan,
          pricing: responsePricing,
        });
      } else {
        showSuccessAlert('Upgrade initiated successfully!');
      }
    } catch (error: unknown) {
      console.error('❌ Upgrade error:', error);
      showErrorAlert(error, 'Upgrade Error');
    }
  };

  const formatPrice = (price: string | number, currency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      return 'Free';
    }

    if (currency && currency.toUpperCase() !== 'INR') {
      return `${currency.toUpperCase()} ${numPrice.toLocaleString()}`;
    }

    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  const getIncludedItems = (plan: SubscriptionPlan): string[] => {
    const included: string[] = Array.isArray(plan.features) ? [...plan.features] : [];

    const limitLine = (label: string, value: number | null | undefined) => {
      if (value === undefined) return;
      if (value === null) {
        included.push(`Unlimited ${label}`);
        return;
      }
      included.push(`Up to ${value} ${label}`);
    };

    const limits = plan.limits;

    limitLine('PG Locations', limits?.max_pg_locations ?? plan.max_pg_locations);
    limitLine('Tenants (across all PGs)', limits?.max_tenants ?? plan.max_tenants);
    limitLine('Rooms (across all PGs)', limits?.max_rooms ?? plan.max_rooms);
    limitLine('Beds (across all PGs)', limits?.max_beds ?? plan.max_beds);
    limitLine('Employees', limits?.max_employees ?? plan.max_employees);
    limitLine('Users', limits?.max_users ?? plan.max_users);
    limitLine('Invoices / Month', limits?.max_invoices_per_month ?? plan.max_invoices_per_month);
    limitLine('SMS / Month', limits?.max_sms_per_month ?? plan.max_sms_per_month);
    limitLine('WhatsApp / Month', limits?.max_whatsapp_per_month ?? plan.max_whatsapp_per_month);

    return included;
  };

  const formatDuration = (days: number) => {
    if (days === 30) return 'Monthly';
    if (days === 90) return 'Quarterly';
    if (days === 180) return 'Half-Yearly';
    if (days === 365) return 'Yearly';
    return `${days} Days`;
  };

  const renderPlanCard = (plan: SubscriptionPlan, _index: number) => {
    const isCurrentPlan = ss?.subscription?.plan_id === plan.s_no;
    const hasActiveSubscription = Boolean(ss?.has_active_subscription);
    const isSelected = selectedPlan === plan.s_no;
    const isPremium = plan.name.toLowerCase().includes('premium');
    void plan.name.toLowerCase().includes('standard');
    void plan.name.toLowerCase().includes('basic');
    const isYearly = plan.duration === 365;
    const isHalfYearly = plan.duration === 180;
    
    const isFreeByPrice = (() => { const n = parseFloat(String(plan.price)); return !Number.isFinite(n) || n <= 0; })();

    const getTierInfo = () => {
      if (isFreeByPrice)         return { icon: 'gift',      color: '#134E4A' }; // free   – dark teal
      if (plan.duration === 365) return { icon: 'trophy',    color: '#14532D' }; // 12 mo  – dark forest green
      if (plan.duration === 180) return { icon: 'star',      color: '#9A3412' }; // 6 mo   – dark burnt orange
      if (plan.duration === 90)  return { icon: 'flash',     color: '#1E3A8A' }; // 3 mo   – dark navy blue
      if (plan.duration === 30)  return { icon: 'flame',     color: '#7F1D1D' }; // 1 mo   – dark crimson
      return                             { icon: 'pricetag', color: '#1E293B' }; // fallback
    };
    
    const tierInfo = getTierInfo();
    
    const isFreePlan = Boolean(plan.is_free);
    const isExpiredFreePlanCard = isFreePlan && isFreePlanExpired;

    const isFullyUnlimited = (() => {
      const limits = plan.limits;
      const fields = [
        limits?.max_pg_locations ?? plan.max_pg_locations,
        limits?.max_tenants      ?? plan.max_tenants,
        limits?.max_rooms        ?? plan.max_rooms,
        limits?.max_beds         ?? plan.max_beds,
        limits?.max_employees    ?? plan.max_employees,
        limits?.max_users        ?? plan.max_users,
        limits?.max_invoices_per_month  ?? plan.max_invoices_per_month,
        limits?.max_sms_per_month       ?? plan.max_sms_per_month,
        limits?.max_whatsapp_per_month  ?? plan.max_whatsapp_per_month,
      ].filter(v => v !== undefined);
      return fields.length > 0 && fields.every(v => v === null);
    })();

    const accentColor = tierInfo.color;
    const durationLabel = isYearly ? '12 Months' : isHalfYearly ? '6 Months' : plan.duration === 90 ? '3 Months' : plan.duration === 30 ? '1 Month' : formatDuration(plan.duration);
    const priceSectionBg = '#0F172A';

    return (
      <TouchableOpacity
        key={plan.s_no}
        onPress={() => setSelectedPlan(plan.s_no)}
        activeOpacity={0.93}
        style={{
          marginBottom: 24,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: isSelected ? accentColor : isCurrentPlan ? '#10B981' : 'transparent',
          elevation: isSelected ? 12 : 5,
          shadowColor: isSelected ? accentColor : '#000',
          shadowOffset: { width: 0, height: isSelected ? 6 : 3 },
          shadowOpacity: isSelected ? 0.3 : 0.12,
          shadowRadius: isSelected ? 14 : 8,
        }}
      >
        {/* ── TOP COLOR BAR with plan label ── */}
        <View style={{ backgroundColor: accentColor, paddingVertical: 11, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name={tierInfo.icon as any} size={16} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
              {durationLabel.toUpperCase()} PLAN
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {plan.is_trial && (
              <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>TRIAL</Text>
              </View>
            )}
            {plan.is_free && (
              <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>FREE</Text>
              </View>
            )}
            {isCurrentPlan && (
              <View style={{ backgroundColor: '#10B981', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="checkmark-circle" size={10} color="#fff" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>ACTIVE</Text>
              </View>
            )}
            {/* Selection dot */}
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: isSelected ? '#fff' : 'rgba(255,255,255,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {isSelected && <Ionicons name="checkmark" size={12} color={accentColor} />}
            </View>
          </View>
        </View>

        {/* ── PRICE SECTION (dark) ── */}
        <View style={{ backgroundColor: priceSectionBg, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
          {/* Plan name + icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                {plan.name}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginTop: 3 }}>
                {plan.description}
              </Text>
            </View>
            <View style={{
              width: 52, height: 52, borderRadius: 18,
              backgroundColor: `${accentColor}22`,
              borderWidth: 1.5, borderColor: `${accentColor}50`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={tierInfo.icon as any} size={26} color={accentColor} />
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />

          {/* Price row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 0.8, marginBottom: 2 }}>
                {isFreePlan ? 'PRICE' : 'BASE PRICE'}
              </Text>
              {isFreePlan ? (
                <Text style={{ fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>Free</Text>
              ) : plan.gst_breakdown ? (() => {
                const gstAmount = plan.gst_breakdown.cgst_amount + plan.gst_breakdown.sgst_amount;
                const basePrice = plan.gst_breakdown.total_price_including_gst - gstAmount;
                return (
                  <View>
                    <Text style={{ fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>
                      {formatPrice(basePrice, plan.currency)}
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      + {plan.gst_breakdown.cgst_rate + plan.gst_breakdown.sgst_rate}% GST
                      {'  '}
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>
                        = {formatPrice(plan.gst_breakdown.total_price_including_gst, plan.currency)}
                      </Text>
                    </Text>
                  </View>
                );
              })() : (
                <Text style={{ fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>
                  {formatPrice(plan.price, plan.currency)}
                </Text>
              )}
            </View>
            {/* Duration badge */}
            <View style={{
              backgroundColor: `${accentColor}22`,
              borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
              alignItems: 'center',
              borderWidth: 1.5, borderColor: `${accentColor}45`,
            }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: accentColor, letterSpacing: -0.5 }}>{plan.duration}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: accentColor, opacity: 0.8, letterSpacing: 0.5 }}>DAYS</Text>
            </View>
          </View>
        </View>

        {/* ── WHAT'S INCLUDED ── */}
        <View style={{ backgroundColor: '#FAFBFF' }}>
          {/* Section label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 7 }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: accentColor }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#1F2937', letterSpacing: 0.6 }}>WHAT'S INCLUDED</Text>
            {isFullyUnlimited && (
              <View style={{ marginLeft: 'auto', backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="infinite" size={10} color="#16A34A" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A' }}>ALL UNLIMITED</Text>
              </View>
            )}
          </View>
          {/* Feature list rows */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
            {getIncludedItems(plan).map((feature: string, idx: number) => {
              const isUnlimitedFeature = feature.startsWith('Unlimited');
              return (
                <View key={`${plan.s_no}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: isUnlimitedFeature ? '#DCFCE7' : `${accentColor}15`,
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Ionicons
                      name={isUnlimitedFeature ? 'infinite' : 'checkmark'}
                      size={12}
                      color={isUnlimitedFeature ? '#16A34A' : accentColor}
                    />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: isUnlimitedFeature ? '700' : '500', color: isUnlimitedFeature ? '#15803D' : '#374151', flex: 1 }}>
                    {feature}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── GST BREAKDOWN ── */}
        {!isFreeByPrice && plan.gst_breakdown && (() => {
          // eslint-disable-next-line no-shadow
          const isGstCollapsed = collapsedGst[plan.s_no] ?? true;
          return (
            <View style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFBFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <View style={{
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <TouchableOpacity
                  onPress={() => setCollapsedGst(prev => ({ ...prev, [plan.s_no]: !isGstCollapsed }))}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F9FAFB' }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: `${accentColor}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name="receipt-outline" size={14} color={accentColor} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.4, flex: 1 }}>GST BREAKDOWN</Text>
                  <View style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 }}>
                    <Ionicons name={isGstCollapsed ? 'chevron-down' : 'chevron-up'} size={14} color="#6B7280" />
                  </View>
                </TouchableOpacity>
                {!isGstCollapsed && (() => {
                  const gstTotal = plan.gst_breakdown.cgst_amount + plan.gst_breakdown.sgst_amount;
                  const basePrice = plan.gst_breakdown.total_price_including_gst - gstTotal;
                  return (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>Base Price</Text>
                        <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{formatPrice(basePrice, plan.currency)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>CGST ({plan.gst_breakdown.cgst_rate}%)</Text>
                        <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{formatPrice(plan.gst_breakdown.cgst_amount, plan.currency)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>SGST ({plan.gst_breakdown.sgst_rate}%)</Text>
                        <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{formatPrice(plan.gst_breakdown.sgst_amount, plan.currency)}</Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Total (incl. GST)</Text>
                        <View style={{ backgroundColor: `${accentColor}15`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: accentColor }}>{formatPrice(plan.gst_breakdown.total_price_including_gst, plan.currency)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          );
        })()}

        {/* ── CTA BUTTON ── */}
        {isCurrentPlan ? (
          <View style={{ backgroundColor: '#F0FDF4', paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#BBF7D0' }}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>Your Current Plan</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (isExpiredFreePlanCard) return;
              if (hasActiveSubscription) { handleUpgrade(plan.s_no); return; }
              handleSubscribe(plan.s_no);
            }}
            disabled={subscribing || upgrading || isExpiredFreePlanCard}
            style={{
              backgroundColor: isExpiredFreePlanCard ? '#9CA3AF' : '#0F172A',
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {(subscribing || upgrading) && selectedPlan === plan.s_no ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>
                  {isExpiredFreePlanCard ? 'Free Plan Ended' : hasActiveSubscription ? 'Upgrade Now' : 'Get Started'}
                </Text>
                {!isExpiredFreePlanCard && <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.85)" />}
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };


  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title="Subscription Plans"
        subtitle="Choose the perfect plan for your business"
        backgroundColor={Theme.colors.background.blue}
      />

      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        <ErrorBanner
          error={fetchError}
          title="Error Loading Subscription Plans"
          onRetry={() => {
            refetchPlans();
            refetchStatus();
          }}
        />

        <ScrollView
          style={{ backgroundColor: CONTENT_COLOR }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await Promise.all([refetchPlans(), refetchStatus()]);
                setRefreshing(false);
              }}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        >
        {/* Current Status Card */}
        {ss && (
          <Card style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: ss.has_active_subscription 
                  ? Theme.withOpacity(Theme.colors.secondary, 0.1)
                  : Theme.withOpacity(Theme.colors.warning, 0.1),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons 
                  name={ss.has_active_subscription ? "checkmark-circle" : "alert-circle"} 
                  size={28} 
                  color={ss.has_active_subscription ? Theme.colors.secondary : Theme.colors.warning} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
                  {ss.has_active_subscription ? 'Active Subscription' : 'No Active Subscription'}
                </Text>
                {ss.subscription?.plan && (
                  <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
                    {ss.subscription.plan.name}
                  </Text>
                )}
              </View>
            </View>

            {ss.has_active_subscription && ss.days_remaining !== undefined && (
              <View style={{
                backgroundColor: Theme.colors.background.secondary,
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}>
                <Text style={{ fontSize: 14, color: Theme.colors.text.primary, fontWeight: '600' }}>
                  {ss.days_remaining} days remaining
                </Text>

                <View style={{
                  height: 6,
                  backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.15),
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginTop: 8,
                }}>
                  <View style={{
                    height: '100%',
                    width: `${(ss.days_remaining / (ss.subscription?.plan?.duration || 30)) * 100}%`,
                    backgroundColor: Theme.colors.primary,
                  }} />
                </View>
              </View>
            )}

            {isFreePlanExpired && (
              <View
                style={{
                  backgroundColor: Theme.withOpacity(Theme.colors.warning, 0.12),
                  padding: 12,
                  borderRadius: 10,
                  marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 13, color: Theme.colors.text.primary, fontWeight: '700', marginBottom: 4 }}>
                  Your free plan has ended
                </Text>
                <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, lineHeight: 18 }}>
                  Please subscribe to a paid plan to continue using create features.
                </Text>
              </View>
            )}

            {ss.is_trial && (
              <View style={{
                backgroundColor: '#EF4444',
                padding: 14,
                borderRadius: 10,
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16 }}>🚀</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 }}>
                    You're on a Trial Plan
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                    {ss.days_remaining !== undefined && ss.days_remaining <= 3
                      ? 'Upgrade now to avoid losing access'
                      : 'Subscribe below to unlock full access'}
                  </Text>
                </View>
                {ss.days_remaining !== undefined && ss.days_remaining <= 7 && (
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                      {ss.days_remaining === 0 ? 'Expires today' : `${ss.days_remaining}d left`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Plans */}
        {((plansLoading || statusLoading) && (!plans || plans.length === 0)) ? (
          <View style={{ paddingVertical: 60, alignItems: 'center',  }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
              Loading plans...
            </Text>
          </View>
        ) : !plans || plans.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', }}>
            <Ionicons name="pricetags-outline" size={64} color={Theme.colors.text.tertiary} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: Theme.colors.text.primary, marginTop: 16 }}>
              No Plans Available
            </Text>
            <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
              Please check back later
            </Text>
          </View>
        ) : (
          <>
            {/* Showing X of Y indicator */}
            <View style={{
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View style={{
                backgroundColor: Theme.colors.text.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'} Available
                </Text>
              </View>
            </View>

            {plans.map((plan, index) => renderPlanCard(plan, index))}
          </>
        )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
