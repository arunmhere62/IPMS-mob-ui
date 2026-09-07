import React, { useRef } from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  ViewStyle, 
  StyleProp,
  TextStyle 
} from 'react-native';

interface AnimatedButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  scaleValue?: number; // How much to scale down (default: 0.95)
  duration?: number; // Animation duration (default: 150ms)
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  style,
  disabled = false,
  scaleValue = 0.95,
  duration = 150,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.timing(scaleAnim, {
      toValue: scaleValue,
      duration: duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    onPress();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
