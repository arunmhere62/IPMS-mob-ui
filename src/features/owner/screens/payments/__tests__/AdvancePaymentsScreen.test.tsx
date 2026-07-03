import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { AdvancePaymentsScreen } from '../AdvancePaymentsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('AdvancePaymentsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<AdvancePaymentsScreen navigation={mockNavigation as any} />);
    expect(getByText('Advance Payments')).toBeTruthy();
  });
});
