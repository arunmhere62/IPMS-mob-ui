import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AnimatedPressableCard } from '../AnimatedPressableCard';

describe('AnimatedPressableCard', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AnimatedPressableCard>
        <Text>Hello</Text>
      </AnimatedPressableCard>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressableCard onPress={onPress}>
        <Text>Press me</Text>
      </AnimatedPressableCard>
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressableCard onPress={onPress} disabled>
        <Text>Press me</Text>
      </AnimatedPressableCard>
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not crash without onPress', () => {
    const { getByText } = render(
      <AnimatedPressableCard>
        <Text>No onPress</Text>
      </AnimatedPressableCard>
    );
    expect(() => fireEvent.press(getByText('No onPress'))).not.toThrow();
  });

  it('calls onPressIn and onPressOut', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByText } = render(
      <AnimatedPressableCard onPressIn={onPressIn} onPressOut={onPressOut} onPress={jest.fn()}>
        <Text>Press</Text>
      </AnimatedPressableCard>
    );
    const el = getByText('Press');
    fireEvent(el, 'pressIn');
    fireEvent(el, 'pressOut');
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('does not call onPressIn/onPressOut when disabled', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByText } = render(
      <AnimatedPressableCard onPressIn={onPressIn} onPressOut={onPressOut} disabled>
        <Text>Disabled</Text>
      </AnimatedPressableCard>
    );
    const el = getByText('Disabled');
    fireEvent(el, 'pressIn');
    fireEvent(el, 'pressOut');
    expect(onPressIn).not.toHaveBeenCalled();
    expect(onPressOut).not.toHaveBeenCalled();
  });

  it('sets accessibilityRole to button when onPress is provided', () => {
    const { getByLabelText } = render(
      <AnimatedPressableCard onPress={jest.fn()} accessibilityLabel="card">
        <Text>Card</Text>
      </AnimatedPressableCard>
    );
    expect(getByLabelText('card').props.accessibilityRole).toBe('button');
  });

  it('sets accessibilityRole to none when no onPress', () => {
    const { getByLabelText } = render(
      <AnimatedPressableCard accessibilityLabel="card">
        <Text>Card</Text>
      </AnimatedPressableCard>
    );
    expect(getByLabelText('card').props.accessibilityRole).toBe('none');
  });
});
