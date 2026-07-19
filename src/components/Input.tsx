import React from 'react';
import { View, TextInput, Text, TextInputProps, StyleSheet, Keyboard } from 'react-native';
import { Theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerClassName = '',
  ...props
}) => {
  // Inbuilt defaults: make Done dismiss the keyboard when not multiline.
  const derivedReturnKeyType = props.returnKeyType ?? (props.multiline ? undefined : 'done');
  const derivedBlurOnSubmit = props.blurOnSubmit ?? (!!derivedReturnKeyType && derivedReturnKeyType === 'done');
  const derivedOnSubmitEditing = props.onSubmitEditing ?? (
    (!!derivedReturnKeyType && derivedReturnKeyType === 'done') ? () => Keyboard.dismiss() : undefined
  );
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.style,
        ]}
        placeholderTextColor={Theme.colors.text.tertiary}
        {...props}
        returnKeyType={derivedReturnKeyType as any}
        blurOnSubmit={derivedBlurOnSubmit}
        onSubmitEditing={derivedOnSubmitEditing}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    lineHeight: 20,
    color: Theme.colors.text.primary,
    backgroundColor: 'transparent',
    minHeight: 48,
    textAlignVertical: 'center', // Fixes Android text alignment
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: Theme.typography.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
});
