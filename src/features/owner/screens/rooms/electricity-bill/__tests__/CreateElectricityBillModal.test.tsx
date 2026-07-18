import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CreateElectricityBillModal } from '../CreateElectricityBillModal';

// Mock dependencies
jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@/features/owner/api', () => ({
  useCreateElectricityBillMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useGetTenantsQuery: jest.fn(() => ({ data: { data: [] }, isFetching: false })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));
jest.mock('@/components/DatePicker', () => ({
  DatePicker: () => null,
}));
jest.mock('@/components/OptionSelector', () => ({
  OptionSelector: () => null,
}));
jest.mock('@/components/Card', () => ({
  Card: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

describe('CreateElectricityBillModal', () => {
  const mockStore = configureStore({
    reducer: {
      pgLocations: () => ({ selectedPGLocationId: 1 }),
    },
  });

  const defaultProps = {
    visible: true,
    roomId: 1,
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
        <CreateElectricityBillModal {...defaultProps} />
      </Provider>,
    );
    expect(getByText('Bill Period')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CreateElectricityBillModal {...defaultProps} visible={false} />
      </Provider>,
    );
    expect(queryByText('Bill Period')).toBeNull();
  });
});
