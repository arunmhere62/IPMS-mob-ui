import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { AdvancePaymentScreen } from '../AdvancePaymentScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('AdvancePaymentScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<AdvancePaymentScreen navigation={mockNavigation as any} />);
    expect(getByText('Advance Payment')).toBeTruthy();
  });
});
