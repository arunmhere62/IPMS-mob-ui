import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { PGLocationsScreen } from '../PGLocationsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('PGLocationsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<PGLocationsScreen navigation={mockNavigation as any} />);
    expect(getByText('PG Locations')).toBeTruthy();
  });
});
