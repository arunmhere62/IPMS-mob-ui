import React, { useState } from 'react';
import { Clipboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import Theme from '@/theme';
import { showSuccessAlert } from '@/utils/errorHandler';

interface CopyableTextProps {
  /** The value to display and copy. If empty/null, renders the fallback. */
  value?: string | null;
  /** Fallback text when value is empty (default: 'N/A') */
  fallback?: string;
  /** Label shown above the value (optional) */
  label?: string;
  /** Font size of the value text (default: 14) */
  fontSize?: number;
  /** Color of the value text (default: Theme.colors.text.primary) */
  color?: string;
  /** Show the copy button inline (row) or below (block). Default: 'row' */
  layout?: 'row' | 'block';
  /** Style override for the value text */
  style?: any;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  value,
  fallback = 'N/A',
  label,
  fontSize = 14,
  color = Theme.colors.text.primary,
  layout = 'row',
  style,
}) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const display = trimmed || fallback;
  const canCopy = !!trimmed;

  const handleCopy = async () => {
    if (!trimmed) return;
    await Clipboard.setString(trimmed);
    showSuccessAlert('Copied to clipboard');
  };

  if (layout === 'row') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <Text style={[{ fontSize, color }, style]}>{display}</Text>
        </View>
        {canCopy && (
          <AnimatedPressableCard
            onPress={handleCopy}
            accessibilityLabel={`Copy ${label || 'value'}`}
            style={styles.copyBtn}
          >
            <Ionicons name="copy-outline" size={15} color={Theme.colors.primary} />
            <Text style={styles.copyBtnText}>Copy</Text>
          </AnimatedPressableCard>
        )}
      </View>
    );
  }

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text style={[{ fontSize, color }, style]}>{display}</Text>
        {canCopy && (
          <AnimatedPressableCard
            onPress={handleCopy}
            accessibilityLabel={`Copy ${label || 'value'}`}
            style={styles.copyBtn}
          >
            <Ionicons name="copy-outline" size={15} color={Theme.colors.primary} />
            <Text style={styles.copyBtnText}>Copy</Text>
          </AnimatedPressableCard>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 11, color: Theme.colors.text.tertiary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  copyBtnText: { fontSize: 12, fontWeight: '600', color: Theme.colors.primary },
});
