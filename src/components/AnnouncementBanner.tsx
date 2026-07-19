import React, { useEffect, useRef, useState } from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnnouncementBannerProps {
  title: string;
  message?: string | null;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ title, message }) => {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true }).start();
  }, [slideAnim]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true }).start(() => setDismissed(true));
  };

  const handleToggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(expandAnim, {
      toValue,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false }).start();
  };

  if (dismissed) return null;

  const messageHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60] });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <AnimatedPressableCard
        style={[styles.header, { paddingTop: 10 }]}
        onPress={message ? handleToggleExpand : undefined}
      >
        <View style={styles.iconBadge}>
          <Ionicons name="megaphone" size={12} color="#F59E0B" />
        </View>

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        <View style={styles.actions}>
          {message ? (
            <AnimatedPressableCard onPress={handleToggleExpand} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(255,255,255,0.7)"
              />
            </AnimatedPressableCard>
          ) : null}
          <AnimatedPressableCard onPress={handleDismiss} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
          </AnimatedPressableCard>
        </View>
      </AnimatedPressableCard>

      {message ? (
        <Animated.View style={[styles.messageWrapper, { maxHeight: messageHeight, overflow: 'hidden' }]}>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E3A5F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 8 },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0 },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2 },
  actionBtn: {
    padding: 3 },
  messageWrapper: {
    paddingHorizontal: 42,
    paddingBottom: 6 },
  message: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 17 } });
