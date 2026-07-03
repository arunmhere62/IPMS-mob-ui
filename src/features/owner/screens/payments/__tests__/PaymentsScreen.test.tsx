import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { PaymentsScreen } from '../PaymentsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('PaymentsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<PaymentsScreen navigation={mockNavigation as any} />);
    expect(getByText('Payments')).toBeTruthy();
  });
});
