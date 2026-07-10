import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { RoomsScreen } from '../RoomsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('RoomsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<RoomsScreen navigation={mockNavigation as any} />);
    expect(getByText('Rooms')).toBeTruthy();
  });
});
