import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { ExpenseScreen } from '../ExpenseScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('ExpenseScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<ExpenseScreen navigation={mockNavigation as any} />);
    expect(getByText('Expenses')).toBeTruthy();
  });
});
