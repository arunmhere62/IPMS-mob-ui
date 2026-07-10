import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { PgTenantTicketDetailScreen } from '../PgTenantTicketDetailScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('PgTenantTicketDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<PgTenantTicketDetailScreen navigation={mockNavigation as any} route={{ params: { ticketId: 1 } } as any} />);
    expect(getByText('Ticket Details')).toBeTruthy();
  });
});
