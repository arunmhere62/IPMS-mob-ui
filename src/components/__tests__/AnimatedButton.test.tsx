import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AnimatedButton } from '../AnimatedButton';

describe('AnimatedButton', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AnimatedButton><Text>Click</Text></AnimatedButton>
    );
    expect(getByText('Click')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPress}><Text>Click</Text></AnimatedButton>
    );
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPress} disabled><Text>Click</Text></AnimatedButton>
    );
    fireEvent.press(getByText('Click'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not crash without onPress', () => {
    const { getByText } = render(
      <AnimatedButton><Text>No onPress</Text></AnimatedButton>
    );
    expect(() => fireEvent.press(getByText('No onPress'))).not.toThrow();
  });
});
