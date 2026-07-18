import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TenantDashboardScreen } from '../TenantDashboardScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('TenantDashboardScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<TenantDashboardScreen navigation={mockNavigation as any} />);
    expect(getByText('Dashboard')).toBeTruthy();
  });
});
