import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { TicketStatsCard } from '../TicketStatsCard';

jest.mock('@/components/Card', () => 'Card');

describe('TicketStatsCard', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<TicketStatsCard overview={null as any} recentTickets={[]} unreadTickets={0 as any} />);
    expect(getByText('Ticket Stats')).toBeTruthy();
  });
});
