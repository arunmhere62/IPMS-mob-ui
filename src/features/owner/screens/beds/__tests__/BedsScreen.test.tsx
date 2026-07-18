import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { BedsScreen } from '../BedsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('BedsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<BedsScreen navigation={mockNavigation as any} />);
    expect(getByText('Beds')).toBeTruthy();
  });
});
