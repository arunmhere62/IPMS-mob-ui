import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenHeader } from '../ScreenHeader';

const renderHeader = (props: React.ComponentProps<typeof ScreenHeader>) =>
  render(
    <SafeAreaProvider>
      <ScreenHeader {...props} />
    </SafeAreaProvider>
  );

describe('ScreenHeader', () => {
  it('renders title', () => {
    const { getByText } = renderHeader({ title: 'Dashboard' });
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = renderHeader({ title: 'Rooms', subtitle: '2 available' });
    expect(getByText('Rooms')).toBeTruthy();
    expect(getByText('2 available')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = renderHeader({ title: 'Rooms' });
    expect(queryByText('2 available')).toBeNull();
  });

  it('renders children when provided', () => {
    const { getByText } = renderHeader({ title: 'Test', children: <Text>Child content</Text> });
    expect(getByText('Child content')).toBeTruthy();
  });

  it('renders without crashing with back button', () => {
    const onBackPress = jest.fn();
    const { getByText } = renderHeader({ title: 'Details', showBackButton: true, onBackPress });
    expect(getByText('Details')).toBeTruthy();
  });

  it('renders without crashing without back button', () => {
    const { getByText } = renderHeader({ title: 'Details' });
    expect(getByText('Details')).toBeTruthy();
  });
});
