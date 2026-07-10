import React, { useEffect, useRef } from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { RootState } from '@/features/owner/store';

type NavParams = { SubscriptionPlans: undefined };

export const TrialBanner: React.FC = () => {
  const navigation = useNavigation<NavigationProp<NavParams>>();
  const subscription = useSelector((state: RootState) => (state as any).rbac?.subscription);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  const show =
    subscription &&
    subscription.has_active_plan &&
    subscription.is_trial &&
    !subscription.is_free_plan;

  useEffect(() => {
    if (show) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true }).start();
    }
  }, [show, slideAnim]);

  if (!show) return null;

  const days = subscription.days_remaining ?? 0;
  const planName = subscription.plan_name ?? 'Trial';

  const urgency = days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'info';

  const config = {
    critical: {
      bg: '#FEF2F2',
      border: '#FCA5A5',
      iconBg: '#FEE2E2',
      icon: 'alert-circle' as const,
      iconColor: '#DC2626',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF',
      titleColor: '#7F1D1D',
      subtitleColor: '#991B1B',
      btnBg: '#DC2626',
      btnText: '#FFFFFF' },
    warning: {
      bg: '#FFF1F2',
      border: '#FECDD3',
      iconBg: '#FFE4E6',
      icon: 'time' as const,
      iconColor: '#E11D48',
      badgeBg: '#E11D48',
      badgeText: '#FFFFFF',
      titleColor: '#881337',
      subtitleColor: '#BE123C',
      btnBg: '#E11D48',
      btnText: '#FFFFFF' },
    info: {
      bg: '#FFF5F5',
      border: '#FECACA',
      iconBg: '#FEE2E2',
      icon: 'rocket' as const,
      iconColor: '#EF4444',
      badgeBg: '#EF4444',
      badgeText: '#FFFFFF',
      titleColor: '#7F1D1D',
      subtitleColor: '#B91C1C',
      btnBg: '#EF4444',
      btnText: '#FFFFFF' } }[urgency];

  const daysLabel = days === 0 ? 'Expires today' : days === 1 ? '1 day left' : `${days} days left`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={18} color={config.iconColor} />
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: config.titleColor }]}>
              {planName} Plan
            </Text>
            <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
              <Ionicons name="time-outline" size={10} color={config.badgeText} />
              <Text style={[styles.badgeText, { color: config.badgeText }]}>
                {daysLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: config.subtitleColor }]}>
            {days <= 3
              ? 'Upgrade now to avoid losing access'
              : 'Upgrade to unlock all features'}
          </Text>
        </View>

        <AnimatedPressableCard
          style={[styles.btn, { backgroundColor: config.btnBg }]}
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          <Text style={[styles.btnText, { color: config.btnText }]}>Upgrade</Text>
          <Ionicons name="arrow-forward" size={12} color={config.btnText} />
        </AnimatedPressableCard>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 99,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0 },
  textBlock: {
    flex: 1,
    gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20 },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2 },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexShrink: 0 },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2 } });
