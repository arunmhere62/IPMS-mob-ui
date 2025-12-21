import React, { useRef, useState, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
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
  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);
  const input4Ref = useRef<TextInput>(null);
  
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [input1Value, setInput1Value] = useState('');
  const [input2Value, setInput2Value] = useState('');
  const [input3Value, setInput3Value] = useState('');
  const [input4Value, setInput4Value] = useState('');

  // Get ref for specific input
  const getInputRef = (index: number) => {
    switch(index) {
      case 0: return input1Ref;
      case 1: return input2Ref;
      case 2: return input3Ref;
      case 3: return input4Ref;
      default: return input1Ref;
    }
  };

  // Get value for specific input
  const getInputValue = (index: number) => {
    switch(index) {
      case 0: return input1Value;
      case 1: return input2Value;
      case 2: return input3Value;
      case 3: return input4Value;
      default: return '';
    }
  };

  // Set value for specific input
  const setInputValue = (index: number, val: string) => {
    switch(index) {
      case 0: setInput1Value(val); break;
      case 1: setInput2Value(val); break;
      case 2: setInput3Value(val); break;
      case 3: setInput4Value(val); break;
    }
  };

  // Update parent with all values
  const updateParentValue = useCallback(() => {
    const fullValue = input1Value + input2Value + input3Value + input4Value;
    onChangeText(fullValue);
  }, [input1Value, input2Value, input3Value, input4Value, onChangeText]);

  // Handle input change for specific input
  const handleInputChange = useCallback((text: string, index: number) => {
    // Only allow numbers, take last character
    const cleanText = text.replace(/[^0-9]/g, '');
    const char = cleanText.slice(-1);
    
    // Update this input
    setInputValue(index, char);
    
    // Auto-focus next input if we have a character
    if (char && index < length - 1) {
      const nextRef = getInputRef(index + 1);
      if (nextRef.current) {
        nextRef.current.focus();
      }
    }
  }, [length]);

  // Handle key press for backspace
  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current input is empty and we're not at the first input
      if (!getInputValue(index) && index > 0) {
        const prevRef = getInputRef(index - 1);
        if (prevRef.current) {
          prevRef.current.focus();
        }
      }
    }
  }, []);

  // Update parent whenever any input value changes
  React.useEffect(() => {
    updateParentValue();
  }, [updateParentValue]);

  // Sync with external value prop
  React.useEffect(() => {
    if (value.length >= 1) setInput1Value(value[0] || '');
    if (value.length >= 2) setInput2Value(value[1] || '');
    if (value.length >= 3) setInput3Value(value[2] || '');
    if (value.length >= 4) setInput4Value(value[3] || '');
  }, [value]);

  // Get input style
  const getInputStyle = useCallback((index: number) => {
    const isFocused = focusedIndex === index;
    const hasValue = !!getInputValue(index);
    
    return [
      styles.input,
      isFocused && styles.inputFocused,
      hasValue && styles.inputFilled,
      error && styles.inputError,
    ];
  }, [focusedIndex, error]);

  return (
    <View style={styles.container}>
      {/* Input 1 */}
      <TextInput
        ref={input1Ref}
        style={getInputStyle(0)}
        value={input1Value}
        onChangeText={(text) => handleInputChange(text, 0)}
        onKeyPress={(e) => handleKeyPress(e, 0)}
        onFocus={() => setFocusedIndex(0)}
        onBlur={() => setFocusedIndex(null)}
        keyboardType="number-pad"
        selectTextOnFocus
        textAlign="center"
        maxLength={1}
        importantForAccessibility="yes"
        accessibilityLabel="OTP digit 1"
      />
      
      {/* Input 2 */}
      <TextInput
        ref={input2Ref}
        style={getInputStyle(1)}
        value={input2Value}
        onChangeText={(text) => handleInputChange(text, 1)}
        onKeyPress={(e) => handleKeyPress(e, 1)}
        onFocus={() => setFocusedIndex(1)}
        onBlur={() => setFocusedIndex(null)}
        keyboardType="number-pad"
        selectTextOnFocus
        textAlign="center"
        maxLength={1}
        importantForAccessibility="yes"
        accessibilityLabel="OTP digit 2"
      />
      
      {/* Input 3 */}
      <TextInput
        ref={input3Ref}
        style={getInputStyle(2)}
        value={input3Value}
        onChangeText={(text) => handleInputChange(text, 2)}
        onKeyPress={(e) => handleKeyPress(e, 2)}
        onFocus={() => setFocusedIndex(2)}
        onBlur={() => setFocusedIndex(null)}
        keyboardType="number-pad"
        selectTextOnFocus
        textAlign="center"
        maxLength={1}
        importantForAccessibility="yes"
        accessibilityLabel="OTP digit 3"
      />
      
      {/* Input 4 */}
      <TextInput
        ref={input4Ref}
        style={getInputStyle(3)}
        value={input4Value}
        onChangeText={(text) => handleInputChange(text, 3)}
        onKeyPress={(e) => handleKeyPress(e, 3)}
        onFocus={() => setFocusedIndex(3)}
        onBlur={() => setFocusedIndex(null)}
        keyboardType="number-pad"
        selectTextOnFocus
        textAlign="center"
        maxLength={1}
        importantForAccessibility="yes"
        accessibilityLabel="OTP digit 4"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  input: {
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
  inputFocused: {
    borderColor: Theme.colors.primary,
    borderWidth: 2,
  },
  inputFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.05),
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
});
