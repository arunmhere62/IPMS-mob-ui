import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface CardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  shadowColor?: string;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  backgroundColor = 'bg-white',
  shadowColor = 'shadow-md',
  elevation,
  style,
  ...props 
}) => {
  return (
    <View
      className={`${backgroundColor} rounded-xl ${shadowColor} p-4 ${className}`}
      style={[
        style,
        elevation !== undefined && { elevation }
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
