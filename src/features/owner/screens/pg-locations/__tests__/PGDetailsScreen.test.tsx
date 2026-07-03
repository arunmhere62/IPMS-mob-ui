import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { PGDetailsScreen } from '../PGDetailsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('PGDetailsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<PGDetailsScreen navigation={mockNavigation as any} />);
    expect(getByText('PG Details')).toBeTruthy();
  });
});
