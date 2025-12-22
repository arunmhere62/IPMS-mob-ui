import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchPlans, fetchSubscriptionStatus, subscribeToPlan } from '../../store/slices/subscriptionSlice';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { SubscriptionPlan } from '../../services/subscription/subscriptionService';
import { CONTENT_COLOR } from '@/constant';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SubscriptionPlansScreenProps {
  navigation: any;
}

export const SubscriptionPlansScreen: React.FC<SubscriptionPlansScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: plans, subscriptionStatus, loading } = useSelector((state: RootState) => state.subscription);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const plansResult = await dispatch(fetchPlans()).unwrap();
        console.log('📦 Plans fetched:', plansResult);
        console.log('📦 Plans length:', plansResult?.length);
        
        const statusResult = await dispatch(fetchSubscriptionStatus()).unwrap();
        console.log('📊 Status fetched:', statusResult);
      } catch (error) {
        console.error('❌ Error loading subscription data:', error);
      }
    };
    
    loadData();
  }, [dispatch]);
  
  // Debug log when plans change
  useEffect(() => {
  }, [plans, loading]);

  const handleSubscribe = async (planId: number) => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);
      const result = await dispatch(subscribeToPlan(planId)).unwrap();
      
      console.log('💳 Subscribe result:', result);
      
      const paymentUrl = (result as any)?.payment_url;
      const orderId = (result as any)?.order_id;
      const subscription = (result as any)?.subscription;
      const subscriptionId = subscription?.s_no ?? subscription?.id;

      if (paymentUrl) {
        // Go directly to CCAvenue (skip payment option screen)
        navigation.navigate('PaymentWebView', {
          paymentUrl,
          orderId,
          subscriptionId,
          paymentMethod: 'ccavenue',
        });
      } else {
        Alert.alert('Success', 'Subscription initiated successfully!');
      }
    } catch (error: any) {
      console.error('❌ Subscribe error:', error);
      Alert.alert('Error', error || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  const formatDuration = (days: number) => {
    if (days === 30) return 'Monthly';
    if (days === 90) return 'Quarterly';
    if (days === 180) return 'Half-Yearly';
    if (days === 365) return 'Yearly';
    return `${days} Days`;
  };

  const getPlanColor = (index: number) => {
    // Use app's blue color scheme
    return Theme.colors.primary;
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const isCurrentPlan = subscriptionStatus?.subscription?.plan_id === plan.s_no;
    const isSelected = selectedPlan === plan.s_no;
    const isPremium = plan.name.toLowerCase().includes('premium');
    const isStandard = plan.name.toLowerCase().includes('standard');
    const isBasic = plan.name.toLowerCase().includes('basic');
    const isYearly = plan.duration === 365;
    
    // Get tier icon - only Premium gets special treatment
    const getTierInfo = () => {
      if (isPremium) return { icon: 'diamond', color: '#FFD700', showIcon: true }; // Gold diamond for Premium only
      return { icon: '', color: '#fff', showIcon: false }; // No icon for others
    };
    
    const tierInfo = getTierInfo();
    
    // Calculate savings percentage for yearly plans
    const calculateSavings = () => {
      if (!isYearly) return null;
      
      // Find the corresponding monthly plan
      const planType = plan.name.toLowerCase().includes('basic') ? 'basic' : 
                      plan.name.toLowerCase().includes('standard') ? 'standard' : 
                      'premium';
      
      const monthlyPlan = plans?.find(p => 
        p.name.toLowerCase().includes(planType) && 
        p.name.toLowerCase().includes('monthly')
      );
      
      if (monthlyPlan) {
        const yearlyPrice = parseFloat(plan.price);
        const monthlyPrice = parseFloat(monthlyPlan.price);
        const monthlyYearlyCost = monthlyPrice * 12;
        const savings = ((monthlyYearlyCost - yearlyPrice) / monthlyYearlyCost) * 100;
        return Math.round(savings);
      }
      return 20; // Default 20% if can't calculate
    };
    
    const savingsPercentage = calculateSavings();

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
        {/* Header Section with Color */}
        <View style={{
          backgroundColor: isPremium ? '#000000' : '#1F2937',
          padding: 20,
          paddingBottom: 24,
        }}>
          {/* Badges Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {savingsPercentage && (
              <View style={{
                backgroundColor: Theme.colors.secondary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="pricetag" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                  SAVE {savingsPercentage}%
                </Text>
              </View>
            )}
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
            {tierInfo.showIcon && (
              <Ionicons name={tierInfo.icon as any} size={26} color={tierInfo.color} style={{ marginRight: 10 }} />
            )}
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', flex: 1 }}>
              {plan.name}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18, marginBottom: 16 }}>
            {plan.description}
          </Text>

          {/* Price */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff' }}>
                {formatPrice(plan.price)}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 8 }}>
                /{formatDuration(plan.duration)}
              </Text>
            </View>
            {savingsPercentage && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginTop: 8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}>
                <Ionicons name="trending-down" size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
                  Save ₹{(() => {
                    const planType = plan.name.toLowerCase().includes('basic') ? 'basic' : 
                                    plan.name.toLowerCase().includes('standard') ? 'standard' : 'premium';
                    const monthlyPlan = plans?.find(p => 
                      p.name.toLowerCase().includes(planType) && 
                      p.name.toLowerCase().includes('monthly')
                    );
                    if (monthlyPlan) {
                      const yearlyPrice = parseFloat(plan.price);
                      const monthlyYearlyCost = parseFloat(monthlyPlan.price) * 12;
                      return Math.round(monthlyYearlyCost - yearlyPrice).toLocaleString('en-IN');
                    }
                    return '0';
                  })()} per year
                </Text>
              </View>
            )}
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
          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 12 }}>
            What's Included:
          </Text>
          
          <View style={{ marginBottom: 20 }}>
            {plan.features && plan.features.slice(0, 3).map((feature, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={18} 
                  color={Theme.colors.secondary} 
                  style={{ marginRight: 10, marginTop: 2 }} 
                />
                <Text style={{ fontSize: 14, color: Theme.colors.text.primary, flex: 1, lineHeight: 20 }}>
                  {feature}
                </Text>
              </View>
            ))}
            
            {/* Limits */}
            {plan.max_pg_locations && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <Ionicons 
                  name="business" 
                  size={18} 
                  color={Theme.colors.secondary} 
                  style={{ marginRight: 10, marginTop: 2 }} 
                />
                <Text style={{ fontSize: 14, color: Theme.colors.text.primary, lineHeight: 20 }}>
                  Up to {plan.max_pg_locations} PG Locations
                </Text>
              </View>
            )}
            
            {plan.max_tenants && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <Ionicons 
                  name="people" 
                  size={18} 
                  color={Theme.colors.secondary} 
                  style={{ marginRight: 10, marginTop: 2 }} 
                />
                <Text style={{ fontSize: 14, color: Theme.colors.text.primary, lineHeight: 20 }}>
                  Up to {plan.max_tenants} Tenants
                </Text>
              </View>
            )}
          </View>

          {/* Subscribe Button */}
          {!isCurrentPlan && (
            <TouchableOpacity
              onPress={() => handleSubscribe(plan.s_no)}
              disabled={subscribing}
              style={{
                backgroundColor: isPremium ? '#000000' : '#1F2937',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {subscribing && selectedPlan === plan.s_no ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginRight: 8 }}>
                    Subscribe Now
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

      <ScrollView
        style={{ backgroundColor: CONTENT_COLOR }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status Card */}
        {subscriptionStatus && (
          <Card style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: subscriptionStatus.has_active_subscription 
                  ? Theme.withOpacity(Theme.colors.secondary, 0.1)
                  : Theme.withOpacity(Theme.colors.warning, 0.1),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons 
                  name={subscriptionStatus.has_active_subscription ? "checkmark-circle" : "alert-circle"} 
                  size={28} 
                  color={subscriptionStatus.has_active_subscription ? Theme.colors.secondary : Theme.colors.warning} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
                  {subscriptionStatus.has_active_subscription ? 'Active Subscription' : 'No Active Subscription'}
                </Text>
                {subscriptionStatus.subscription?.plan && (
                  <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
                    {subscriptionStatus.subscription.plan.name}
                  </Text>
                )}
              </View>
            </View>

            {subscriptionStatus.has_active_subscription && subscriptionStatus.days_remaining !== undefined && (
              <View style={{
                backgroundColor: Theme.colors.background.secondary,
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}>
                <Text style={{ fontSize: 13, color: Theme.colors.text.secondary }}>
                  {subscriptionStatus.days_remaining} days remaining
                </Text>
                <View style={{
                  height: 6,
                  backgroundColor: Theme.colors.border,
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${(subscriptionStatus.days_remaining / (subscriptionStatus.subscription?.plan?.duration || 30)) * 100}%`,
                    backgroundColor: Theme.colors.primary,
                  }} />
                </View>
              </View>
            )}

            {subscriptionStatus.is_trial && (
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
        {loading && (!plans || plans.length === 0) ? (
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

        {/* View History Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SubscriptionHistory')}
          style={{
            marginTop: 20,
            paddingVertical: 16,
            paddingHorizontal: 24,
            backgroundColor: Theme.colors.canvas,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: Theme.colors.border,
          }}
        >
          <Ionicons name="time-outline" size={20} color={Theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Theme.colors.primary }}>
            View Subscription History
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
};
