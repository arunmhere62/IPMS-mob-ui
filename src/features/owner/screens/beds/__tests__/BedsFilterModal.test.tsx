import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { BedsFilterModal } from '../BedsFilterModal';

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));

describe('BedsFilterModal', () => {
  it('renders correctly when visible', () => {
    const { getByText } = renderWithProviders(<BedsFilterModal visible={true} onClose={jest.fn()} onApply={jest.fn()} onClear={jest.fn()} rooms={[]} selectedRoomId={null} occupancyFilter="all" onRoomChange={jest.fn()} onOccupancyChange={jest.fn()} />);
    expect(getByText('Filter Beds')).toBeTruthy();
  });
});
