import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { RoomDetailsScreen } from '../RoomDetailsScreen';

jest.mock('@/components/Button', () => 'Button');
jest.mock('@/components/Card', () => 'Card');

describe('RoomDetailsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('renders correctly', () => {
    // @ts-ignore - navigation prop is provided by NavigationContainer context
    const { getByText } = renderWithProviders(<RoomDetailsScreen navigation={mockNavigation as any} route={{ params: { roomId: 1 } } as any} />);
    expect(getByText('Room Details')).toBeTruthy();
  });
});
