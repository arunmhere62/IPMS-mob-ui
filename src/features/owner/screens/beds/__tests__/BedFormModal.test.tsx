import React from 'react';
import { render } from '@testing-library/react-native';
import { BedFormModal } from '../BedFormModal';

jest.mock('@/features/owner/api/roomsApi', () => ({
  useCreateBedMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateBedMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));
jest.mock('@/components/ImageUploadS3', () => ({
  ImageUploadS3: () => null,
}));
jest.mock('@/config/aws.config', () => ({
  getFolderConfig: jest.fn(() => ({ beds: { images: 'test-beds' } })),
}));
jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

describe('BedFormModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    roomId: 1,
    roomNo: '101',
    pgId: 1,
    organizationId: 1,
    userId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(<BedFormModal {...defaultProps} />);
    expect(getByText('BED')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(<BedFormModal {...defaultProps} visible={false} />);
    expect(queryByText('Bed Number')).toBeNull();
  });
});
