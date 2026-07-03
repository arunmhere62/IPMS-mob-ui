import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { RentPaymentsScreen } from '../RentPaymentsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('RentPaymentsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<RentPaymentsScreen navigation={mockNavigation as any} />);
    expect(getByText('Rent Payments')).toBeTruthy();
  });
});
