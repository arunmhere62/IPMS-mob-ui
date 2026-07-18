import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TenantTicketsScreen } from '../TenantTicketsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('TenantTicketsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<TenantTicketsScreen navigation={mockNavigation as any} />);
    expect(getByText('My Tickets')).toBeTruthy();
  });
});
