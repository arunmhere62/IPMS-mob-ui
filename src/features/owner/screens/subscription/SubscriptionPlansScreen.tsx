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
import { showSuccessAlert } from '@/utils/errorHandler';
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
    } catch (error: any) {
      console.error('❌ Subscribe error:', error);
      const maybeData = (error as any)?.data;
      const message =
        (maybeData && (maybeData.message || maybeData.error)) ||
        (error as any)?.message ||
        'Failed to subscribe';
      Alert.alert('Error', message);
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
    } catch (error: any) {
      console.error('❌ Upgrade error:', error);
      const maybeData = (error as any)?.data;
      const message =
        (maybeData && (maybeData.message || maybeData.error)) ||
        (error as any)?.message ||
        'Failed to upgrade';
      Alert.alert('Error', message);
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
      if (isFreeByPrice)       return { icon: 'gift',     color: '#06B6D4' }; // free  – cyan gift
      if (plan.duration === 365) return { icon: 'trophy',   color: '#F59E0B' }; // 12 mo – gold trophy
      if (plan.duration === 180) return { icon: 'star',     color: '#A855F7' }; // 6 mo  – purple star
      if (plan.duration === 90)  return { icon: 'flash',    color: '#3B82F6' }; // 3 mo  – blue flash
      if (plan.duration === 30)  return { icon: 'flame',    color: '#F97316' }; // 1 mo  – orange flame
      return                            { icon: 'pricetag', color: '#6B7280' }; // fallback
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

    return (
      <TouchableOpacity
        key={plan.s_no}
        onPress={() => setSelectedPlan(plan.s_no)}
        activeOpacity={0.9}
        style={{
          marginBottom: 20,
          borderRadius: 16,
          backgroundColor: '#fff',
          borderWidth: isSelected ? 3 : (isPremium ? 2 : 1),
          borderColor: isSelected ? Theme.colors.primary : (isPremium ? '#FFD700' : Theme.colors.border),
          overflow: 'hidden',
          elevation: isSelected ? 8 : (isPremium ? 5 : 3),
          shadowColor: isPremium ? '#FFD700' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.2 : (isPremium ? 0.3 : 0.1),
          shadowRadius: isSelected ? 8 : (isPremium ? 6 : 4),
        }}
      >
        {/* Selection indicator – top-right */}
        <View style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          width: 24, height: 24, borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? Theme.colors.primary : 'rgba(255,255,255,0.4)',
          backgroundColor: isSelected ? Theme.colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>

        {/* Header Section with Color */}
        <View style={{
          backgroundColor: isPremium ? '#000000' : '#1F2937',
          padding: 20,
          paddingBottom: 24,
        }}>
          <View style={{
            marginHorizontal: -20,
            backgroundColor: Theme.colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 0,
            alignItems: 'center',
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.8, textAlign: 'center' }}>
              {isYearly
                ? '12 MONTHS PLAN'
                : isHalfYearly
                  ? '6 MONTHS PLAN'
                  : plan.duration === 90
                    ? '3 MONTHS PLAN'
                    : plan.duration === 30
                      ? '1 MONTH PLAN'
                      : `${formatDuration(plan.duration).toUpperCase()} PLAN`}
            </Text>
          </View>
          {/* Badges Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {plan.is_trial && (
                <View style={{
                  backgroundColor: Theme.colors.info,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="flash" size={12} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>
                    TRIAL
                  </Text>
                </View>
              )}
              {plan.is_free && (
                <View style={{
                  backgroundColor: Theme.colors.secondary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name="gift" size={12} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>
                    FREE
                  </Text>
                </View>
              )}
              
            </View>
            {isCurrentPlan && (
              <View style={{
                backgroundColor: Theme.colors.secondary,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                marginLeft: 'auto',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>
                  ACTIVE
                </Text>
              </View>
            )}
          </View>

          {/* Plan Name with Tier Icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: `${tierInfo.color}25`,
              borderWidth: 1, borderColor: `${tierInfo.color}60`,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name={tierInfo.icon as any} size={24} color={tierInfo.color} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', flex: 1 }}>
              {plan.name}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18, marginBottom: 16 }}>
            {plan.description}
          </Text>

          {/* Price */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              {isFreePlan ? (
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '800',
                      color: 'rgba(255,255,255,0.75)',
                      textDecorationLine: 'line-through',
                      marginRight: 10,
                    }}
                  >
                    {formatPrice(plan.price, plan.currency)}
                  </Text>
                  <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff' }}>
                    Free
                  </Text>
                </View>
              ) : (
                <View>
                  {plan.gst_breakdown ? (() => {
                    const gstAmount = plan.gst_breakdown.cgst_amount + plan.gst_breakdown.sgst_amount
                    const basePrice = plan.gst_breakdown.total_price_including_gst - gstAmount
                    const gstRate = plan.gst_breakdown.cgst_rate + plan.gst_breakdown.sgst_rate
                    return (
                      <View>
                        <Text style={{ fontSize: 52, fontWeight: '900', color: '#fff' }}>
                          {formatPrice(basePrice, plan.currency)}
                        </Text>
                        <View style={{ marginTop: 4, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>+ {gstRate}% GST:</Text>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: '700' }}>
                              {formatPrice(gstAmount, plan.currency)}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 4 }} />
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>You pay:</Text>
                            <Text style={{ fontSize: 14, color: '#fff', fontWeight: '900' }}>
                              {formatPrice(plan.gst_breakdown.total_price_including_gst, plan.currency)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                  })() : (
                    <Text style={{ fontSize: 52, fontWeight: '900', color: '#fff' }}>
                      {formatPrice(plan.price, plan.currency)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Body Section - White Background */}
        <View style={{ padding: 20 }}>
          {/* Duration Info */}
          <View style={{
            backgroundColor: Theme.colors.background.blueLight,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="time-outline" size={18} color={Theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, color: Theme.colors.text.primary, fontWeight: '600' }}>
              {plan.duration} days full access
            </Text>
          </View>

          {/* Features */}
          {isFullyUnlimited && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0FDF4',
              borderWidth: 1.5,
              borderColor: '#22C55E',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
            }}>
              <Ionicons name="infinite" size={18} color="#16A34A" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#15803D' }}>Everything Unlimited</Text>
                <Text style={{ fontSize: 11, color: '#166534', opacity: 0.8, marginTop: 1 }}>No caps on any resource</Text>
              </View>
              <Ionicons name="star" size={14} color="#22C55E" />
            </View>
          )}

          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 12 }}>
            What's Included:
          </Text>
          
          <View style={{ marginBottom: 20 }}>
            {getIncludedItems(plan).map((feature: string, idx: number) => {
              const isUnlimitedFeature = feature.startsWith('Unlimited');
              return (
                <View key={`${plan.s_no}-${idx}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Ionicons
                    name={isUnlimitedFeature ? 'infinite' : 'checkmark-circle'}
                    size={18}
                    color={isUnlimitedFeature ? '#16A34A' : Theme.colors.secondary}
                    style={{ marginRight: 10, marginTop: 2 }}
                  />
                  <Text style={{ fontSize: 14, color: isUnlimitedFeature ? '#15803D' : Theme.colors.text.primary, flex: 1, lineHeight: 20, fontWeight: isUnlimitedFeature ? '600' : '400' }}>
                    {feature}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* GST Breakdown */}
          {!isFreeByPrice && plan.gst_breakdown && (() => {
            const isGstCollapsed = collapsedGst[plan.s_no] ?? true;
            return (
              <View style={{
                backgroundColor: Theme.colors.background.blueLight,
                borderRadius: 10,
                marginBottom: 16,
                overflow: 'hidden',
              }}>
                {/* Collapsible header */}
                <TouchableOpacity
                  onPress={() => setCollapsedGst(prev => ({ ...prev, [plan.s_no]: !isGstCollapsed }))}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                >
                  <Ionicons name="receipt-outline" size={14} color={Theme.colors.text.secondary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text.secondary, letterSpacing: 0.5, flex: 1 }}>GST INCLUDED IN PRICE</Text>
                  <Ionicons name={isGstCollapsed ? 'chevron-down' : 'chevron-up'} size={14} color={Theme.colors.text.secondary} />
                </TouchableOpacity>

                {!isGstCollapsed && (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>CGST ({plan.gst_breakdown.cgst_rate}%) incl.</Text>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.primary, fontWeight: '500' }}>{formatPrice(plan.gst_breakdown.cgst_amount, plan.currency)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>SGST ({plan.gst_breakdown.sgst_rate}%) incl.</Text>
                      <Text style={{ fontSize: 12, color: Theme.colors.text.primary, fontWeight: '500' }}>{formatPrice(plan.gst_breakdown.sgst_amount, plan.currency)}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: Theme.colors.border, marginBottom: 8 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text.primary }}>Total (GST incl.)</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary }}>{formatPrice(plan.price, plan.currency)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Subscribe Button */}
          {!isCurrentPlan && (
            <TouchableOpacity
              onPress={() => {
                if (isExpiredFreePlanCard) {
                  return;
                }
                if (hasActiveSubscription) {
                  handleUpgrade(plan.s_no);
                  return;
                }
                handleSubscribe(plan.s_no);
              }}
              disabled={subscribing || upgrading || isExpiredFreePlanCard}
              style={{
                backgroundColor: isExpiredFreePlanCard
                  ? Theme.colors.border
                  : (isPremium ? '#000000' : '#1F2937'),
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {(subscribing || upgrading) && selectedPlan === plan.s_no ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginRight: 8 }}>
                    {isExpiredFreePlanCard
                      ? 'Free Plan Ended'
                      : (hasActiveSubscription ? 'Upgrade Now' : 'Subscribe Now')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
                backgroundColor: Theme.withOpacity(Theme.colors.info, 0.1),
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="information-circle" size={20} color={Theme.colors.info} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: Theme.colors.info, flex: 1 }}>
                  You're currently on a trial period
                </Text>
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
