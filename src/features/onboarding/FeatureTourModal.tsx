import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Theme } from '@/theme';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface FeatureTourStep {
  title: string;
  description: string;
  icon: IoniconName;
}

export const WELCOME_TOUR_STEPS: FeatureTourStep[] = [
  {
    title: 'Your dashboard',
    description: 'See occupancy, rent follow-ups, recent activity, and key performance at a glance.',
    icon: 'grid-outline',
  },
  {
    title: 'Add your PG locations',
    description: 'Create each property and switch between locations from the dashboard header.',
    icon: 'business-outline',
  },
  {
    title: 'Set up rooms and beds',
    description: 'Add rooms, configure bed capacity, and set monthly rent for each bed.',
    icon: 'bed-outline',
  },
  {
    title: 'Bring in your tenants',
    description: 'Assign tenants to available beds and keep their rent and move-in details organized.',
    icon: 'people-outline',
  },
  {
    title: 'Track payments',
    description: 'Record rent collections and review tenant-submitted payment proofs from Payment Verification.',
    icon: 'wallet-outline',
  },
];

interface FeatureTourModalProps {
  visible: boolean;
  title: string;
  description?: string | null;
  steps: FeatureTourStep[];
  currentStep: number;
  isStarted: boolean;
  isSaving: boolean;
  onStart: () => void;
  onNext: () => void;
  onBack: () => void;
  onDismiss: () => void;
}

export const FeatureTourModal: React.FC<FeatureTourModalProps> = ({
  visible,
  title,
  description,
  steps,
  currentStep,
  isStarted,
  isSaving,
  onStart,
  onNext,
  onBack,
  onDismiss,
}) => {
  const step = steps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Skip welcome tour"
            disabled={isSaving}
            onPress={onDismiss}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={Theme.colors.text.secondary} />
          </TouchableOpacity>

          {!isStarted ? (
            <>
              <View style={styles.welcomeIcon}>
                <Ionicons name="compass-outline" size={32} color={Theme.colors.primary} />
              </View>
              <Text style={styles.eyebrow}>GETTING STARTED</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>
                {description || 'Take a quick tour of the tools that help you manage your PG.'}
              </Text>
              <Text style={styles.duration}>5 short steps</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={onDismiss}
                  style={styles.textButton}
                >
                  <Text style={styles.textButtonLabel}>Skip for now</Text>
                </TouchableOpacity>
                <AnimatedPressableCard
                  accessibilityLabel="Start welcome tour"
                  disabled={isSaving}
                  onPress={onStart}
                  style={styles.primaryButton}
                >
                  {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.primaryButtonLabel}>Start tour</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </AnimatedPressableCard>
              </View>
            </>
          ) : step ? (
            <>
              <View style={styles.stepTopline}>
                <Text style={styles.eyebrow}>WELCOME TOUR</Text>
                <Text style={styles.stepCount}>{currentStep + 1} / {steps.length}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
              </View>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={30} color={Theme.colors.primary} />
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={isSaving || currentStep === 0}
                  onPress={onBack}
                  style={[styles.textButton, currentStep === 0 && styles.disabledButton]}
                >
                  <Ionicons name="arrow-back" size={16} color={Theme.colors.text.secondary} />
                  <Text style={styles.textButtonLabel}>Back</Text>
                </TouchableOpacity>
                <AnimatedPressableCard
                  accessibilityLabel={currentStep === steps.length - 1 ? 'Finish welcome tour' : 'Continue welcome tour'}
                  disabled={isSaving}
                  onPress={onNext}
                  style={styles.primaryButton}
                >
                  {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.primaryButtonLabel}>
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </Text>
                  <Ionicons
                    name={currentStep === steps.length - 1 ? 'checkmark' : 'arrow-forward'}
                    size={16}
                    color="#FFFFFF"
                  />
                </AnimatedPressableCard>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isSaving}
                onPress={onDismiss}
                style={styles.skipButton}
              >
                <Text style={styles.textButtonLabel}>Skip tour</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: Theme.colors.background.blueLight,
    marginBottom: 20,
  },
  eyebrow: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: 10,
    color: Theme.colors.text.primary,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: Theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 23,
  },
  duration: {
    marginTop: 18,
    color: Theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  stepTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 38,
  },
  stepCount: {
    color: Theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    marginTop: 12,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background.blueLight,
    marginTop: 28,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
  },
  textButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  textButtonLabel: {
    color: Theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
});
