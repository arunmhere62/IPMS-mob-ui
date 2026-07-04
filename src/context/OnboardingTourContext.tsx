import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, Modal, Animated, Easing, StyleSheet } from 'react-native';

export type TourStep =
  | 'tap_add_room'      // On Rooms screen: tap FAB + to add a room
  | 'tap_room'          // On Rooms screen: tap a room to open details
  | 'tap_add_bed'       // On RoomDetails screen: tap + to add bed
  | 'tap_room_for_tenant' // On Rooms screen: tap a room to open details (tenant tour)
  | 'tap_add_tenant'    // On RoomDetails screen: tap Add Tenant on an available bed
  | 'tap_tenant'        // On Tenants screen: tap a tenant card to open details
  | 'tap_add_rent'      // On TenantDetails screen: tap Add Rent button
  | null;               // No active tour

interface OnboardingTourContextValue {
  tourStep: TourStep;
  startRoomTour: () => void;
  startBedTour: () => void;
  startTenantTour: () => void;
  startRentTour: () => void;
  advanceTour: () => void;
  endTour: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue>({
  tourStep: null,
  startRoomTour: () => {},
  startBedTour: () => {},
  startTenantTour: () => {},
  startRentTour: () => {},
  advanceTour: () => {},
  endTour: () => {} });

const CelebrationModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      confettiAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(confettiAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={celebStyles.overlay}>
        <Animated.View style={[celebStyles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={celebStyles.emoji}>🎉</Text>
          <Text style={celebStyles.title}>Congratulations!</Text>
          <Text style={celebStyles.subtitle}>You've completed the setup!</Text>
          <Text style={celebStyles.message}>
            Your PG is now fully configured with rooms, beds, tenants, and rent tracking. You're all set to manage your property like a pro!
          </Text>
          <Animated.View style={{ opacity: confettiAnim, flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
            <Text style={{ fontSize: 28 }}>🛏️</Text>
            <Text style={{ fontSize: 28 }}>👤</Text>
            <Text style={{ fontSize: 28 }}>💰</Text>
          </Animated.View>
          <AnimatedPressableCard onPress={onClose} style={celebStyles.button}>
            <Text style={celebStyles.buttonText}>Let's Go! 🚀</Text>
          </AnimatedPressableCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12 },
  emoji: {
    fontSize: 64,
    marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 12,
    textAlign: 'center' },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20 },
  button: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff' } });

export const OnboardingTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tourStep, setTourStep] = useState<TourStep>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const startRoomTour = useCallback(() => {
    setTourStep('tap_add_room');
  }, []);

  const startBedTour = useCallback(() => {
    setTourStep('tap_room');
  }, []);

  const startTenantTour = useCallback(() => {
    setTourStep('tap_room_for_tenant');
  }, []);

  const startRentTour = useCallback(() => {
    setTourStep('tap_tenant');
  }, []);

  const advanceTour = useCallback(() => {
    setTourStep((prev) => {
      if (prev === 'tap_add_room') return 'tap_room';        // room created → tap room to open
      if (prev === 'tap_room') return 'tap_add_bed';         // room opened → add bed
      if (prev === 'tap_add_bed') return 'tap_add_tenant';   // bed created → add tenant
      if (prev === 'tap_room_for_tenant') return 'tap_add_tenant';
      if (prev === 'tap_add_tenant') return 'tap_add_rent';  // tenant created → add rent
      if (prev === 'tap_tenant') return 'tap_add_rent';
      return null;
    });
  }, []);

  const endTour = useCallback(() => {
    setTourStep(null);
    setShowCelebration(true);
  }, []);

  return (
    <OnboardingTourContext.Provider value={{ tourStep, startRoomTour, startBedTour, startTenantTour, startRentTour, advanceTour, endTour }}>
      {children}
      <CelebrationModal visible={showCelebration} onClose={() => setShowCelebration(false)} />
    </OnboardingTourContext.Provider>
  );
};

export const useOnboardingTour = () => useContext(OnboardingTourContext);
