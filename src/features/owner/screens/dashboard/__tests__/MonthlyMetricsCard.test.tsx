import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { MonthlyMetricsCard } from '../MonthlyMetricsCard';

jest.mock('@/components/Card', () => 'Card');

describe('MonthlyMetricsCard', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MonthlyMetricsCard isFetching={false} onDateRangeChange={jest.fn()} formatCurrency={jest.fn() as any} />);
    expect(getByText('Monthly Metrics')).toBeTruthy();
  });
});
