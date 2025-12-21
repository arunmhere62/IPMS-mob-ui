import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Theme } from '../theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ 
  length = 4, 
  value, 
  onChangeText,
  error = false,
}) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>(Array(length).fill(''));

  // Update otpValues when value prop changes
  useEffect(() => {
    const newOtpValues = Array(length).fill('');
    for (let i = 0; i < value.length && i < length; i++) {
      newOtpValues[i] = value[i];
    }
    setOtpValues(newOtpValues);
  }, [value, length]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    const newOtpValues = [...otpValues];
    
    if (numericText.length === 0) {
      // Handle backspace - clear current and shift left
      newOtpValues[index] = '';
      
      // Shift all subsequent values left by one
      for (let i = index + 1; i < length; i++) {
        if (newOtpValues[i]) {
          newOtpValues[i - 1] = newOtpValues[i];
          newOtpValues[i] = '';
        } else {
          break; // Stop when we hit an empty slot
        }
      }
      
      setOtpValues(newOtpValues);
      const finalValue = newOtpValues.join('').trimEnd();
      onChangeText(finalValue);
      
      // Focus management
      if (index > 0 && !newOtpValues[index]) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (numericText.length === 1) {
      // Single digit entered - could be replacement or new entry
      if (newOtpValues[index]) {
        // Replacing existing digit
        newOtpValues[index] = numericText;
        setOtpValues(newOtpValues);
        const finalValue = newOtpValues.join('').trimEnd();
        onChangeText(finalValue);
        
        // Move to next input if available
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      } else {
        // New digit in empty slot
        newOtpValues[index] = numericText;
        setOtpValues(newOtpValues);
        const finalValue = newOtpValues.join('').trimEnd();
        onChangeText(finalValue);
        
        // Move to next input
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    } else if (numericText.length > 1) {
      // Handle paste - distribute digits
      const digits = numericText.slice(0, length - index).split('');
      
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtpValues[index + i] = digit;
        }
      });
      
      setOtpValues(newOtpValues);
      const finalValue = newOtpValues.join('').trimEnd();
      onChangeText(finalValue);
      
      // Focus last filled input
      const lastFilledIndex = newOtpValues.map((val, i) => val ? i : -1).filter(i => i !== -1).pop();
      if (lastFilledIndex !== undefined && lastFilledIndex < length - 1) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getBoxStyle = (index: number) => {
    const isFocused = focusedIndex === index;
    const isFilled = !!otpValues[index];
    
    return [
      styles.box,
      isFocused && styles.boxFocused,
      isFilled && styles.boxFilled,
      error && styles.boxError,
    ];
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={getBoxStyle(index)}
          value={otpValues[index]}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          keyboardType="number-pad"
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  box: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.canvas,
  },
  boxFocused: {
    borderColor: Theme.colors.primary,
    borderWidth: 2,
  },
  boxFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.05),
  },
  boxError: {
    borderColor: Theme.colors.danger,
  },
});
