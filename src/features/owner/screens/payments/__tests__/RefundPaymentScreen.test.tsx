import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { RefundPaymentScreen } from '../RefundPaymentScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('RefundPaymentScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<RefundPaymentScreen navigation={mockNavigation as any} />);
    expect(getByText('Refund Payment')).toBeTruthy();
  });
});
