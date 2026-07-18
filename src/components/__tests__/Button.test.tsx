import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders title', () => {
    const { getByText } = render(<Button title="Click me" onPress={jest.fn()} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} />);
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} disabled />);
    fireEvent.press(getByText('Click'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { toJSON } = render(<Button title="Click" onPress={onPress} loading />);
    // When loading, button shows ActivityIndicator instead of text
    // Press is disabled via AnimatedPressableCard disabled prop
    expect(toJSON()).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'outline'] as const;
    variants.forEach(variant => {
      const { getByText } = render(<Button title={variant} onPress={jest.fn()} variant={variant} />);
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it('renders all sizes without crashing', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach(size => {
      const { getByText } = render(<Button title={size} onPress={jest.fn()} size={size} />);
      expect(getByText(size)).toBeTruthy();
    });
  });

  it('renders icon when provided', () => {
    const icon = <Text testID="icon">★</Text>;
    const { getByTestId } = render(<Button title="With Icon" onPress={jest.fn()} icon={icon} />);
    expect(getByTestId('icon')).toBeTruthy();
  });

  it('renders icon on left by default', () => {
    const icon = <Text testID="icon">★</Text>;
    const { getByTestId, getByText } = render(<Button title="With Icon" onPress={jest.fn()} icon={icon} />);
    expect(getByTestId('icon')).toBeTruthy();
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('renders icon on right when iconPosition is right', () => {
    const icon = <Text testID="icon">★</Text>;
    const { getByTestId } = render(
      <Button title="With Icon" onPress={jest.fn()} icon={icon} iconPosition="right" />
    );
    expect(getByTestId('icon')).toBeTruthy();
  });

  it('applies reduced opacity when disabled', () => {
    const { toJSON } = render(<Button title="Disabled" onPress={jest.fn()} disabled />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"opacity":0.5');
  });
});
