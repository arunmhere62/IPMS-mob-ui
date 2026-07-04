import React, { useEffect, useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
  Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ForceUpdateScreenProps {
  currentVersion: string;
  minimumVersion: string;
  storeUrl?: string | null;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({
  currentVersion,
  minimumVersion,
  storeUrl }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleUpdate = async () => {
    const url = storeUrl?.trim();
    if (!url) {
      const fallbackUrl =
        Platform.OS === 'android'
          ? 'market://details?id=com.yourapp.id'
          : 'itms-apps://itunes.apple.com/app/id0000000000';

      try {
        await Linking.openURL(fallbackUrl);
      } catch {
        Alert.alert('Update Required', 'Please visit the app store to update the app.');
      }
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Update Required', 'Please visit the app store to update the app.');
      }
    } catch {
      Alert.alert('Update Required', 'Please visit the app store to update the app.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="arrow-up-circle" size={72} color="#2563EB" />
        </View>

        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.subtitle}>
          A newer version of the app is required to continue. Please update to get the latest features and security improvements.
        </Text>

        <View style={styles.versionBadgeRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionLabel}>Current</Text>
            <Text style={styles.versionValue}>v{currentVersion}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#9CA3AF" style={{ marginHorizontal: 12 }} />
          <View style={[styles.versionBadge, styles.versionBadgeRequired]}>
            <Text style={[styles.versionLabel, { color: '#1D4ED8' }]}>Required</Text>
            <Text style={[styles.versionValue, { color: '#1D4ED8' }]}>v{minimumVersion}</Text>
          </View>
        </View>

        <AnimatedPressableCard style={styles.updateButton} onPress={handleUpdate}>
          <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.updateButtonText}>Update Now</Text>
        </AnimatedPressableCard>

        <Text style={styles.note}>
          This update is mandatory to ensure security and compatibility.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32 },
  iconWrapper: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.2 },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28 },
  versionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32 },
  versionBadge: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB' },
  versionBadgeRequired: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE' },
  versionLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2 },
  versionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937' },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6 },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3 },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18 } });
