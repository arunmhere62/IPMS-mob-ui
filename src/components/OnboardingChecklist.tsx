import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onDismiss: () => void;
  onContactUs?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  steps,
  onDismiss,
  onContactUs,
}) => {
  const [expanded, setExpanded] = useState(true);
  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;

  // A step is unlocked if all previous steps are completed
  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return steps.slice(0, index).every((s) => s.completed);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🚀 Getting Started</Text>
          <Text style={styles.subtitle}>
            {allDone ? "All done! You're all set." : `${completedCount} of ${steps.length} completed`}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6366F1" />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(completedCount / steps.length) * 100}%` as any }]} />
      </View>

      {/* Celebration when all done */}
      {expanded && allDone ? (
        <View style={styles.celebration}>
          <View style={styles.celebrationIcon}>
            <Ionicons name="trophy" size={32} color={Theme.colors.primary} />
          </View>
          <Text style={styles.celebrationTitle}>Congratulations!</Text>
          <Text style={styles.celebrationText}>
            You've completed all the onboarding steps. Your PG is ready to go!
          </Text>
          <TouchableOpacity onPress={onDismiss} style={styles.celebrationBtn}>
            <Text style={styles.celebrationBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.steps}>
          {steps.map((step, index) => {
            const unlocked = isUnlocked(index);
            const locked = !unlocked && !step.completed;
            return (
              <View key={step.id} style={[styles.step, locked && styles.stepLocked]}>
                {/* Step number / check circle */}
                <View style={[
                  styles.iconCircle,
                  step.completed && styles.iconCircleDone,
                  locked && styles.iconCircleLocked,
                ]}>
                  {step.completed ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={11} color="#CBD5E1" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.stepTitle,
                    step.completed && styles.stepTitleDone,
                    locked && styles.stepTitleLocked,
                  ]}>
                    Step {index + 1}: {step.title}
                  </Text>
                  {!step.completed && !locked && (
                    <Text style={styles.stepDesc}>{step.description}</Text>
                  )}
                  {locked && (
                    <Text style={styles.lockedHint}>Complete step {index} first</Text>
                  )}
                </View>

                {!step.completed && step.onAction && step.actionLabel && (
                  <TouchableOpacity
                    style={[styles.actionBtn, locked && styles.actionBtnLocked]}
                    onPress={unlocked ? step.onAction : undefined}
                    activeOpacity={unlocked ? 0.8 : 1}
                    disabled={locked}
                  >
                    {locked && <Ionicons name="lock-closed" size={10} color="#94A3B8" style={{ marginRight: 3 }} />}
                    <Text style={[styles.actionBtnText, locked && styles.actionBtnTextLocked]}>
                      {step.actionLabel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Need help getting started?</Text>
            {onContactUs && (
              <TouchableOpacity onPress={onContactUs}>
                <Text style={styles.contactLink}>Contact Us</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: Theme.colors.canvas,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Theme.colors.background.blueLight,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginTop: 1,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Theme.colors.background.blueMedium,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  steps: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  stepLocked: {
    opacity: 0.55,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.background.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCircleDone: {
    backgroundColor: Theme.colors.secondary,
  },
  iconCircleLocked: {
    backgroundColor: Theme.colors.background.tertiary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  stepTitleDone: {
    color: Theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  stepTitleLocked: {
    color: Theme.colors.text.tertiary,
  },
  stepDesc: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  lockedHint: {
    fontSize: 10,
    color: Theme.colors.text.tertiary,
    marginTop: 1,
  },
  actionBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtnLocked: {
    backgroundColor: Theme.colors.button.disabled,
  },
  actionBtnText: {
    color: Theme.colors.button.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnTextLocked: {
    color: Theme.colors.button.disabledText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 11,
    color: Theme.colors.text.tertiary,
  },
  contactLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  dismissBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Theme.colors.background.tertiary,
  },
  dismissBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  celebration: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  celebrationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.background.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    marginBottom: 6,
  },
  celebrationText: {
    fontSize: 13,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  celebrationBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  celebrationBtnText: {
    color: Theme.colors.button.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
});
