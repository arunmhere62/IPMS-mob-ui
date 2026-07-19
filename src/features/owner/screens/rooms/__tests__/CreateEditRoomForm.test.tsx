import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RoomModal } from '../CreateEditRoomForm';

jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@/features/owner/api/roomsApi', () => ({
  useCreateRoomMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateRoomMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useGetRoomByIdQuery: jest.fn(() => ({ data: null, isFetching: false, isError: false })),
}));

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));
jest.mock('@/components/ImageUploadS3', () => ({
  ImageUploadS3: () => null,
}));
jest.mock('@/config/aws.config', () => ({
  getFolderConfig: jest.fn(() => ({ rooms: { images: 'test-rooms' } })),
}));
jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({ can: jest.fn(() => true) })),
}));

describe('RoomModal', () => {
  const mockStore = configureStore({
    reducer: {
      pgLocations: () => ({ selectedPGLocationId: 1 }),
    },
  });

  const defaultProps = {
    visible: true,
    roomId: null,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ((useSelector as unknown) as jest.Mock).mockImplementation((callback: any) =>
      callback({ pgLocations: { selectedPGLocationId: 1 } }),
    );
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <Provider store={mockStore}>
        <RoomModal {...defaultProps} />
      </Provider>,
    );
    expect(getByText('RM')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Provider store={mockStore}>
        <RoomModal {...defaultProps} visible={false} />
      </Provider>,
    );
    expect(queryByText('RM')).toBeNull();
  });
});
