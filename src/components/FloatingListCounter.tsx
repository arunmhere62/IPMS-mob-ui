import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FloatingListCounterProps {
  /** Number of items currently visible in the list */
  visibleCount: number;
  /** Total number of items (from pagination or array length) */
  totalCount: number;
  /** Distance from the bottom of the screen (default: 100) */
  bottom?: number;
  /** Distance from the right edge (default: 16) */
  right?: number;
}

/**
 * Floating pill that shows "X of Y" and "Z remaining" —
 * used in list screens with pagination to indicate how many
 * items are loaded vs. total.
 */
export const FloatingListCounter: React.FC<FloatingListCounterProps> = ({
  visibleCount,
  totalCount,
  bottom = 100,
  right = 16,
}) => {
  if (visibleCount <= 0) return null;
  // Don't show if everything is visible (no remaining items)
  if (visibleCount >= totalCount) return null;

  const remaining = Math.max(0, totalCount - visibleCount);

  return (
    <View
      style={[
        styles.container,
        { bottom, right },
      ]}
    >
      <Text style={styles.countText}>
        {visibleCount} of {totalCount}
      </Text>
      {remaining > 0 && (
        <Text style={styles.remainingText}>
          {remaining} remaining
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  remainingText: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
});
