import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { DashboardScreen } from '../DashboardScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('DashboardScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<DashboardScreen navigation={mockNavigation as any} />);
    expect(getByText('Dashboard')).toBeTruthy();
  });
});
