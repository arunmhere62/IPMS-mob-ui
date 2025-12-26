import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Theme } from '../theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ 
  length = 4, 
  value, 
  onChangeText,
  error = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = useMemo(() => {
    return (value || '').replace(/[^0-9]/g, '').slice(0, length);
  }, [value, length]);

  const focusInput = useCallback(() => {
    const pos = digits.length;
    inputRef.current?.focus();
    setTimeout(() => {
      inputRef.current?.setNativeProps({ selection: { start: pos, end: pos } });
    }, 0);
  }, [digits.length]);

  const activeIndex = useMemo(() => {
    if (!isFocused) return null;
    return Math.min(digits.length, length - 1);
  }, [digits.length, isFocused, length]);

  const handleChange = useCallback(
    (text: string) => {
      const next = (text || '').replace(/[^0-9]/g, '').slice(0, length);
      onChangeText(next);
    },
    [length, onChangeText]
  );

  return (
    <View style={styles.container}>
      <Pressable onPressIn={focusInput} style={styles.boxRow}>
        {Array.from({ length }).map((_, i) => {
          const char = digits[i] || '';
          const filled = !!char;
          const focused = activeIndex === i;
          return (
            <View
              key={i}
              style={[
                styles.box,
                filled && styles.boxFilled,
                focused && styles.boxFocused,
                error && styles.boxError,
              ]}
            >
              <Text style={styles.boxText}>{char}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={handleChange}
        keyboardType={Platform.OS === 'android' ? 'numeric' : 'number-pad'}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        inputMode="numeric"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        onFocus={() => {
          setIsFocused(true);
          focusInput();
        }}
        onBlur={() => setIsFocused(false)}
        maxLength={length}
        onKeyPress={(e) => {
          if (e.nativeEvent.key !== 'Backspace') return;
          if (!digits) return;
          onChangeText(digits.slice(0, -1));
        }}
        caretHidden
        selectionColor="transparent"
        underlineColorAndroid="transparent"
        style={styles.hiddenInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  box: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    backgroundColor: Theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: Theme.colors.primary,
  },
  boxFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.05),
  },
  boxError: {
    borderColor: Theme.colors.danger,
  },
  boxText: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: Platform.OS === 'android' ? 0.02 : 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
});
