import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { PgTenantTicketsScreen } from '../PgTenantTicketsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('PgTenantTicketsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<PgTenantTicketsScreen navigation={mockNavigation as any} />);
    expect(getByText('Tickets')).toBeTruthy();
  });
});
