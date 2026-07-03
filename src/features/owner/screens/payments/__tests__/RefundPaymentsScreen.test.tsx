import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { RefundPaymentsScreen } from '../RefundPaymentsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('RefundPaymentsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<RefundPaymentsScreen navigation={mockNavigation as any} />);
    expect(getByText('Refund Payments')).toBeTruthy();
  });
});
